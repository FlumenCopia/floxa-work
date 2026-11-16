import mongoose, { Schema, Model, Types } from 'mongoose';

export type UserRole = 'freelancer' | 'client' | 'dual' | 'admin';

export type AdminRole =
  | 'super_admin'
  | 'operations_admin'
  | 'trust_safety_moderator'
  | 'support_operator'
  | 'analytics_viewer';

export type UserAccountStatus = 'active' | 'suspended' | 'deactivated';

export interface IUserRestrictions {
  messagingRestricted?: boolean;
  invitationsRestricted?: boolean;
  suspensionReason?: string;
  restrictedAt?: Date;
  restrictedBy?: Types.ObjectId | string;
}

export interface IUser {
  _id?: Types.ObjectId;
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  handle: string;
  role: UserRole;
  adminRole?: AdminRole;
  status?: UserAccountStatus;
  suspensionReason?: string;
  suspendedAt?: Date;
  suspendedBy?: Types.ObjectId | string;
  restrictions?: IUserRestrictions;
  avatarUrl?: string;
  isVerified: boolean;
  emailVerified?: boolean;
  emailVerificationTokenHash?: string;
  emailVerificationExpires?: Date;
  passwordResetTokenHash?: string;
  passwordResetExpires?: Date;
  floxaDesignLinked: boolean;
  floxaDesignUserId?: string;
  clientRatingAverage?: number;
  clientRatingCount?: number;
  clientCompletedProjectsCount?: number;
  preferredCurrency?: string;
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
    adminRole: {
      type: String,
      enum: ['super_admin', 'operations_admin', 'trust_safety_moderator', 'support_operator', 'analytics_viewer'],
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'deactivated'],
      default: 'active',
      index: true,
    },
    suspensionReason: { type: String, default: '' },
    suspendedAt: { type: Date, default: null },
    suspendedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    restrictions: {
      type: Schema.Types.Mixed,
      default: () => ({ messagingRestricted: false, invitationsRestricted: false }),
    },
    avatarUrl: { type: String, default: '' },
    isVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    emailVerificationTokenHash: { type: String, default: null, select: false },
    emailVerificationExpires: { type: Date, default: null, select: false },
    passwordResetTokenHash: { type: String, default: null, select: false },
    passwordResetExpires: { type: Date, default: null, select: false },
    floxaDesignLinked: { type: Boolean, default: false },
    floxaDesignUserId: { type: String, default: '' },
    clientRatingAverage: { type: Number, default: 5.0 },
    clientRatingCount: { type: Number, default: 0 },
    clientCompletedProjectsCount: { type: Number, default: 0 },
    preferredCurrency: { type: String, default: 'USD' },
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
    delete ret.passwordResetTokenHash;
    delete ret.emailVerificationTokenHash;
    delete ret.__v;
    return ret;
  },
});

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

