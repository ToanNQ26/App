import mongoose, { Schema } from 'mongoose';

const DisbursementSchema = new Schema({
  requestId: { type: Schema.Types.ObjectId, ref: 'FinancialRequest', required: true, index: true },
  amount: { type: Number, required: true, min: 1 },
  method: { type: String, enum: ['BANK_TRANSFER', 'CASH', 'OTHER'], required: true },
  referenceCode: String, note: String,
  disbursedAt: { type: Date, required: true },
  accountantId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

DisbursementSchema.index({ requestId: 1, createdAt: 1 });
export const Disbursement = mongoose.model('Disbursement', DisbursementSchema);
