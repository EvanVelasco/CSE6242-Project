# Traffic Detection using YOLO

A web-based visualization project for traffic detection using YOLO (You Only Look Once) object detection.

## Overview

This project demonstrates traffic detection and analysis using YOLO object detection, with interactive visualizations built using D3.js. The system processes video footage and displays real-time detection results alongside analytical charts.

## Project Structure

```
YOLO-Traffic-Detection/
├── index.html                      # Main web interface
├── style.css                       # Styling for web interface
├── content/                        # Media content directory
│   ├── videos/                     # Video files directory
│   │   └── ...                     # Processed video with detections
│   ├── data/                       # Data files directory
│   │   └── ...                     # Processed video with detections
├── data_viz/                       # Visualization scripts directory
│   ├── bounding-box.js             # Real-time object detection overlay
│   ├── container1.js               # Vehicle count by class visualization
│   └── container2.js               # Vehicle count over time visualization
├── model/                          # Python model directory
└── ...                             # Python files used to train the model and produce json output
├── utils/                          # Utility scripts
│   └── video-selector.js           # Video selection handling
└── README.md                       # Project documentation
```

## Visualizations

1. **Object Detection Overlay**
   - Real-time bounding box visualization
   - Color-coded by vehicle class
   - Shows confidence scores and tracking IDs

2. **Vehicle Count by Class**
   - Bar chart showing detected vehicle counts
   - Categorized by vehicle type
   - Allows for analysis of class distribution

3. **Total Vehicle Count**
   - Line chart showing total vehicles by frame
   - Provides analysis of traffic flow

## Technologies Used

- HTML & CSS for webpage and styling
- D3.js for data visualization
- YOLO v11 for object detection
- ByteTrack for object association
  
