const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const port = 3000;


// Set up the database connection
const db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '12345678',
    database: 'NewYorkEvents'
});


db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to database');
});

// Serve static files from the "web" directory
app.use(express.static('web'));
app.use(express.json());

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'web', 'SerendipitousVis.html'));
});


app.get('/rose_chart', (req, res) => {

    let baseQuery = `SELECT 
    MONTH(e.date_time) AS month, 
    DAYOFMONTH(e.date_time) AS date, 
    e.name AS event_name,
    e.date_time,
    e.category,
    v.name AS venue_name,
    v.borough,
    v.coordinates, 
    GROUP_CONCAT(ea.tag ORDER BY ea.tag SEPARATOR ', ') AS tags
    FROM 
        Event e
    JOIN 
        Venue v ON e.venue_id = v.id
    JOIN 
        Event_Audience ea ON ea.event_id = e.id
    WHERE 
        (v.coordinates < '0' OR v.coordinates > '0') 
        AND e.date_time BETWEEN '2019-01-01' AND '2019-12-31'
    GROUP BY 
        e.id, e.date_time, e.name, e.category, v.name, v.borough, v.coordinates
    ORDER BY 
        e.date_time;`;
	
    db.query(baseQuery,(error, results) => {
        if (error) {
            res.status(500).send('Internal Server Error');
            return;
        }
        res.json(results);
    });
});
