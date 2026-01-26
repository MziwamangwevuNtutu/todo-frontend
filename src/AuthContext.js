import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext({});
export const useAuth = () => useContext(AuthContext);

// const API_BASE_URL = 'http://localhost:8080/todolist/api/auth';
const API_BASE_URL = 'http://localhost:8080/todolist/api/auth';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const username = localStorage.getItem('username');
            if (username) setUser({ username });
        }
        setLoading(false);
    }, [token]);

    const login = async (username, password) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/login`, { username, password });
            const { token: receivedToken, username: receivedUser } = response.data;
            
            localStorage.setItem('token', receivedToken);
            localStorage.setItem('username', receivedUser);
            setToken(receivedToken);
            setUser({ username: receivedUser });
            axios.defaults.headers.common['Authorization'] = `Bearer ${receivedToken}`;
            
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data || 'Login failed' };
        }
    };

    const register = async (username, email, password) => {
        try {
            await axios.post(`${API_BASE_URL}/register`, { username, email, password });
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data || 'Registration failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, isAuthenticated: !!user }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};