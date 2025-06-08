
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { permissionMappings } from '../utils/permissionMappings';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    user: null,
    isAuthenticated: false,
    loading: true,
    permissions: []
  });
  const navigate = useNavigate();

  const hasPermission = (permissionKey) => {
    if (!authState.user) return false;
    if (authState.user.role === 'Admin') return true;

    const dbPermission = Object.keys(permissionMappings).find(
      key => permissionMappings[key] === permissionKey
    );

    return authState.permissions.includes(dbPermission || permissionKey);
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
    
        if (token && user) {
          const response = await axios.get('http://localhost:5000/api/user', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
    
  
         setAuthState({
           user: { ...response.data.user },   // <- only latest
           permissions: response.data.permissions || [],
           isAuthenticated: true,
           loading: false
         });
        } else {
          setAuthState(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setAuthState({
          user: null,
          permissions: [],
          isAuthenticated: false,
          loading: false
        });
      }
    };
    

    loadUser();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post('http://localhost:5000/api/login', {
        username,
        password
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      setAuthState({
        user: response.data.user,
        permissions: response.data.user.permissions || [],
        isAuthenticated: true,
        loading: false
      });

      // Use navigate instead of window.location
      navigate('/dashboard', { replace: true });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    setAuthState({
      user: null,
      permissions: [],
      isAuthenticated: false,
      loading: false
    });

    navigate('/', { replace: true });

    if (window.caches) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
  }, [navigate]);

  return (
    <AuthContext.Provider value={{
      ...authState,
      login,
      logout,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

