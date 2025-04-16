document.addEventListener('DOMContentLoaded', function() {
    // Data mapping object to link videos with their data files
    const videoDataMapping = {
        'content/videos/video_1.mp4': 'content/data/data_1.json',
        'content/videos/video_2.mp4': 'content/data/data_2.json',
        'content/videos/video_3.mp4': 'content/data/data_3.json',
        'content/videos/video_4.mp4': 'content/data/data_4.json',
        'content/videos/video_5.mp4': 'content/data/data_5.json',
        'content/videos/video_6.mp4': 'content/data/data_6.json'
    };

    const videoItems = document.querySelectorAll('.video-item');
    const videoElement = document.querySelector('.content-video');
    const videoSource = videoElement.querySelector('source');
    const videoTitle = document.getElementById('video-title');

    // Custom event for data file changes
    const dataFileChangedEvent = new CustomEvent('dataFileChanged', {
        detail: { dataFile: videoDataMapping['content/videos/video_1.mp4'] }
    });

    // Show default video selection
    videoItems.forEach(item => {
        if (item.getAttribute('data-video') === 'content/videos/video_1.mp4') {
            item.classList.add('active');
            videoTitle.textContent = item.textContent;
        } else {
            item.classList.remove('active');
        }
    });

    videoItems.forEach(item => {
        item.addEventListener('click', function() {
            // Update active state
            videoItems.forEach(vi => vi.classList.remove('active'));
            this.classList.add('active');

            // Update video title
            videoTitle.textContent = this.textContent;

            // Update video source
            const videoPath = this.getAttribute('data-video');
            videoSource.src = videoPath;
            videoElement.load(); // Reload the video with new source

            // Dispatch event with new data file path
            const newDataFile = videoDataMapping[videoPath];
            const event = new CustomEvent('dataFileChanged', {
                detail: { dataFile: newDataFile }
            });
            document.dispatchEvent(event);
        });
    });

    // Dispatch initial data file event
    document.dispatchEvent(dataFileChangedEvent);
}); 