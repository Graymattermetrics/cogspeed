import React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SignupFormData {
  full_name: string;
  email: string;
  password: string;
  date_of_birth: string;
  gender: string;
  phone_number?: string;
  country?: string;
}

interface SignupFormProps {
  onSubmit: (data: SignupFormData) => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({ onSubmit }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormData>();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full max-w-md mx-auto">
      <div>
        <Label>Full Name</Label>
        <Input {...register("full_name", { required: "Full name required" })} />
        {errors.full_name && <p className="text-red-500">{errors.full_name.message}</p>}
      </div>

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

      <div>
        <Label>Date of Birth</Label>
        <Input type="date" {...register("date_of_birth", { required: "DOB required" })} />
        {errors.date_of_birth && <p className="text-red-500">{errors.date_of_birth.message}</p>}
      </div>

      <div>
        <Label>Gender</Label>
        <select {...register("gender", { required: "Gender required" })} className="w-full border rounded px-2 py-1">
          <option value="">Select...</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        {errors.gender && <p className="text-red-500">{errors.gender.message}</p>}
      </div>

      <div>
        <Label>Phone Number (optional)</Label>
        <Input {...register("phone_number")} />
      </div>

      <div>
        <Label>Country (optional)</Label>
        <Input {...register("country")} />
      </div>

      <Button type="submit" className="w-full">Sign Up</Button>
    </form>
  );
};