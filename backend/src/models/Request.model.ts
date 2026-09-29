import mongoose, { Schema } from 'mongoose';
import { PAYMENT_STATUSES, REQUEST_STATUSES } from '../enums/index.js';
import { RequestItemSchema } from './RequestItem.model.js';
import { schemaOptions } from './schema-options.js';

const RequestSchema = new Schema({
  requestCode: { type: String, required: true, unique: true, index: true },
  requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department', index: true },
  type: { type: String, enum: ['ADVANCE', 'PAYMENT'], required: true },
  purpose: { type: String, required: true, trim: true },
  items: { type: [RequestItemSchema], required: true },
  totalAmount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: REQUEST_STATUSES, default: 'DRAFT', index: true },
  approvalLevel: { type: String, enum: ['AUTO', 'DEPARTMENT_HEAD', 'DIRECTOR', 'CHAIRMAN'] },
  paymentStatus: { type: String, enum: PAYMENT_STATUSES },
  bankAccountNumber: { type: String, trim: true },
  bankName: { type: String, trim: true },
  submittedAt: Date, approvedAt: Date, rejectedAt: Date,
  chairmanPaymentApprovedAt: Date,
  version: { type: Number, default: 0 }
}, schemaOptions);

RequestSchema.index({ status: 1, approvalLevel: 1 });
RequestSchema.index({ departmentId: 1, status: 1 });
export const FinancialRequest = mongoose.model('FinancialRequest', RequestSchema);
