import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { clerkMiddleware , requireAuth } from '@clerk/express'
import aiRouter from './routes/aiRoutes.js';
import connectCloudinary from './configs/cloudinary.js';
import userRouter from './routes/userRoutes.js';



const app = express();

await connectCloudinary()

// app.use(cors())
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow Postman/curl
      if (origin.startsWith("http://localhost:")) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
//here change
app.use(express.json())
app.use(clerkMiddleware())




app.get('/', (req,res) => res.send('Server is Live! you can code')
)

app.use(requireAuth())
app.use('/api/ai', aiRouter)
app.use('/api/user' , userRouter)


const PORT = process.env.PORT || 3000;

app.listen(PORT , ()=>{
    console.log('server is running on port' ,PORT);
})







