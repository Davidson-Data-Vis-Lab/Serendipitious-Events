class Venue_Map {
	constructor(_config, _data) {
		this._config = {
			parentElement: _config.parentElement,
		};
		this.data = this.transformData(_data);
		this.eventData = _data;
		this.askConfirmation = true;
		this.initVis();
	}

	initVis() {
		let vis = this;

		const nycBounds = [
			[40.477399, -74.25909],
			[40.917577, -73.700272],
		];

		vis.defaultView = [40.7128, -74.006];
        vis.defaultZoom = 12;

		const map = L.map(this._config.parentElement.slice(1), {
			maxBounds: nycBounds,
			maxBoundsViscosity: 1.0,
			minZoom: 8,
		}).setView([40.7128, -74.006], 12);

		// Add OpenStreetMap tiles to the map
		L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
			attribution:
				'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
		}).addTo(map);

		vis.map = map;

		const icons = {
			Fitness: L.icon({ iconUrl: "./assets/Fitness.svg", iconSize: [30, 75] }),
			FamilyFestival: L.icon({
				iconUrl: "./assets/Family_Festival.svg",
				iconSize: [38, 95],
			}),
			Sport: L.icon({ iconUrl: "./assets/Sport.svg", iconSize: [30, 60] }),
			AcademicsOutofSchoolTime: L.icon({
				iconUrl: "./assets/Academics.svg",
				iconSize: [38, 95],
			}),
			ArtsCulture: L.icon({
				iconUrl: "./assets/Arts_Culture.svg",
				iconSize: [38, 95],
			}),
			MobileUnit: L.icon({
				iconUrl: "./assets/Mobile_unit.svg",
				iconSize: [38, 95],
			}),
			Performance: L.icon({
				iconUrl: "./assets/Performance.svg",
				iconSize: [38, 95],
			}),
			Nature: L.icon({ iconUrl: "./assets/Nature.svg", iconSize: [38, 95] }),
			CloseButton: L.icon({ iconUrl: "./assets/close-button.svg", iconSize: [40, 50],className: 'close-button-marker' }),
		};

		vis.icons = icons;
        vis.individualLayer = L.layerGroup().addTo(vis.map);
		vis.addLegend();
        vis.addResetZoomButton();
	}

	addLegend() {
        const legend = L.control({ position: 'topright' });

        legend.onAdd = () => {
            const container = L.DomUtil.create('div', 'legend-container');
            const toggle = L.DomUtil.create('div', 'legend-toggle', container);
            const legendDiv = L.DomUtil.create('div', 'legend', container);

			const icon = L.DomUtil.create('img', '', toggle);
            icon.src = './assets/Legend.svg'; // Path to your SVG icon

            legendDiv.innerHTML = `
                <div><img src="./assets/Fitness.svg" alt="Fitness"> Fitness</div>
                <div><img src="./assets/Family_Festival.svg" alt="Family Festival"> Family Festival</div>
                <div><img src="./assets/Sport.svg" alt="Sport"> Sport</div>
                <div><img src="./assets/Academics.svg" alt="Academics/Out of School Time"> Academics/Out of School Time</div>
                <div><img src="./assets/Arts_Culture.svg" alt="Arts/Culture"> Arts/Culture</div>
                <div><img src="./assets/Mobile_unit.svg" alt="Mobile Unit"> Mobile Unit</div>
                <div><img src="./assets/Performance.svg" alt="Performance"> Performance</div>
                <div><img src="./assets/Nature.svg" alt="Nature"> Nature</div>
            `;

            toggle.addEventListener('click', () => {
                const isVisible = legendDiv.style.display === 'block';
                legendDiv.style.display = isVisible ? 'none' : 'block';
            });

            return container;
        };

        legend.addTo(this.map);
    }

	addResetZoomButton() {
        const resetZoomContainer = L.control({ position: 'topleft' });

        resetZoomContainer.onAdd = () => {
            const button = L.DomUtil.create('div', 'reset-zoom');
            const icon = L.DomUtil.create('img', '', button);
            icon.src = './assets/reset-zoom.svg'; // Path to your SVG icon
            icon.alt = 'Reset Zoom';
            button.addEventListener('click', () => {
                this.map.setView(this.defaultView, this.defaultZoom);
            });
            return button;
        };

        resetZoomContainer.addTo(this.map);
    }

	updateVis() {
		let vis = this;

		if (vis.markersLayer) {
			vis.map.removeLayer(vis.markersLayer);
		}

		// Create a new layer for markers
		vis.markersLayer = L.layerGroup().addTo(this.map);

		// Add circles for each data point
		vis.data.forEach((d) => {
			const [lat, lon] = d.coordinates.split(",").map(Number);
			const radius = (d.events.length / 2) * 10; // Radius based on the number of events

			const circle = L.circle([lat, lon], {
				color: "blue",
				fillColor: "#5c33ff",
				fillOpacity: 0.5,
				radius: radius,
			}).addTo(vis.markersLayer);

			const popupContent = `<b>${d.venue_name}</b><br>Events: ${d.events.length}<br><button class="expand-events-btn" data-coordinates="${d.coordinates}">Show Events</button>`;
			circle.bindPopup(popupContent);
		});

		this.map.on("popupopen", (e) => {
			const popupNode = e.popup._contentNode;
			const button = popupNode.querySelector(".expand-events-btn");
			if (button) {
				button.addEventListener("click", () =>
					this.expandEvents(button.dataset.coordinates)
				);
			}
		});
	}

	expandEvents(coordinates) {
		let vis = this;
		const venueData = vis.data.find((d) => d.coordinates === coordinates);
		if (!venueData) return;

		vis.markersLayer.eachLayer((layer) => {
			if (
				layer instanceof L.Circle &&
				layer
					.getLatLng()
					.equals(L.latLng(venueData.coordinates.split(",").map(Number)))
			) {
				vis.markersLayer.removeLayer(layer);
				vis.addDotMarker(venueData);
			}
		});
		const bounds = [];

		venueData.events.forEach((event) => {
			console.log(event)
			const [lat, lon] = venueData.coordinates.split(",").map(Number);

			const offsetLat = lat + (Math.random() - 0.5) * 0.0015;
			const offsetLon = lon + (Math.random() - 0.5) * 0.0015;

			const icon =
				vis.icons[event.category.replace(/ /g, "").replace(/\//g, "")];

			const marker = L.marker([lat, lon], { icon })
				.bindPopup(
					`<b>${event.event_name}</b><br>${event.date_time}<br>${event.venue_name}`
				)
				.addTo(vis.markersLayer);
			
			marker.venueCoordinates = coordinates;
			vis.animateMarker(marker, [lat, lon], [offsetLat, offsetLon]);	

			bounds.push([offsetLat, offsetLon]);
		});

		if (bounds.length > 0) {
			const boundsLayer = L.featureGroup(bounds.map(coord => L.marker(coord)));
			vis.map.fitBounds(boundsLayer.getBounds().pad(0.1));
		}
	}

	animateMarker(marker, startLatLng, endLatLng) {
		let duration = 200; // 1 second
		let steps = 50;
		let stepDuration = duration / steps;

		let latStep = (endLatLng[0] - startLatLng[0]) / steps;
		let lngStep = (endLatLng[1] - startLatLng[1]) / steps;

		let currentStep = 0;

		function moveMarker() {
			if (currentStep < steps) {
				let lat = startLatLng[0] + latStep * currentStep;
				let lng = startLatLng[1] + lngStep * currentStep;
				marker.setLatLng([lat, lng]);
				currentStep++;
				setTimeout(moveMarker, stepDuration);
			} else {
				marker.setLatLng(endLatLng);
			}
		}

		moveMarker();
	}


	addDotMarker(venueData) {
		let vis = this;
		const [lat, lon] = venueData.coordinates.split(",").map(Number);

		// Ensure the custom icon is used properly with L.marker
		const dotMarker = L.marker([lat, lon], {
			icon: vis.icons.CloseButton
		}).addTo(vis.markersLayer);

		dotMarker.on('click', () => {
			if (vis.askConfirmation) {
				vis.showCollapseConfirmation(venueData, dotMarker);
			} else {
				vis.collapseEvents(venueData, dotMarker);
			}
		});
	}

	
	collapseEvents(venueData,dotMarker) {
		let vis = this;
	
		// Remove individual event markers for the specific venue
		vis.markersLayer.eachLayer((layer) => {
			if (layer.venueCoordinates === venueData.coordinates) {
				vis.markersLayer.removeLayer(layer);
			}
		});

		vis.markersLayer.removeLayer(dotMarker);
	
		// Add the venue circle back
		const [lat, lon] = venueData.coordinates.split(",").map(Number);
		const radius = (venueData.events.length / 2) * 10; // Radius based on the number of events
	
		const circle = L.circle([lat, lon], {
			color: "blue",
			fillColor: "#5c33ff",
			fillOpacity: 0.5,
			radius: radius,
		}).addTo(vis.markersLayer);
	
		const popupContent = `<b>${venueData.venue_name}</b><br>Events: ${venueData.events.length}<br><button class="expand-events-btn" data-coordinates="${venueData.coordinates}">Show Events</button>`;
		circle.bindPopup(popupContent);
	}

	showCollapseConfirmation(venueData, dotMarker) {
		const confirmationPopup = L.popup()
			.setLatLng(dotMarker.getLatLng())
			.setContent(`
				<div>Do you want to collapse the events?</div>
				<button class="confirm-collapse-btn">Yes</button>
				<button class="cancel-collapse-btn">No</button>
				<div>
					<input type="checkbox" id="dont-ask-again">
					<label for="dont-ask-again">Don't ask me again</label>
				</div>
			`)
			.openOn(this.map);

		const popupNode = confirmationPopup._contentNode;
		popupNode.querySelector('.confirm-collapse-btn').addEventListener('click', () => {
			const dontAskAgain = popupNode.querySelector('#dont-ask-again').checked;
			if (dontAskAgain) {
				this.askConfirmation = false;
			}
			this.collapseEvents(venueData, dotMarker);
			this.map.closePopup(confirmationPopup);
		});

		popupNode.querySelector('.cancel-collapse-btn').addEventListener('click', () => {
			this.map.closePopup(confirmationPopup);
		});
	}

	transformData(queryResults) {
		const groupedData = {};

		queryResults.forEach((event) => {
			const { coordinates, venue_name, event_name, date_time, category } =
				event;

			if (!groupedData[coordinates]) {
				groupedData[coordinates] = {
					coordinates: coordinates,
					venue_name: venue_name,
					events: [],
				};
			}
			groupedData[coordinates].events.push({ event_name, date_time, category,venue_name });
		});

		// Convert the grouped data to an array
		return Object.values(groupedData);
	}

	cleanMarkersLayers() {
		if (this.markersLayer) {
			this.markersLayer.clearLayers();
			console.log("markersLayer is cleared");
		}
	}

    cleanIndividualLayer(){
        if (this.individualLayer) {
			this.individualLayer.clearLayers();
			console.log("individual layer is cleared");
		}
    }

	addPreciseEventMarker(eventData) {
        this.cleanMarkersLayers();

		console.log("event data is: ", eventData.category);
		const icon =
			this.icons[eventData.category.replace(/ /g, "").replace(/\//g, "")];
		const [lat, lon] = eventData.coordinates.split(",").map(Number);

		const marker = L.marker([lat, lon], { icon })
			.bindPopup(
				`<b>${eventData.venue_name}</b><br>${eventData.event_name}<br>${eventData.date_time}`
			)
			.addTo(this.individualLayer)
			.openPopup();
	}

	addVagueEventMarker(eventData) {
        this.cleanIndividualLayer();

		const icon =
			this.icons[eventData.category.replace(/ /g, "").replace(/\//g, "")];
		const [lat, lon] = eventData.coordinates.split(",").map(Number);

		const offsetLat = lat + (Math.random() - 0.5) * 0.0015;
		const offsetLon = lon + (Math.random() - 0.5) * 0.0015;

		const marker = L.marker([offsetLat, offsetLon], { icon })
			.bindPopup(
				`<b>${eventData.venue_name}</b><br>${eventData.event_name}<br>${eventData.date_time}`
			)
			.addTo(this.markersLayer);
	}


}
