// src/hooks/useAuthSocket.js
import { useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook to connect auth state with socket authentication
 * For client/customer users
 */
export const useClientSocketAuth = () => {
  const { isAuthenticated, user } = useAuth();
  const { authenticateSocket, connected } = useSocket();

  useEffect(() => {
    // Only authenticate when both conditions are true:
    // 1. User is authenticated
    // 2. Socket is connected
    if (isAuthenticated && user && user._id && connected) {
      authenticateSocket(user._id, false);
    }
  }, [isAuthenticated, user, connected, authenticateSocket]);

  return null;
};

// src/hooks/useAdminSocketAuth.js
import { useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAdminAuth } from '../contexts/AdminAuthContext';

/**
 * Hook to connect admin auth state with socket authentication
 * For admin users
 */
export const useAdminSocketAuth = () => {
  const { isAuthenticated, user } = useAdminAuth();
  const { authenticateSocket, connected } = useSocket();

  useEffect(() => {
    // Only authenticate when socket is connected and user is authenticated
    if (isAuthenticated && user && user._id && connected) {
      authenticateSocket(user._id, true);
    }
  }, [isAuthenticated, user, connected, authenticateSocket]);

  return null;
};