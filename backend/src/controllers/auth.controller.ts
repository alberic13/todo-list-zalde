import { Elysia, t } from "elysia";
import { AuthService } from "../services/auth.service";
import { authPlugin } from "../middlewares/auth.middleware";
import { successResponse, errorResponse } from "../utils/response";

export const authController = new Elysia({ prefix: "/api/auth" })
  .use(authPlugin)
  // POST /api/auth/register
  .post(
    "/register",
    async ({ body, jwt, set }) => {
      try {
        const user = await AuthService.register(body.name, body.email, body.password);
        const token = await jwt.sign({
          id: user.id,
          email: user.email,
          name: user.name,
        });

        set.status = 201;
        return successResponse({ user, token }, "Registration successful");
      } catch (err: any) {
        set.status = 400;
        return errorResponse(err.message || "Registration failed");
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 2, maxLength: 255 }),
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 6 }),
      }),
      detail: {
        tags: ["Auth"],
        summary: "Register new user",
      },
    }
  )
  // POST /api/auth/login
  .post(
    "/login",
    async ({ body, jwt, set }) => {
      const user = await AuthService.verifyCredentials(body.email, body.password);
      if (!user) {
        set.status = 401;
        return errorResponse("Invalid email or password");
      }

      const token = await jwt.sign({
        id: user.id,
        email: user.email,
        name: user.name,
      });

      return successResponse({ user, token }, "Login successful");
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 1 }),
      }),
      detail: {
        tags: ["Auth"],
        summary: "Login user",
      },
    }
  )
  // GET /api/auth/me
  .get(
    "/me",
    async ({ user, set }) => {
      if (!user) {
        set.status = 401;
        return errorResponse("Unauthorized", { code: "UNAUTHORIZED" });
      }

      const profile = await AuthService.findById(user.id);
      if (!profile) {
        set.status = 404;
        return errorResponse("User not found");
      }

      return successResponse(profile, "User profile retrieved");
    },
    {
      detail: {
        tags: ["Auth"],
        summary: "Get current user profile",
      },
    }
  );
