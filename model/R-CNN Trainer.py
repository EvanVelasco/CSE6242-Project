import os
import torch
import torchvision
from torchvision.models.detection import fasterrcnn_resnet50_fpn
from torchvision.models.detection.faster_rcnn import FastRCNNPredictor
from torch.utils.data import DataLoader, Dataset
from PIL import Image
import json
from torchvision import transforms as T
from torchvision.ops import box_iou

'''
Folder Path
Proj folder
    - Proj
        - data
            -train
                -images
                -labels
            -valid
                -images
                -labels
        - runs
            -detect
                -trained folder in various names
                ...
        - Video data
            - video 1
            - video 2
            ...
        - Video Output
'''


# ======================= Set working directory 
os.chdir('PATH/Proj') #This is local path to local path

# ============================= CONFIG 
image_dir = 'combined_data/train/images'
annotation_file = 'combined_data/train/annotations_coco.json'
val_image_dir = 'combined_data/valid/images'
val_annotation_file = 'combined_data/valid/annotations_coco.json'
num_classes = 22  # 21 classes + 1 background

def get_transform():
    return T.Compose([T.ToTensor()])

class CocoFormatDataset(Dataset):
    def __init__(self, image_dir, annotation_file, transforms=None):
        self.image_dir = image_dir
        self.transforms = transforms
        with open(annotation_file, 'r') as f:
            coco = json.load(f)
        self.images = coco['images']
        self.annotations = coco['annotations']
        self.categories = coco['categories']
        self.image_id_to_annotations = {}
        for ann in self.annotations:
            self.image_id_to_annotations.setdefault(ann['image_id'], []).append(ann)

    def __len__(self):
        return len(self.images)

    def __getitem__(self, idx):
        img_info = self.images[idx]
        img_path = os.path.join(self.image_dir, img_info['file_name'])
        img = Image.open(img_path).convert("RGB")

        anns = self.image_id_to_annotations.get(img_info['id'], [])
        boxes, labels = [], []
        for ann in anns:
            x, y, w, h = ann['bbox']
            boxes.append([x, y, x + w, y + h])
            labels.append(ann['category_id'])

        boxes = torch.as_tensor(boxes, dtype=torch.float32).reshape(-1, 4)
        labels = torch.as_tensor(labels, dtype=torch.int64)
        image_id = torch.tensor([img_info['id']])
        area = (boxes[:, 3] - boxes[:, 1]) * (boxes[:, 2] - boxes[:, 0])
        iscrowd = torch.zeros((len(anns),), dtype=torch.int64)

        target = {
            'boxes': boxes,
            'labels': labels,
            'image_id': image_id,
            'area': area,
            'iscrowd': iscrowd
        }

        if self.transforms:
            img = self.transforms(img)

        return img, target

# ================== training dataset 
dataset = CocoFormatDataset(image_dir, annotation_file, transforms=get_transform())
dataloader = DataLoader(dataset, batch_size=2, shuffle=True, collate_fn=lambda x: tuple(zip(*x)))

# ===================== Load model 
model = fasterrcnn_resnet50_fpn(pretrained=True)
in_features = model.roi_heads.box_predictor.cls_score.in_features
model.roi_heads.box_predictor = FastRCNNPredictor(in_features, num_classes)

# ================ device setup
device = torch.device('cuda') if torch.cuda.is_available() else torch.device('cpu')
model.to(device)

# ====================== optmizer 
params = [p for p in model.parameters() if p.requires_grad]
optimizer = torch.optim.SGD(params, lr=0.005, momentum=0.9, weight_decay=0.0005)

# ================ Training loop


model.train()
i = 0
for images, targets in dataloader:
    i += 1 
    images = list(img.to(device) for img in images)
    targets = [{k: v.to(device) for k, v in t.items()} for t in targets]

    loss_dict = model(images, targets)
    losses = sum(loss for loss in loss_dict.values())

    optimizer.zero_grad()
    losses.backward()
    optimizer.step()

    print(f"image: {i} Loss: {losses.item():.4f}")


# ================ Save the trained model 
torch.save(model.state_dict(), 'fasterrcnn_trained.pth')
print("[INFO] Trained Faster R-CNN model saved as 'fasterrcnn_trained.pth'")



# ================== Evaluation on validation set 
print("\n[INFO] Starting evaluation on validation set...")
val_dataset = CocoFormatDataset(val_image_dir, val_annotation_file, transforms=get_transform())
val_loader = DataLoader(val_dataset, batch_size=1, shuffle=False, collate_fn=lambda x: tuple(zip(*x)))

model.eval()
iou_threshold = 0.5
true_positives = 0
detected = 0
actual = 0
average_precisions = []

with torch.no_grad():
    for images, targets in val_loader:
        images = list(img.to(device) for img in images)
        outputs = model(images)

        for output, target in zip(outputs, targets):
            pred_boxes = output['boxes'].cpu()
            true_boxes = target['boxes'].cpu()
            if len(pred_boxes) == 0 or len(true_boxes) == 0:
                continue

            ious = box_iou(pred_boxes, true_boxes)
            #matches = (ious > iou_threshold).sum().item()
            matched_gt = set()
            matches = 0

            for pred_idx, pred_box in enumerate(pred_boxes):
                max_iou, gt_idx = torch.max(ious[pred_idx], dim=0)
                if max_iou > iou_threshold and gt_idx.item() not in matched_gt:
                    matches += 1
                    matched_gt.add(gt_idx.item())
            true_positives += matches
            detected += len(pred_boxes)
            actual += len(true_boxes)

            # Calculate AP per image
            precision = matches / len(pred_boxes) if len(pred_boxes) else 0
            recall = matches / len(true_boxes) if len(true_boxes) else 0
            if precision + recall > 0:
                ap = (precision * recall) / (precision + recall)
                average_precisions.append(ap)

precision = true_positives / detected if detected else 0
recall = true_positives / actual if actual else 0
map_score = sum(average_precisions) / len(average_precisions) if average_precisions else 0

print(f"\n[RESULT] Precision: {precision:.4f}, Recall: {recall:.4f}, mAP: {map_score:.4f}")
