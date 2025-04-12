(function(){
  // Create the visualization with frame counter
function createVisualization() {
  // Clear any existing SVG
  d3.select('#container2 svg').remove();
  
  // Get container dimensions
  const container = document.getElementById('container2');
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  
  // Set dimensions
  const margin = {top: 50, right: 50, bottom: 80, left: 50};
  const width = Math.max(300, Math.min(containerWidth - 40, 800));
  const height = Math.max(300, Math.min(containerHeight - 40, 500));
  
  // Create SVG
  const svg = d3.select('#container2')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('display', 'block')
    .style('margin', 'auto');

  // Add frame counter display
  const frameDisplay = d3.select('body')
    .append('div')
    .style('position', 'absolute')
    .style('background', 'rgba(0, 0, 0, 0.7)')
    .style('color', 'white')
    .style('padding', '5px 10px')
    .style('border-radius', '3px')
    .style('font-family', 'monospace')
    .style('font-size', '14px')
    .style('pointer-events', 'none')  // Allow clicking through the counter
    .text('Frame: 0');

  // Position the frame counter relative to video
  function updateFramePosition() {
    const video = document.querySelector('.content-video');
    if (video) {
      const rect = video.getBoundingClientRect();
      frameDisplay
        .style('top', `${rect.top + 10}px`)
        .style('left', `${rect.right - 130}px`);
    }
  }

  // Update position on window resize
  window.addEventListener('resize', updateFramePosition);
  // Initial position
  updateFramePosition();
    
  // Add loading indicator
  const loading = svg.append('text')
    .attr('x', width / 2)
    .attr('y', height / 2)
    .attr('text-anchor', 'middle')
    .text('Loading data...');

  // Load and process data
  d3.json('content/yolo_output_tracking_11m_ver2.json')
    .then(data => {
      loading.remove();
      
      // Process data
      const frameCount = d3.rollup(
        data,
        v => v.length,
        d => d.frame
      );
      
      const processedData = Array.from(frameCount, ([frame, count]) => ({
        frame: +frame,
        count
      })).sort((a, b) => a.frame - b.frame);

      // Create scales
      const xScale = d3.scaleLinear()
        .domain(d3.extent(processedData, d => d.frame))
        .range([margin.left, width - margin.right]);
        
      const yScale = d3.scaleLinear()
        .domain([0, d3.max(processedData, d => d.count)])
        .nice()
        .range([height - margin.bottom, margin.top]);
      
      // Create line
      const line = d3.line()
        .curve(d3.curveMonotoneX)
        .x(d => xScale(d.frame))
        .y(d => yScale(d.count));

      // Create a clip path that will reveal the line
      const clipPath = svg.append('defs')
        .append('clipPath')
        .attr('id', 'clip-path');

      clipPath.append('rect')
        .attr('x', margin.left)
        .attr('y', margin.top)
        .attr('width', 0)
        .attr('height', height - margin.top - margin.bottom);
      
      // Add the line path with clip path
      svg.append('path')
        .datum(processedData)
        .attr('fill', 'none')
        .attr('stroke', '#6E260E')
        .attr('stroke-width', 3)
        .attr('d', line)
        .attr('clip-path', 'url(#clip-path)');

      // Add frame indicator dot
      const frameIndicator = svg.append('circle')
        .attr('fill', 'none')  // Transparent fill for the center
        .attr('stroke', 'steelblue')  // Red outline
        .attr('stroke-width', 2)  // Thickness of the donut
        .attr('r', 6)  // Slightly larger radius to account for stroke
        .style('opacity', 0)
        .style('transition', 'opacity 0.2s ease');

      // Add axes
      const xAxis = svg.append('g')
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale)
          .ticks(width > 500 ? 10 : 5)
          .tickFormat(d3.format('d')));
          
      xAxis.append('text')
        .attr('x', width / 2)
        .attr('y', 35)
        .attr('fill', 'black')
        .attr('font-size', '14px')
        .attr('text-anchor', 'middle')
        .text('Frame Number');
        
      const yAxisLine = svg.append('g')
        .attr('transform', `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale)
          .ticks(height > 300 ? 8 : 5)
          .tickFormat(d3.format('d'))
          .tickValues(d3.range(0, Math.ceil(d3.max(processedData, d => d.count)) + 1)));

          
          
      yAxisLine.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -35)
        .attr('x', -(height - margin.bottom + margin.top) / 2)
        .attr('fill', 'black')
        .attr('font-size', '14px')
        .attr('text-anchor', 'middle')
        .text('Count');

      // Get video element and add timeupdate listener
      const video = document.querySelector('video');
      const fps = 25; // video is 25fps
      
      let animationFrameId;
      
      function updateFrame() {
        const currentFrame = Math.floor(video.currentTime * fps);
        
        // Update frame counter display
        frameDisplay.text(`Frame: ${currentFrame}`);
        
        // Find the nearest data points
        const dataIndex = processedData.findIndex(d => d.frame >= currentFrame);
        if (dataIndex !== -1) {
          let xPos = xScale(currentFrame);
          let yPos;
          
          if (dataIndex === 0) {
            // If before first frame, use first frame's count
            yPos = yScale(processedData[0].count);
          } else if (dataIndex === processedData.length) {
            // If after last frame, use last frame's count
            yPos = yScale(processedData[processedData.length - 1].count);
          } else {
            // Interpolate between nearest frames
            const prevData = processedData[dataIndex - 1];
            const nextData = processedData[dataIndex];
            const fraction = (currentFrame - prevData.frame) / (nextData.frame - prevData.frame);
            const interpolatedCount = prevData.count + (nextData.count - prevData.count) * fraction;
            yPos = yScale(interpolatedCount);
          }
          
          if (xPos >= margin.left && xPos <= width - margin.right) {
            // Update clip path width to reveal line up to current position
            clipPath.select('rect')
              .attr('width', xPos - margin.left);
            
            frameIndicator
              .style('opacity', 1)
              .attr('transform', `translate(${xPos},${yPos})`);
          } else {
            frameIndicator.style('opacity', 0);
          }
        } else {
          frameIndicator.style('opacity', 0);
        }
        
        // Request next frame
        animationFrameId = requestAnimationFrame(updateFrame);
      }
      
      // Start animation when video plays
      video.addEventListener('play', () => {
        animationFrameId = requestAnimationFrame(updateFrame);
      });
      
      // Stop animation when video pauses
      video.addEventListener('pause', () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      });
      
      // Stop animation when video ends
      video.addEventListener('ended', () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      });
      
      // Initial update if video is already playing
      if (!video.paused) {
        animationFrameId = requestAnimationFrame(updateFrame);
      }
    })
    .catch(error => {
      loading.remove();
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', 'red')
        .text('Error loading data');
      console.error('Error loading data:', error);
    });
}

// Initial creation
createVisualization();

// Add window resize handler with debounce
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    createVisualization();
  }, 250);
});

// Cleanup function
function cleanup() {
  const video = document.querySelector('video');
  if (video) {
    video.removeEventListener('play', null);
    video.removeEventListener('pause', null);
    video.removeEventListener('ended', null);
  }
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  window.removeEventListener('resize', createVisualization);
  window.removeEventListener('resize', updateFramePosition);
  d3.select('#container2 svg').remove();
  frameDisplay.remove();
}

})();
