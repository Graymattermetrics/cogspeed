import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { useAuthStore } from "src/stores/auth.store.ts";
import { AuthResponse } from "src/types/client.ts";
import { LoginForm, LoginFormData } from "../components/LoginForm.tsx";


export const LoginPage = () => {
  const { setClient } = useAuthStore();

  const handleLogin = async (data: LoginFormData) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/clients/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const responseData: AuthResponse = await response.json();
      
      if (response.ok && responseData.success) {
        setClient(responseData.client);

        console.log("Successfully logged in:", responseData.client);

        // Redirect to the homepage
        window.location.href = "/";
      } else {
        console.error("Server responded with an error:", responseData);
        alert(`Login failed: ${responseData.error || "Invalid email or password."}`);
      }
    } catch (error) {
      console.error("An error occurred while making the request:", error);
      alert("Login failed: Could not connect to the server.");
    }
  }

  return (
    // Use the same responsive, scrollable layout as the signup page
    <div className="min-h-screen flex justify-center bg-gray-100 dark:bg-gray-900 p-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Enter your credentials to access your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm onSubmit={handleLogin} />
        </CardContent>
      </Card>
    </div>
  );
};