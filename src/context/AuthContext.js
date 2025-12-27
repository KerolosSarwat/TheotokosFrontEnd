import React, { createContext, useContext, useEffect, useState } from 'react';

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

    // Check for existing auth on mount
    useEffect(() => {
        const checkAuth = () => {
            try {
                const storedUser = localStorage.getItem('user');
                const authToken = localStorage.getItem('authToken');

                if (storedUser && authToken) {
                    setUser(JSON.parse(storedUser));
                    setIsAuthenticated(true);
                }
            } catch (error) {
                console.error('Error checking auth:', error);
                localStorage.removeItem('user');
                localStorage.removeItem('authToken');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (email, password, rememberMe = false) => {
        try {
            // TODO: Replace with actual API call to your backend
            // For now, simulate login with a delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Simulate successful login
            const userData = {
                id: '1',
                email: email,
                name: email.split('@')[0],
            };

            const token = 'mock-jwt-token-' + Date.now();

            // Store in localStorage or sessionStorage based on rememberMe
            const storage = rememberMe ? localStorage : sessionStorage;
            storage.setItem('user', JSON.stringify(userData));
            storage.setItem('authToken', token);

            // Also set in localStorage for consistency (can be modified based on requirements)
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('authToken', token);

            setUser(userData);
            setIsAuthenticated(true);

            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message || 'Login failed' };
        }
    };

    const register = async (name, email, password) => {
        try {
            // TODO: Replace with actual API call to your backend
            // For now, simulate registration with a delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Simulate successful registration
            const userData = {
                id: '1',
                email: email,
                name: name,
            };

            const token = 'mock-jwt-token-' + Date.now();

            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('authToken', token);

            setUser(userData);
            setIsAuthenticated(true);

            return { success: true };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: error.message || 'Registration failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('authToken');

        setUser(null);
        setIsAuthenticated(false);
    };

    const updateProfile = async (name, email) => {
        try {
            // TODO: Replace with actual API call to your backend
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Update user data
            const updatedUser = {
                ...user,
                name: name,
                email: email,
            };

            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);

            return { success: true };
        } catch (error) {
            console.error('Update profile error:', error);
            return { success: false, error: error.message || 'Failed to update profile' };
        }
    };

    const value = {
        user,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        updateProfile,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
