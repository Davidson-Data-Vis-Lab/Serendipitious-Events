document.addEventListener("DOMContentLoaded", function () {
	Split(['#chart', '#map'], {
        sizes: [65, 35], // Initial sizes in percentages
        minSize: [300, 300], // Minimum size in pixels for each pane
        gutterSize: 4, // Width of the draggable gutter in pixels
    });

	let rose_chart, map;

	async function fetchData() {
		try {
			const response = await fetch("http://localhost:3000/rose_chart");
			if (!response.ok) {
				throw new Error("Network response was not ok");
			}
			return await response.json();
		} catch (error) {
			console.error(
				"There has been a problem with your rose chart operation:",
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
            map.map.setView(map.defaultView,map.defaultZoom);
        }
    });

});
