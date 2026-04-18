import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  sessionId: String,
  messages: [{ role: String, content: String }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Chat", chatSchema);