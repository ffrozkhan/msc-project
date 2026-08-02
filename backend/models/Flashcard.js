import mongoose from "mongoose";

const flashcardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },
    cards: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
        difficulty: {
          type: String,
          enum: ["easy", "medium", "hard"],
          default: "medium",
        },
        lastReviewed: {
          type: Date,
          default: null,
        },
        reviewCount: {
          type: Number,
          default: 0,
        },
        isStarred: {
          type: Boolean,
          default: false,
        },
        easeFactor:  { 
          type: Number, 
          default: 2.5 
        },
        interval:    { 
          type: Number, 
          default: 1 
        },
        repetitions: { 
          type: Number, 
          default: 0 
        },
        nextReview:  { 
          type: Date,   
          default: Date.now 
        },
        lastReviewed:{ 
          type: Date,   
          default: null 
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

flashcardSchema.index({ userId: 1, documentId: 1 });

const Flashcard = mongoose.model("Flashcard", flashcardSchema);

export default Flashcard;
