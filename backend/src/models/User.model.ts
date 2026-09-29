import mongoose, { Schema } from 'mongoose';
import { ROLES } from '../enums/index.js';
import { schemaOptions } from './schema-options.js';

const UserSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ROLES, required: true },
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
  bankAccountNumber: { type: String, trim: true },
  bankName: { type: String, trim: true },
  isActive: { type: Boolean, default: true }
}, schemaOptions);

export const User = mongoose.model('User', UserSchema);
