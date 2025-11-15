import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
const AI_API_BASE_URL = process.env.REACT_APP_AI_API_URL || 'http://localhost:9091/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const aiApi = axios.create({
  baseURL: AI_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }).then(res => res.data),
  register: (userData) => api.post('/auth/register', userData).then(res => res.data),
  getCurrentUser: () => api.get('/auth/me').then(res => res.data),
  logout: () => api.post('/auth/logout').then(res => res.data),
};

export const animalsAPI = {
  getAll: () => api.get('/animals').then(res => res.data),
  getById: (id) => api.get(`/animals/${id}`).then(res => res.data),
  create: (animal) => api.post('/animals', animal).then(res => res.data),
  update: (id, animal) => api.put(`/animals/${id}`, animal).then(res => res.data),
  delete: (id) => api.delete(`/animals/${id}`).then(res => res.data),
  getBreedingCandidates: (gender, minScore = 70) => 
    api.get(`/animals/breeding-candidates?gender=${gender}&minScore=${minScore}`).then(res => res.data),
  analyzePhoto: (photoBase64, animalName) => 
    api.post('/animals/analyze-photo', { photoBase64, animalName }).then(res => res.data),
  analyzeAndSave: (id, photoBase64, animalName) => 
    api.post(`/animals/${id}/analyze-and-save`, { photoBase64, animalName }).then(res => res.data),
};

export const breedingAPI = {
  getHistory: (animalId) => api.get(`/breeding/history/${animalId}`).then(res => res.data),
  scheduleBreeding: (animal1Id, animal2Id, breedingDate) => 
    api.post('/breeding/schedule', null, {
      params: { animal1Id, animal2Id, breedingDate }
    }).then(res => res.data),
  getRecommendations: (animalId) => 
    api.get(`/breeding/recommendations/${animalId}`).then(res => res.data),
  getSmartRecommendations: (payload) => 
    api.post('/breeding/smart-recommendations', payload).then(res => res.data),
  getBreedingHistory: () => api.get('/breeding-box/breeding/history').then(res => res.data),
};

export const breedingBoxAPI = {
  analyze: (request) => api.post('/breeding-box/analyze', request).then(res => res.data),
  getAllSessions: () => api.get('/breeding-box/sessions').then(res => res.data),
  getSession: (id) => api.get(`/breeding-box/sessions/${id}`).then(res => res.data),
  deepAnalyze: (request) => api.post('/breeding-box/deep-analyze', request).then(res => res.data),
  predictOffspring: (motherId, fatherId, species) => api.post('/breeding-box/predict-offspring', { motherId, fatherId, species }).then(res => res.data),
  createSession: (analysis) => api.post('/breeding-box/sessions', analysis).then(res => res.data),
  getHybridInfo: (breed1, breed2) => aiApi.post('/breeding/get-hybrid-info', { breed1, breed2 }).then(res => res.data),
};

export const aiBreedingAPI = {
  getSmartRecommendations: (payload) => api.post('/ai/smart-recommendations-proxy', payload).then(res => res.data),
};

export const aiAdvisorAPI = {
  askQuestion: (question) => api.post('/ai-advisor/ask', question).then(res => res.data),
  processVoiceCommand: (voiceInput) => 
    api.post('/ai-advisor/voice-command', voiceInput).then(res => res.data),
  submitQuestionAnswers: (animalId, questionResponse) => 
    api.post(`/ai-advisor/questions/${animalId}`, questionResponse).then(res => res.data),
  generateCarePlan: (breedData) => 
    api.post('/ai-advisor/generate-care-plan', breedData).then(res => res.data),
};

export const scheduleAPI = {
  getUpcoming: () => api.get('/schedule/upcoming').then(res => res.data),
  getWeekly: () => api.get('/schedule/week').then(res => res.data),
  create: (schedule) => api.post('/schedule/create', schedule).then(res => res.data),
  createHatching: (payload) => api.post('/schedule/create-hatching', payload).then(res => res.data),
  markComplete: (id) => api.put(`/schedule/${id}/complete`).then(res => res.data),
  update: (id, data) => api.put(`/schedule/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/schedule/${id}`).then(res => res.data),
};

export const uploadAPI = {
  analyzeImage: (file, animalName = 'Unknown') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('animalName', animalName);
    return api.post('/upload/analyze-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data);
  },
  analyzeAndSave: (animalId, file, animalName = 'Unknown') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('animalName', animalName);
    return api.post(`/upload/analyze-and-save/${animalId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data);
  },
};

export const healthAPI = {
  getStatus: () => api.get('/health/status').then(res => res.data),
  checkDatabase: () => api.get('/health/database').then(res => res.data),
};

export const statsAPI = {
  get: (key) => api.get(`/stats/${encodeURIComponent(key)}`).then(res => res.data),
  increment: (key) => api.post(`/stats/${encodeURIComponent(key)}/increment`).then(res => res.data),
};

export default api;


