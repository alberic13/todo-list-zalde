import { Elysia } from "elysia";
import { errorResponse } from "../utils/response";

export const errorHandler = new Elysia({ name: "errorHandler" })
  .onError(({ code, error, set }) => {
    console.error(`[Error] [${code}]:`, error);

    if (code === "VALIDATION") {
      set.status = 400;
      return errorResponse("Validation error", error.message);
    }

    if (code === "NOT_FOUND") {
      set.status = 404;
      return errorResponse("Endpoint not found");
    }

    if (code === "PARSE") {
      set.status = 400;
      return errorResponse("Invalid JSON payload");
    }

    set.status = 500;
    return errorResponse(
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : (error as Error).message || "Internal server error"
    );
  });
