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
app.get('/api/games', (req, res) => {
    const sqlQuery = 'SELECT * FROM games';
    db.query(sqlQuery, (err, result) => {
        if (err) throw err;
        res.send(result);
    });
});

app.get('/api/songs', (req, res) => {
    const sqlQuery = 'SELECT * FROM songs';
    db.query(sqlQuery, (err, result) => {
        if (err) throw err;
        res.send(result);
    });
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
    const { date, members, contents, games, songs } = req.body;

    // Validate input
    if (!date || !members || !contents || !games || !songs) {
        return res.status(400).json({ error: 'Date, members, contents, games and songs are required.' });
    }

    // Update query
    const query = 'UPDATE replayline SET date = ?, members = ?, contents = ?, games = ?, songs = ? WHERE id = ?';

    db.query(query, [date, JSON.stringify(members), JSON.stringify(contents), JSON.stringify(games), JSON.stringify(songs), eventId], (err, result) => {
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

app.get('/api/videos', (req, res) => {
    const { channels } = req.query;
    const channelList = channels.split(',').map(Number);
    const query = `SELECT * FROM replayline WHERE channel IN (?)`;
    db.query(query, [channelList], (err, results) => {
        if (err) {
            console.error('Error fetching videos:', err);
            res.status(500).send('Error fetching videos');
            return;
        }
        res.json(results);
    });
});

app.get('/api/random-video', (req, res) => {
    const { channels } = req.query;
    const channelList = channels.split(',').map(Number);
    const query = `SELECT * FROM replayline WHERE channel IN (?) ORDER BY RAND() LIMIT 1`;
    db.query(query, [channelList], (err, results) => {
        if (err) {
            console.error('Error fetching random video:', err);
            res.status(500).send('Error fetching random video');
            return;
        }
        res.json(results[0]);
    });
});

// API to submit score
app.post('/api/submit-score', (req, res) => {
    const { username, score, channels } = req.body || {};
    if (!username || score === undefined || !channels) {
        return res.status(400).send('Username, score, and channels are required');
    }
    const query = `INSERT INTO scores (username, score, channels) VALUES (?, ?, ?)`;
    db.query(query, [username, score, JSON.stringify(channels)], (err, results) => {
        if (err) {
            console.error('Error submitting score:', err);
            res.status(500).send('Error submitting score');
            return;
        }
        res.status(201).send('Score submitted successfully');
    });
});

// API to get top 10 scores
app.get('/api/top-scores', (req, res) => {
    const query = `SELECT username, score, channels, created_at FROM scores ORDER BY score DESC, created_at ASC LIMIT 100`;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching top scores:', err);
            res.status(500).send('Error fetching top scores');
            return;
        }
        res.json(results);
    });
});

app.listen(5000, '0.0.0.0', () => {
    console.log('Server started on port 5000');
});
