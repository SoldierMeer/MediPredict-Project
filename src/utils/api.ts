import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000', // Changed from localhost to 127.0.0.1
});

export default api;