# Content Directory

This directory contains the video files and their corresponding detection data used in our traffic detection visualization system.

## Structure

```
content/
├── videos/        # Traffic video files without bounding boxes
└── data/          # JSON files containing detection data
```


## Adding New Content

All new content must include both a video file and a json file. To add a new video and its detection data:

1. Place the video file in `content/videos/`
2. Place the corresponding JSON file in `content/data/`
3. Update the video-to-JSON mapping in `utils/video-selector.js`
4. Add the video entry to the sidebar in `index.html`


## Video Format

Videos should use standard web browser formats. If your video is not playing, you may need to convert it to a compatible format. For more information about video conversion, visit [ffmpeg.org](https://ffmpeg.org/).


## JSON Data Format

Each JSON file should contain an array of objects with the following structure:

```json
{
  "frame": 10,          // Frame number
  "id": 1,              // Vehicle ID
  "class": "car",       // Vehicle class
  "confidence": 0.95,   // Detection confidence (0-1)
  "bbox": [             // Bounding box coordinates
    100,                  // Left
    150,                  // Top
    200,                  // Right
    250                   // Bottom
  ]
}
```
