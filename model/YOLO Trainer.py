import os
os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'
os.environ["CUDA_LAUNCH_BLOCKING"] = "1"

from ultralytics import YOLO
import torch


def main():
    print(torch.__version__)
    print(torch.version.cuda)
    print(torch.cuda.is_available())
    print(torch.cuda.get_device_name(0))

    os.chdir('E:/GradSchool/CSE6242_DVA/Proj')
    # Load YOLO model (use pre-trained weights, e.g., yolov8n.pt or yolov11.pt if available)
    
    #model = YOLO('runs/detect/train13/weights/last.pt')  # use 'last.pt' to resume

    
    # start from scatch
    model = YOLO('yolo11m.pt')  # Replace with yolov11 weights if you have them
    # Train on your custom dataset
    model.train(
        #data='E:/GradSchool/CSE6242_DVA/Proj/combined_data/data_1.yaml',  # Your YAML file
        data='E:/GradSchool/CSE6242_DVA/Proj/batch_1/data.yaml',  # Your YAML file
        epochs=10,
        imgsz=640,
        batch=16,
        workers=0,
        device=0,  # Use GPU (0) or CPU (-1)
        verbose=True,
        show=False
    )
    '''

    #for resume model

    model = YOLO('runs/detect/train13/weights/last.pt')
    model.train(
        data='E:/GradSchool/CSE6242_DVA/Proj/combined_data/data_1.yaml',
        resume=True, #on if retrain
        device=0
        )
'''
    print("[System] Training Complete! Model saved in runs/detect/train/weights/")

if __name__ == "__main__":
    main()