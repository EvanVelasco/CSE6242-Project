import os
import cv2
import torch
import json
from ultralytics import YOLO
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

# CONFIG
os.chdir('PATH/Proj') #update the path if needed
input_path = 'video_data/Video 1.mp4'

model_selection = "11 Small" #11n, 11m

if model_selection == "11n":
    #11 Nano 30 epoch
    model_path = 'runs/detect/train8-11n/weights/best.pt'
    output_path = 'video_output/yolo_output_11n.mp4'
    json_output_path = 'video_data/yolo_output_tracking_11n.json'

elif model_selection == "11m":
    # 11 Medium 30 epoch
    output_path = 'video_output/yolo_output_11m_video6.mp4'
    model_path = 'runs/detect/train13-11m/weights/best.pt'
    json_output_path = 'video_data/yolo_output_tracking_11m_video6.json'

elif model_selection == "11n10g":
    # 11 Nano 10 Epoch
    output_path = 'video_output/yolo_output_11n10g1.mp4'
    model_path = 'runs/detect/train3-11n10g/weights/best.pt'
    json_output_path = 'video_data/yolo_output_tracking_11n10g1.json'

elif model_selection == "stdm":
    # Standard YOLO
    output_path = 'video_data/yolo_output_std11m.mp4'
    model_path = 'yolo11m.pt'
    json_output_path = 'video_data/yolo_output_tracking_std11m.json'

elif model_selection == "custom":
    # 11 Medium 
    output_path = 'video_output/yolo_output_11n_10epch.mp4'
    model_path = 'runs/detect/OneDrive_2025-04-15/yolo_output 11n 10E, 16/weights/best.pt'
    json_output_path = 'video_data/yolo_output_tracking_11n_10epch.json'

elif model_selection == "11s":
    # 11 Medium
    output_path = 'video_output/yolo_output_Small.mp4'
    model_path = 'runs/detect/Alex/best.pt'
    json_output_path = 'video_data/yolo_output_tracking_Small.json'

else:
    print ("model selection error")
    

# Load YOLO model 
model = YOLO(model_path)

#  Video Setup 
cap = cv2.VideoCapture(input_path)
fps = cap.get(cv2.CAP_PROP_FPS)
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
start_time = time.time()

print("[INFO] Running YOLO + ByteTrack inference on video...")

# Run YOLO with tracking enabled
tracking_results = model.track(
    source=input_path,
    persist=True,
    tracker='bytetrack.yaml',
    verbose=False,
    stream=True
)

json_data = []
frame_idx = 0

for result in tracking_results:
    frame = result.orig_img
    if result.boxes is not None:
        for box in result.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            conf = float(box.conf.item())
            cls = int(box.cls.item())
            class_name = model.names[cls] if cls < len(model.names) else str(cls)
            obj_id = int(box.id.item()) if box.id is not None else -1

            if conf < 0.5:
                continue

            # Draw on frame
            label = f"{class_name} ID:{obj_id}"
            cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 0), 2)
            cv2.putText(frame, label, (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)

            # Append to JSON output
            json_data.append({
                "frame": frame_idx,
                "id": obj_id,
                "class": class_name,
                "confidence": round(conf, 3),
                "bbox": [x1, y1, x2, y2]
            })

    out.write(frame)
    if model_selection == "11n":
        cv2.imshow('YOLO11n Tracking', frame)
    elif model_selection == "11m":
        cv2.imshow('YOLO11m Tracking', frame)
    elif model_selection == "11n10g":
        cv2.imshow('YOLO11n10gb Tracking', frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

    frame_idx += 1

cap.release()
out.release()
cv2.destroyAllWindows()
elapsed = time.time() - start_time
# Write tracking results to JSON
with open(json_output_path, 'w') as f:
    json.dump(json_data, f, indent=2)


# Results
print(f"[DONE] YOLO Tracking output saved to {output_path}")
print(f"[DONE] JSON tracking data saved to {json_output_path}")
print(f"[TIME] Inference + tracking completed in {elapsed:.2f} seconds")
