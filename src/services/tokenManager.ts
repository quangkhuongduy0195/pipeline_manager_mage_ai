import { jwtDecode } from 'jwt-decode';

interface TokenData {
  token: string;
  expiresAt: number; // Unix timestamp
}

interface DecodedToken {
  [key: string]: any;
}

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

const TOKEN_KEY = 'authToken';
const USER_INFO_KEY = 'userInfo';

export const saveToken = (token: string, expiresIn: string) => {
  const expiresAt = new Date().getTime() + parseInt(expiresIn) * 1000;
  const tokenData: TokenData = { token, expiresAt };
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokenData));
};

export const saveUserInfo = (userInfo: UserInfo) => {
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
};

export const getUserInfo = (): UserInfo | null => {
  const userInfo = localStorage.getItem(USER_INFO_KEY);
  return userInfo ? JSON.parse(userInfo) : null;
};

export const getToken = (): string | null => {
  const tokenData = localStorage.getItem(TOKEN_KEY);
  if (!tokenData) return null;

  const { token, expiresAt }: TokenData = JSON.parse(tokenData);
  if (new Date().getTime() > expiresAt) {
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }

  return token;
};

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const isTokenValid = (): boolean => {
  const tokenData = localStorage.getItem(TOKEN_KEY);
  if (!tokenData) return false;

  const { expiresAt }: TokenData = JSON.parse(tokenData);
  return new Date().getTime() <= expiresAt;
};

export const decodeToken = (token: string): DecodedToken | null => {
  try {
    return (jwtDecode(token) as DecodedToken)['token'];
  } catch (error) {
    return null;
  }
};

export const clearUserData = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_INFO_KEY);
};
