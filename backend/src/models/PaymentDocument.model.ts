import mongoose, { Schema } from 'mongoose';

const PaymentDocumentSchema = new Schema({
  requestId: { type: Schema.Types.ObjectId, ref: 'FinancialRequest', required: true, index: true },
  documentType: { type: String, required: true },
  originalName: String, fileUrl: String, storageKey: String, mimeType: String, fileSize: Number,
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  uploadedAt: { type: Date, default: Date.now }
});

export const PaymentDocument = mongoose.model('PaymentDocument', PaymentDocumentSchema);
