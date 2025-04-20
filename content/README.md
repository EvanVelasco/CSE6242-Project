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

Videos should use standard web browser formats and be set to 25 fps. If your video is not playing, you may need to convert it to a compatible format. For more information about video conversion, visit [ffmpeg.org](https://ffmpeg.org/).


## JSON Data Format

Each JSON file should contain an array of objects with the following structure:

```
{
  "frame": number,          // Frame number
  "id": number,             // Vehicle ID
  "class": string,          // Vehicle class
  "confidence": float,      // Confidence Score
  "bbox": [                 // Bounding box coordinates
    number,                  // Left
    number,                  // Top
    number,                  // Right
    number                   // Bottom
  ]
}
```
