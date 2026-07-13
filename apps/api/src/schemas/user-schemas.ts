import { z } from 'zod';

export const UpdateProfileDtoSchema = z.object({
  email: z.string().email().optional(),
  mobileNumber: z
    .string()
    .regex(/^\+91[6-9]\d{9}$/)
    .optional(),
});
export type UpdateProfileDTO = z.infer<typeof UpdateProfileDtoSchema>;

export const UpdatePreferencesDtoSchema = z.object({
  theme: z.enum(['light', 'dark']).optional(),
  notificationsEnabled: z.boolean().optional(),
  biometricsEnabled: z.boolean().optional(),
});
export type UpdatePreferencesDTO = z.infer<typeof UpdatePreferencesDtoSchema>;
