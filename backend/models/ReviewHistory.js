import mongoose from 'mongoose';

const reviewHistorySchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',      required: true },
  cardId:     { type: mongoose.Schema.Types.ObjectId,                   required: true },
  setId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Flashcard', required: true },
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document',  required: true },
  quality:    { type: Number, required: true, min: 0, max: 5 },
  easeFactor: { type: Number, required: true },
  interval:   { type: Number, required: true },
  reviewedAt: { type: Date,   default: Date.now },
});

reviewHistorySchema.index({ userId: 1, reviewedAt: -1 });
reviewHistorySchema.index({ cardId: 1, reviewedAt: -1 });
reviewHistorySchema.index({ setId: 1, reviewedAt: -1 });

export default mongoose.model('ReviewHistory', reviewHistorySchema);