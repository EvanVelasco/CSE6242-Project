//example derived from https://observablehq.com/@d3/bar-chart/2
const data2 = [
    { letter: 'A', frequency: 0.08167 },
    { letter: 'B', frequency: 0.01492 },
    { letter: 'C', frequency: 0.02782 },
];

const width2 = 200;
const height2 = 200;
const marginTop2 = 30;
const marginRight2 = 0;
const marginBottom2 = 30;
const marginLeft2 = 40;

const x2 = d3.scaleBand()
    .domain(d3.groupSort(data2, ([d]) => -d.frequency, (d) => d.letter)) 
    .range([marginLeft2, width2 - marginRight2])
    .padding(0.1);

const y2 = d3.scaleLinear()
    .domain([0, d3.max(data2, (d) => d.frequency)])
    .range([height2 - marginBottom2, marginTop2]);

const svg2 = d3.select("#container2")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`) 
    .attr("preserveAspectRatio", "xMidYMid meet") 
    .attr("width", "100%")
    .attr("height", "100%");

svg2.append("g")
    .attr("fill", "steelblue")
  .selectAll("rect")
  .data(data)
  .join("rect")
    .attr("x", (d) => x(d.letter))
    .attr("y", (d) => y(d.frequency))
    .attr("height", (d) => y(0) - y(d.frequency))
    .attr("width", x.bandwidth());

svg2.append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(d3.axisBottom(x).tickSizeOuter(0));

svg2.append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y).tickFormat((y) => (y * 100).toFixed()))
    .call(g => g.select(".domain").remove())
    .call(g => g.append("text")
        .attr("x", -marginLeft)
        .attr("y", 10)
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .text("Frequency (%)"));