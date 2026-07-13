import { z } from 'zod';

export const RegisterDtoSchema = z.object({
  email: z.string().email(),
  mobileNumber: z.string().regex(/^\+91[6-9]\d{9}$/, {
    message: 'Must be a valid Indian mobile number (+91XXXXXXXXXX).',
  }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long.' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter.' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter.' })
    .regex(/\d/, { message: 'Password must contain at least one number.' })
    .regex(/[!@#$%^&*(),.?":{}|<>]/, {
      message: 'Password must contain at least one special character.',
    }),
});
export type RegisterDTO = z.infer<typeof RegisterDtoSchema>;

export const LoginDtoSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  deviceId: z.string(),
  deviceName: z.string().optional(),
  ipAddress: z.string().optional(),
});
export type LoginDTO = z.infer<typeof LoginDtoSchema>;

export const RequestOtpDtoSchema = z.object({
  userId: z.string().uuid(),
  purpose: z.string(),
});
export type RequestOtpDTO = z.infer<typeof RequestOtpDtoSchema>;

export const VerifyOtpDtoSchema = z.object({
  userId: z.string().uuid(),
  code: z.string().length(6, { message: 'OTP must be exactly 6 digits.' }),
  purpose: z.string(),
});
export type VerifyOtpDTO = z.infer<typeof VerifyOtpDtoSchema>;
