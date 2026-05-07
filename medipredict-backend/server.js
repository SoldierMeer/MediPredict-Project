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
app.use(cors({
  origin: [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:5173",
    "https://medipredict-app-iota.vercel.app" // Keep this for when you go back to prod
  ],
  credentials: true
}));

app.use(express.json()); // Essential for reading JSON from the frontend


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
app.use('/api/requests', requestRoutes);
app.use('/api/medications', medicationRoutes);

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server is flying on port ${PORT}`);
  });
}

export default app;