const express = require('express');
const mysql   = require('mysql2');
const bcrypt  = require('bcrypt');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
app.use('/uploads', express.static('uploads'));

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename:    (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
  })
});

const db = mysql.createConnection({
  host: 'localhost', user: 'root', password: 'Syam@8056', database: 'syamdb'
});
db.connect(err => { if (err) throw err; console.log('✅ Connected to syamdb'); });

// SIGNUP
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  db.query('INSERT INTO users (username, email, password) VALUES (?,?,?)',
    [username, email, hashed],
    (err, result) => {
      if (err) return res.status(400).json({ message: '❌ Email already exists' });
      res.json({ message: '✅ Signup successful!' });
    });
});

// LOGIN
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err || results.length === 0) return res.status(401).json({ message: '❌ User not found' });
    const match = await bcrypt.compare(password, results[0].password);
    if (!match) return res.status(401).json({ message: '❌ Wrong password' });
    res.json({ message: '✅ Login successful!', userId: results[0].id, user: results[0].username });
  });
});

// SAVE PROFILE
app.post('/profile/save', upload.single('picture'), (req, res) => {
  const { user_id, username, email, phone } = req.body;
  const picture = req.file ? req.file.filename : null;
  db.query('SELECT * FROM profiles WHERE user_id = ?', [user_id], (err, results) => {
    if (results.length > 0) {
      const picPart = picture ? ', picture=?' : '';
      const params  = picture ? [username, email, phone, picture, user_id] : [username, email, phone, user_id];
      db.query(`UPDATE profiles SET username=?, email=?, phone=?${picPart} WHERE user_id=?`, params,
        () => res.json({ message: '✅ Profile updated!' }));
    } else {
      db.query('INSERT INTO profiles (user_id, username, email, phone, picture) VALUES (?,?,?,?,?)',
        [user_id, username, email, phone, picture],
        () => res.json({ message: '✅ Profile saved!' }));
    }
  });
});

// GET PROFILE
app.get('/profile/:userId', (req, res) => {
  db.query('SELECT * FROM profiles WHERE user_id = ?', [req.params.userId], (err, results) => {
    if (!results || results.length === 0) return res.json({});
    res.json(results[0]);
  });
});

app.get('/', (req, res) => res.sendFile(__dirname + '/public/auth.html'));

app.listen(3000, () => console.log('🚀 Server running on http://localhost:3000'));
