// src/api/axios.js
import axios from 'axios';
import { auth } from '../config/firebase';

const API = axios.create({
  baseURL: 'http://localhost:4000/api',
});

API.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
