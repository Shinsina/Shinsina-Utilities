import { config } from 'dotenv';
config();

export const MONGODB_URI = process.env['MONGODB_URI'];
export const MONGODB_DB = process.env['MONGODB_DB'];
