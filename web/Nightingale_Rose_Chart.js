class Nightingale_Rose_Chart{
    /**
     * Class constructor with basic rose chart configuration
     * @param {*} _config 
     * @param {*} _data 
     */
    constructor(_config,_data){
        this._config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 600,
            containerHeight: _config.containerHeight || 800,
            margin: _config.margin || {top: 5, right: 20, bottom: 20, left: 20}
        }
        this.originalData = _data; // Store the original data
        this.selectedCategory = null; // Track the selected category
        this.dataProcessed = false;
        this.data = _data;
        this.initVis();
    }

    /**
     * This builds things that doesn't need any update.
     */
    initVis(){
        let vis = this;

        // SVG elements and constants
        vis.width = vis._config.containerWidth - vis._config.margin.left - vis._config.margin.right;
        vis.height = vis._config.containerHeight - vis._config.margin.top - vis._config.margin.bottom;

        vis.innerRadius = 150;
        vis.outerRadius = Math.min(vis.width, vis.height) / 1.5;

        vis.svg = d3.select(vis._config.parentElement)
                    .append('svg')
                    .attr("width", vis._config.containerWidth)
                    .attr("height", vis._config.containerHeight)
                    .attr("viewBox", [-vis.width / 2, -vis.height / 2, vis.width, vis.height])
                    .attr("style", "width: 100%; font: 10px sans-serif;");
        
        //Data needs to be initiated to fill color keys
        vis.processData();

        vis.monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        vis.daysInMonth = {
            "Jan": 31, "Feb": 28, "Mar": 31, "Apr": 30, "May": 31, "Jun": 30,
            "Jul": 31, "Aug": 31, "Sep": 30, "Oct": 31, "Nov": 30, "Dec": 31
        };

        // Month is always the same
        vis.x = d3.scaleBand()
            .domain(vis.monthNames)
            .range([0, 2 * Math.PI])
            .align(0);
        
        vis.y = d3.scaleRadial()
            .range([vis.innerRadius, vis.outerRadius]);
        
        vis.arc = d3.arc()
            .innerRadius(vis.innerRadius)
            .outerRadius(vis.innerRadius)
            .startAngle(d => vis.x(vis.monthNames[d.data.month - 1]))
            .endAngle(d => vis.x(vis.monthNames[d.data.month - 1]) + vis.x.bandwidth())
            .padAngle(5 / vis.innerRadius)
            .padRadius(vis.innerRadius);
        
        vis.color = d3.scaleOrdinal()
            .range(["#4e79a7","#f28e2c","#e15759","#76b7b2","#59a14f","#edc949","#af7aa1","#ff9da7","#9c755f","#bab0ab"])
            .unknown("#ccc")
            .domain(vis.data.map(d => d.key));
        
        vis.ring = vis.svg.append('g');
        vis.innerMark = vis.svg.append('g').attr("text-anchor", "middle");
        vis.background = vis.svg.append('g').attr("text-anchor", "middle");
        vis.colorkey = vis.svg.append("g");

        vis.renderInnerMark();
        vis.initiateColorKey();
        
    }

    updateVis(){
        let vis = this;

        if(!vis.dataProcessed){
            vis.processData();
        }
        vis.y.domain([0, d3.max(vis.data, d => d3.max(d, d => d[1]))])

        vis.renderRings();
        vis.renderBackground();
        vis.renderInnerMark();
    }

    processData() {
        let vis = this;
    
        // Group the data by month and category
        let groupedData = d3.groups(vis.data, d => d.month, d => d.category)
            .map(([month, categories]) => {
                const categoryCounts = {};
                categories.forEach(([category, events]) => {
                    categoryCounts[category] = events.length;
                });
                return { month, ...categoryCounts };
            });
    
        // Prepare data for stack layout
        const stack = d3.stack().keys([...new Set(vis.data.map(d => d.category))]);
        const series = stack(groupedData);
    
        vis.data = series;
        vis.dataProcessed = true;

    }

    /**
     * This function changes the inner marks according to data. 
     */
    renderInnerMark(){
        let vis = this;
        let x = vis.x;
        vis.innerMark.selectAll("*").remove();

        vis.innerMark.selectAll("g")
            .data(x.domain())
            .join("g")
            .attr("transform", d => `
                rotate(${((x(d) + x.bandwidth() / 2) * 180 / Math.PI - 90)})
                translate(${vis.innerRadius},0)
            `)
            .call(g => g.append("line")
            .attr("x2", -5)
            .attr("stroke", "#000"))
            //We use call here because "text" and "line" is on the same hierarchy. If using append, we need to return to the parent node.
            .call(g => g.append("text") 
            .attr("transform", d => (x(d) + x.bandwidth() / 2 + Math.PI / 2) % (2 * Math.PI) < Math.PI
                //If in the upper half, turn 90, else, turn -90
                ? "rotate(90)translate(0,16)"
                : "rotate(-90)translate(0,-9)")
            .attr("class", "month-key")
            .text(d => d))
            .on("click", function(event,d) {
                let matching_event = vis.originalData.filter(data => data.month === vis.monthNames.indexOf(d) + 1)
                if(vis.selectedCategory != null ){
                    matching_event = matching_event.filter(data => data.category === vis.selectedCategory)
                }
                const month = new CustomEvent("roseChartMonthClick", { detail: matching_event });
                window.dispatchEvent(month);
            });
    }

    /**
     * This function changes the background according to data. 
     */
    renderBackground(){
        let vis = this;
        let y = vis.y;
        vis.background.selectAll("*").remove();

        if(vis.selectedCategory == null){
            vis.background
            .call(g => g.append("text")
            .attr("y", d => -y(y.ticks(3).pop()))
            .attr("dy", "-1em")
            .text("Count"))
            .call(g => g.selectAll("g")
            .data(y.ticks(3))
            .join("g")
            .attr("fill", "none")
            .call(g => g.append("circle")
                .attr("stroke", "#000")
                .attr("stroke-opacity", 0.5)
                .attr("r", y))
            .call(g => g.append("text")
                .attr("y", d => -y(d))
                .attr("dy", "0.35em")
                .attr("stroke", "#fff") // A white background so that the text can stands out
                .attr("stroke-width", 5)
                .text(y.tickFormat(3, "s"))// Formatted so that it won't be 1k,2k
                .clone(true)
                .attr("fill", "#000")
                .attr("stroke", "none")));
        } else {
            // Always keep the inner radius circle
            vis.background
                .append("circle")
                .attr("stroke", "#000")
                .attr("stroke-opacity", 0.5)
                .attr("r", vis.innerRadius)
                .attr("fill", "none");
        }
    }

    /**
     * This function initiates the color key according to data. 
     */
    initiateColorKey(){
        let vis = this;

        vis.colorkey
            .selectAll("g")
            .data(vis.color.domain())
            .join("g")
            .attr("class", "color-key")
            .attr("transform", (d, i, nodes) => `translate(${vis.width / 2}, ${-vis.height / 2 + 20 + i * 20})`)
            .call(g => g.append("rect")
            .attr("width", 18)
            .attr("height", 18)
            .attr("fill", vis.color))
            .on("click", (event, d) => {
                if (vis.selectedCategory === d) {
                    vis.selectedCategory = null;
                    vis.data = vis.originalData;
                    d3.select(event.currentTarget).classed("selected", false);
                } else {
                    vis.selectedCategory = d;
                    vis.data = vis.originalData.filter(data => data.category === d);
                    vis.colorkey.selectAll("g").classed("selected", false);
                    d3.select(event.currentTarget).classed("selected", true);
                }
                vis.dataProcessed = false;
                vis.updateVis();
            })
            .call(g => g.append("text")
            .attr("x", 24)
            .attr("y", 9)
            .attr("dy", "0.35em")
            .text(d => d));
    }
   
    renderRings() {
        let vis = this;
        let y = vis.y;
        vis.ring.selectAll("*").remove();

        let tooltip = d3.select("body").select(".tooltip");
        if (tooltip.empty()) {
            tooltip = d3.select("body").append("div")
                .attr("class", "tooltip")
                .style("position", "absolute")
                .style("visibility", "hidden")
                .style("background", "#f9f9f9")
                .style("border", "1px solid #d3d3d3")
                .style("padding", "5px")
                .style("border-radius", "5px")
                .style("box-shadow", "0px 0px 5px rgba(0,0,0,0.1)");
        }
    
        // Render the arcs for each category
        vis.ring.selectAll("g")
            .data(vis.data)
            .join("g") //This creates inner tags of <g> that has the size of the categories
            .attr("fill", d => vis.color(d.key)) //Fill the color according to colors assigned
            .selectAll("path") // In each <g>, select path.
            .data(d => d) // Tuples of [start, end]
            .join("path") //Create arcs for 12 months
            .attr("d", vis.arc)
            .transition()
            .duration(1000)
            .attrTween("d", function (d) {
                const interpolateInner = d3.interpolate(vis.innerRadius, y(d[0]));
                const interpolateOuter = d3.interpolate(vis.innerRadius, vis.selectedCategory ? vis.outerRadius : y(d[1]));
                return function (t) {
                    //This is called repeatedly to perform the arc(d) given changing inner / outer radius.
                    return vis.arc
                        .innerRadius(interpolateInner(t))
                        .outerRadius(interpolateOuter(t))(d);
                };
            });
    
        // Add circles for each event
        if (vis.selectedCategory != null) {
            vis.ring.selectAll("g")
                .data(vis.data)
                .join("g")
                .attr("fill", d => vis.color(d.key)) // Fill the color according to colors assigned
                .each(function (d) {
                    d.forEach(e => {
                        if (e.data[vis.selectedCategory] !== undefined) {
                            const daysInMonth = vis.daysInMonth[vis.monthNames[e.data.month - 1]];
                            const startAngle = vis.x(vis.monthNames[e.data.month - 1]);
                            const endAngle = startAngle + vis.x.bandwidth();
                            const arcHeight = vis.outerRadius - vis.innerRadius;
                            const arcWidth = endAngle - startAngle;
                            const paddingRadius = daysInMonth >= 30? arcHeight/11 : arcHeight/10;

                            const circlesPerLine = Math.floor(daysInMonth / 3);
                            

                            for (let i = 0; i < daysInMonth; i++) {
                                let lineIndex = Math.floor(i / circlesPerLine);
                                let positionInLine = i % circlesPerLine;

                                // If there are extra events, add them to the middle line
                                if (lineIndex >= 3) {
                                    lineIndex = 1;
                                    positionInLine += circlesPerLine; // Adjust position in line for overflow
                                }

                                const radius = vis.innerRadius + paddingRadius * positionInLine + 10; // Position circles in straight lines
                                const angle = startAngle + (lineIndex + 1) * (arcWidth / 4);
                                const circleRadius = paddingRadius/2.5;
                                const date = i + 1;
                                
                                d3.select(this).append("circle")
                                    .attr("cx", radius * Math.cos(angle - Math.PI / 2))
                                    .attr("cy", radius * Math.sin(angle - Math.PI / 2))
                                    .attr("r", circleRadius) // Radius of each circle
                                    .attr("fill", "#FFF") // Color of the circles
                                    .attr('fill-opacity', 0.8)
                                    .on("mouseover", (event) => {
                                        console.log(vis.originalData);
                                        const count = vis.originalData.filter(data => data.month === e.data.month && data.date === date && data.category === vis.selectedCategory).length;
                                        tooltip.style("visibility", "visible")
                                            .text(`Date: ${vis.monthNames[e.data.month - 1]} ${date}, Events: ${count}`)
                                            .style("top", (event.pageY - 10) + "px")
                                            .style("left", (event.pageX + 10) + "px");
                                    })
                                    .on("mousemove", (event) => {
                                        tooltip.style("top", (event.pageY - 10) + "px")
                                            .style("left", (event.pageX + 10) + "px");
                                    })
                                    .on("mouseout", () => {
                                        tooltip.style("visibility", "hidden");
                                    })
                                    .on("click", () => {
                                        vis.renderEventCircles(e.data.month, date, vis.selectedCategory);
                                    });;
                        }
    
                            // Add count text on top of each arc
                            const textRadius = vis.outerRadius + 10;
                            const textAngle = startAngle + (arcWidth / 2);
                            d3.select(this).append("text")
                                .attr("x", textRadius * Math.cos(textAngle - Math.PI / 2))
                                .attr("y", textRadius * Math.sin(textAngle - Math.PI / 2))
                                .attr("dy", "0.35em")
                                .attr("text-anchor", "middle")
                                .attr("fill", "#000")
                                .text(e.data[vis.selectedCategory]);
                        }
                    });
                });
        }
    }

    renderEventCircles(month, date, category) {
        let vis = this;
        vis.innerMark.selectAll("circle").remove(); // Clear existing circles
    
        const events = vis.originalData.filter(data => data.month === month && data.date === date && data.category === category);
        const packingInnerRadius = vis.innerRadius * 0.7;
        // Prepare the data for the circle packing layout
        const data = {
            name: "root",
            children: events.map((event, i) => ({
                name: event.event_name,
                value: 1 // Uniform size
            }))
        };
    
        // Set up the circle packing layout
        const pack = d3.pack()
            .size([packingInnerRadius * 1.8, packingInnerRadius * 1.8]) // Set size based on inner radius
            .padding(5);
    
        const root = d3.hierarchy(data)
            .sum(d => d.value);
    
        const nodes = pack(root).leaves();
    
        vis.innerMark.selectAll("circle")
            .data(nodes)
            .join("circle")
            .attr("cx", d => d.x - packingInnerRadius + 10) // Adjust for the center and smaller radius
            .attr("cy", d => d.y - packingInnerRadius + 10)
            .attr("r", d => d.r)
            .attr("fill", vis.color(category))
            .attr("fill-opacity", 0.8)
            .on("mouseover", (event, d) => {
                let tooltip = d3.select("body").select(".tooltip");
                tooltip.style("visibility", "visible")
                    .text(d.data.name) // Display event name
                    .style("top", (event.pageY - 10) + "px")
                    .style("left", (event.pageX + 10) + "px");
            })
            .on("mousemove", (event) => {
                let tooltip = d3.select("body").select(".tooltip");
                tooltip.style("top", (event.pageY - 10) + "px")
                    .style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", () => {
                let tooltip = d3.select("body").select(".tooltip");
                tooltip.style("visibility", "hidden");
            });
    }
    

}
