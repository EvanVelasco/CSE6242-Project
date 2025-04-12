document.addEventListener('DOMContentLoaded', function() {
    const videoItems = document.querySelectorAll('.video-item');
    const videoElement = document.querySelector('.content-video');
    const videoSource = videoElement.querySelector('source');

    videoItems.forEach(item => {
        item.addEventListener('click', function() {
            // Update active state
            videoItems.forEach(vi => vi.classList.remove('active'));
            this.classList.add('active');

            // Update video source
            const videoPath = this.getAttribute('data-video');
            videoSource.src = videoPath;
            videoElement.load(); // Reload the video with new source
        });
    });
}); 