import { z } from "zod";
const trimString = (value) => {
  return typeof value === "string" ? value.trim() : value;
};
const normalizeOccupationId = (value) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }
  return value;
};
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

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
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
    .regex(/[A-Z]/, "Mật khẩu phải chứa ít nhất 1 chữ hoa")
    .regex(/[0-9]/, "Mật khẩu phải chứa ít nhất 1 chữ số"),
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
  displayName: z.preprocess(
    trimString,
    z
      .string()
      .min(2, "Display name phải có ít nhất 2 ký tự")
      .max(50, "Display name không được quá 50 ký tự")
      .optional(),
  ),

  avatar: z.preprocess(
    trimString,
    z
      .union([
        z.string().url("Link avatar phải là một URL hợp lệ"),
        z.literal(""),
      ])
      .optional(),
  ),
  bio: z.preprocess(
    trimString,
    z.string().max(200, "Bio không quá 200 ký tự").optional(),
  ),
  occupationId: z.preprocess(
    normalizeOccupationId,
    z
      .union([
        z.string().regex(objectIdRegex, "occupationId không hợp lệ"),
        z.null(),
      ])
      .optional(),
  ),
});
export const changePasswordUserSchema = z
  .object({
    oldPassword: z.string({ required_error: "Mật khẩu là bắt buộc" }),
    newPassword: z
      .string({ required_error: "Mật khẩu là bắt buộc" })
      .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
      .regex(/[A-Z]/, "Mật khẩu phải chứa ít nhất 1 chữ hoa")
      .regex(/[0-9]/, "Mật khẩu phải chứa ít nhất 1 chữ số"),
    confirmPassword: z.string({
      required_error: "Vui lòng xác nhận lại mật khẩu",
    }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });
