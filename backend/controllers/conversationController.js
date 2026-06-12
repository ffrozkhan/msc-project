import { GoogleGenAI } from '@google/genai';
import Conversation from '../models/Conversation.js';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// GET /api/conversations
export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ user: req.user._id })
      .select('title updatedAt createdAt')
      .sort({ updatedAt: -1 });
    res.json({ success: true, data: conversations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/conversations
export const createConversation = async (req, res) => {
  try {
    const conversation = await Conversation.create({
      user: req.user._id,
      title: 'New Conversation',
      messages: []
    });
    res.status(201).json({ success: true, data: conversation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/conversations/:id
export const getConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    if (!conversation) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: conversation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/conversations/:id/message
export const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    if (!conversation) return res.status(404).json({ success: false, message: 'Not found' });

    // Add user message
    conversation.messages.push({ role: 'user', content: message });

    // Build history for Gemini
    const history = conversation.messages.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // Call Gemini
    // const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    // const chat = model.startChat({ history });
    // const result = await chat.sendMessage(message);
    // const reply = result.response.text();

    const historyText = conversation.messages
        .slice(0, -1)
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n');

    const prompt = historyText ? `${historyText}\nUser: ${message}` : message;

    const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: prompt,
        });
    const reply = response.text;


    // Add assistant reply
    conversation.messages.push({ role: 'assistant', content: reply });

    // Auto-title after first exchange
    if (conversation.messages.length === 2) {
      conversation.title = message.slice(0, 50) + (message.length > 50 ? '...' : '');
    }

    await conversation.save();

    res.json({ success: true, data: { reply, conversation } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/conversations/:id/title
export const updateTitle = async (req, res) => {
  try {
    const conversation = await Conversation.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { title: req.body.title },
      { new: true }
    );
    if (!conversation) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: conversation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/conversations/:id
export const deleteConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });
    if (!conversation) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};