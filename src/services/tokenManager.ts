import { jwtDecode } from 'jwt-decode';

interface TokenData {
  token: string;
  expiresAt: number; // Unix timestamp
}

interface DecodedToken {
  [key: string]: any;
}

const TOKEN_KEY = 'authToken';

export const saveToken = (token: string, expiresIn: string) => {
  const expiresAt = new Date().getTime() + parseInt(expiresIn) * 1000;
  const tokenData: TokenData = { token, expiresAt };
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokenData));
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
    console.error('Error decoding token:', error);
    return null;
  }
};
