import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export default async function authMiddleware (req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // ✅ Use findById to get the full user object
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ Attach the user document to the request
    req.user = user; 
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

