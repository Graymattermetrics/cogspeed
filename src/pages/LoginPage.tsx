import React from "react";
import { LoginForm } from "../abc/LoginForm.tsx";

export const LoginPage = () => {
  const handleLogin = (data: any) => {
    console.log("Login data:", data);
    // fetch("/api/login", ...)
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoginForm onSubmit={handleLogin} />
    </div>
  );
};