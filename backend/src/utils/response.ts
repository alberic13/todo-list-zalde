export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T | null;
  errors: any | null;
}

export const successResponse = <T>(data: T, message = "Operation successful"): ApiResponse<T> => {
  return {
    success: true,
    message,
    data,
    errors: null,
  };
};

export const errorResponse = (message = "Operation failed", errors: any = null): ApiResponse<null> => {
  return {
    success: false,
    message,
    data: null,
    errors,
  };
};
