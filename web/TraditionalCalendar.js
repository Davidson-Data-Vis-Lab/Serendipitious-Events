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

    // Get selected categories
    const selectedCategories = Array.from(document.querySelectorAll('.legend-item.selected')).map(item => item.dataset.category);
    console.log(selectedCategories);
    // Get days in the selected month
    const daysInMonth = new Date(2019, month, 0).getDate();

    // Render each day
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('day');

        const dateDiv = document.createElement('div');
        dateDiv.classList.add('date');
        dateDiv.textContent = day;
        dayDiv.appendChild(dateDiv);

        let dayEvents = [];
        if (selectedCategories.length > 0) {
            dayEvents = events.filter(event => event.month === month && event.date === day && selectedCategories.includes(event.category));
        }
        
        console.log(dayEvents);
        dayEvents.sort((a, b) => new Date(a.date_time) - new Date(b.date_time));

        dayEvents.forEach(event => {
            const eventDiv = document.createElement('div');
            eventDiv.classList.add('event');
            eventDiv.textContent = event.event_name == null? "No Title" : event.event_name;
            eventDiv.style.backgroundColor = getCategoryColor(event.category);
            eventDiv.addEventListener('click', () => {
                if (!isPopupOpen) {
                    showEventDetails(event);
                }
            });
            dayDiv.appendChild(eventDiv);
        });

        calendar.appendChild(dayDiv);
    }
}

function showEventDetails(event) {
    isPopupOpen = true;

    const eventDetails = document.createElement('div');
    eventDetails.classList.add('event-details');

    const formattedTime = formatDateTime(event.date_time);

    const detailsHtml = `
        <h2>${event.event_name}</h2>
        <p><strong>Time:</strong> ${formattedTime}</p>
        <p><strong>Venue:</strong> ${event.venue_name}</p>
        <p><strong>Borough:</strong> ${event.borough}</p>
        <p><strong>Tags:</strong> ${event.tags}</p>
        <button id="close-btn">Close</button>
    `;
    eventDetails.innerHTML = detailsHtml;

    document.body.appendChild(eventDetails);

    document.getElementById('close-btn').addEventListener('click', () => {
        document.body.removeChild(eventDetails);
        isPopupOpen = false;
    });
}

function formatDateTime(dateTime) {
    const date = new Date(dateTime);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}-${day} ${hours}:${minutes}`;
}

function getCategoryColor(category) {
    const categoryColors = {
        "Fitness": "#4e79a7",
        "Arts/Culture": "#f28e2c",
        "Sport": "#e15759",
        "Academics/Out of School Time": "#76b7b2",
        "Family Festival": "#59a14f",
        "Mobile Unit": "#edc949",
        "Performance": "#af7aa1",
        "Nature": "#ff9da7"
    };
    return categoryColors[category] || "#bab0ab"; // Default color if category not found
}
