import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { env } from "../config/env";
import { errorResponse } from "../utils/response";

export interface AuthUserPayload {
  id: string;
  email: string;
  name: string;
}

export const authPlugin = new Elysia({ name: "authPlugin" })
  .use(
    jwt({
      name: "jwt",
      secret: env.JWT_SECRET,
      exp: "7d",
    })
  )
  .derive({ as: "scoped" }, async ({ headers, jwt }) => {
    const authHeader = headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { user: null as AuthUserPayload | null };
    }

    const token = authHeader.slice(7);
    const payload = (await jwt.verify(token)) as AuthUserPayload | false;

    if (!payload || !payload.id) {
      return { user: null as AuthUserPayload | null };
    }

    return {
      user: {
        id: payload.id,
        email: payload.email,
        name: payload.name,
      } as AuthUserPayload,
    };
  });

export const requireAuth = new Elysia({ name: "requireAuth" })
  .use(authPlugin)
  .onBeforeHandle(({ user, set }) => {
    if (!user) {
      set.status = 401;
      return errorResponse("Unauthorized", { code: "UNAUTHORIZED" });
    }
  })
  .resolve({ as: "scoped" }, ({ user }) => ({ user: user as AuthUserPayload }));
