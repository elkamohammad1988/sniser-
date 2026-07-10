import { z } from "zod";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address")
  .max(254);

const strongPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128)
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[0-9]/, "Password must include a number");

export const signupBodySchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  email,
  password: strongPassword,
});

export const loginBodySchema = z.object({
  email,
  password: z.string().min(1, "Password is required").max(128),
});

export const verifyEmailBodySchema = z.object({
  token: z.string().min(10).max(200),
});

export const forgotPasswordBodySchema = z.object({ email });

export const resetPasswordBodySchema = z.object({
  token: z.string().min(10).max(200),
  password: strongPassword,
});

export const changePasswordBodySchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: strongPassword,
});

export type SignupBody = z.infer<typeof signupBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
export type ResetPasswordBody = z.infer<typeof resetPasswordBodySchema>;
export type ChangePasswordBody = z.infer<typeof changePasswordBodySchema>;
