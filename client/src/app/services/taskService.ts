import { api } from './api';

export const getTasks = async (token: string) => api.get<{ success: boolean; data: any[] }>('/tasks', token);

export const createTask = async (token: string, task: any) =>
  api.post<{ success: boolean; data: any; message?: string }>('/tasks', task, token);

export const updateTask = async (token: string, id: string, task: any) =>
  api.put<{ success: boolean; data: any; message?: string }>(`/tasks/${id}`, task, token);

export const deleteTask = async (token: string, id: string) =>
  api.delete<{ success: boolean; message?: string }>(`/tasks/${id}`, token);
