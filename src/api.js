import axios from 'axios';

// Get CSRF token from cookies
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add CSRF token to every request
api.interceptors.request.use(config => {
  config.headers['X-CSRFToken'] = getCookie('csrftoken');
  return config;
});

export const getAccount = () => api.get('/account/');
export const getTrades = () => api.get('/trades/');
export const getPositions = () => api.get('/positions/');
export const getMarketData = () => api.get('/market/');
export const getMarketStatus = () => api.get('/market/status/');
export const getQuote = (symbol) => api.get(`/market/quote/${symbol}/`);
export const executeTrade = (tradeData) => api.post('/trades/execute/', tradeData);

export default api;