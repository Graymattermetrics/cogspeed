import { create } from 'zustand';
import Cookies from 'js-cookie';
import { Client, AuthResponse } from 'src/types/client.ts';

interface AuthState {
  client: Client | null;
  getchClient: () => Promise<Client | null>;
  setClient: (client: Client) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  client: null,

  /**
   * Checks for a client session, first in memory, then by verifying cookies with the API.
   * This is ideal for running once when the application initializes.
   * @returns The client object if a valid session exists, otherwise null.
   */
  getchClient: async () => {
    const { client, logout } = get();
    if (client) {
      return client;
    }

    const clientId = Cookies.get('client_id');
    const apiKey = Cookies.get('api_key');
 
    if (!clientId || !apiKey) {
      return null;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/clients/fetch`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Id': clientId,
          'X-Api-Key': apiKey,
        },
      });

      const responseData: AuthResponse = await response.json();

      if (response.ok && responseData.success) {
        const fetchedClient = responseData.client;
        set({ client: fetchedClient });
        return fetchedClient;
      } else {
        console.error('Failed to verify client session:', responseData.error);
        logout();
        return null;
      }
    } catch (error) {
      console.error('Network error while fetching client:', error);
      return null;
    }
  },

  /**
   * Stores a client object in memory and sets authentication cookies.
   * @param client The client object received from a successful login/signup.
   */
  setClient: (client: Client) => {
    set({ client });
    Cookies.set('client_id', client.client_id, { expires: 7, secure: true, sameSite: 'strict' });
    Cookies.set('api_key', client.api_key, { expires: 7, secure: true, sameSite: 'strict' });
  },

  /**
   * Clears the client from memory and removes authentication cookies.
   */
  logout: () => {
    set({ client: null });
    Cookies.remove('client_id');
    Cookies.remove('api_key');
    console.log('Client and credentials cleared.');
  },
}));