// API configuration
const API_BASE_URL = 'https://theotokosbackend-production.up.railway.app/api';

// User endpoints
export const USER_API = {
  GET_ALL: `${API_BASE_URL}/users`,
  GET_PENDDING: `${API_BASE_URL}/users/pendding`,
  GET_BY_CODE: (code) => `${API_BASE_URL}/users/${code}`,
  CREATE: `${API_BASE_URL}/users`,
  UPDATE: (code) => `${API_BASE_URL}/users/${code}`,
  BULK_UPDATE: `${API_BASE_URL}/users/bulk-update`,
  DELETE: (code) => `${API_BASE_URL}/users/${code}`,
  NOTIFICATION: `${API_BASE_URL}/users/send-notification`
};

// Firestore endpoints
export const FIRESTORE_API = {
  GET_COLLECTION: (collection) => `${API_BASE_URL}/firestore/${collection}`,
  GET_DOCUMENT: (collection, docId) => `${API_BASE_URL}/firestore/${collection}/${docId}`,
  ADD_DOCUMENT: (collection) => `${API_BASE_URL}/firestore/${collection}`
};

// Collections
export const COLLECTIONS = {
  AGBYA: 'agbya',
  TAKS: 'taks',
  COPTIC: 'coptic',
  HYMNS: 'hymns'
};
