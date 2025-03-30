# Traffic Detection using YOLO

A web-based visualization project for traffic detection using YOLO (You Only Look Once) object detection.

## Overview

This project demonstrates traffic detection and analysis using YOLO object detection, with interactive visualizations built using D3.js. The system processes video footage and displays real-time detection results alongside analytical charts.


## Project Structure

```
CSE6242-Project/
├── index.html                      # Main web interface
├── about.html                      # About page
├── style.css                       # Styling for web interface
├── content/                        # Media content directory
│   └── yolo_output_11n_h264.mp4    # Processed video file
│   └── yolo_output_tracking_11n    # YOLO model output
├── data_viz/                       # Visualization scripts directory
│   ├── container1.js               # Vehicle count visualization
│   └── container2.js               # Vehicle trajectory visualization
└── README.md                       # Project documentation
```