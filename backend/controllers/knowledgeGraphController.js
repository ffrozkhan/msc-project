import KnowledgeGraph from '../models/KnowledgeGraph.js';
import Document from '../models/Document.js';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// POST /api/knowledge-graph/generate/:documentId
export const generateGraph = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.documentId,
      userId: req.user._id
    });
    if (!document) return res.status(404).json({ success: false, message: 'Document not found' });

    const prompt = `You are an expert knowledge graph builder. Analyse this academic document and extract the key concepts and their relationships.

Document title: "${document.title}"
Document content: "${document.extractedText?.substring(0, 6000) || ''}"

Return ONLY a valid JSON object in exactly this format with no markdown, no explanation, no extra text:
{
  "nodes": [
    { "id": "node1", "label": "Concept Name", "type": "core", "description": "One sentence description" },
    { "id": "node2", "label": "Another Concept", "type": "sub", "description": "One sentence description" }
  ],
  "edges": [
    { "source": "node1", "target": "node2", "relationship": "includes" }
  ]
}

Node types must be one of: core, sub, related, pitfall, example
Relationship examples: includes, depends on, leads to, causes, uses, example of, related to, requires
Generate 8 to 15 nodes and 10 to 20 edges. Make sure every edge references valid node ids.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
    });

    let graphData;
    try {
      const clean = response.text.replace(/```json|```/g, '').trim();
      graphData = JSON.parse(clean);
    } catch {
      return res.status(500).json({ success: false, message: 'Failed to parse graph data from AI' });
    }

    // Upsert — replace existing graph for this document
    const graph = await KnowledgeGraph.findOneAndUpdate(
      { documentId: req.params.documentId, userId: req.user._id },
      {
        userId:     req.user._id,
        documentId: req.params.documentId,
        nodes:      graphData.nodes,
        edges:      graphData.edges,
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, data: graph });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/knowledge-graph/:documentId
export const getGraph = async (req, res) => {
  try {
    const graph = await KnowledgeGraph.findOne({
      documentId: req.params.documentId,
      userId:     req.user._id
    });
    if (!graph) return res.status(404).json({ success: false, message: 'No graph found' });
    res.json({ success: true, data: graph });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/knowledge-graph/:documentId
export const deleteGraph = async (req, res) => {
  try {
    await KnowledgeGraph.findOneAndDelete({
      documentId: req.params.documentId,
      userId:     req.user._id
    });
    res.json({ success: true, message: 'Graph deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};