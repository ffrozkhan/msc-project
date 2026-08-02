import VideoAnswer from '../models/VideoAnswer.js';
import Document from '../models/Document.js';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// POST /api/video-answers/generate-question/:documentId
export const generateQuestion = async (req, res) => {
    try {
        const document = await Document.findOne({
            _id: req.params.documentId,
            userId: req.user._id
        });
        if (!document) return res.status(404).json({ success: false, message: 'Document not found' });

        const prompt = `Based on this document titled "${document.title}", generate ONE clear, specific question that tests understanding of a key concept. Return only the question, nothing else.\n\nDocument content: ${document.extractedText?.substring(0, 5000) || document.title}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        res.json({ success: true, data: { question: response.text.trim() } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/video-answers/submit/:documentId
export const submitAnswer = async (req, res) => {
    try {
        const { question, transcript, duration } = req.body;

        if (!transcript || transcript.trim().length < 10) {
            return res.status(400).json({ success: false, message: 'Transcript too short' });
        }

        const document = await Document.findOne({
            _id: req.params.documentId,
            userId: req.user._id
        });
        if (!document) return res.status(404).json({ success: false, message: 'Document not found' });

        const prompt = `You are an expert academic assessor. Evaluate this spoken answer.

Question: "${question}"

Student's Answer (transcribed): "${transcript}"

Document Context: "${document.extractedText?.substring(0, 3000) || document.title}"

Evaluate the answer and respond ONLY with valid JSON in this exact format:
{
  "score": <number 0-100>,
  "feedback": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"]
}`;

        const response = await ai.models.generateContent({
           model: 'gemini-2.5-flash',
            contents: prompt,
        });

        let evaluation;
        try {
            const clean = response.text.replace(/```json|```/g, '').trim();
            evaluation = JSON.parse(clean);
        } catch {
            evaluation = { score: 50, feedback: response.text, strengths: [], improvements: [] };
        }

        const videoAnswer = await VideoAnswer.create({
            user: req.user._id,
            document: req.params.documentId,
            question,
            transcript,
            score: evaluation.score,
            feedback: evaluation.feedback,
            strengths: evaluation.strengths || [],
            improvements: evaluation.improvements || [],
            duration: duration || 0,
        });

        res.status(201).json({ success: true, data: { ...videoAnswer.toObject(), ...evaluation } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/video-answers/:documentId
export const getAnswers = async (req, res) => {
    try {
        const answers = await VideoAnswer.find({
            document: req.params.documentId,
            user: req.user._id
        }).sort({ createdAt: -1 });
        res.json({ success: true, data: answers });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /api/video-answers/:id
export const deleteAnswer = async (req, res) => {
    try {
        await VideoAnswer.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        res.json({ success: true, message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};