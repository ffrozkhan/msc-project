import axios from 'axios';
import { BASE_URL, API_PATHS } from '../utils/apiPaths';

const getHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

const conversationService = {
  getAll: () => axios.get(`${BASE_URL}${API_PATHS.CONVERSATIONS.GET_ALL}`, getHeaders()),
  create: () => axios.post(`${BASE_URL}${API_PATHS.CONVERSATIONS.CREATE}`, {}, getHeaders()),
  getById: (id) => axios.get(`${BASE_URL}${API_PATHS.CONVERSATIONS.GET_BY_ID(id)}`, getHeaders()),
  sendMessage: (id, message) => axios.post(`${BASE_URL}${API_PATHS.CONVERSATIONS.SEND_MESSAGE(id)}`, { message }, getHeaders()),
  updateTitle: (id, title) => axios.patch(`${BASE_URL}${API_PATHS.CONVERSATIONS.UPDATE_TITLE(id)}`, { title }, getHeaders()),
  delete: (id) => axios.delete(`${BASE_URL}${API_PATHS.CONVERSATIONS.DELETE(id)}`, getHeaders()),
};

export default conversationService;