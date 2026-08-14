import mongoose from 'mongoose';

const nodeSchema = new mongoose.Schema({
  id:          { type: String, required: true },
  label:       { type: String, required: true },
  type:        { type: String, enum: ['core', 'sub', 'related', 'pitfall', 'example'], default: 'sub' },
  description: { type: String, default: '' },
});

const edgeSchema = new mongoose.Schema({
  source:       { type: String, required: true },
  target:       { type: String, required: true },
  relationship: { type: String, required: true },
});

const knowledgeGraphSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true, unique: true },
  nodes:      [nodeSchema],
  edges:      [edgeSchema],
}, { timestamps: true });

export default mongoose.model('KnowledgeGraph', knowledgeGraphSchema);