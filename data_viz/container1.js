// import class colors
import { classColors } from '../utils/set-class-colors.js';

(function(){
    let currentData = null;

    function loadData(dataFile) {
        return d3.json(dataFile)
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
                
                currentData = accumulateIds(data);
                return currentData;
            })
            .catch(error => {
                console.error('Error loading or processing data:', error);
                currentData = null;
            });
    }

    function createVisualization() {
        d3.select('#container1 svg').remove();
        
        const container = document.getElementById('container1');
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        const margin = {top: 20, right: 20, bottom: 60, left: 60};
        const width = containerWidth - margin.left - margin.right;
        const height = containerHeight - margin.top - margin.bottom;
        
        const svg = d3.select('#container1')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .style('display', 'block')
            .style('margin', 'auto');
            
        const loading = svg.append('text')
            .attr('x', width / 2)
            .attr('y', height / 2)
            .attr('text-anchor', 'middle')
            .text('Loading data...');

        if (!currentData) {
            loading.text('No data available');
            return;
        }

        loading.remove();
        
        // Get unique classes
        const classes = Array.from(new Set(Object.keys(currentData[0].classes)));
        
        // Create scales
        const xScale = d3.scaleBand()
            .domain(classes)
            .range([margin.left, width - margin.right])
            .padding(0.1);
            
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(currentData, d => d3.max(Object.values(d.classes)))])
            .nice()
            .range([height - margin.bottom, margin.top]);
        
        // Create bars
        svg.selectAll('.bar')
            .data(classes)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => xScale(d))
            .attr('y', height - margin.bottom)
            .attr('width', xScale.bandwidth())
            .attr('height', 0)
            .attr('fill', d => classColors[d] || '#808080');

        // Add axes
        svg.append('g')
            .attr('transform', `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(xScale))
            .append('text')
            .attr('x', width / 2)
            .attr('y', 35)
            .attr('fill', 'black')
            .attr('font-size', '14px')
            .attr('text-anchor', 'middle')
            .text('Vehicle Class');
            
        const yAxisLine = svg.append('g')
            .attr('transform', `translate(${margin.left},0)`)
            .call(d3.axisLeft(yScale));

        // Add y-axis label
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
            if (!currentData) return;
            
            const currentFrame = Math.floor(video.currentTime * fps);
            const frameData = currentData[currentFrame] || currentData[0];
            
            svg.selectAll('.bar')
                .data(classes)
                .transition()
                .duration(40)
                .attr('y', d => yScale(frameData.classes[d]))
                .attr('height', d => (height - margin.bottom) - yScale(frameData.classes[d]));
            
            animationFrameId = requestAnimationFrame(updateFrame);
        }
        
        video.addEventListener('play', () => {
            animationFrameId = requestAnimationFrame(updateFrame);
        });
        
        video.addEventListener('pause', () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        });
        
        video.addEventListener('ended', () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        });
        
        if (!video.paused) {
            animationFrameId = requestAnimationFrame(updateFrame);
        }
    }

    // Listen for data file changes
    document.addEventListener('dataFileChanged', async (event) => {
        const { dataFile } = event.detail;
        await loadData(dataFile);
        createVisualization();
    });

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
})();


