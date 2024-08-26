import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: string;
  username: string;
  email: string;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  Authlogin: (token: string, freeTrialsRemaining: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  Authlogin: () => {},
  logout: () => {},
  isLoading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token);
        setUser({
          id: decodedToken.userId,
          username: decodedToken.username,
          email: decodedToken.email
        });
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        logout();
      }
    }
    setIsLoading(false);
  }, []);

  const Authlogin = (token: string, freeTrialsRemaining: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('freeTrialsRemaining', freeTrialsRemaining);

    setIsAuthenticated(true);

    try {
      const decodedToken: any = jwtDecode(token);
      setUser({
        id: decodedToken.userId,
        username: decodedToken.username,
        email: decodedToken.email
      });
    } catch (error) {
      console.error('Failed to decode token:', error);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('freeTrialsRemaining');
    setIsAuthenticated(false);
    setUser(null);
  };

  const contextValue = useMemo(() => ({
    isAuthenticated,
    user,
    Authlogin,
    logout,
    isLoading,
  }), [isAuthenticated, user, isLoading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthContext };