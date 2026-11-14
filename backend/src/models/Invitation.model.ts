import mongoose, { Schema, Model, Types } from 'mongoose';

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired';

export interface IInvitation {
  _id?: Types.ObjectId;
  id: string;
  briefId: Types.ObjectId | string;
  clientId: Types.ObjectId | string;
  freelancerId: Types.ObjectId | string;
  message?: string;
  status: InvitationStatus;
  respondedAt?: Date;
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const invitationSchema = new Schema<IInvitation>(
  {
    briefId: { type: Schema.Types.ObjectId, ref: 'Brief', required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    freelancerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    message: { type: String, default: 'We reviewed your portfolio and would like to invite you to submit a diagnostic pitch for our project.' },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'cancelled', 'expired'],
      default: 'pending',
      index: true,
    },
    respondedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) }, // 14-day validity
  },
  {
    collection: 'invitations',
    timestamps: true,
  }
);

// Prevent duplicate active invitations to the same freelancer for the same brief
invitationSchema.index({ briefId: 1, freelancerId: 1 }, { unique: true });
invitationSchema.index({ createdAt: -1 });

invitationSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id?.toString();
    delete ret.__v;
    return ret;
  },
});

export const Invitation: Model<IInvitation> =
  mongoose.models.Invitation || mongoose.model<IInvitation>('Invitation', invitationSchema);

