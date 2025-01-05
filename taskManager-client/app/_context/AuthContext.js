'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = () => {
            const token = Cookies.get('token') || localStorage.getItem('token');
            if (token) {
                setIsAuthenticated(true);
                const userData = {
                    name: localStorage.getItem('userName'),
                    email: localStorage.getItem('userEmail'),
                    job: localStorage.getItem('userJob'),
                    location: localStorage.getItem('userLocation')
                };
                setUser(userData);
            } else {
                setIsAuthenticated(false);
                setUser(null);
            }
            setIsLoading(false);
        };

        checkAuth();
        
        // Set up an interval to periodically check token
        const interval = setInterval(checkAuth, 5000);
        
        return () => clearInterval(interval);
    }, []);

    const login = (token, userData) => {
        // Store token
        localStorage.setItem('token', token);
        Cookies.set('token', token, { 
            expires: 7,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax'
        });

        // Store user data
        localStorage.setItem('userName', userData.fullName);
        localStorage.setItem('userEmail', userData.email);
        localStorage.setItem('userJob', userData.job || '');
        localStorage.setItem('userLocation', userData.location || 'Casablanca, Morocco');

        setUser(userData);
        setIsAuthenticated(true);
    };

    const logout = () => {
        // Clear token
        localStorage.removeItem('token');
        Cookies.remove('token');

        // Clear user data
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userJob');
        localStorage.removeItem('userLocation');
        localStorage.removeItem('profileImage');
        localStorage.removeItem('bannerImage');
        localStorage.removeItem('taskCount');

        setUser(null);
        setIsAuthenticated(false);
        router.push('/auth/login');
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            setUser, 
            isAuthenticated, 
            isLoading,
            login,
            logout 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
