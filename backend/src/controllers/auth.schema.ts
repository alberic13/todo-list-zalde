import { t } from "elysia";

export const registerBodySchema = t.Object({
  name: t.String({ minLength: 2, maxLength: 255 }),
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 6 }),
});

export const verifyEmailBodySchema = t.Object({
  email: t.String({ format: "email" }),
  code: t.String({ minLength: 6, maxLength: 6 }),
});

export const resendVerificationBodySchema = t.Object({
  email: t.String({ format: "email" }),
});

export const loginBodySchema = t.Object({
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 1 }),
});

export const googleLoginBodySchema = t.Object({
  credential: t.String(),
});

export const updateProfileBodySchema = t.Object({
  name: t.Optional(t.String({ minLength: 2, maxLength: 255 })),
  phoneNumber: t.Optional(t.String({ maxLength: 50 })),
});

export const forgotPasswordBodySchema = t.Object({
  email: t.String({ format: "email" }),
});

export const resetPasswordBodySchema = t.Object({
  token: t.String({ minLength: 1 }),
  newPassword: t.String({ minLength: 6 }),
});
