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
        const response = await fetch('/content/data/data_1.json');
        boundingBoxData = await response.json();

        // Remove existing SVG if any
        d3.select(videoContainer).select('.bounding-box-overlay').remove();

        // Get video element dimensions
        const videoElement = videoContainer.querySelector('.content-video');
        const videoRect = videoElement.getBoundingClientRect();

        // Create SVG overlay with the same dimensions as the video
        svg = d3.select(videoContainer)
            .append('svg')
            .attr('class', 'bounding-box-overlay')
            .style('position', 'absolute')
            .style('top', `${videoRect.top - videoContainer.getBoundingClientRect().top}px`)
            .style('left', `${videoRect.left - videoContainer.getBoundingClientRect().left}px`)
            .style('width', `${videoRect.width}px`)
            .style('height', `${videoRect.height}px`);

        // Add a group for the bounding boxes
        svg.append('g')
            .attr('class', 'bounding-boxes');

        // Add class color legend
        const legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', 'translate(15, 25)');

        // Get unique classes from the data
        const uniqueClasses = [...new Set(boundingBoxData.map(d => d.class))];

        // Create legend items
        uniqueClasses.forEach((className, i) => {
            const legendItem = legend.append('g')
                .attr('transform', `translate(0, ${i * 20})`);

            // Add colored rectangle
            legendItem.append('rect')
                .attr('width', 15)
                .attr('height', 15)
                .attr('fill', classColors[className] || '#808080');

            // Add class name
            legendItem.append('text')
                .attr('x', 20)
                .attr('y', 12)
                .style('font-size', '14px')
                .style('fill', 'white')
                .style('text-shadow', '1px 1px 1px rgba(0, 0, 0, 0.7)')
                .text(className);
        });

        // Add resize observer to update SVG position and size when video dimensions change
        const resizeObserver = new ResizeObserver(() => {
            const newVideoRect = videoElement.getBoundingClientRect();
            const containerRect = videoContainer.getBoundingClientRect();
            
            svg.style('top', `${newVideoRect.top - containerRect.top}px`)
               .style('left', `${newVideoRect.left - containerRect.left}px`)
               .style('width', `${newVideoRect.width}px`)
               .style('height', `${newVideoRect.height}px`);

            // Update boxes if we have a current frame
            if (currentFrame !== undefined) {
                updateBoundingBoxes(currentFrame);
            }
        });

        resizeObserver.observe(videoElement);

    } catch (error) {
        console.error('Error initializing bounding boxes:', error);
    }
}

function updateBoundingBoxes(frameNumber) {
    if (!svg || !boundingBoxData) return;

    currentFrame = frameNumber;
    const frameData = boundingBoxData.filter(d => d.frame === frameNumber);
    
    // Get video dimensions for scaling
    const videoElement = svg.node().parentNode.querySelector('.content-video');
    const videoRect = videoElement.getBoundingClientRect();
    
    // Get the actual video dimensions
    const videoWidth = videoElement.videoWidth;
    const videoHeight = videoElement.videoHeight;
    
    // Calculate scaling factors
    const scale = Math.min(
        videoRect.width / videoWidth,
        videoRect.height / videoHeight
    );
    
    // Calculate the actual dimensions of the video display area
    const actualWidth = videoWidth * scale;
    const actualHeight = videoHeight * scale;
    
    // Calculate offsets to center the video
    const xOffset = (videoRect.width - actualWidth) / 2;
    const yOffset = (videoRect.height - actualHeight) / 2;
    
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
        .attr('x', d => xOffset + (d.bbox[0] / videoWidth) * actualWidth)
        .attr('y', d => yOffset + (d.bbox[1] / videoHeight) * actualHeight)
        .attr('width', d => ((d.bbox[2] - d.bbox[0]) / videoWidth) * actualWidth)
        .attr('height', d => ((d.bbox[3] - d.bbox[1]) / videoHeight) * actualHeight)
        .attr('class', 'bounding-box')
        .style('fill', 'none')
        .style('stroke', d => classColors[d.class] || '#808080')
        .style('stroke-width', '2px')
        .style('opacity', d => Math.min(1, d.confidence + 0.3));

    // Update labels
    const labels = svg.select('.bounding-boxes')
        .selectAll('text')
        .data(frameData, d => d.id);

    labels.exit().remove();

    labels.enter()
        .append('text')
        .merge(labels)
        .attr('x', d => xOffset + (d.bbox[0] / videoWidth) * actualWidth)
        .attr('y', d => yOffset + (d.bbox[1] / videoHeight) * actualHeight - 5)
        .text(d => `${d.class} ${d.id} (${Math.round(d.confidence * 100)}%)`)
        .attr('class', 'bounding-box-label')
        .style('fill', d => classColors[d.class] || '#808080')
        .style('font-size', '18px')
        .style('font-weight', 'bold');
}

// Function to handle window resize
function handleResize() {
    if (svg) {
        updateBoundingBoxes(currentFrame);
    }
}

// Add resize listener
window.addEventListener('resize', handleResize);

// Export functions
export { initializeBoundingBoxes, updateBoundingBoxes };
