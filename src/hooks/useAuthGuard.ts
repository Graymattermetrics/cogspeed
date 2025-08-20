import { useState, useEffect } from 'react';
import { useAuthStore } from 'src/stores/auth.store.ts';

/**
 * A custom hook to guard routes that should only be accessible by unauthenticated users.
 * It checks for an active session and redirects to a specified path if a user is found.
 *
 * @param redirectPath The path to redirect to if the user is already logged in (defaults to '/').
 * @returns {boolean} A boolean `isLoading` state. The component should render a loading UI
 *                    while this is true to prevent content flashing before redirection.
 */
export const useAuthGuard = (redirectPath: string = '/') => {
  const [isLoading, setIsLoading] = useState(true);
  const { getchClient } = useAuthStore();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const client = await getchClient();
        if (client) {
          // If a client is found, the user is already logged in. Redirect them.
          console.log(`Active session found. Redirecting to ${redirectPath}...`);
          window.location.href = redirectPath;
        } else {
          // No client found, so it's safe to show the page (e.g., Login/Signup).
          setIsLoading(false);
        }
      } catch (error) {
        // If there's an error, assume not logged in and allow page to load.
        console.error("Auth guard check failed:", error);
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, [getchClient, redirectPath]); // Dependencies for the effect

  return isLoading;
};