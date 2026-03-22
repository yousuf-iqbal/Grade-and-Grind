// src/api/axios.js
// axios instance — attaches firebase token to every request automatically

import axios from 'axios';
import { auth } from '../config/firebase';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// attach fresh firebase token before every request
API.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export default API;