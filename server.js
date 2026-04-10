const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const dbConnect = require('./config/database');

// ── Connect to Database ──────────────────────────────────
dbConnect();

// ── Middleware ───────────────────────────────────────────
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:3000',
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── API Routes ───────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Uvoro API is running 🚀' });
});

// ── Start Server ──────────────────────────────────────────
const PORT = process.env.PORT || 4005;
app.listen(PORT, () => {
  console.log(`\n✨ Uvoro Backend running!`);
  console.log(`   API: http://localhost:${PORT}/api\n`);
});
