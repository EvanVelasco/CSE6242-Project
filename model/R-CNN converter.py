import os
import json
from tqdm import tqdm

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

# CONFIGURATION 
os.chdir('E:/GradSchool/CSE6242_DVA/Proj')
yolo_dataset_path = 'combined_data/train'  
#yolo_dataset_path = 'combined_data/valid' 
image_dir = os.path.join(yolo_dataset_path, 'images')
label_dir = os.path.join(yolo_dataset_path, 'labels')
output_json_path = os.path.join(yolo_dataset_path, 'annotations_coco.json')

# 21 classes from dataset
class_names = [
    'ambulance', 'army vehicle', 'auto rickshaw', 'bicycle', 'bus', 'car',
    'garbagevan', 'human hauler', 'minibus', 'minivan', 'motorbike', 'pickup',
    'policecar', 'rickshaw', 'scooter', 'suv', 'taxi', 'three wheelers -CNG-',
    'truck', 'van', 'wheelbarrow'
]

# COCO JSON STRUCTURE 
coco_output = {
    "images": [],
    "annotations": [],
    "categories": [{"id": i, "name": name} for i, name in enumerate(class_names)]
}

annotation_id = 1
image_id = 1

for img_file in tqdm(os.listdir(image_dir)):
    if not img_file.lower().endswith(('.jpg', '.png', '.jpeg')):
        continue

    # Match corresponding label file
    image_path = os.path.join(image_dir, img_file)
    label_file = os.path.splitext(img_file)[0] + ".txt"
    label_path = os.path.join(label_dir, label_file)

    if not os.path.exists(label_path):
        continue

    # img info (placeholder size)
    from PIL import Image
    with Image.open(image_path) as img:
        width, height = img.size

    coco_output["images"].append({
        "id": image_id,
        "file_name": img_file,
        "width": width,
        "height": height
    })

    with open(label_path, 'r') as f:
        for line in f.readlines():
            parts = line.strip().split()
            if len(parts) != 5:
                continue

            class_id, x_center, y_center, bbox_width, bbox_height = map(float, parts)
            x_center *= width
            y_center *= height
            bbox_width *= width
            bbox_height *= height
            x_min = x_center - bbox_width / 2
            y_min = y_center - bbox_height / 2

            coco_output["annotations"].append({
                "id": annotation_id,
                "image_id": image_id,
                "category_id": int(class_id),
                "bbox": [x_min, y_min, bbox_width, bbox_height],
                "area": bbox_width * bbox_height,
                "iscrowd": 0
            })
            annotation_id += 1

    image_id += 1

# Save JSON without overriding
if os.path.exists(output_json_path):
    print(f"[INFO] File already exists at {output_json_path}, not overwriting.")
else:
    with open(output_json_path, 'w') as f:
        json.dump(coco_output, f)
    print(f"[SUCCESS] COCO annotation file saved to {output_json_path}")
