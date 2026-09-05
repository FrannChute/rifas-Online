import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(180)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(200),
  next: z.string().optional(),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

export function parseAdminLoginForm(formData: FormData) {
  return adminLoginSchema.parse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  });
}
