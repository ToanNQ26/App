export const schemaOptions = {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_document: unknown, result: Record<string, unknown>) => {
      result.id = result._id;
      delete result._id;
      delete result.__v;
      delete result.passwordHash;
      return result;
    }
  }
} as const;
