require('dotenv').config();
const express = require('express');
const mysql = require('mysql');
const cors = require('cors'); // React와 서버 간에 CORS 문제 해결용

const app = express();
app.use(cors()); // CORS 설정

// JSON 요청 본문을 파싱하도록 설정
app.use(express.json());
// MySQL 연결 설정
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) throw err;
    console.log('MySQL Connected...');
});

// 데이터 요청을 처리하는 API 엔드포인트
app.get('/api/timeline', (req, res) => {
    const sqlQuery = 'SELECT * FROM timeline ORDER BY date';
    db.query(sqlQuery, (err, result) => {
        if (err) throw err;
        res.send(result);
    });
});

app.put('/api/timeline/:id', (req, res) => {
    const eventId = req.params.id;
    const { date, members } = req.body;

    // Validate input
    if (!date || !members) {
        return res.status(400).json({ error: 'Date and members are required.' });
    }

    // Update query
    const query = 'UPDATE timeline SET date = ?, members = ? WHERE id = ?';

    db.query(query, [date, JSON.stringify(members), eventId], (err, result) => {
        if (err) {
            console.error('Error updating timeline event:', err);
            return res.status(500).json({ error: 'Failed to update the timeline event.' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Timeline event not found.' });
        }

        res.json({ message: 'Timeline event updated successfully.' });
    });
});

app.get('/api/replayline', (req, res) => {
    const sqlQuery = 'SELECT * FROM replayline ORDER BY date';
    db.query(sqlQuery, (err, result) => {
        if (err) throw err;
        res.send(result);
    });
});

// API to update the date and members of a timeline event
app.put('/api/replayline/:id', (req, res) => {
    const eventId = req.params.id;
    const { date, members, contents } = req.body;

    // Validate input
    if (!date || !members || !contents) {
        return res.status(400).json({ error: 'Date and members and contents are required.' });
    }

    // Update query
    const query = 'UPDATE replayline SET date = ?, members = ?, contents = ? WHERE id = ?';

    db.query(query, [date, JSON.stringify(members), JSON.stringify(contents), eventId], (err, result) => {
        if (err) {
            console.error('Error updating replayline event:', err);
            return res.status(500).json({ error: 'Failed to update the replayline event.' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Replayline event not found.' });
        }

        res.json({ message: 'Replayline event updated successfully.' });
    });
});

app.listen(5000, '0.0.0.0', () => {
    console.log('Server started on port 5000');
});
