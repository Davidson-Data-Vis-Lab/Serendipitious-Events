document.addEventListener("DOMContentLoaded", function () {
    let splitInstance, isMagicPotionVisible = false;

    Split(['#chart', '#map-magic-container'], {
        sizes: [55, 45], // Golden ratio sizes in percentages
        minSize: [300, 300], // Minimum size in pixels for each pane
        gutterSize: 4, // Width of the draggable gutter in pixels
        direction: 'horizontal' // Split direction
    });

    let rose_chart, map, magicPotion;
    let coordinates = [40.747552523013795, -73.98654171064388];

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
                    <img src="./assets/wheelchair.svg" alt="Fitness" height = "24" width = "24">
                    <div id="slider1" class="slider-panel"></div>
                </div>
                <div class="slider-container">
                    <p>Location</p>
                    <div id="slider2" class="slider-panel"></div>
                    <button id="toggleRandomLoc" class="toggle-button">Any location!</button>
                </div>
                <div class="slider-container">
                    <p>Date</p>
                    <div id="slider3" class="slider-panel"></div>
                    <button id="toggleRandomDate" class="toggle-button">Any date!</button>
                </div>
                <div class="slider-container">
                    <p>Age</p>
                    <div id="slider4" class="slider-panel"></div>
                    <img id="fetchRandomEventSVG" src="./assets/lottery.svg" alt="Lottery" width="45" height="45">
                </div>
                <div class="category-buttons-container">
                    <div class="category-buttons-container">
                        <button id="categoryFitness" class="category-button">
                            <img src="./assets/Fitness.svg" alt="Fitness" height = "24" width = "24">
                        </button>
                        <button id="categoryArts" class="category-button">
                            <img src="./assets/Arts_Culture.svg" alt="Arts/Culture" height = "24" width = "24">
                        </button>
                        <button id="categorySport" class="category-button">
                            <img src="./assets/Sport.svg" alt="Sport" height = "24" width = "24">
                        </button>
                        <button id="categoryAcademics" class="category-button">
                            <img src="./assets/Academics.svg" alt="Academics" height = "24" width = "24">
                        </button>
                        <button id="categoryFamily" class="category-button">
                            <img src="./assets/Family_Festival.svg" alt="Family Festival" height = "24" width = "24">
                        </button>
                        <button id="categoryMobile" class="category-button">
                            <img src="./assets/Mobile_Unit.svg" alt="Mobile Unit" height = "24" width = "24">
                        </button>
                        <button id="categoryPerformance" class="category-button">
                            <img src="./assets/Performance.svg" alt="Performance" height = "24" width = "24">
                        </button>
                        <button id="categoryNature" class="category-button">
                            <img src="./assets/Nature.svg" alt="Nature" height = "24" width = "24">
                        </button>
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

            <div id="graph-container">
                <div id="event-bar-chart"></div>
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

    document.getElementById("fetchRoseButton").addEventListener("click", () => {
        if (rose_chart) {
            // Remove the rose chart if it exists
            const parentElement = d3.select(rose_chart._config.parentElement);
            if (parentElement) {
                parentElement.selectAll("*").remove(); // Remove all child elements
            }
            rose_chart = null;
            document.getElementById("fetchRoseButton").innerText = "Display Year Calendar";
        } else {
            // Fetch data and display the rose chart
            fetchData().then(data => {
                data.forEach(event => {
                    event.date_time = formatDateTime(event.date_time);
                });
                UpdateChart(data);
            });
            document.getElementById("fetchRoseButton").innerText = "Remove Year Calendar";
        }
    });

    document.getElementById("fetchMapButton").addEventListener("click", () => {
        if (map) {
            const parentElement = document.querySelector(map._config.parentElement);
            if (parentElement) {
                const newElement = parentElement.cloneNode(false); // Clone without children
                parentElement.parentNode.replaceChild(newElement, parentElement);
            }
            map = null; 
            document.getElementById("fetchMapButton").innerText = "Display Event Map";
        } else {
            fetchData().then(data => {
                data.forEach(event => {
                    event.date_time = formatDateTime(event.date_time);
                });
                UpdateVenueMap(data);
            });
            document.getElementById("fetchMapButton").innerText = "Remove Event Map";
        }
    });

    document.getElementById("toggleMagicPotionButton").addEventListener("click", () => {
        const magicPotionContainer = document.getElementById("magicPotion");
        const mapContainer = document.getElementById("map");
    
        if (isMagicPotionVisible) {
            if (splitInstance) {
                splitInstance.destroy();
                splitInstance = null;
            }
            magicPotionContainer.style.display = 'none';
            if (map) {
                mapContainer.style.flex = '1'; 
                map.resize(); 
            }
            document.getElementById("toggleMagicPotionButton").innerText = "Display Magic Potion";
        } 
        else {
            // Split the divs
            fetchData().then(data => {
                data.forEach(event => {
                    event.date_time = formatDateTime(event.date_time);
                });
                initMagicPotion(data);
                magicPotionContainer.style.display = "flex";
                if (map) {
                    mapContainer.style.flex = 'none';
                    splitInstance = Split(['#map', '#magicPotion'], {
                        sizes: [50, 50], 
                        minSize: [300, 300],
                        gutterSize: 4, 
                        direction: 'vertical' 
                    });
                    map.resize();
                } 
                document.getElementById("toggleMagicPotionButton").innerText = "Remove Magic Potion";
            });
        }
        isMagicPotionVisible = !isMagicPotionVisible;
    });
    
    
    
    
    window.addEventListener("resize", () => {
        if (rose_chart) {
            rose_chart.updateVis();
        }
        if (map) {
            map.updateVis();
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
	
});
