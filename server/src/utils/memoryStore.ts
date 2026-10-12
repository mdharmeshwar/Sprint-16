export const memoryUsers: Array<{
  _id: string;
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}> = [];

export const memoryTasks: Array<{
  _id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}> = [];

export const useMemoryStore = () => !process.env.MONGODB_URI;

export const makeId = () => Math.random().toString(36).slice(2, 11) + Date.now().toString(36);

export const getMemoryUserById = (id: string) => memoryUsers.find((user) => user._id === id) || null;
export const getMemoryUserByEmail = (email: string) => memoryUsers.find((user) => user.email === email.toLowerCase()) || null;
export const getMemoryTasksByAuthor = (authorId: string) =>
  [...memoryTasks].filter((task) => task.authorId === authorId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
export const getMemoryTaskById = (id: string) => memoryTasks.find((task) => task._id === id) || null;
