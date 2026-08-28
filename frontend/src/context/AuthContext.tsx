import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWeb3, type UserRole } from './Web3Context';

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'Donor' | 'NGO' | 'Admin';
  walletAddress?: string;
  isVerified?: boolean;
  verificationStatus?: 'Pending' | 'Approved' | 'Rejected';
}

interface AuthContextType {
  user: UserData | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: UserData) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setCurrentRole, setActiveNgoId, setDonorProfile, resetState, disconnectWallet } = useWeb3();

  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync session states from localStorage on initialization
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as UserData;
        setToken(storedToken);
        setUser(parsedUser);

        // Sync Web3Context states with authenticated Web2.5 profile
        const mappedRole = parsedUser.role.toLowerCase() as UserRole;
        setCurrentRole(mappedRole);

        if (mappedRole === 'ngo') {
          setActiveNgoId(parsedUser.id);
        } else if (mappedRole === 'donor') {
          setDonorProfile({
            name: parsedUser.name,
            email: parsedUser.email,
            wallet: parsedUser.walletAddress || '',
          });
        }
      } catch (error) {
        console.error('Failed to parse stored user profile:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  // Log in user session
  const login = (jwtToken: string, userData: UserData) => {
    localStorage.setItem('token', jwtToken);
    localStorage.setItem('user', JSON.stringify(userData));

    setToken(jwtToken);
    setUser(userData);

    // Sync Web3Context role and profiles (Wallet remains disconnected until explicitly connected via MetaMask)
    const mappedRole = userData.role.toLowerCase() as UserRole;
    setCurrentRole(mappedRole);

    if (mappedRole === 'ngo') {
      setActiveNgoId(userData.id);
    } else if (mappedRole === 'donor') {
      setDonorProfile({
        name: userData.name,
        email: userData.email,
        wallet: userData.walletAddress || '',
      });
    }
  };

  // Log out user session
  const logout = () => {
    localStorage.clear();
    setToken(null);
    setUser(null);

    disconnectWallet();
    resetState();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
      }}
    >
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
