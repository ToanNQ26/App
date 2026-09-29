import { Schema } from 'mongoose';

// RequestItem được nhúng trong FinancialRequest để cập nhật draft nguyên tử.
export const RequestItemSchema = new Schema({
  itemType: { type: String, required: true },
  name: { type: String, required: true },
  description: String,
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  amount: { type: Number, required: true, min: 0 },
  supplier: String
}, { _id: true });
