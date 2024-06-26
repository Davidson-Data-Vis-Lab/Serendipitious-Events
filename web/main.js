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
		if (rose_chart) {
			d3.select(rose_chart._config.parentElement).selectAll("*").remove();
		}
		// Initialize and render the new chart
		rose_chart = new Nightingale_Rose_Chart(
			{ parentElement: "#chart" },
			inputData
		);
		rose_chart.updateVis();
	}

	function UpdateVenueMap(inputData) {
		if (map) {
			const parentElement = document.querySelector(map._config.parentElement);
			if (parentElement) {
				const newElement = parentElement.cloneNode(false); // Clone without children
				parentElement.parentNode.replaceChild(newElement, parentElement);
			}
		}
		map = new Venue_Map({ parentElement: "#map" }, inputData);
		map.updateVis();
	}

	function formatDateTime(dateTimeString) {
		const date = new Date(dateTimeString);
		const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-based
		const day = String(date.getDate()).padStart(2, "0");
		const hours = String(date.getHours()).padStart(2, "0");
		const minutes = String(date.getMinutes()).padStart(2, "0");

		return `${month}-${day} ${hours}:${minutes}`;
	}

	document.getElementById("fetchRoseButton").addEventListener("click", () => {
		fetchData().then(data => {
            data.forEach(event => {
                event.date_time = formatDateTime(event.date_time);
            });
            UpdateChart(data);
        });
    });

	document.getElementById("fetchMapButton").addEventListener("click", () => {
        fetchData().then(data => {
            data.forEach(event => {
                event.date_time = formatDateTime(event.date_time);
            });
			UpdateVenueMap(data);
        });
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
});
