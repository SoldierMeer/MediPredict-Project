import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logRoutes from './routes/logRoutes.js'
import authRoutes from './routes/authRoutes.js'
import requestRoutes from './routes/requestRoutes.js';
import medicationRoutes from './routes/medicationRoutes.js';
import userRoutes from './routes/userRoutes.js';

import 'dotenv/config';

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Essential for reading JSON from the frontend
app.use('/api/requests', requestRoutes);
app.use('/api/medications', medicationRoutes);

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
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is flying on port ${PORT}`);
});