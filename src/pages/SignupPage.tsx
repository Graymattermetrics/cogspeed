import React from "react";
import { SignupForm, SignupFormData } from "src/components/SignupForm.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { useAuthStore } from "src/stores/auth.store.ts";
import { AuthResponse } from "src/types/client.ts";
import { useAuthGuard } from "src/hooks/useAuthGuard.ts";


export const SignupPage = () => {
  const { setClient } = useAuthStore();

  const handleSignup = async (data: SignupFormData) => {
    console.log("Form data to be sent:", data);

    const { acceptedTermsOfConditions, ...payload } = data;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/clients/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseData: AuthResponse = await response.json();

      if (response.ok && responseData.success) {
        setClient(responseData.client);

        alert("Signup successful!");
        console.log("Successfully created client:", responseData.client);

        window.location.href = "/";

      } else {
        console.error("Server responded with an error:", responseData);
        alert(`Signup failed: ${responseData.error || "Please try again."}`);
      }
    } catch (error) {
      console.error("An error occurred while making the request:", error);
      alert("Signup failed: Could not connect to the server.");
    }
  };

  const isLoading = useAuthGuard();
  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-100 dark:bg-gray-900">
        <p>Verifying session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign Up</CardTitle>
          <CardDescription>
            Create an account to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm onSubmit={handleSignup} />
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-center text-sm text-muted-foreground">
            Already have an account? {" "}
            <a href="/login" className="underline text-primary">
              Log in
            </a>
          </p>
          <p className="text-center text-sm text-muted-foreground">
            <a href="/" className="underline text-primary">
              Back to Cogspeed Homepage
            </a>
          </p>
          <div className="mt-4 text-xs text-muted-foreground space-y-1 text-center">
            <p>Parental consent is required for users under the age of 13.</p>
            <p>All personal data is stored securely and will never be sold or commercially distributed.</p>
            <p>This software is distributed under the GNU General Public License (GPL).</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};