import React from "react";
import { SignupForm } from "../abc/SignupForm";

export const SignupPage = () => {
  const handleSignup = (data: any) => {
    console.log("Signup data:", data);
    // fetch("/api/signup", ...)
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <SignupForm onSubmit={handleSignup} />
    </div>
  );
};