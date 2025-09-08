import axios from 'axios';
import { USER_API, FIRESTORE_API } from './api';

// User service functions
export const userService = {
  // Get all users
  getAllUsers: async () => {
    try {
      const response = await axios.get(USER_API.GET_ALL);
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  getPenddingUsers: async () => {
    try {
      const response = await axios.get(USER_API.GET_PENDDING);
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Get user by code
  getUserByCode: async (code) => {
    try {
      const response = await axios.get(USER_API.GET_BY_CODE(code));
      return response.data;
    } catch (error) {
      console.error(`Error fetching user with code ${code}:`, error);
      throw error;
    }
  },

  // Create new user
  createUser: async (userData) => {
    try {
      const response = await axios.post(USER_API.CREATE, userData);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Update user
  updateUser: async (code, userData) => {
    try {
      const response = await axios.put(USER_API.UPDATE(code), userData);
      return response.data;
    } catch (error) {
      console.error(`Error updating user with code ${code}:`, error);
      throw error;
    }
  },


  // Delete user
  deleteUser: async (code) => {
    try {
      const response = await axios.delete(USER_API.DELETE(code));
      return response.data;
    } catch (error) {
      console.error(`Error deleting user with code ${code}:`, error);
      throw error;
    }
  },

  sendNotfications: async (title, message) => {
    try {
      const response = await axios.post(USER_API.NOTIFICATION, { title, message });
      return response.data;
    } catch (error) {
      console.error(`Error sending the notification`, error);
      throw error;
    }

  },

  bulkUpdateUsers: async (usersData) => {
    try {
      const response = await axios.post(USER_API.BULK_UPDATE, usersData);
      return response.data;
    } catch (error) {
      console.error(`Error updating users`, error);
      throw error;
    }
  }
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
