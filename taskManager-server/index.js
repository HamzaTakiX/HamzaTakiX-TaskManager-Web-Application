import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userRouter from './routes/userRouter.js';
import taskRouter from './routes/taskRouter.js';
import aiRouter from './routes/aiRouter.js';
import notificationRouter from './routes/notificationRouter.js';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';
import fs from 'fs';
import './models/notification.model.js';  // Import notification model

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Server configuration
app.use(cors({
    origin: true, // Allow all origins in development
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
dotenv.config();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const profilesDir = path.join(uploadsDir, 'profiles');
const bannersDir = path.join(uploadsDir, 'banners');

[profilesDir, bannersDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));

// Middleware for logging requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Request headers:', req.headers);
  next();
});

// Route for API - Move routes before MongoDB connection
app.use('/api/users', userRouter);
app.use('/api/tasks', taskRouter);
app.use('/api/ai', aiRouter);
app.use('/api/notifications', notificationRouter);

const port = process.env.PORT || 9000;
const mongoUri = 'mongodb://127.0.0.1:27017/task-management';

console.log('Attempting to connect to MongoDB at:', mongoUri);

// Server start
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }).then(async () => {
        console.log('Connected to MongoDB');
        
        // Debug: Check for users in the database
        try {
            const users = await User.find({});
            console.log('Found users in database:', users.length);
            if (users.length > 0) {
                console.log('Sample user emails:', users.map(u => u.email));
            } else {
                console.log('No users found in database');
            }
        } catch (error) {
            console.error('Error querying users:', error.message, error.stack);
        }
    }).catch((error) => {
        console.error('Error connecting to MongoDB:', error.message, error.stack);
    });
});
