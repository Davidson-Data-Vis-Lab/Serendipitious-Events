document.addEventListener('DOMContentLoaded', async () => {
    const events = await fetchData();

    document.querySelectorAll('.legend-item').forEach(item => {
        item.classList.add('selected');
    });

    const currentMonth = new Date().getMonth() + 1; // getMonth() returns 0-11, so add 1
    document.getElementById('month-select').value = currentMonth;

    if (events) {
        renderCalendar(currentMonth, events);
    }

    document.getElementById('month-select').addEventListener('change', function() {
        const selectedMonth = parseInt(this.value);
        renderCalendar(selectedMonth, events);
    });

    document.querySelectorAll('.legend-item').forEach(item => {
        item.addEventListener('click', () => {
            item.classList.toggle('selected');
            const selectedMonth = parseInt(document.getElementById('month-select').value);
            renderCalendar(selectedMonth, events);
        });
    });

    document.getElementById('choose-all').addEventListener('click', () => {
        const allSelected = document.querySelectorAll('.legend-item.selected').length === document.querySelectorAll('.legend-item').length;
        document.querySelectorAll('.legend-item').forEach(item => {
            if (allSelected) {
                item.classList.remove('selected');
            } else {
                item.classList.add('selected');
            }
        });
        const selectedMonth = parseInt(document.getElementById('month-select').value);
        renderCalendar(selectedMonth, events);
    });
});

let isPopupOpen = false;
let selectedEventDiv = null;

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

function renderCalendar(month, events) {
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';

    // Add headers for the weekdays
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    weekdays.forEach(day => {
        const weekdayDiv = document.createElement('div');
        weekdayDiv.classList.add('weekday');
        weekdayDiv.textContent = day;
        calendar.appendChild(weekdayDiv);
    });

    // Get the first day of the month to determine the starting position
    const firstDay = new Date(2019, month - 1, 1).getDay();
    const daysInMonth = new Date(2019, month, 0).getDate();

    // Render empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        calendar.appendChild(emptyCell);
    }

    // Render each day
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('day');

        const dateDiv = document.createElement('div');
        dateDiv.classList.add('date');
        dateDiv.textContent = day;
        dayDiv.appendChild(dateDiv);

        let dayEvents = [];
        const selectedCategories = Array.from(document.querySelectorAll('.legend-item.selected')).map(item => item.dataset.category);
        if (selectedCategories.length > 0) {
            dayEvents = events.filter(event => event.month === month && event.date === day && selectedCategories.includes(event.category));
        }

        dayEvents.sort((a, b) => new Date(a.date_time) - new Date(b.date_time));

        dayEvents.forEach(event => {
            const eventDiv = document.createElement('div');
            eventDiv.classList.add('event');
            
            const eventName = event.event_name == null ? '<i>No Title</i>' : event.event_name;
            eventDiv.innerHTML = eventName; 
            
            eventDiv.style.backgroundColor = getCategoryColor(event.category);
            eventDiv.addEventListener('click', () => {
                showEventDetails(event,eventDiv);
            });
            dayDiv.appendChild(eventDiv);
        });

        calendar.appendChild(dayDiv);
    }
}

function showEventDetails(event, eventDiv) {
    if (isPopupOpen) {
        const currentlySelectedEventDiv = selectedEventDiv;
        closeEventDetails();
        if (currentlySelectedEventDiv === eventDiv) {
            console.log("Same event clicked, closing details.");
            return; // If the same event is clicked again, just close the details
        }
    }
    console.log("Opening event details:", event);
    isPopupOpen = true;

    selectedEventDiv = eventDiv;
    eventDiv.classList.add('selected');

    const eventDetails = document.createElement('div');
    eventDetails.classList.add('event-details');

    const formattedTime = formatDateTime(event.date_time);
    const eventName = event.event_name ? event.event_name : '<i>No Title</i>';
    const detailsHtml = `
        <button id="close-btn">&times;</button>
        <h2>${eventName}</h2>
        <p><strong>Date& Time:</strong> ${formattedTime}</p>
        <p><strong>Venue:</strong> ${event.venue_name}</p>
        <p><strong>Borough:</strong> ${event.borough}</p>
        <p><strong>Tags:</strong> ${event.tags}</p>
    `;
    eventDetails.innerHTML = detailsHtml;

    document.body.appendChild(eventDetails);

    document.getElementById('close-btn').addEventListener('click', closeEventDetails);
    
}

function closeEventDetails() {
    const eventDetails = document.querySelector('.event-details');
    if (eventDetails) {
        document.body.removeChild(eventDetails);
        isPopupOpen = false;
        if (selectedEventDiv) {
            console.log("Removing selected class from:", selectedEventDiv);
            selectedEventDiv.classList.remove('selected'); // Remove selected class from the event
            selectedEventDiv = null;
        }
    }
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

function getCategoryColor(category) {
    const categoryColors = {
        "Fitness": "#4e79a7c9",
        "Arts/Culture": "#f28e2c",
        "Sport": "#e15759",
        "Academics/Out of School Time": "#76b7b2",
        "Family Festival": "#ff9da7",
        "Mobile Unit": "#edc949",
        "Performance": "#af7aa1bf",
        "Nature": "#59a14fbd"
    };
    return categoryColors[category] || "#bab0ab"; // Default color if category not found
}
