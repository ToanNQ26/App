import mongoose, { Schema } from 'mongoose';

const ApprovalActionSchema = new Schema({
  requestId: { type: Schema.Types.ObjectId, ref: 'FinancialRequest', required: true, index: true },
  actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  action: { type: String, required: true },
  fromStatus: String, toStatus: String, comment: String
}, { timestamps: { createdAt: true, updatedAt: false } });

ApprovalActionSchema.index({ requestId: 1, createdAt: 1 });
export const ApprovalAction = mongoose.model('ApprovalAction', ApprovalActionSchema);
