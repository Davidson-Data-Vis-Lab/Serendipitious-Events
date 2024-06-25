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
            margin: _config.margin || {top: 5, right: 20, bottom: 20, left: 50}
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

        const tooltip = d3.select("#tooltip");
    
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
                const interpolateOuter = d3.interpolate(vis.innerRadius, y(d[1]));
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
                            const eventCount = e.data[vis.selectedCategory];
                            const startAngle = vis.x(vis.monthNames[e.data.month - 1]);
                            const endAngle = startAngle + vis.x.bandwidth();
                            const arcHeight = y(e[1]) - y(e[0]);
                            const arcWidth = endAngle - startAngle;
                            const paddingAngle = 0.05; // Padding in radians
                            const paddingRadius = 5; // Padding in radius units
    
                            // Filter original data to find the matching events
                            const matchingEvents = vis.originalData.filter(data => 
                                data.month === e.data.month && data.category === vis.selectedCategory);

                            for (let i = 0; i < eventCount; i++) {
                                const angle = startAngle + paddingAngle + (Math.random() * (arcWidth - 2 * paddingAngle));
                                const radius = vis.innerRadius + paddingRadius + (Math.random() * (arcHeight - 2 * paddingRadius));
    
                                const eventData = matchingEvents[i % matchingEvents.length];
    
                                d3.select(this).append("circle")
                                    .attr("cx", radius * Math.cos(angle - Math.PI / 2))
                                    .attr("cy", radius * Math.sin(angle - Math.PI / 2))
                                    .attr("r", 5) // Radius of each circle
                                    .attr("fill", "#FFF") // Color of the circles
                                    .attr('fill-opacity', 0.7)
                                    .on("mouseover", (event, d) => {
                                        tooltip.style("display", "block")
                                               .html(`Event: ${eventData.event_name}<br>Venue: ${eventData.venue_name}<br>Date: ${eventData.date_time}`);
                                    })
                                    .on("mousemove", (event) => {
                                        tooltip.style("left", (vis.width + 100) + "px")
                                           .style("top", (vis.height/2 + 100) + "px");
                                    })
                                    .on("mouseout", () => {
                                        tooltip.style("display", "none");
                                    })
                                    .on("click", () => {
                                        const event = new CustomEvent("roseChartEventClick", { detail: eventData });
                                        window.dispatchEvent(event);
                                    });
                            }
                        }
    
                    });
                });
        }
    }
}
