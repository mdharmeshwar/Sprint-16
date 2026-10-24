export const buildResponse = (success: boolean, message: string, data?: any) => ({
  success,
  message,
  ...(data !== undefined ? { data } : {}),
});

export const buildErrorResponse = (
  message: string,
  code: string,
  errors: Array<{ path?: string; message: string }> = []
) => ({ success: false, message, code, errors });
