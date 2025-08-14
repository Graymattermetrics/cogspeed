import React from "react";
import { SignupForm, SignupFormData } from "src/components/SignupForm.tsx";


export const SignupPage = () => {
  const handleSignup = async (data: SignupFormData) => {
    console.log("Form data to be sent:", data);

    const { _acceptedTermsOfConditions, ...payload } = data;

    try {
      const response = await fetch("https://example.com/clients/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert("Signup successful!");
        console.log("Successfully created client.");
        window.location.href = '/';
      } else {
        const errorData = await response.json();
        console.error("Server responded with an error:", errorData);
        alert(`Signup failed: ${errorData.detail || "Please try again."}`);
      }
    } catch (error) {
      console.error("An error occurred while making the request:", error);
      alert("Signup failed: Could not connect to the server.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <SignupForm onSubmit={handleSignup} />
    </div>
  );
};