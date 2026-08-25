import { z } from "zod";

export const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(60, "Name too long"),
  email: z.string().email("Invalid email address").max(100),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password too long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(10, "Invalid or missing reset token"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const NewsletterSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
});

export const ContactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  subject: z.string().min(2).max(150),
  message: z.string().min(10).max(2000),
});

export const CartItemValidationSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(50),
  size: z.string().min(1).max(20),
  color: z.string().min(1).max(30),
});

export const CheckoutSchema = z.object({
  items: z.array(CartItemValidationSchema).min(1, "Cart cannot be empty"),
  shippingAddress: z.object({
    firstName: z.string().min(2).max(50),
    lastName: z.string().min(2).max(50),
    email: z.string().email(),
    phone: z.string().min(10).max(20),
    address: z.string().min(5).max(200),
    city: z.string().min(2).max(50),
    postalCode: z.string().min(3).max(20),
    province: z.string().min(2).max(50),
  }),
  paymentMethod: z.enum(["cod", "online", "card"]),
  promoCode: z.string().optional(),
});
