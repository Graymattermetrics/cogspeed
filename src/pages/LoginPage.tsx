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
import { LoginForm, LoginFormData } from "../components/LoginForm.tsx";
import { useAuthGuard } from "src/hooks/useAuthGuard.ts";


export const LoginPage = () => {
  const { setClient, } = useAuthStore();

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

  const isLoading = useAuthGuard();
  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-100 dark:bg-gray-900">
        <p>Verifying session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md h-fit">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Enter your credentials to access your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm onSubmit={handleLogin} />
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <a href="/signup" className="underline text-primary">
              Create Account
            </a>
          </p>
          <p className="text-center text-sm text-muted-foreground">
            <a href="/" className="underline text-primary">
              Back to Cogspeed Homepage
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};