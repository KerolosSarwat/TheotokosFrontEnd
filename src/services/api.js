// API configuration
const API_BASE_URL = 'https://theotokosbackend-production.up.railway.app/api';
//const API_BASE_URL = 'http://localhost:5000/api';

// User endpoints
export const USER_API = {
  GET_ALL: `${API_BASE_URL}/users`,
  GET_PENDDING: `${API_BASE_URL}/users/pendding`,
  GET_BY_CODE: (code, type) => `${API_BASE_URL}/users/${code}${type ? `?type=${type}` : ''}`,
  CREATE: `${API_BASE_URL}/users`,
  UPDATE: (code, type) => `${API_BASE_URL}/users/${code}${type ? `?type=${type}` : ''}`,
  BULK_UPDATE: `${API_BASE_URL}/users/bulk-update`,
  DELETE: (code) => `${API_BASE_URL}/users/${code}`,
  DELETE_PENDDING: (code) => `${API_BASE_URL}/users/pendding/${code}`,
  NOTIFICATION: `${API_BASE_URL}/users/send-notification`,
  ATTENDANCE: (level) => `${API_BASE_URL}/users/attendance-report?level=${level}`,
  APPROVE: (code) => `${API_BASE_URL}/users/approve/${code}`,

  // Portal User Management
  PORTAL_SYNC: `${API_BASE_URL}/users/portal/sync`,
  GET_PORTAL_USERS: `${API_BASE_URL}/users/portal/users`,
  UPDATE_PORTAL_USER: (uid) => `${API_BASE_URL}/users/portal/users/${uid}`,
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
