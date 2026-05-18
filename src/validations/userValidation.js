import { z } from "zod";

export const registerUserSchema = z.object({
  username: z
    .string({ required_error: "Username là bắt buộc" })
    .trim()
    .min(3, "Username phải có ít nhất 3 ký tự")
    .max(30, "Username không được quá 30 ký tự"),

  email: z
    .string({ required_error: "Email là bắt buộc" })
    .trim()
    .email("Định dạng email không hợp lệ")
    .toLowerCase(),

  password: z
    .string({ required_error: "Mật khẩu là bắt buộc" })
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  //   .regex(/[A-Z]/, "Mật khẩu phải chứa ít nhất 1 chữ hoa")
  //   .regex(/[0-9]/, "Mật khẩu phải chứa ít nhất 1 chữ số"),
});
export const loginUserSchema = z.object({
  email: z
    .string({ required_error: "Email là bắt buộc" })
    .trim()
    .email("Định dạng email không hợp lệ")
    .toLowerCase(),

  password: z
    .string({ required_error: "Mật khẩu là bắt buộc" })
    .min(1, "Vui lòng nhập mật khẩu"),
});
export const updateUserSchema = z.object({
  username: z.string().trim().min(3).optional(),
  avatar: z
    .string()
    .url("Link avatar phải là một URL hợp lệ")
    .or(z.literal(""))
    .optional(),
  bio: z.string().max(200, "Bio không quá 200 ký tự").optional(),
  occupationId: z.string().optional(),
});

