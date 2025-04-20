import os
import cv2
import torch
from torchvision.models.detection import fasterrcnn_resnet50_fpn
from torchvision.models.detection.faster_rcnn import FastRCNNPredictor
from torchvision import transforms as T
import time

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

# ================== CONFIG ===
os.chdir('E:/GradSchool/CSE6242_DVA/Proj')
input_path = 'video_data/Video 1.mp4'
output_path = 'video_data/fasterrcnn_output_video1.mp4'
num_classes = 22
class_names = [
    'ambulance', 'army vehicle', 'auto rickshaw', 'bicycle', 'bus', 'car', 'garbagevan', 'human hauler',
    'minibus', 'minivan', 'motorbike', 'pickup', 'policecar', 'rickshaw', 'scooter', 'suv', 'taxi',
    'three wheelers -CNG-', 'truck', 'van', 'wheelbarrow']

# ===================== Load model ===
model = fasterrcnn_resnet50_fpn(pretrained=False)
in_features = model.roi_heads.box_predictor.cls_score.in_features
model.roi_heads.box_predictor = FastRCNNPredictor(in_features, num_classes)
model.load_state_dict(torch.load('fasterrcnn_trained.pth'))

# ================== Move model to device ===
device = torch.device('cuda') if torch.cuda.is_available() else torch.device('cpu')
model.to(device)
model.eval()

def preprocess(frame):
    transform = T.Compose([T.ToTensor()])
    return transform(frame)

# ================== Video Setup 
cap = cv2.VideoCapture(input_path)
fps = cap.get(cv2.CAP_PROP_FPS)
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
start_time = time.time()

print("[INFO] Running inference on video...")



while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    image_tensor = preprocess(frame).unsqueeze(0).to(device)

    with torch.no_grad():
        predictions = model(image_tensor)[0]

    boxes = predictions['boxes'].cpu()
    labels = predictions['labels'].cpu()
    scores = predictions['scores'].cpu()

    for box, label, score in zip(boxes, labels, scores):
        if score < 0.5:
            continue
        x1, y1, x2, y2 = map(int, box.tolist())
        class_name = class_names[label] if label < len(class_names) else str(label)
        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(frame, f"{class_name} {score:.2f}", (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

    out.write(frame)
    cv2.imshow('Faster R-CNN Inference', frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

elapsed = time.time() - start_time

cap.release()
out.release()
cv2.destroyAllWindows()
print(f"[DONE] Output saved to {output_path}")
print(f"[TIME] Inference + tracking completed in {elapsed:.2f} seconds")
#print(f"[]")
