import axios from 'axios';

const http = axios.create({
  baseURL: 'http://localhost:5000'
});

// 请求拦截器：自动加上 token
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default http;

