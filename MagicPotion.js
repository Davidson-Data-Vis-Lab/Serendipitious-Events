class MagicPotion{
    constructor(_config, _data, coordinates, time) {
        this._config = {
            parentElement: _config.parentElement,
        };
        this.data = _data;
        this.eventData = _data;
        this.myCoordinates = coordinates;
        this.myDatetime = time;
        this.sliderInfo = {
            slider1: null,
            slider2: [null, null],
            slider3: [null, null],
            slider4: [null, null]
        };
        this.randomLoc = false;
        this.randomDate = false;
        this.selectedCategories = [];
        this.selectedTags = [];
    }


    async initVis(){
        
        const slider1 = document.getElementById('slider1');
        const slider2 = document.getElementById('slider2');
        const slider3 = document.getElementById('slider3');
        const slider4 = document.getElementById('slider4');
        const toggleRandomLocButton = document.getElementById('toggleRandomLoc');
        const toggleRandomDateButton = document.getElementById('toggleRandomDate');

        const fetchRandomEventSVG = document.getElementById('fetchRandomEventSVG');
        const closePanelButton = document.getElementById('closePanel');
        const eventPanel = document.getElementById('eventPanel');
        const container = document.querySelector('.container');
        const graphContainer = document.getElementById('graph-container');

        this.initSVG();

        const categoryButtons = {
            Fitness: document.getElementById('categoryFitness'),
            'Arts/Culture': document.getElementById('categoryArts'),
            Sport: document.getElementById('categorySport'),
            'Academics/Out of School Time': document.getElementById('categoryAcademics'),
            'Family Festival': document.getElementById('categoryFamily'),
            'Mobile Unit': document.getElementById('categoryMobile'),
            Performance: document.getElementById('categoryPerformance')
        };

        noUiSlider.create(slider1, {
            start: [0],
            direction: 'rtl',
            orientation: 'vertical',
            connect: [true,false],
            range: {
                'max': 1,
                'min': 0
            },
            step: 1,
            tooltips: [wNumb({ decimals: 0, edit: function(value) {
                console.log(value);
                return value == 1 ? 'Yes' : 'No';
            }})]
        });
        
        slider1.noUiSlider.on('update', (values) => {
            this.updateSliderInfo('slider1', values.map(value => value == 1 ? true : false));
        });

        // Range slider (1-10)
        noUiSlider.create(slider2, {
            start: [2, 8],
            direction: 'rtl',
            orientation: 'vertical',
            behaviour: 'smooth-steps',
            connect: [false,true,false],
            range: {
                'max': 10,
                'min': 0
            },
            step: 0.1,
            tooltips: [wNumb({ decimals: 1 }), wNumb({ decimals: 1 })]
        });
        
        slider2.noUiSlider.on('update', (values) => {
            this.updateSliderInfo('slider2', values);
        });
        
        // Range slider (1-10)
        noUiSlider.create(slider3, {
            start: [3, 7],
            direction: 'rtl',
            orientation: 'vertical',
            behaviour: 'smooth-steps',
            connect: [false,true,false],
            range: {
                'max': 10,
                'min': 0
            },
            step: 0.1,
            tooltips: [wNumb({ decimals: 1 }), wNumb({ decimals: 1 })]
        });
        
        slider3.noUiSlider.on('update', (values) => {
            this.updateSliderInfo('slider3', values);
        });
        
        // Range slider (1-100)
        noUiSlider.create(slider4, {
            start: [18, 65],
            direction: 'rtl',
            behaviour: 'smooth-steps',
            orientation: 'vertical',
            connect: [false,true,false],
            range: {
                'max': 100,
                'min': 1
            },
            step: 1,
            tooltips: [wNumb({ decimals: 0 }), wNumb({ decimals: 0 })]
        });
        
        slider4.noUiSlider.on('update', (values) => {
            this.updateSliderInfo('slider4', values);
        });

        fetchRandomEventSVG.addEventListener('click', () => {
            this.showRandomEvent();
        });

        closePanelButton.addEventListener('click', () => {
            eventPanel.classList.add('hidden');
            eventPanel.style.display = 'none'; 
            container.classList.remove('blur-background'); 
            graphContainer.classList.remove('blur-background');
        });

        toggleRandomLocButton.addEventListener('click', () => {
            this.randomLoc = !this.randomLoc;
            if (this.randomLoc) {
                slider2.noUiSlider.set([slider2.noUiSlider.options.range.min, slider2.noUiSlider.options.range.max]);
                slider2.setAttribute('disabled', true);
                slider2.style.backgroundColor = 'grey';
                toggleRandomLocButton.classList.add('active');
            } else {
                slider2.removeAttribute('disabled');
                slider2.style.backgroundColor = '';
                toggleRandomLocButton.classList.remove('active');
            }
        });

        toggleRandomDateButton.addEventListener('click', () => {
            this.randomDate = !this.randomDate;
            if (this.randomDate) {
                slider3.noUiSlider.set([slider3.noUiSlider.options.range.min, slider3.noUiSlider.options.range.max]);
                slider3.setAttribute('disabled', true);
                slider3.style.backgroundColor = 'grey';
                toggleRandomDateButton.classList.add('active');
            } else {
                slider3.removeAttribute('disabled');
                slider3.style.backgroundColor = '';
                toggleRandomDateButton.classList.remove('active');
            }
        });

        Object.keys(categoryButtons).forEach(category => {
            categoryButtons[category].addEventListener('click', () => {
                if (this.selectedCategories.includes(category)) {
                    this.selectedCategories = this.selectedCategories.filter(c => c !== category);
                    categoryButtons[category].classList.remove('active');
                    this.updateVis();
                } else {
                    this.selectedCategories.push(category);
                    categoryButtons[category].classList.add('active');
                    this.updateVis();
                }
                console.log(this.selectedCategories);
            });
        });

        this.data = await this.fetchData();

        //Process Data
        this.data = this.data.filter(event => moment(event.date_time).isSameOrAfter(this.myDatetime));

        const diffInDays = this.data.map(event => moment(event.date_time).diff(this.myDatetime, 'days'));
        const distances = this.data.map(event => this.calculateDistance(event.coordinates, this.myCoordinates));

        this.data.forEach((event, index) => {
            event.diff_in_days = diffInDays[index];
            event.distance_km = distances[index];
        });

        
        this.updateSVG();

    }

    initSVG() {
        const svgHeight = 100;
        const svgWidth = 550;

        this.svg = d3.select('#event-bar-chart')
            .append('svg')
            .attr('width', svgWidth)
            .attr('height', svgHeight);
        
        console.log("SVG is BUILD",this.svg);
    }

    async fetchData() {
        try {
            const response = await fetch("data.json");
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error("There has been a problem with your fetch operation:", error);
        }
    }

    updateSliderInfo(slider, values) {
        this.sliderInfo[slider] = values;
        this.updateVis();
    }

    calculateDistance(venueCoordinates, myCoordinates) {
        if (!venueCoordinates) return null;
        const parsedVenueCoordinates = venueCoordinates.split(',').map(coord => parseFloat(coord.trim()));
        return this.haversine(parsedVenueCoordinates, myCoordinates, { unit: 'km' });
    }

    showRandomEvent() {
        if (this.eventData.length === 0) {
            alert('No matching events found.');
            return;
        }

        const randomEvent = this.eventData[Math.floor(Math.random() * this.eventData.length)];

        randomEvent.date_time = this.formatDateTime(randomEvent.date_time)
        console.log(randomEvent)

        document.getElementById('eventName').textContent = randomEvent.event_name;
        document.getElementById('eventTime').textContent = randomEvent.date_time;
        document.getElementById('eventVenue').textContent = randomEvent.venue_name;

        const eventPanel = document.getElementById('eventPanel');
        eventPanel.classList.remove('hidden');
        eventPanel.style.display = 'block'; // Show the panel

        const container = document.querySelector('.container'); 
        const graphContainer = document.getElementById('graph-container');

        container.classList.add('blur-background');
        graphContainer.classList.add('blur-background'); 

        const eventDetail = new CustomEvent("showEventDetail", { detail: randomEvent });
        window.dispatchEvent(eventDetail);
    }

    updateVis() {
        let vis = this, newData = vis.data;

        const ageDict = {
            '0-3': 'Tot',
            '0-12': 'Children',
            '10-18': 'Teens',
            '18-35': 'Young Adult',
            '18-65': 'Adults',
            '65-100': 'Seniors',
            '0-100': 'General Public'
        };
        console.log("Original", newData.length)

        //Filter adaptive.
        if (vis.sliderInfo['slider1'][0]) {
            newData = newData.filter(event => event.tags.split(', ').includes('Adaptive'));
            console.log("Adaptive Filter", newData.length)
        }
        

        //Category Filter
        newData = newData.filter(event => vis.selectedCategories.includes(event.category));
        console.log("Category Filter", newData.length)


        //Age Filter
        let tags = [];
        const [ageLower, ageUpper] = vis.sliderInfo['slider4'].map(Number);
        for (const [range, value] of Object.entries(ageDict)) {
            const [start, end] = range.split('-').map(Number);
            if (start <= ageUpper && end >= ageLower) {
                tags.push(value);
            }
        }
        newData = newData.filter(event => tags.includes(event.tags));
        console.log("Age Filter", newData.length)

        // Distance Filter
        if(!vis.randomLoc){
            const sortedDistances = newData.map(event => event.distance_km).sort((a, b) => a - b);
            const [lowerQuartileLoc, upperQuartileLoc] = vis.sliderInfo['slider2'].map(Number);
            const lowerThresholdLoc = sortedDistances[Math.floor(lowerQuartileLoc * 0.1 * sortedDistances.length)];
            const upperThresholdLoc = sortedDistances[Math.floor(upperQuartileLoc * 0.1 * sortedDistances.length)];
            newData = newData.filter(event => event.distance_km >= lowerThresholdLoc && event.distance_km <= upperThresholdLoc);
        }
        console.log("Distance Filter", newData.length)
        

        // Time Filter
        if(!vis.randomDate){
            const sortedTime = newData.map(event => event.diff_in_days).sort((a, b) => a - b);
            const [lowerQuartileTime, upperQuartileTime] = vis.sliderInfo['slider3'].map(Number);
            const lowerThresholdTime = sortedTime[Math.floor(lowerQuartileTime * 0.1 * sortedTime.length)];
            const upperThresholdTime = sortedTime[Math.floor(upperQuartileTime * 0.1 * sortedTime.length)];
            
            newData = newData.filter(event => event.diff_in_days >= lowerThresholdTime && event.diff_in_days <= upperThresholdTime);
        }
        console.log("Time Filter", newData.length)
        

        vis.eventData = newData;
        console.log("Filtered events",vis.eventData);

        vis.updateSVG();
    }

    formatDateTime(dateTime) {
        const date = new Date(dateTime);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');

        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        const formattedTime = `${month}-${day} ${hours}:${minutes} ${ampm}`;
        return formattedTime;
    }

    haversine(coords1, coords2, options = { unit: 'km' }) {
        const toRadians = (angle) => angle * (Math.PI / 180);
    
        const [lat1, lon1] = coords1;
        const [lat2, lon2] = coords2;
    
        const R = options.unit === 'km' ? 6371 : 3959; // Radius of the earth in km or miles
        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);
    
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
    
        return distance;
    }

    updateSVG() {
        const vis = this;
        const svgWidth = 550;
        const svgHeight = 100;
        const barWidth = 40; // Fixed bar width
        const barHeight = 8; // Fixed bar height
        const numColumns = 12; // Number of columns
        const columnPadding = (svgWidth - (numColumns * barWidth)) / (numColumns - 1); // Calculate padding between columns
    
        // Calculate the approximate number of events per column with some randomness
        const eventsPerColumn = Math.floor(vis.eventData.length / numColumns);
        let columnCounts = Array(numColumns).fill(eventsPerColumn);
        let remainingEvents = vis.eventData.length % numColumns;
    
        // Distribute remaining events randomly
        while (remainingEvents > 0) {
            const randomIndex = Math.floor(Math.random() * numColumns);
            columnCounts[randomIndex]++;
            remainingEvents--;
        }
    
        // Group events by columns based on calculated counts
        let eventIndex = 0;
        const columns = columnCounts.map(count => {
            const columnEvents = vis.eventData.slice(eventIndex, eventIndex + count);
            eventIndex += count;
            return columnEvents;
        });
    
        // Flatten the columns for easy data binding
        const flattenedData = columns.flatMap((col, colIndex) => col.map((event, rowIndex) => ({
            ...event,
            colIndex,
            rowIndex
        })));
    
        // Select all rectangles and bind data
        const bars = vis.svg.selectAll('rect')
            .data(flattenedData);
    
        // Update existing bars
        bars.attr('x', d => d.colIndex * (barWidth + columnPadding))
            .attr('y', d => svgHeight - (d.rowIndex + 1) * (barHeight + 2)) // 2px for padding
            .attr('width', barWidth)
            .attr('height', barHeight)
            .attr('fill', d => `hsl(${(1 - (d.rowIndex / Math.max(...columnCounts))) * 120}, 100%, 50%)`)
            .attr('rx', 2) // Border radius
            .attr('ry', 2); // Border radius
    
        // Enter new bars
        bars.enter()
            .append('rect')
            .attr('x', d => d.colIndex * (barWidth + columnPadding))
            .attr('y', d => svgHeight - (d.rowIndex + 1) * (barHeight + 2)) // 2px for padding
            .attr('width', barWidth)
            .attr('height', barHeight)
            .attr('fill', d => `hsl(${(1 - (d.rowIndex / Math.max(...columnCounts))) * 120}, 100%, 50%)`)
            .attr('rx', 2) // Border radius
            .attr('ry', 2); // Border radius
    
        // Remove old bars
        bars.exit().remove();
    }
    
}
