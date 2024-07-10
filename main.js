document.addEventListener("DOMContentLoaded", function () {
    let splitInstance, isMagicPotionVisible = false;
    let rose_chart, map, magicPotion;
    let coordinates = [40.71155426032145, -73.96276232229434];

    async function fetchData() {
        try {
            const response = await fetch("data.json");
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error(
                "There has been a problem with your fetch operation:",
                error
            );
        }
    }

    function UpdateChart(inputData) {
        rose_chart = new Nightingale_Rose_Chart(
            { parentElement: "#chart" },
            inputData
        );
        rose_chart.updateVis();
    }

    function UpdateVenueMap(inputData) {
        map = new Venue_Map({ parentElement: "#map" }, inputData);
        map.updateVis();
    }

    function initMagicPotion(inputData) {
        const magicPotionContainer = document.getElementById("magicPotion");
        magicPotionContainer.innerHTML = ''; // Clear any existing content

        // Add HTML content dynamically
        magicPotionContainer.innerHTML = `
            <div class="container">
                <div class="slider-container">
                    <img src="./assets/wheelchair.svg" alt="Fitness" height="24" width="24">
                    <div id="slider1" class="slider-panel"></div>
                </div>
                <div class="slider-container">
                    <p>Location</p>
                    <div id="slider2" class="slider-panel"></div>
                    <div class = "subtext">Homebase Address</div>
                    <button id="toggleRandomLoc" class="toggle-button">Any location!</button>
                </div>
                <div class="slider-container">
                    <p>Date</p>
                    <div id="slider3" class="slider-panel"></div>
                    <div class = "subtext">Today</div>
                    <button id="toggleRandomDate" class="toggle-button">Any date!</button>
                </div>
                <div class="slider-container">
                    <p>Age</p>
                    <div id="slider4" class="slider-panel"></div>
                </div>
                <div class="category-submit">
                    <div class="category-buttons-container">
                        <button id="categoryFitness" class="category-button active">
                            <img src="./assets/Fitness.svg" alt="Fitness" height="24" width="24">
                        </button>
                        <button id="categoryArts" class="category-button active">
                            <img src="./assets/Arts_Culture.svg" alt="Arts/Culture" height="24" width="24">
                        </button>
                        <button id="categorySport" class="category-button active">
                            <img src="./assets/Sport.svg" alt="Sport" height="24" width="24">
                        </button>
                        <button id="categoryAcademics" class="category-button active">
                            <img src="./assets/Academics.svg" alt="Academics" height="24" width="24">
                        </button>
                        <button id="categoryFamily" class="category-button active">
                            <img src="./assets/Family_Festival.svg" alt="Family Festival" height="24" width="24">
                        </button>
                        <button id="categoryMobile" class="category-button active">
                            <img src="./assets/Mobile_Unit.svg" alt="Mobile Unit" height="24" width="24">
                        </button>
                        <button id="categoryPerformance" class="category-button active">
                            <img src="./assets/Performance.svg" alt="Performance" height="24" width="24">
                        </button>
                        <button id="categoryNature" class="category-button active">
                            <img src="./assets/Nature.svg" alt="Nature" height="24" width="24">
                        </button>
                    </div>

                    <div class="submit-button-container">
                        <button id="fetchRandomEventSVG" class="submit-button">Submit</button>
                    </div>
                </div>
            </div>

            <div id="eventPanel" class="event-panel hidden">
                <div class="event-panel-content">
                    <span id="closePanel" class="close-button">&times;</span>
                    <h2 id="eventName">Event Name</h2>
                    <p id="eventTime">Event Time</p>
                    <p id="eventVenue">Event Venue</p>
                </div>
            </div>
        `;


        
        const datetime = new Date('2019-07-09T10:00:00');
        magicPotion = new MagicPotion({ parentElement: "#magicPotion" }, inputData, coordinates, datetime);
        magicPotion.initVis(); // Call initVis to dynamically add content
    }

    function formatDateTime(dateTime) {
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

    async function initializeVisualizations() {
        const data = await fetchData();
        data.forEach(event => {
            event.date_time = formatDateTime(event.date_time);
        });

        UpdateChart(data);
        UpdateVenueMap(data);
        initMagicPotion(data);
        startTutorial();
    }

    initializeVisualizations();
    
    window.addEventListener("resize", () => {
        if (rose_chart) {
            rose_chart.updateVis();
        }
        if (map) {
            map.resize(); // Call the resize method
        }
        if (magicPotion) {
            magicPotion.updateVis();
        }
    });

    window.addEventListener("roseChartEventClick", (event) => {
        const eventData = event.detail;
        console.log("Event clicked: ", eventData);

        if (map) {
            map.addPreciseEventMarker(eventData);
        }
    });

    window.addEventListener("roseChartMonthClick", (event) => {
        const eventData = event.detail;
        console.log("Month clicked: ", eventData);

        if (map) {
            map.cleanMarkersLayers();
            map.cleanIndividualLayer();
            eventData.forEach((event) => {
                map.addVagueEventMarker(event);
            });
        }
    });

    window.addEventListener("venueMapEventClick", (event) => {
        const eventData = event.detail;
        console.log("Venue map event clicked: ", eventData);

        if (rose_chart) {
            rose_chart.highlightEvent(eventData);
        }
    });

    window.addEventListener("resetZoom", () => {
        if (map) {
            map.map.setZoom(map.defaultZoom);
        }
    });

    window.addEventListener("resetLocZoom", () => {
        if (map) {
            map.map.setView(map.defaultView, map.defaultZoom);
        }
    });

	window.addEventListener("showEventDetail", (event) => {
        const eventData = event.detail;

        // Highlight the event in the calendar and map
        if (rose_chart) {
            rose_chart.highlightEvent(eventData);
        }
        if (map) {
            map.addPreciseEventMarker(eventData);
        }
    });

    window.addEventListener("updateMagicPotionCoordinates", (event) => {
        const newCoordinates = event.detail;
        const coordinatesArray = [newCoordinates.lat, newCoordinates.lng];
        coordinates = coordinatesArray;
        if (magicPotion) {
            magicPotion.updateCoordinates(coordinates);
        }
    });

    window.addEventListener("roseChartArcClick", function (event) {
        const matchingEvents = event.detail;
        if (!map){
            fetchData().then(data => {
                data.forEach(event => {
                    event.date_time = formatDateTime(event.date_time);
                });
                UpdateVenueMap(data);
            });
        }
        if (map) {
            map.cleanMarkersLayers();
            map.cleanIndividualLayer();
            matchingEvents.forEach(event => {
                map.addVagueEventMarker(event);
            });
        }
    });

    function startTutorial() {
        introJs().setOptions({
            steps: [
                {
                    intro: "This is a simple tour of basic features to help you familarize yourself with the tool."
                },
                {
                    element: '#chart',
                    intro: 'This is the year calendar. It shows data categorized by month and category.'
                },
                {
                    element: '.color-key',
                    intro: 'This is the color key. Click on a color to find events in that category throughout the year.',
                    position: 'right'
                },
                {
                    element: '#map',
                    intro: 'This is the venue map. Click on each blue circles to see events at a specific venue.'
                },
                {
                    element: '.reset-zoom',
                    intro: 'Use this button to reset the map zoom.'
                },
                {
                    element: '.trash-container',
                    intro: 'Use this button to restore the original map.'
                },
                {
                    element: '.legend-toggle',
                    intro: 'Click to see the legend for each icon.'
                },
                {
                    element: '#homeMarker',
                    intro: 'You can drag around this house icon to set your homebase address.'
                },
                {
                    element: '#magicPotion',
                    intro: 'This is the Magic Potion. You can use it to generate random events.'
                },
                {
                    element: '#slider2',
                    intro: 'Use sliders to filter your needs. For example, here you are filtering by distance to your address.'
                },
                {
                    element: '.category-button',
                    intro: 'These are the category buttons. They are all selected by default.'
                },
                {
                    element: '#fetchRandomEventSVG',
                    intro: 'Click this button to submit and find an event.'
                },
                {
                    intro: 'Play around! There are more interesting features that need some digging. 👀'
                }
            ]
        }).start();
    }
   
    
});
