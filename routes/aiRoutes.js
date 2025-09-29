import express from "express";
import { generateArticle, generateBlogTitle, generateImage, removeBackground, removeObject, resumeReview } from "../controllers/aiControllers.js";
import { auth } from "../middlewares/auth.js";
import { upload } from "../configs/multer.js";



const aiRouter = express.Router();

aiRouter.post('/generate-article' ,auth, generateArticle)
aiRouter.post('/generate-blog-title' ,auth, generateBlogTitle)
aiRouter.post('/generate-image' ,auth, generateImage)
aiRouter.post('/remove-background' ,auth, upload.single('image'), removeBackground)
aiRouter.post('/remove-object' , auth,upload.single('image') , removeObject)
aiRouter.post('/resume-review' ,auth, upload.single('resume') , resumeReview)





export default aiRouter








