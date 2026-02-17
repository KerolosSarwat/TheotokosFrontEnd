import axios from 'axios';
import { USER_API, FIRESTORE_API } from './api';
import { auth } from '../firebase'; // Import auth to get token

// Create Axios Instance
const api = axios.create();

// Add Request Interceptor
api.interceptors.request.use(async (config) => {
  try {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error("Error attaching auth token:", error);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// User service functions
// User service functions
export const userService = {
  // Get all users
  getAllUsers: async () => {
    try {
      const response = await api.get(USER_API.GET_ALL);
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  getPenddingUsers: async () => {
    try {
      const response = await api.get(USER_API.GET_PENDDING);
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Get user by code
  getUserByCode: async (code, type) => {
    try {
      const response = await api.get(USER_API.GET_BY_CODE(code, type));
      return response.data;
    } catch (error) {
      console.error(`Error fetching user with code ${code}:`, error);
      throw error;
    }
  },

  // Create new user
  createUser: async (userData) => {
    try {
      const response = await api.post(USER_API.CREATE, userData);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Update user
  updateUser: async (code, userData, type) => {
    try {
      const response = await api.put(USER_API.UPDATE(code, type), userData);
      return response.data;
    } catch (error) {
      console.error(`Error updating user with code ${code}:`, error);
      throw error;
    }
  },


  // Delete user
  deleteUser: async (code) => {
    try {
      const response = await api.delete(USER_API.DELETE(code));
      return response.data;
    } catch (error) {
      console.error(`Error deleting user with code ${code}:`, error);
      throw error;
    }
  },

  deletePenddingUser: async (code) => {
    try {
      const response = await api.delete(USER_API.DELETE_PENDDING(code));
      return response.data;
    } catch (error) {
      console.error(`Error deleting pending user with code ${code}:`, error);
      throw error;
    }
  },

  sendNotfications: async (title, message) => {
    try {
      const response = await api.post(USER_API.NOTIFICATION, { title, message });
      return response.data;
    } catch (error) {
      console.error(`Error sending the notification`, error);
      throw error;
    }

  },

  bulkUpdateUsers: async (usersData) => {
    try {
      const response = await api.post(USER_API.BULK_UPDATE, usersData);
      return response.data;
    } catch (error) {
      console.error(`Error updating users`, error);
      throw error;
    }
  },

  getUsersAttendance: async (level) => {
    try {
      const response = await api.get(USER_API.ATTENDANCE(level));
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  approveUser: async (code) => {
    try {
      const response = await api.post(USER_API.APPROVE(code));
      return response.data;
    } catch (error) {
      console.error(`Error approving user with code ${code}:`, error);
      throw error;
    }
  },

  // Portal User Services
  syncPortalUser: async (userData) => {
    try {
      const response = await api.post(USER_API.PORTAL_SYNC, userData);
      return response.data;
    } catch (error) {
      console.error('Error syncing portal user:', error);
      // Don't throw here to avoid blocking login if sync fails
      return null;
    }
  },

  getAllPortalUsers: async () => {
    try {
      const response = await api.get(USER_API.GET_PORTAL_USERS);
      return response.data;
    } catch (error) {
      console.error('Error fetching portal users:', error);
      throw error;
    }
  },

  updatePortalUser: async (uid, data) => {
    try {
      const response = await api.put(USER_API.UPDATE_PORTAL_USER(uid), data);
      return response.data;
    } catch (error) {
      console.error(`Error updating portal user ${uid}:`, error);
      throw error;
    }
  },
};



// Firestore service functions
export const firestoreService = {
  // Get all documents from a collection
  getCollection: async (collection) => {
    try {
      const response = await axios.get(FIRESTORE_API.GET_COLLECTION(collection));
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${collection} collection:`, error);
      throw error;
    }
  },

  // Get document by ID from a collection
  getDocument: async (collection, docId) => {
    try {
      const response = await axios.get(FIRESTORE_API.GET_DOCUMENT(collection, docId));
      return response.data;
    } catch (error) {
      console.error(`Error fetching document ${docId} from ${collection}:`, error);
      throw error;
    }
  },

  addDocument: async (collection, docId) => {
    try {
      const response = await axios.post(FIRESTORE_API.ADD_DOCUMENT(collection));
      return response.data;
    } catch (error) {
      console.error(`Error fetching document ${docId} from ${collection}:`, error);
      throw error;
    }
  }


};
