

import OpenAI from "openai";

import fs from 'fs';
import sql from "../configs/db.js";
import { clerkClient } from "@clerk/express";
import axios from "axios";
import { v2 as cloudinary } from "cloudinary";
import FormData from 'form-data';
import pdf from 'pdf-parse/lib/pdf-parse.js';

const AI = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});





export const generateArticle = async (req, res) => {
  try {
    const userId = req.userId;
    const plan = req.plan;
    const free_usage = req.free_usage;
    const { prompt, length } = req.body;

    if (!prompt || prompt.trim() === "") {
      return res.json({ success: false, message: "Prompt cannot be empty" });
    }

    if (plan !== "premium" && free_usage >= 10) {
      return res.json({ success: false, message: "Limit reached. Upgrade to continue" });
    }

    console.log("Sending request to Gemini:", { prompt });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "No content generated";

    console.log("Gemini response content:", content);

    // Save to DB
    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, ${prompt}, ${content}, 'article')
    `;

    // Update free usage
    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: free_usage + 1 },
      });
    }

    res.json({ success: true, content });

  } catch (error) {
    console.log("Gemini full error:", error);
    res.json({ success: false, message: error.message });
  }
};

export const generateBlogTitle = async (req, res) => {
  try {
    const userId = req.userId;
    const plan = req.plan;
    const free_usage = req.free_usage;
    const { prompt } = req.body;

    if (!prompt || prompt.trim() === "") {
      return res.json({ success: false, message: "Prompt cannot be empty" });
    }

    if (plan !== "premium" && free_usage >= 10) {
      return res.json({ success: false, message: "Limit reached. Upgrade to continue" });
    }

    console.log("Sending request to Gemini:", { prompt });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "No content generated";

    console.log("Gemini response content:", content);


    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, ${prompt}, ${content}, 'blog-title')
    `;


    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: free_usage + 1 },
      });
    }

    res.json({ success: true, content });

  } catch (error) {
    console.log("Gemini full error:", error);
    res.json({ success: false, message: error.message });
  }
};

export const generateImage = async (req, res) => {
  try {
    const userId = req.userId;
    const plan = req.plan;
    const { prompt, publish } = req.body;

    if (!prompt || prompt.trim() === "") {
      return res.json({ success: false, message: "Prompt cannot be empty" });
    }

    if (plan !== "premium") {
      return res.json({ success: false, message: "This feautre is only available for Premium Subscriptions." });
    }

    const formData = new FormData()
    formData.append('prompt', prompt)
    const { data } = await axios.post("https://clipdrop-api.co/text-to-image/v1", formData, {
      headers: { 'x-api-key': process.env.CLIPDROP_API_KEY, },
      responseType: "arraybuffer",
    })

    const base64Image = `data:image/png;base64,${Buffer.from(data, 'binary').toString('base64')}`;

    const { secure_url } = await cloudinary.uploader.upload(base64Image)


    await sql`
      INSERT INTO creations (user_id, prompt, content, type , publish)
      VALUES (${userId}, ${prompt}, ${secure_url}, 'image', ${publish ?? false})
    `;




    res.json({ success: true, content: secure_url });

  } catch (error) {
    console.log("Gemini full error:", error);
    res.json({ success: false, message: error.message });
  }
};


export const removeBackground = async (req, res) => {
  try {
    const userId = req.userId;
    const plan = req.plan;
    const image = req.file;

    if (!image) {
      return res.json({ success: false, message: "No image uploaded" });
    }

    if (plan !== "premium") {
      return res.json({ success: false, message: "This feautre is only available for Premium Subscriptions." });
    }




    const { secure_url } = await cloudinary.uploader.upload(image.path, {
      transformation: [{
        effect: 'background_removal',
        background_removal: 'remove_the_background'
      }]
    })


    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, 'Remove background from image', ${secure_url}, 'image') `;




    res.json({ success: true, content: secure_url });

  } catch (error) {
    console.log("Gemini full error:", error);
    res.json({ success: false, message: error.message });
  }
};



export const removeObject = async (req, res) => {
  try {
    const userId = req.userId;
    const plan = req.plan;
    const image = req.file;
    const { object } = req.body;

    if (!object || object.trim() === "") {
      return res.json({ success: false, message: "Object cannot be empty" });
    }

    // Upload image to Cloudinary (no gen_remove effect)
    const uploadRes = await cloudinary.uploader.upload(image.path);

    // Save to DB
    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, ${`Uploaded image with object: ${object}`}, ${uploadRes.secure_url}, 'image')
    `;

    // Return uploaded image URL to frontend
    res.json({ success: true, content: uploadRes.secure_url });
  } catch (error) {
    console.log("Error in removeObject:", error);
    res.json({ success: false, message: error.message });
  }
};





export const resumeReview = async (req, res) => {
  try {
    const userId = req.userId;
    const plan = req.plan;
    const resume = req.file;


    if (plan !== 'premium') {
      return res.json({ success: false, message: "This feautre is only avaialable for premium subscriptions" })
    }

    if (resume.size > 5 * 1024 * 1024) {
      return res.json({ success: false, message: " Resume file size exceeds allowed size (5MB)." })
    }

    const dataBuffer = fs.readFileSync(resume.path)
    const pdfData = await pdf(dataBuffer)



    const prompt = ` Review the following resume and provide ATS score , constructive feedback on its strengths, weaknesses,areas for improvement. Resume Content:\n\n${pdfData.text}`;


    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [{ role: "user", content: prompt, }],
      temperature: 0.7
      ,
      max_tokens: 1000,
    });
    const content = response.choices[0].message.content

    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId},'Review the uploaded resume ',${content}, 'resume-review')
    `;

    res.json({ success: true, content });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};














