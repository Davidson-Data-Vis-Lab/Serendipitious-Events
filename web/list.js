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

document.addEventListener('DOMContentLoaded', async () => {
    const events = await fetchData();

    if (!events) {
        console.error("Failed to fetch events.");
        return;
    }

    const eventList = document.querySelector('.event-list');
    const monthFilter = document.getElementById('month-filter');
    const dateFilter = document.getElementById('date-filter');
    const categoryFilter = document.getElementById('category-filter');
    const filterButton = document.getElementById('filter-button');

    function displayEvents(filteredEvents) {
        eventList.innerHTML = '';
        filteredEvents.forEach(event => {
            const eventDate = new Date(event.date_time);
            const day = eventDate.getDate();
            const month = eventDate.toLocaleString('default', { month: 'short' });

            const eventItem = document.createElement('li');
            eventItem.classList.add('event-item');
            
            eventItem.innerHTML = `
                <div class="event-date">
                    <div class="day">${day}</div>
                    <div class="month">${month}</div>
                </div>
                <div class="event-summary">
                    <p class="event-name">${event.event_name}</p>
                    <p>${event.category}</p>
                    <p>${eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p>${event.venue_name}, ${event.borough}</p>
                    <p>${event.tags}</p>
                </div>
            `;

            eventList.appendChild(eventItem);
        });
    }

    function filterEvents() {
        const monthValue = monthFilter.value;
        const dateValue = dateFilter.value;
        const categoryValue = categoryFilter.value;

        const filteredEvents = events.filter(event => {
            const eventDate = new Date(event.date_time);
            const eventMonth = ('0' + (eventDate.getMonth() + 1)).slice(-2);
            const eventDay = eventDate.getDate().toString();

            return (
                (monthValue === "" || eventMonth === monthValue) &&
                (dateValue === "" || eventDay === dateValue) &&
                (categoryValue === "" || event.category === categoryValue)
            );
        });

        displayEvents(filteredEvents);
    }

    filterButton.addEventListener('click', filterEvents);

    displayEvents(events); // Display all events initially
});
