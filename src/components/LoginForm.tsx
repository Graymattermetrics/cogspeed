import React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";


interface LoginFormData {
  email: string;
  password: string;
}

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSubmit }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();

  return (
   <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Login to Cogspeed</CardTitle>
        <Button variant="link">Sign Up</Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full max-w-md mx-auto">
          <div> 
            <Label>Email</Label>
            <Input type="email" {...register("email", { required: "Email required" })} />
            {errors.email && <p className="text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <Label>Password</Label>
            <Input type="password" {...register("password", { required: "Password required" })} />
            {errors.password && <p className="text-red-500">{errors.password.message}</p>}
          </div>

          <Button type="submit" className="w-full">Login</Button>
        </form>
      </CardContent>
      <CardFooter>
        <p>Card Footer</p>
      </CardFooter>
    </Card>
  );
};