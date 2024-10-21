import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { getUserInfo } from '../services/tokenManager';

interface UserInfo {
  id: number;
  username: string;
  first_name: string | null;
  last_name: string;
  avatar: string | null;
  roles_display: string;
  owner: boolean;
  email: string;
  roles_new: Role[];
}

interface Role {
  created_at: string;
  id: number;
  name: string;
  permissions: Permission[];
  updated_at: string;
}

interface Permission {
  access: number;
  created_at: string;
  entity: string;
  entity_id: number | null;
  entity_name: string | null;
  entity_type: string | null;
  id: number;
  updated_at: string;
}


interface UserContextType {
  userInfo: UserInfo | null;
  setUserInfo: React.Dispatch<React.SetStateAction<UserInfo | null>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    const storedUserInfo = getUserInfo();
    if (storedUserInfo) {
      setUserInfo(storedUserInfo);
    }
  }, []);


  return (
    <UserContext.Provider value={{ userInfo, setUserInfo }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
