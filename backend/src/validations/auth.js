import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email({ message: 'Invalid email address' })
      .trim(),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, { message: 'Password must be at least 8 characters long' })
      .max(100, { message: 'Password must not exceed 100 characters' }),
    fullName: z
      .string({ required_error: 'Full name is required' })
      .min(1, { message: 'Full name cannot be empty' })
      .trim(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email({ message: 'Invalid email address' })
      .trim(),
    password: z
      .string({ required_error: 'Password is required' })
      .min(1, { message: 'Password cannot be empty' }),
  }),
});
