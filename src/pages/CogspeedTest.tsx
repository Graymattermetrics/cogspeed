import React, { useEffect, useState } from "react";
import { startUp } from "src/cogspeed/main.ts";
import { useAuthStore } from "src/stores/auth.store.ts";

export const CogspeedTest = () => {
  const { getchClient, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeTest = async () => {
        const client = await getchClient();

        startUp(client, logout);
        setIsLoading(false);
    };

    initializeTest();

  }, [getchClient]);

  if (isLoading) {
    return <div>Loading Test...</div>;
  }

  return <div id="cogspeed-container" className="App"></div>;
};