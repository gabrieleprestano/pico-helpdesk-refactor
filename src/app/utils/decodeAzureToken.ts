import { AzureJwtPayload } from '../models/types/token.types';

export function decodeAzureToken(token: string): AzureJwtPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );

    return JSON.parse(jsonPayload) as AzureJwtPayload;
  } catch (error) {
    console.error('Errore nella decodifica del token', error);
    return null;
  }
}
