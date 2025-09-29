import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import aiRouter from './routes/aiRoutes.js';
import connectCloudinary from './configs/cloudinary.js';
import userRouter from './routes/userRoutes.js';

const app = express(); // CREATE EXPRESS APP FIRST

await connectCloudinary();

// -------------------- CORS --------------------
app.use(cors({
  origin: ['https://nova-frontend-xi.vercel.app', 'http://localhost:5175'], // frontend + local dev
  methods: ['GET','POST','PUT','DELETE'],
  credentials: true
}));

// -------------------- MIDDLEWARE --------------------
app.use(express.json());
app.use(clerkMiddleware());

// -------------------- ROUTES --------------------
app.get('/', (req, res) => res.send('Server is Live! you can code'));

app.use(requireAuth());
app.use('/api/ai', aiRouter);
app.use('/api/user', userRouter);

// -------------------- START SERVER --------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server is running on port', PORT));







