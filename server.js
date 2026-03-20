const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // serves your HTML files

// ✅ Connect to MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',        // your MySQL username
  password: 'Syam@8056',        // your MySQL password
  database: 'syamdb'  // your database
});

db.connect(err => {
  if (err) throw err;
  console.log('✅ Connected to syamdb');
});

// ✅ SIGNUP Route
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10); // encrypt password

  const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
  db.query(sql, [username, email, hashed], (err, result) => {
    if (err) return res.status(400).json({ message: 'Email already exists' });
    res.json({ message: '✅ Signup successful!' });
  });
});

// ✅ LOGIN Route
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], async (err, results) => {
    if (err || results.length === 0)
      return res.status(401).json({ message: '❌ User not found' });

    const match = await bcrypt.compare(password, results[0].password);
    if (!match) return res.status(401).json({ message: '❌ Wrong password' });

    res.json({ message: '✅ Login successful!', user: results[0].username });
  });
});

app.listen(3000, () => console.log('🚀 Server running on http://localhost:3000'));