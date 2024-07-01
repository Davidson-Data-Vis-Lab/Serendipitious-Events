async function fetchData() {
    try {
        const response = await fetch("http://localhost:3000/rose_chart");
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        return await response.json();
    } catch (error) {
        console.error("There has been a problem with your rose chart operation:", error);
    }
}

async function fetchSvg(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${url}`);
        }
        return await response.text();
    } catch (error) {
        console.error("There has been a problem with fetching SVG:", error);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const events = await fetchData();

    if (!events) {
        console.error("Failed to fetch events.");
        return;
    }

    const categoryIcons = {
        "Fitness": "assets/Fitness.svg",
        "Arts/Culture": "assets/Arts_Culture.svg",
        "Sport": "assets/Sport.svg",
        "Academics/Out of School Time": "assets/Academics.svg",
        "Family Festival": "assets/Family_Festival.svg",
        "Mobile Unit": "assets/Mobile_Unit.svg",
        "Performance": "assets/Performance.svg",
        "Nature": "assets/Nature.svg"
        // Add more categories and their corresponding SVG file names here
    };

    const eventList = document.querySelector('.event-list');
    const startDateFilter = document.getElementById('start-date-filter');
    const endDateFilter = document.getElementById('end-date-filter');
    const categoryFilter = document.getElementById('category-filter');
    const filterButton = document.getElementById('filter-button');

    const today = new Date();
    today.setFullYear(2019);
    const formattedStartDate = today.toISOString().split('T')[0];
    startDateFilter.value = formattedStartDate;
    endDateFilter.value = '2019-12-31';

    async function displayEvents(filteredEvents) {
        eventList.innerHTML = '';
        for (const event of filteredEvents) {
            const eventDate = new Date(event.date_time);
            const day = eventDate.getDate();
            const month = eventDate.toLocaleString('default', { month: 'short' });
            const categoryIconPath = categoryIcons[event.category]; 
            const categoryIconSvg = await fetchSvg(categoryIconPath);

            const eventName = event.event_name ? event.event_name : '<i>No Title</i>';

            const eventItem = document.createElement('li');
            eventItem.classList.add('event-item');
            
            eventItem.innerHTML = `
                <div class="event-date">
                    <div class="day">${day}</div>
                    <div class="month">${month}</div>
                </div>
                <div class="event-summary">
                    <p class="event-name">${eventName}</p>
                    <p>${event.category}</p>
                    <p>${eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit',hour12: true  })}</p>
                    <p>${event.venue_name}, ${event.borough}</p>
                    <p>${event.tags}</p>
                </div>
            `;

            const iconContainer = document.createElement('div');
            iconContainer.classList.add('event-icon');
            iconContainer.innerHTML = categoryIconSvg;
            eventItem.appendChild(iconContainer);

            eventList.appendChild(eventItem);
        }
    }

    function filterEvents() {
        const startDateValue = new Date(startDateFilter.value);
        const endDateValue = new Date(endDateFilter.value);
        const categoryValue = categoryFilter.value;

        const filteredEvents = events.filter(event => {
            const eventDate = new Date(event.date_time);

            return (
                (!isNaN(startDateValue) && eventDate >= startDateValue) &&
                (!isNaN(endDateValue) && eventDate <= endDateValue) &&
                (categoryValue === "" || event.category === categoryValue)
            );
        });

        displayEvents(filteredEvents);
    }

    // Filter and display events within the default date range
    const defaultStartDate = new Date(startDateFilter.value);
    const defaultEndDate = new Date(endDateFilter.value);
    const initialFilteredEvents = events.filter(event => {
        const eventDate = new Date(event.date_time);
        return eventDate >= defaultStartDate && eventDate <= defaultEndDate;
    });
    displayEvents(initialFilteredEvents);

    filterButton.addEventListener('click', filterEvents);
});
