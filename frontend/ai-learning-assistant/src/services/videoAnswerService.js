import axios from 'axios';
import { BASE_URL, API_PATHS } from '../utils/apiPaths';

const getHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

const videoAnswerService = {
  generateQuestion: (documentId) =>
    axios.post(`${BASE_URL}/api/video-answers/generate-question/${documentId}`, {}, getHeaders()),
  submitAnswer: (documentId, data) =>
    axios.post(`${BASE_URL}/api/video-answers/submit/${documentId}`, data, getHeaders()),
  getAnswers: (documentId) =>
    axios.get(`${BASE_URL}/api/video-answers/${documentId}`, getHeaders()),
  deleteAnswer: (id) =>
    axios.delete(`${BASE_URL}/api/video-answers/${id}`, getHeaders()),
};

export default videoAnswerService;