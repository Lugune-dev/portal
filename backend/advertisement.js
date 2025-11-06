// advertisement.js
const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// ===== Database Connection =====
const db = mysql.createConnection({
  host: 'localhost',
  user: 'sheddy', // your DB username
  password: '**Lugun7', // your DB password
  database: 'tphpa'
});

db.connect(err => {
  if (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL');
});

// ===== Multer Config for File Upload =====
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueName + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// ===== POST Route to Save Advertisement =====
router.post('/advertisements', upload.single('image'), (req, res) => {
  try {
    const { title, description, date } = req.body;

    if (!title || !description || !req.file) {
      return res.status(400).json({ message: 'Title, description, and image are required' });
    }

    const imagePath = `/uploads/${req.file.filename}`;
    const sql = `INSERT INTO advertisements (title, description, image, date) VALUES (?, ?, ?, ?)`;

    db.query(sql, [title, description, imagePath, date], (err, result) => {
      if (err) {
        console.error('Error inserting into DB:', err);
        return res.status(500).json({ message: 'Database insert failed' });
      }

      res.json({
        message: 'Advertisement saved successfully',
        adId: result.insertId,
        imageUrl: imagePath
      });
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== Health Check Endpoint =====
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

module.exports = router;
