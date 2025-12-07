import { z } from 'zod';

/**
 * Common field schemas for reuse
 */
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const simplePasswordSchema = z
  .string()
  .min(1, 'Password is required');

export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

/**
 * Login form schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: simplePasswordSchema,
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Registration form schema
 */
export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Forgot password form schema
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/**
 * Reset password form schema
 */
export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

/**
 * Profile update schema
 */
export const profileUpdateSchema = z.object({
  name: nameSchema.optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  location: z.string().max(100, 'Location must be less than 100 characters').optional(),
  website: z.string().url('Please enter a valid URL').or(z.literal('')).optional(),
  phone: z.string().regex(/^(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/, 'Please enter a valid phone number').or(z.literal('')).optional(),
});

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;

/**
 * Contact form schema
 */
export const contactFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject must be less than 200 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message must be less than 2000 characters'),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

/**
 * Helper function to validate form data against a schema
 */
export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string> = {};
  // Zod v4 uses result.error.issues instead of result.error.errors
  const issues = (result.error as any).issues || (result.error as any).errors || [];
  issues.forEach((issue: { path: (string | number)[]; message: string }) => {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  });
  
  return { success: false, errors };
}

/**
 * Helper to get field error from validation result
 */
export function getFieldError(
  errors: Record<string, string> | undefined,
  field: string
): string | undefined {
  return errors?.[field];
}
