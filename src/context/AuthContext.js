import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase';
import { userService } from '../services/services';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile as firebaseUpdateProfile,
    sendPasswordResetEmail
} from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Listen for Firebase auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                // User is signed in
                const userData = {
                    id: firebaseUser.uid,
                    email: firebaseUser.email,
                    name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                    photoURL: firebaseUser.photoURL,
                    emailVerified: firebaseUser.emailVerified
                };

                // Set initial auth state
                setUser(userData);
                setIsAuthenticated(true);

                // Sync with backend portalUsers DB and fetch permissions
                try {
                    const syncUser = async () => {
                        try {
                            const portalUser = await userService.syncPortalUser({
                                uid: firebaseUser.uid,
                                email: firebaseUser.email,
                                displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                                photoURL: firebaseUser.photoURL
                            });

                            if (portalUser && portalUser.user) {
                                setUser(prev => ({
                                    ...prev,
                                    ...portalUser.user,
                                    id: firebaseUser.uid
                                }));
                            }
                        } catch (e) {
                            console.error("Error syncing user", e);
                        }
                    };
                    syncUser();
                } catch (e) {
                    console.error("Error syncing user", e);
                }

                // Store token in localStorage if needed for backend requests
                firebaseUser.getIdToken().then(token => {
                    localStorage.setItem('authToken', token);
                });
            } else {
                // User is signed out
                setUser(null);
                setIsAuthenticated(false);
                localStorage.removeItem('authToken');
                localStorage.removeItem('user'); // Clean up old storage if present
            }
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    const login = async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Login error:', error.code, error.message);
            // Return user-friendly error messages
            let errorMessage = 'Login failed. Please check your credentials.';
            if (error.code === 'auth/user-not-found') errorMessage = 'No user found with this email.';
            if (error.code === 'auth/wrong-password') errorMessage = 'Incorrect password.';
            if (error.code === 'auth/invalid-email') errorMessage = 'Invalid email address.';
            if (error.code === 'auth/too-many-requests') errorMessage = 'Too many failed attempts. Please try again later.';

            return { success: false, error: errorMessage };
        }
    };

    const register = async (name, email, password) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // Update the profile with the display name
            await firebaseUpdateProfile(userCredential.user, {
                displayName: name
            });

            // Force update local user state to include the new display name immediately
            setUser(prev => ({ ...prev, name: name }));

            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Registration error:', error.code, error.message);
            let errorMessage = 'Registration failed.';
            if (error.code === 'auth/email-already-in-use') errorMessage = 'Email is already registered.';
            if (error.code === 'auth/weak-password') errorMessage = 'Password should be at least 6 characters.';
            if (error.code === 'auth/invalid-email') errorMessage = 'Invalid email address.';

            return { success: false, error: errorMessage };
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: error.message };
        }
    };

    const resetPassword = async (email) => {
        try {
            await sendPasswordResetEmail(auth, email);
            return { success: true };
        } catch (error) {
            console.error('Password reset error:', error);
            let errorMessage = 'Failed to send reset email.';
            if (error.code === 'auth/user-not-found') errorMessage = 'No account found with this email.';
            if (error.code === 'auth/invalid-email') errorMessage = 'Invalid email address.';
            return { success: false, error: errorMessage };
        }
    };

    const updateProfile = async (name) => {
        try {
            if (auth.currentUser) {
                await firebaseUpdateProfile(auth.currentUser, {
                    displayName: name
                });

                // Update local state
                setUser(prev => ({ ...prev, name: name }));
                return { success: true };
            } else {
                return { success: false, error: 'No user logged in' };
            }
        } catch (error) {
            console.error('Update profile error:', error);
            return { success: false, error: error.message || 'Failed to update profile' };
        }
    };

    // Check if user has specific permission
    const hasPermission = (module, action) => {
        if (!user) return false;
        // Admins have full access
        if (user.admin) return true;

        // Check granular permissions
        if (user.permissions && user.permissions[module] && user.permissions[module][action]) {
            return true;
        }

        return false;
    };

    const value = {
        user,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        resetPassword,
        updateProfile,
        hasPermission,
    };

    return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
