const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const logRoutes = require('./routes/logRoutes');
const authRoutes = require('./routes/authRoutes');
const requestRoutes = require('./routes/requestRoutes');

require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Essential for reading JSON from the frontend
app.use('/api/requests', requestRoutes);
app.use('/api/medications', require('./routes/medicationRoutes'));

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Atlas Connected Successfully"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Test Route
app.get('/', (req, res) => {
  res.send("Med-Reminder API is running...");
});

app.use('/api/auth', authRoutes);
app.use('/api/logs', logRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is flying on port ${PORT}`);
});