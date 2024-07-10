class Nightingale_Rose_Chart {
    /**
     * Class constructor with basic rose chart configuration
     * @param {*} _config 
     * @param {*} _data 
     */
    constructor(_config, _data) {
        this._config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 600,
            containerHeight: _config.containerHeight || 800,
            margin: _config.margin || { top: 10, right: 20, bottom: 10, left: 20 }
        }
        this.originalData = _data; // Store the original data
        this.selectedCategory = null; // Track the selected category
        this.dataProcessed = false;
        this.data = _data;
        this.initVis();
    }

    /**
     * This builds things that don't need any update.
     */
    initVis() {
        let vis = this;

        // SVG elements and constants
        vis.width = vis._config.containerWidth - vis._config.margin.left - vis._config.margin.right;
        vis.height = vis._config.containerHeight - vis._config.margin.top - vis._config.margin.bottom;

        vis.innerRadius = 150;
        vis.outerRadius = Math.min(vis.width, vis.height) / 1.5;

        vis.svg = d3.select(vis._config.parentElement)
            .append('svg')
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr("viewBox", [-vis.width / 2, -vis.height / 2, vis.width, vis.height])
            .attr("style", "width: 100%; height: 100% ; font: 12px sans-serif;");

        // Data needs to be initiated to fill color keys
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

        vis.colorScale = {
            "Fitness": "#4e79a7",
            "Arts/Culture": "#f28e2c",
            "Sport": "#e15759",
            "Academics/Out of School Time": "#76b7b2",
            "Family Festival": "#ff9da7",
            "Mobile Unit": "#edc949",
            "Performance": "#af7aa1",
            "Nature": "#59a14f"
        };

        vis.customGreys = ["#ffffff", "#b8b6b6", "#828181", "#4e4f4e", "#000000"];

        vis.ring = vis.svg.append('g');
        vis.innerMark = vis.svg.append('g').attr("text-anchor", "middle").attr("class", "inner-mark");
        vis.background = vis.svg.append('g').attr("text-anchor", "middle");
        vis.colorkey = vis.svg.append("g");

        vis.renderInnerMark();
        vis.initiateColorKey();
    }

    updateVis() {
        let vis = this;

        if (!vis.dataProcessed) {
            vis.processData();
        }
        vis.y.domain([0, d3.max(vis.data, d => d3.max(d, d => d[1]))]);

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

    renderInnerMark() {
        let vis = this;
        let x = vis.x;
        vis.innerMark.selectAll("*").remove();

        const monthGroups = vis.innerMark.selectAll("g")
            .data(x.domain())
            .join("g")
            .attr("transform", d => `
                rotate(${((x(d) + x.bandwidth() / 2) * 180 / Math.PI - 90)})
                translate(${vis.innerRadius},0)
            `)
            .on("click", function (event, d) {
                let matching_event = vis.originalData.filter(data => data.month === vis.monthNames.indexOf(d) + 1);
                if (vis.selectedCategory != null) {
                    matching_event = matching_event.filter(data => data.category === vis.selectedCategory);
                }
                const month = new CustomEvent("roseChartMonthClick", { detail: matching_event });
                window.dispatchEvent(month);

                const resetZoomEvent = new CustomEvent("resetLocZoom");
                window.dispatchEvent(resetZoomEvent);
            });

        monthGroups.append("rect")
            .attr("x", -20)
            .attr("y", -10)
            .attr("width", 30)
            .attr("height", 20)
            .attr("fill", "#ddd") // Background color for the button
            .attr("rx", 5) // Optional: add rounded corners
            .attr("ry", 5) // Optional: add rounded corners
            .attr("transform", d => {
                const angle = (x(d) + x.bandwidth() / 2 + Math.PI / 2) % (2 * Math.PI);
                return angle < Math.PI
                    ? "rotate(90)translate(5,15)"
                    : "rotate(-90)translate(5,-15)";
            });

        monthGroups.append("text")
            .attr("transform", d => (x(d) + x.bandwidth() / 2 + Math.PI / 2) % (2 * Math.PI) < Math.PI
                ? "rotate(90)translate(0,16)"
                : "rotate(-90)translate(0,-13)")
            .attr("class", "month-key")
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle")
            .text(d => d);
    }

    renderBackground() {
        let vis = this;
        let y = vis.y;
        vis.background.selectAll("*").remove();

        if (vis.selectedCategory == null) {
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
                        .attr("stroke", "#fff") // A white background so that the text can stand out
                        .attr("stroke-width", 5)
                        .text(y.tickFormat(3, "s")) // Formatted so that it won't be 1k,2k
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

    initiateColorKey() {
        let vis = this;

        vis.colorkey
            .selectAll("g")
            .data(Object.keys(vis.colorScale))
            .join("g")
            .attr("class", "color-key")
            .attr("transform", (d, i, nodes) => `translate(${-vis.width + 140}, ${-vis.height / 2 + 20 + i * 20})`)
            .call(g => g.append("rect")
                .attr("width", 18)
                .attr("height", 18)
                .attr("fill", d => vis.colorScale[d]))
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

    getCustomGreyScale(eventCounts) {
        const maxCount = d3.max(eventCounts);
        const colorScale = d3.scaleQuantize()
            .domain([0, maxCount])
            .range(this.customGreys);
        return colorScale;
    }

    renderRings() {
        let vis = this;
        let y = vis.y;
        vis.ring.selectAll("*").remove();

        let tooltip = d3.select("body").select(".tooltip");
        if (tooltip.empty()) {
            tooltip = d3.select("body").append("div")
                .attr("class", "tooltip");
        }

        // Render the arcs for each category
        vis.ring.selectAll("g")
            .data(vis.data)
            .join("g") // This creates inner tags of <g> that has the size of the categories
            .attr("fill", d => vis.colorScale[d.key]) // Fill the color according to colors assigned
            .selectAll("path") // In each <g>, select path.
            .data(d => {
                return d.map(segment => ({
                    segment,
                    category: d.key
                }));
            })
            .join("path") // Create arcs for 12 months
            .attr("d", d => vis.arc(d.segment))
            .transition()
            .duration(1000)
            .attrTween("d", function (d) {
                const interpolateInner = d3.interpolate(vis.innerRadius, y(d.segment[0]));
                const interpolateOuter = d3.interpolate(vis.innerRadius, vis.selectedCategory ? vis.outerRadius : y(d.segment[1]));
                return function (t) {
                    // This is called repeatedly to perform the arc(d) given changing inner / outer radius.
                    return vis.arc
                        .innerRadius(interpolateInner(t))
                        .outerRadius(interpolateOuter(t))(d.segment);
                };
            });

        if (!vis.selectedCategory) {
            vis.ring.selectAll("g")
                .selectAll("path")
                .on("mouseover", function (event, d) {
                    const eventCount = d.segment[1] - d.segment[0];
                    const category = d.category;

                    tooltip.style("visibility", "visible")
                        .text(`${category} : ${eventCount}`)
                        .style("top", (event.pageY - 10) + "px")
                        .style("left", (event.pageX + 10) + "px");

                        d3.select(this).classed("arc-hover", true);
                })
                .on("mousemove", (event) => {
                    tooltip.style("top", (event.pageY - 10) + "px")
                        .style("left", (event.pageX + 10) + "px");
                })
                .on("mouseout", function (event) {
                    d3.select(event.currentTarget).classed("arc-hover", false);
    
                    tooltip.style("visibility", "hidden");
                })
                .on("click", function (event, d) {
                    // Filter the events for the specific category and month
                    const matchingEvents = vis.originalData.filter(data =>
                        data.category === d.category &&
                        data.month === vis.monthNames.indexOf(vis.monthNames[d.segment.data.month - 1]) + 1
                    );
                    console.log("clicked:",matchingEvents);
                    // Dispatch a custom event to update the venue map
                    const eventDetail = new CustomEvent("roseChartArcClick", { detail: matchingEvents });
                    window.dispatchEvent(eventDetail);
    
                    // Prevent event propagation to avoid triggering other event listeners
                    event.stopPropagation();
                });
        }

        if (vis.selectedCategory != null) {
            let circlesGroup = vis.ring.selectAll("g.circles-group")
                .data([vis.data])
                .join("g")
                .attr("class", "circles-group");

            const categoryData = vis.originalData.filter(d => d.category === vis.selectedCategory);
            const eventCounts = categoryData.map(d => categoryData.filter(data => data.month === d.month && data.date === d.date).length);
            const colorScale = vis.getCustomGreyScale(eventCounts);

            vis.data.forEach(d => {
                d.forEach(e => {
                    if (e.data[vis.selectedCategory] !== undefined) {
                        const daysInMonth = vis.daysInMonth[vis.monthNames[e.data.month - 1]];
                        const startAngle = vis.x(vis.monthNames[e.data.month - 1]);
                        const endAngle = startAngle + vis.x.bandwidth();
                        const arcHeight = vis.outerRadius - vis.innerRadius;
                        const arcWidth = endAngle - startAngle;
                        const paddingRadius = daysInMonth >= 30 ? arcHeight / 11 : arcHeight / 10;

                        const circlesPerLine = Math.floor(daysInMonth / 3);

                        for (let i = 0; i < daysInMonth; i++) {
                            let lineIndex = Math.floor(i / circlesPerLine);
                            let positionInLine = i % circlesPerLine;

                            if (lineIndex >= 3) {
                                lineIndex = 1;
                                positionInLine += circlesPerLine;
                            }

                            const radius = vis.innerRadius + paddingRadius * positionInLine + 10;
                            const angle = startAngle + (lineIndex + 1) * (arcWidth / 4);
                            const circleRadius = paddingRadius / 2.5;
                            const date = i + 1;

                            const count = vis.originalData.filter(data => data.month === e.data.month && data.date === date && data.category === vis.selectedCategory).length;
                            const color = colorScale(count);
                            circlesGroup.append("circle")
                                .datum({ month: e.data.month, date: date, count: count })
                                .attr("class", "date-circle")
                                .attr("cx", radius * Math.cos(angle - Math.PI / 2))
                                .attr("cy", radius * Math.sin(angle - Math.PI / 2))
                                .attr("r", 0)  // Start with radius 0
                                .attr("fill", color)
                                .attr("fill-opacity", 0.8)
                                .transition()
                                .delay(600)  // Delay for 1 second
                                .duration(500)  // Animation duration
                                .attr("r", circleRadius);  // End with target radius

                            circlesGroup.selectAll("circle")
                                .on("mouseover", (event, d) => {
                                    tooltip.style("visibility", "visible")
                                        .text(`Date: ${vis.monthNames[d.month - 1]} ${d.date}, Events: ${d.count}`)
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
                                .on("click", function (event, d) {
                                    d3.selectAll(".date-circle").classed("selected-circle blue", false); // Remove both classes
                                    if (vis.selectedCategory === 'Sport' || vis.selectedCategory === 'Arts/Culture') {
                                        d3.select(this).classed("selected-circle blue", true);
                                    } else {
                                        d3.select(this).classed("selected-circle", true); // Add both classes
                                    }
                                    vis.renderEventCircles(d.month, d.date, vis.selectedCategory);
                                    event.stopPropagation();
                                });
                        }

                        // Add count text on top of each arc
                        const textRadius = vis.outerRadius + 10;
                        const textAngle = startAngle + (arcWidth / 2);
                        vis.ring.append("text")
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

    renderEventCircles(month, date, category, name = null) {
        let vis = this;
        vis.innerMark.selectAll("circle").remove(); // Clear existing circles
        
        const events = vis.originalData.filter(data => data.month === month && data.date === date && data.category === category);
        const packingInnerRadius = vis.innerRadius * 0.7;

        // Prepare the data for the circle packing layout
        const data = {
            name: "root",
            children: events.map((event) => ({
                name: event.event_name,
                value: 1,
                eventData: {
                    month: event.month,
                    date: event.date,
                    category: event.category,
                    venue_name: event.venue_name,
                    event_name: event.event_name,
                    date_time: event.date_time,
                    coordinates: event.coordinates,
                } // Store all the necessary event data
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
            .attr("class", "event-circle")
            .attr("cx", d => d.x - packingInnerRadius + 10) // Adjust for the center and smaller radius
            .attr("cy", d => d.y - packingInnerRadius + 10)
            .attr("r", 0)
            .attr("fill", vis.colorScale[category])
            .attr("fill-opacity", 0.5)  // Default opacity
            .transition()
            .duration(500)
            .attr("r", d => d.r);

        vis.innerMark.selectAll("circle")
            .on("mouseover", function (event, d) {
                d3.select(this)
                    .attr("fill-opacity", 0.8);  // Increase opacity on hover
                let tooltip = d3.select("body").select(".tooltip");
                tooltip.style("visibility", "visible")
                    .html(`${d.data.eventData.event_name}<br>${d.data.eventData.date_time}<br> ${d.data.eventData.venue_name}`) // Display event details
                    .style("top", (event.pageY - 10) + "px")
                    .style("left", (event.pageX + 10) + "px");
            })
            .on("mousemove", (event) => {
                let tooltip = d3.select("body").select(".tooltip");
                tooltip.style("top", (event.pageY - 10) + "px")
                    .style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", function () {
                if (!d3.select(this).classed("clicked")) {
                    d3.select(this).attr("fill-opacity", 0.5);  // Reset opacity on mouseout if not clicked
                }
                let tooltip = d3.select("body").select(".tooltip");
                tooltip.style("visibility", "hidden");
            })
            .on("click", function (event, d) {
                const isSelected = d3.select(this).classed("clicked");

                d3.selectAll(".event-circle")
                    .attr("stroke", "none")
                    .attr("fill-opacity", 0.5)
                    .classed("clicked", false);  // Reset stroke and opacity for all circles

                if (!isSelected) {
                    d3.select(this)
                        .attr("stroke", "red")
                        .attr("stroke-width", 3)
                        .attr("fill-opacity", 0.8)  // Set stroke and opacity for clicked circle
                        .classed("clicked", true);

                    const individualEvent = new CustomEvent("roseChartEventClick", { detail: d.data.eventData });
                    window.dispatchEvent(individualEvent);
                } else {
                    const resetZoomEvent = new CustomEvent("resetZoom");
                    window.dispatchEvent(resetZoomEvent);
                }
            });

        if (name) {
            // If name is provided, treat the corresponding event as clicked
            vis.innerMark.selectAll("circle")
                .filter(d => d.data.eventData.event_name === name)
                .classed("clicked", true)
                .attr("stroke", "red")
                .attr("stroke-width", 3)
                .attr("fill-opacity", 0.8);
        }
    }

    highlightEvent(eventData) {
        const vis = this;

        const highlight = () => {
            const circles = d3.selectAll(".date-circle");
            circles.classed("selected-circle", false); // Remove both classes

            const matchingCircle = circles.filter(d => {
                return (
                    d.month === new Date(eventData.date_time).getMonth() + 1 &&
                    d.date === new Date(eventData.date_time).getDate()
                );
            });

            matchingCircle.classed("selected-circle", true); // Add both classes

            matchingCircle.each(function () {
                this.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });

            vis.renderEventCircles(new Date(eventData.date_time).getMonth() + 1, new Date(eventData.date_time).getDate(), eventData.category, eventData.event_name);
        };

        if (vis.selectedCategory !== eventData.category) {
            vis.selectedCategory = eventData.category;

            vis.data = vis.originalData.filter(data => data.category === vis.selectedCategory);
            vis.dataProcessed = false;
            vis.updateVis();

            setTimeout(highlight, 600);
        } else {
            highlight();
        }

        vis.colorkey.selectAll("g").classed("selected", false);
        vis.colorkey.selectAll("g")
            .filter(d => d === vis.selectedCategory)
            .classed("selected", true);
    }
}
