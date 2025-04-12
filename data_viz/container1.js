(function(){
    function loadData() {
    return d3.json('content/yolo_output_tracking_11m_ver2.json')
        .then(data => {
            function accumulateIds(data) {
                const seenClasses = {};
                const result = [];
                
                const allClasses = new Set(data.map(entry => entry.class));
                const maxFrame = Math.max(...data.map(entry => entry.frame));
                
                for (let frame = 0; frame <= maxFrame; frame++) {
                    const frameResult = { frame: frame, classes: {} };
                    
                    allClasses.forEach(cls => {
                        frameResult.classes[cls] = seenClasses[cls] ? seenClasses[cls].size : 0;
                    });
                    
                    result.push(frameResult);
                }
                
                data.forEach(entry => {
                    const frame = entry.frame;
                    const className = entry.class;
                    const id = entry.id;
                    
                    if (!seenClasses[className]) {
                        seenClasses[className] = new Set();
                    }
                    
                    seenClasses[className].add(id);
                    
                    for (let i = frame; i <= maxFrame; i++) {
                        result[i].classes[className] = seenClasses[className].size;
                    }
                });
                
                return result;
            }
            
            return accumulateIds(data);
        })
        .catch(error => {
            console.error('Error loading or processing data:', error);
        });
}

function createVisualization() {
    d3.select('#container1 svg').remove();

    const container = document.getElementById('container1');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const margin = { top: 50, right: 50, bottom: 150, left: 50 };
    const width = Math.max(300, Math.min(containerWidth - 40, 800));
    const height = Math.max(300, Math.min(containerHeight - 40, 500));

    const svg = d3.select('#container1')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('display', 'block')
        .style('margin', 'auto');

    const loading = svg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .text('Loading data...');

    loadData().then(data => {
        loading.remove();

        // Sanity check
        console.log(JSON.stringify(data, null, 2));

        // Extract classes and values from the last frame for scaling
        const lastFrame = data[data.length - 1];
        const classes = Object.keys(lastFrame.classes);
        const values = Object.values(lastFrame.classes);

        // round to nearest 10 from max Y value
        const maxY = Math.ceil (Math.max(...values)/10) * 10;

        // Create x and y scales
        const xScale = d3.scaleBand()
            .domain(classes)
            .range([margin.left, width - margin.right])
            .padding(0.1);

        const yScale = d3.scaleLinear()
            .domain([0, maxY])
            .range([height - margin.bottom - 125, margin.top]);

        // Create axes
        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale)
            .tickValues(d3.range(0, maxY + 1, 5))  // Show ticks every 2 units
            .tickFormat(d3.format('d'));  // Format as integers

        // Append axes to the SVG
        svg.append('g')
            .attr('transform', `translate(0,${height - margin.bottom - 125})`)
            .call(xAxis)
            .selectAll('text')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end')
            .attr('dx', '-0.5em')
            .attr('dy', '0.7em');

        svg.append('g')
            .attr('transform', `translate(${margin.left},0)`)
            .call(yAxis);

        // Add y-axis label
        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', margin.left - 35)
            .attr('x', -(height/2) + 120)
            .attr('text-anchor', 'middle')
            .attr('font-size', '14px')
            .text('Count');

        

        // Create bars
        svg.selectAll('.bar')
            .data(classes)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => xScale(d))
            .attr('y', height - margin.bottom - 125)  // Position at x-axis
            .attr('width', xScale.bandwidth())
            .attr('height', 0)
            .attr('fill', '#6E260E');

        // Get video element and add timeupdate listener
        const video = document.querySelector('video');
        const fps = 25; // video is 25fps

        let animationFrameId;

        function updateFrame() {
            const currentFrame = Math.floor(video.currentTime * fps);
            const frameData = data[currentFrame];

            svg.selectAll('.bar')
                .data(classes)
                .transition()
                .duration(40)  // Short duration to keep up with video frame rate
                .attr('y', d => yScale(frameData.classes[d]))
                .attr('height', d => (height - margin.bottom - 125) - yScale(frameData.classes[d]));

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
})};



createVisualization();

// Add window resize handler with debounce
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    createVisualization();
  }, 250);
});

})();


