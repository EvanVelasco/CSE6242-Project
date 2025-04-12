// D3.js code for bounding box visualization
let boundingBoxData = [];
let svg = null;
let currentFrame = 0;

// Define colors for each class
const classColors = {
    'car': '#2196F3',    // blue
    'truck': '#4CAF50',  // green
    'bus': '#FFC107',    // yellow
};

async function initializeBoundingBoxes(videoContainer) {
    try {
        // Load the YOLO tracking data
        const response = await fetch('/content/yolo_output_tracking_11m_ver2.json');
        boundingBoxData = await response.json();

        // Remove existing SVG if any
        d3.select('#bounding-box-overlay').remove();

        // Get video element dimensions
        const videoElement = videoContainer.querySelector('.content-video');
        
        // Create a wrapper div that will handle clicks
        const overlayWrapper = document.createElement('div');
        overlayWrapper.id = 'bounding-box-wrapper';
        overlayWrapper.style.position = 'absolute';
        overlayWrapper.style.top = '0';
        overlayWrapper.style.left = '0';
        overlayWrapper.style.right = '0';
        overlayWrapper.style.bottom = '0';
        overlayWrapper.style.zIndex = '10';
        
        // Add the wrapper to the video container
        videoContainer.style.position = 'relative';
        videoContainer.appendChild(overlayWrapper);
        
        // Add click handler to the wrapper
        overlayWrapper.addEventListener('click', function(e) {
            // Forward clicks to video
            if (videoElement) {
                if (videoElement.paused) {
                    videoElement.play();
                } else {
                    videoElement.pause();
                }
            }
            e.stopPropagation();
        });
        
        // Create SVG inside wrapper
        svg = d3.select(overlayWrapper)
            .append('svg')
            .attr('id', 'bounding-box-overlay')
            .attr('width', '100%')
            .attr('height', '100%')
            .style('pointer-events', 'none');

        // Add a group for the bounding boxes
        svg.append('g')
            .attr('class', 'bounding-boxes')
            .style('pointer-events', 'none');

        // Get the video's dimensions for letterboxing calculation
        const videoWidth = videoElement.videoWidth;
        const videoHeight = videoElement.videoHeight;
        const videoAspectRatio = videoWidth / videoHeight;
        
        // Calculate positions
        const videoRect = videoElement.getBoundingClientRect();
        const wrapperRect = overlayWrapper.getBoundingClientRect();
        const containerAspectRatio = videoRect.width / videoRect.height;
        
        // Calculate offsets for letterboxing
        let offsetX, offsetY;
        
        if (videoAspectRatio > containerAspectRatio) {
            // Video is wider - black bars on top/bottom
            offsetX = 0;
            offsetY = (videoRect.height - (videoRect.width / videoAspectRatio)) / 2;
        } else {
            // Video is taller - black bars on sides
            offsetY = 0;
            offsetX = (videoRect.width - (videoRect.height * videoAspectRatio)) / 2;
        }
        
        // Calculate relative position with letterboxing offset
        const relativeLeft = videoRect.left - wrapperRect.left + offsetX;
        const relativeTop = videoRect.top - wrapperRect.top + offsetY;

        // Add class color legend positioned relative to the video
        const legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${relativeLeft + 15}, ${relativeTop + 25})`)
            .style('pointer-events', 'none');

        // Get unique classes from the data
        const uniqueClasses = [...new Set(boundingBoxData.map(d => d.class))];

        // Create legend items
        uniqueClasses.forEach((className, i) => {
            const legendItem = legend.append('g')
                .attr('transform', `translate(0, ${i * 20})`)
                .style('pointer-events', 'none');

            // Add colored rectangle
            legendItem.append('rect')
                .attr('width', 15)
                .attr('height', 15)
                .attr('fill', classColors[className] || '#808080')
                .style('pointer-events', 'none');

            // Add class name
            legendItem.append('text')
                .attr('x', 20)
                .attr('y', 12)
                .style('font-size', '14px')
                .style('fill', 'white')
                .style('text-shadow', '1px 1px 1px rgba(0, 0, 0, 0.7)')
                .text(className)
                .style('pointer-events', 'none');
        });

        // Add resize observer to reposition elements when video size changes
        const resizeObserver = new ResizeObserver(() => {
            // Recalculate positions with letterboxing
            const newVideoRect = videoElement.getBoundingClientRect();
            const newWrapperRect = overlayWrapper.getBoundingClientRect();
            const newContainerAspectRatio = newVideoRect.width / newVideoRect.height;
            
            let newOffsetX, newOffsetY;
            
            if (videoAspectRatio > newContainerAspectRatio) {
                // Video is wider - black bars on top/bottom
                newOffsetX = 0;
                newOffsetY = (newVideoRect.height - (newVideoRect.width / videoAspectRatio)) / 2;
            } else {
                // Video is taller - black bars on sides
                newOffsetY = 0;
                newOffsetX = (newVideoRect.width - (newVideoRect.height * videoAspectRatio)) / 2;
            }
            
            const newRelativeLeft = newVideoRect.left - newWrapperRect.left + newOffsetX;
            const newRelativeTop = newVideoRect.top - newWrapperRect.top + newOffsetY;
            
            legend.attr('transform', `translate(${newRelativeLeft + 15}, ${newRelativeTop + 25})`);
            
            // Update boxes if we have a current frame
            if (currentFrame !== undefined) {
                updateBoundingBoxes(currentFrame);
            }
        });
        
        resizeObserver.observe(videoElement);
        resizeObserver.observe(window.document.body);

        // Also update on window resize
        window.addEventListener('resize', () => {
            // Recalculate positions with letterboxing
            const newVideoRect = videoElement.getBoundingClientRect();
            const newWrapperRect = overlayWrapper.getBoundingClientRect();
            const newContainerAspectRatio = newVideoRect.width / newVideoRect.height;
            
            let newOffsetX, newOffsetY;
            
            if (videoAspectRatio > newContainerAspectRatio) {
                // Video is wider - black bars on top/bottom
                newOffsetX = 0;
                newOffsetY = (newVideoRect.height - (newVideoRect.width / videoAspectRatio)) / 2;
            } else {
                // Video is taller - black bars on sides
                newOffsetY = 0;
                newOffsetX = (newVideoRect.width - (newVideoRect.height * videoAspectRatio)) / 2;
            }
            
            const newRelativeLeft = newVideoRect.left - newWrapperRect.left + newOffsetX;
            const newRelativeTop = newVideoRect.top - newWrapperRect.top + newOffsetY;
            
            legend.attr('transform', `translate(${newRelativeLeft + 15}, ${newRelativeTop + 25})`);
            
            if (currentFrame !== undefined) {
                updateBoundingBoxes(currentFrame);
            }
        });

    } catch (error) {
        console.error('Error initializing bounding boxes:', error);
    }
}

function updateBoundingBoxes(frameNumber) {
    if (!svg || !boundingBoxData) return;

    currentFrame = frameNumber;
    const frameData = boundingBoxData.filter(d => d.frame === frameNumber);
    
    // Get video element
    const videoElement = document.querySelector('.content-video');
    if (!videoElement) return;
    
    // Get the actual video dimensions
    const videoWidth = videoElement.videoWidth;
    const videoHeight = videoElement.videoHeight;
    const videoAspectRatio = videoWidth / videoHeight;
    
    // Get the video element's displayed dimensions and position
    const videoRect = videoElement.getBoundingClientRect();
    const wrapperRect = svg.node().getBoundingClientRect();
    
    // Calculate the actual displayed video dimensions accounting for letterboxing
    // First, determine if we have vertical or horizontal letterboxing
    const containerAspectRatio = videoRect.width / videoRect.height;
    
    let displayedWidth, displayedHeight, offsetX, offsetY;
    
    if (videoAspectRatio > containerAspectRatio) {
        // Video is wider than container - will have black bars on top and bottom
        displayedWidth = videoRect.width;
        displayedHeight = displayedWidth / videoAspectRatio;
        offsetX = 0;
        offsetY = (videoRect.height - displayedHeight) / 2;
    } else {
        // Video is taller than container - will have black bars on sides
        displayedHeight = videoRect.height;
        displayedWidth = displayedHeight * videoAspectRatio;
        offsetX = (videoRect.width - displayedWidth) / 2;
        offsetY = 0;
    }
    
    // Calculate relative position of video within the wrapper
    const relativeLeft = videoRect.left - wrapperRect.left + offsetX;
    const relativeTop = videoRect.top - wrapperRect.top + offsetY;
    
    // Select all existing boxes and bind new data
    const boxes = svg.select('.bounding-boxes')
        .selectAll('rect')
        .data(frameData, d => d.id);

    // Remove old boxes
    boxes.exit().remove();

    // Add new boxes and update existing ones
    boxes.enter()
        .append('rect')
        .merge(boxes)
        .attr('x', d => relativeLeft + (d.bbox[0] / videoWidth) * displayedWidth)
        .attr('y', d => relativeTop + (d.bbox[1] / videoHeight) * displayedHeight)
        .attr('width', d => ((d.bbox[2] - d.bbox[0]) / videoWidth) * displayedWidth)
        .attr('height', d => ((d.bbox[3] - d.bbox[1]) / videoHeight) * displayedHeight)
        .attr('class', 'bounding-box')
        .style('fill', 'none')
        .style('stroke', d => classColors[d.class] || '#808080')
        .style('stroke-width', '2px')
        .style('opacity', d => Math.min(1, d.confidence + 0.3))
        .style('pointer-events', 'none');

    // Update labels
    const labels = svg.select('.bounding-boxes')
        .selectAll('text')
        .data(frameData, d => d.id);

    labels.exit().remove();

    labels.enter()
        .append('text')
        .merge(labels)
        .attr('x', d => relativeLeft + (d.bbox[0] / videoWidth) * displayedWidth)
        .attr('y', d => relativeTop + (d.bbox[1] / videoHeight) * displayedHeight - 5)
        .text(d => `${d.class} ${d.id} (${Math.round(d.confidence * 100)}%)`)
        .attr('class', 'bounding-box-label')
        .style('fill', d => classColors[d.class] || '#808080')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('pointer-events', 'none');
}

// Export functions
export { initializeBoundingBoxes, updateBoundingBoxes };
