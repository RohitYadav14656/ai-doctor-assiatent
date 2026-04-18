// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import Groq from "groq-sdk";

// dotenv.config();

// const app = express();
// app.use(cors());
// app.use(express.json());

// const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// app.post("/chat", async (req, res) => {
//   const { messages } = req.body; // changed to messages (array)

//   const response = await groq.chat.completions.create({
//     model: "llama-3.3-70b-versatile",
//     messages: messages, // send full history
//   });

//   res.json({ reply: response.choices[0].message.content });
// });

// app.listen(3000, () => console.log("Server running on port 3000"));

import express from 'express'; 
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk'; 
import mongoose from 'mongoose';     
import connectdb from './connectdb.js';
import Chat from './schema.js';

dotenv.config();

const app = express();              
app.use(express.json());             
app.use(cors());             

const port = 3000;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Load previous chat history
app.get("/chat/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  const chat = await Chat.findOne({ sessionId });
  res.json({ messages: chat ? chat.messages : [] });
});

connectdb();

// Send message + save to MongoDB
app.post("/chat", async (req, res) => {
  const { messages, sessionId } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array is required" });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const stream = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: "You are an assistant to a doctor. Be polite and keep replies short."
      },
      ...messages
    ],
    stream: true
  });

  let aiReply = "";

  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content || "";
    if (token) {
      aiReply += token;
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
    }
  }

  // Save to MongoDB
await Chat.findOneAndUpdate(
  { sessionId },
  { 
    sessionId, 
    messages: [...messages, { role: "assistant", content: aiReply }] 
  },
  { upsert: true, returnDocument: 'after' }  // ← new way
);

  res.write("data: [DONE]\n\n");
  res.end();
});

app.listen(3000, () => {
  console.log('Server running on port');
});