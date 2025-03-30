const data2 = [
    { date: new Date(2025, 0, 1), value: 30 },
    { date: new Date(2025, 1, 1), value: 50 },
    { date: new Date(2025, 2, 1), value: 40 },
    { date: new Date(2025, 3, 1), value: 60 },
    { date: new Date(2025, 4, 1), value: 80 }
];

const width2 = 300;
const height2 = 200;
const marginTop2 = 30;
const marginRight2 = 40;
const marginBottom2 = 30;
const marginLeft2 = 40;

const svg2 = d3.select("#container2")
    .append("svg")
    .attr("viewBox", `0 0 ${width2} ${height2}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("width", "100%")
    .attr("height", "100%");

const xScale2 = d3.scaleTime()
    .domain(d3.extent(data2, d => d.date))
    .range([marginLeft2, width2 - marginRight2]);

const yScale2 = d3.scaleLinear()
    .domain([0, d3.max(data2, d => d.value)])
    .range([height2 - marginBottom2, marginTop2]);

const line2 = d3.line()
    .x(d => xScale2(d.date))
    .y(d => yScale2(d.value));

svg2.append("path")
    .datum(data2)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 3)
    .attr("d", line2);

svg2.append("g")
    .attr("transform", `translate(0,${height2 - marginBottom2})`)
    .call(d3.axisBottom(xScale2)
        .tickValues(data2.map(d => d.date))
        .tickFormat(d3.timeFormat("%b %Y")));

svg2.append("g")
    .attr("transform", `translate(${marginLeft2},0)`)
    .call(d3.axisLeft(yScale2).tickFormat((y) => (y * 100).toFixed()))