import mongoose, { Schema, Model, Types } from 'mongoose';

export type UserRole = 'freelancer' | 'client' | 'dual' | 'admin';

export interface IUser {
  _id?: Types.ObjectId;
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  handle: string;
  role: UserRole;
  avatarUrl?: string;
  isVerified: boolean;
  floxaDesignLinked: boolean;
  floxaDesignUserId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    handle: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: { type: String, enum: ['freelancer', 'client', 'dual', 'admin'], default: 'dual' },
    avatarUrl: { type: String, default: '' },
    isVerified: { type: Boolean, default: false },
    floxaDesignLinked: { type: Boolean, default: false },
    floxaDesignUserId: { type: String, default: '' },
  },
  {
    collection: 'users',
    timestamps: true,
  }
);

userSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id?.toString();
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

