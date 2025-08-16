import { create } from 'zustand';
import Cookies from 'js-cookie';
import { Client } from 'src/types/client.tsx';


interface AuthState {
  client: Client | null;
  setClient: (client: Client) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  client: null,

  setClient: (client: Client) => {
    set({ client });

    Cookies.set('client_id', client.client_id, { expires: 7, secure: true, sameSite: 'strict' });
    Cookies.set('api_key', client.api_key, { expires: 7, secure: true, sameSite: 'strict' });
  },

  logout: () => {
    set({ client: null });

    Cookies.remove('client_id');
    Cookies.remove('api_key');

    console.log('Client and credentials cleared.');
  },
}));