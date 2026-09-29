import mongoose, { Schema } from 'mongoose';
import { schemaOptions } from './schema-options.js';

const DepartmentSchema = new Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  isActive: { type: Boolean, default: true }
}, schemaOptions);

export const Department = mongoose.model('Department', DepartmentSchema);
