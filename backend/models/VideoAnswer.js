import mongoose from 'mongoose';

const videoAnswerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  question: { type: String, required: true },
  transcript: { type: String, default: '' },
  score: { type: Number, min: 0, max: 100, default: 0 },
  feedback: { type: String, default: '' },
  strengths: [String],
  improvements: [String],
  duration: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('VideoAnswer', videoAnswerSchema);