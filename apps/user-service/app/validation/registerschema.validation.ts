import {z} from 'zod'


export const registerSchema = z.object({
  user_name: z.string().min(1, "Username is required"),
  user_first_name: z.string().min(1, "First name is required"),
  user_last_name: z.string().min(1, "Last name is required"),
  user_email: z.string().email("Invalid email address"),
  google_id: z.string().optional(), // optional if user signs up via email
  verified_status: z.boolean().optional(), // optional, default usually false
  user_password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/\d/, "Password must contain at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character"
    ),
  refresh_token: z.string().optional(), // usually not required at registration
});