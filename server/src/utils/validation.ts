import mongoose from 'mongoose';

export const isValidObjectId = (value: string) => mongoose.isValidObjectId(value);
