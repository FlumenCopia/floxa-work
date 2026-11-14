import mongoose, { Schema, Model, Types } from 'mongoose';

export type ContractStatus = 'active' | 'completed' | 'disputed' | 'cancelled';

export interface IContract {
  _id?: Types.ObjectId;
  id: string;
  briefId: Types.ObjectId | string;
  proposalId: Types.ObjectId | string;
  clientId: Types.ObjectId | string;
  freelancerId: Types.ObjectId | string;
  totalBudget: number;
  currency: string;
  status: ContractStatus;
  msaAgreementSignedAt?: Date;
  clientSignature?: string;
  freelancerSignature?: string;
  proposalSnapshot?: Record<string, any>;
  floxaDesignWorkspaceLinked: boolean;
  floxaDesignProjectId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const contractSchema = new Schema<IContract>(
  {
    briefId: { type: Schema.Types.ObjectId, ref: 'Brief', required: true, index: true },
    proposalId: { type: Schema.Types.ObjectId, ref: 'Proposal', required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    freelancerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    totalBudget: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    status: {
      type: String,
      enum: ['active', 'completed', 'disputed', 'cancelled'],
      default: 'active',
      index: true,
    },
    msaAgreementSignedAt: { type: Date, default: null },
    clientSignature: { type: String, default: '' },
    freelancerSignature: { type: String, default: '' },
    proposalSnapshot: { type: Schema.Types.Mixed, default: null },
    floxaDesignWorkspaceLinked: { type: Boolean, default: false },
    floxaDesignProjectId: { type: String, default: '' },
  },
  {
    collection: 'contracts',
    timestamps: true,
  }
);

contractSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id?.toString();
    delete ret.__v;
    return ret;
  },
});

export const Contract: Model<IContract> =
  mongoose.models.Contract || mongoose.model<IContract>('Contract', contractSchema);

