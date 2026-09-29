import { Schema, model } from "mongoose";

const RequestBookmarkSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    requestId: { type: Schema.Types.ObjectId, ref: "FinancialRequest", required: true },
  },
  { timestamps: true },
);

RequestBookmarkSchema.index({ userId: 1, requestId: 1 }, { unique: true });
export const RequestBookmark = model("RequestBookmark", RequestBookmarkSchema);
