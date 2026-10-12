export const buildResponse = (success: boolean, message: string, data?: any) => ({
  success,
  message,
  ...(data !== undefined ? { data } : {}),
});
