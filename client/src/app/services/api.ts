const BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api';

export const api = {
  async request<T>(endpoint: string, options: RequestInit = {}, token?: string): Promise<T> {
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.message || 'Request failed');
    }

    return payload;
  },
  get<T>(endpoint: string, token?: string) {
    return this.request<T>(endpoint, { method: 'GET' }, token);
  },
  post<T>(endpoint: string, body: unknown, token?: string) {
    return this.request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }, token);
  },
  put<T>(endpoint: string, body: unknown, token?: string) {
    return this.request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }, token);
  },
  delete<T>(endpoint: string, token?: string) {
    return this.request<T>(endpoint, { method: 'DELETE' }, token);
  },
};
