import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';

const knowledgeGraphService = {
  get: (documentId) =>
    axiosInstance.get(API_PATHS.KNOWLEDGE_GRAPH.GET(documentId)),
  generate: (documentId) =>
    axiosInstance.post(API_PATHS.KNOWLEDGE_GRAPH.GENERATE(documentId)),
  delete: (documentId) =>
    axiosInstance.delete(API_PATHS.KNOWLEDGE_GRAPH.DELETE(documentId)),
};

export default knowledgeGraphService;