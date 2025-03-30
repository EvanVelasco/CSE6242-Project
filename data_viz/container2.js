const data = [
    { date: new Date(2025, 0, 1), value: 30 },
    { date: new Date(2025, 1, 1), value: 50 },
    { date: new Date(2025, 2, 1), value: 40 },
    { date: new Date(2025, 3, 1), value: 60 },
    { date: new Date(2025, 4, 1), value: 80 }
];


const width = 200;
const height = 200;
const marginTop = 30;
const marginRight = 0;
const marginBottom = 30;
const marginLeft = 40;

const svg = d3.select("#container2")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`) 
    .attr("preserveAspectRatio", "xMidYMid meet") 
    .attr("width", "100%")
    .attr("height", "100%");

const xScale = d3.scaleTime()
    .domain(d3.extent(data, d => d.date))
    .range([marginLeft, width - marginRight]);

const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value)])
    .range([height - marginBottom, marginTop]);

const line = d3.line()
    .x(d => xScale(d.date))
    .y(d => yScale(d.value));

svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("d", line);



svg.append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(d3.axisBottom(x).tickSizeOuter(0));

svg.append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y).tickFormat((y) => (y * 100).toFixed()))
    .call(g => g.select(".domain").remove())
    .call(g => g.append("text")
        .attr("x", -marginLeft)
        .attr("y", 10)
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .text("Frequency (%)"));