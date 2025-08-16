import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { CountryDropdown } from "@/components/ui/country-dropdown.tsx";

export interface SignupFormData {
  full_name: string;
  email: string;
  password: string;
  date_of_birth: string;
  gender: string;
  country: string;

  education?: string;
  occupation?: string;
  handedness?: string;

  acceptedTermsOfConditions: boolean;
}

interface SignupFormProps {
  onSubmit: (data: SignupFormData) => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({ onSubmit }) => {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    defaultValues: {
      acceptedTermsOfConditions: false
    }
  });
  const [showExtraInfo, setShowExtraInfo] = useState(false);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>Full Name</Label>
        <Input {...register("full_name", { required: "Full name is required" })} />
        {errors.full_name && (
          <p className="text-red-500 text-sm mt-1">{errors.full_name.message}</p>
        )}
      </div>

      <div>
        <Label>Email</Label>
        <Input
          type="email"
          {...register("email", { required: "Email is required" })}
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
        )}
      </div>

      <div>
        <Label>Password</Label>
        <Input
          type="password"
          {...register("password", { required: "Password is required" })}
          autoComplete="new-password"
        />
        {errors.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
        )}
      </div>

      <div>
        <Label>Date of Birth</Label>
        <Input
          type="date"
          {...register("date_of_birth", {
            required: "Date of birth is required",
          })}
        />
        {errors.date_of_birth && (
          <p className="text-red-500 text-sm mt-1">
            {errors.date_of_birth.message}
          </p>
        )}
      </div>

      <div>
        <Label>Gender</Label>
        <select
          {...register("gender", { required: "Gender is required" })}
          className="w-full border rounded px-2 py-1.5"
        >
          <option value="">Select...</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        {errors.gender && (
          <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>
        )}
      </div>

      <div>
        <Label>Country</Label>
        <Controller
          name="country"
          control={control}
          rules={{ required: "Country is required" }}
          render={({ field }) => (
            <CountryDropdown
              defaultValue={field.value}
              onChange={(val) => field.onChange(val.alpha3)}
            />
          )}
        />
        {errors.country && (
          <p className="text-red-500 text-sm mt-1">{errors.country.message}</p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="extra-information"
          checked={showExtraInfo}
          onCheckedChange={(checked) => setShowExtraInfo(checked === true)}
        />
        <Label
          htmlFor="extra-information"
          className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Would you like to add more information to help with Data Research?
        </Label>
      </div>

      {showExtraInfo && (
        <div className="space-y-4 rounded-md border bg-muted p-4 animate-in fade-in-0">
          <h4 className="text-sm font-semibold">
            Optional Research Information
          </h4>

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="education">Education Level</Label>
            <Input
              type="text"
              id="education"
              placeholder="e.g., High School, Bachelor's, PhD"
              {...register("education")}
            />
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="occupation">Occupation</Label>
            <Input
              type="text"
              id="occupation"
              placeholder="e.g., Student, Engineer, Artist"
              {...register("occupation")}
            />
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="handedness">Handedness</Label>
            <select
              {...register("handedness")}
              className="w-full border rounded px-2 py-1.5"
            >
              <option value="">Select...</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>
        </div>
      )}

      <div className="flex items-start space-x-2">
        <Controller
          name="acceptedTermsOfConditions"
          control={control}
          rules={{ required: "You must accept the terms and conditions" }}
          render={({ field }) => (
            <Checkbox
              id="terms-2"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <div className="grid gap-1.5 leading-none">
          <Label
            htmlFor="terms-2"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Accept terms and conditions
          </Label>
          <p className="text-sm text-muted-foreground">
            You agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
      {errors.acceptedTermsOfConditions && (
        <p className="text-red-500 text-sm mt-1">
          {errors.acceptedTermsOfConditions.message}
        </p>
      )}

      <Button type="submit" className="w-full">
        Sign Up
      </Button>
    </form>
  );
};