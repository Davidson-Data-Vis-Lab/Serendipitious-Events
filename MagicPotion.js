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
        this.selectedCategories = ["Nature","Performance","Mobile Unit","Family Festival","Academics/Out of School Time","Sport","Arts/Culture","Fitness"];
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

        const categoryButtons = {
            Fitness: document.getElementById('categoryFitness'),
            'Arts/Culture': document.getElementById('categoryArts'),
            Sport: document.getElementById('categorySport'),
            'Academics/Out of School Time': document.getElementById('categoryAcademics'),
            'Family Festival': document.getElementById('categoryFamily'),
            'Mobile Unit': document.getElementById('categoryMobile'),
            Performance: document.getElementById('categoryPerformance'),
            Nature: document.getElementById('categoryNature')
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
            tooltips: [
                {
                to: function (value) {
                    return 'closer';
                },
                from: Number
            }, {
                to: function (value) {
                    return 'farther';
                },
                from: Number
            }]
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
            tooltips: [
                {
                to: function (value) {
                    return 'sooner';
                },
                from: Number
            }, {
                to: function (value) {
                    return 'later';
                },
                from: Number
            }]
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
                    console.log(this.selectedCategories);
                    this.updateVis();
                }
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

        this.updateVis();
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

    updateCoordinates(newCoordinates) {
        this.myCoordinates = newCoordinates;
        // Recalculate distances based on the new coordinates
        this.data.forEach(event => {
            event.distance_km = this.calculateDistance(event.coordinates, this.myCoordinates);
        });
        // Update the visualization with the new distances
        this.updateVis();
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

        document.getElementById('eventName').textContent = randomEvent.event_name;
        document.getElementById('eventTime').textContent = randomEvent.date_time;
        document.getElementById('eventVenue').textContent = randomEvent.venue_name;

        const eventPanel = document.getElementById('eventPanel');
        eventPanel.classList.remove('hidden');
        eventPanel.style.display = 'block'; // Show the panel

        const container = document.querySelector('.container'); 

        container.classList.add('blur-background');

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
            '0-100': 'General Public',
            '1-100': 'Adaptive'
        };
        // console.log("Original", newData)

        //Filter adaptive.
        if (vis.sliderInfo['slider1'][0]) {
            newData = newData.filter(event => event.tags.split(', ').includes('Adaptive'));
            // console.log("Adaptive Filter", newData)
        }
        

        //Category Filter
        newData = newData.filter(event => vis.selectedCategories.includes(event.category));
        // console.log("Category Filter", newData)


        //Age Filter
        let tags = [];
        const [ageLower, ageUpper] = vis.sliderInfo['slider4'].map(Number);
        for (const [range, value] of Object.entries(ageDict)) {
            const [start, end] = range.split('-').map(Number);
            if (start <= ageUpper && end >= ageLower) {
                tags.push(value);
            }
        }
        newData = newData.filter(event => {
            const eventTags = event.tags.split(', ');
            return tags.some(tag => eventTags.includes(tag));
        });
        // console.log("Age Filter", newData)

        // Distance Filter
        if(!vis.randomLoc){
            const sortedDistances = newData.map(event => event.distance_km).sort((a, b) => a - b);
            const [lowerQuartileLoc, upperQuartileLoc] = vis.sliderInfo['slider2'].map(Number);
            console.log(upperQuartileLoc)
            const lowerThresholdLoc = sortedDistances[Math.floor(lowerQuartileLoc * 0.1 * sortedDistances.length)];
            let upperThresholdLoc = sortedDistances[Math.floor(upperQuartileLoc * 0.1 * sortedDistances.length)];
            if(upperQuartileLoc == 10){
                upperThresholdLoc = sortedDistances[Math.floor(upperQuartileLoc * 0.1 * sortedDistances.length)-1];
            }
            newData = newData.filter(event => event.distance_km >= lowerThresholdLoc && event.distance_km <= upperThresholdLoc);
        }
        // console.log("Distance Filter", newData)
        

        // Time Filter
        if(!vis.randomDate){
            const sortedTime = newData.map(event => event.diff_in_days).sort((a, b) => a - b);
            const [lowerQuartileTime, upperQuartileTime] = vis.sliderInfo['slider3'].map(Number);
            const lowerThresholdTime = sortedTime[Math.floor(lowerQuartileTime * 0.1 * sortedTime.length)];
            let upperThresholdTime = sortedTime[Math.floor(upperQuartileTime * 0.1 * sortedTime.length)];
            if(upperQuartileTime == 10){
                upperThresholdTime = sortedTime[Math.floor(upperQuartileTime * 0.1 * sortedTime.length)-1];
            }
            newData = newData.filter(event => event.diff_in_days >= lowerThresholdTime && event.diff_in_days <= upperThresholdTime);
        }
        // console.log("Time Filter", newData)
        

        vis.eventData = newData;
        // console.log("Filtered events",vis.eventData);
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
}
