document.addEventListener('DOMContentLoaded', function() {
    const videoItems = document.querySelectorAll('.video-item');
    const videoElement = document.querySelector('.content-video');
    const videoSource = videoElement.querySelector('source');
    const videoTitle = document.getElementById('video-title');

    // Show default video selection
    videoItems.forEach(item => {
        if (item.getAttribute('data-video') === 'content/videos/yolo_output_11m_ver2.mp4') {
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
        });
    });
}); 