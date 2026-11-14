import mongoose, { Schema, Model, Types } from 'mongoose';

export type PaymentRecordStatus =
  | 'not_recorded'
  | 'reported_by_client'
  | 'acknowledged_by_freelancer'
  | 'disputed'
  | 'cancelled';

export type PaymentMethod =
  | 'bank_transfer'
  | 'upi'
  | 'razorpay_direct'
  | 'stripe_direct'
  | 'paypal'
  | 'other';

export interface IPaymentRecord {
  _id?: Types.ObjectId;
  id: string;
  contractId: Types.ObjectId | string;
  milestoneId: Types.ObjectId | string;
  payerId: Types.ObjectId | string;
  payeeId: Types.ObjectId | string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentMethodDetails?: string;
  reportedDate: Date;
  externalReference?: string;
  receiptFileUrl?: string;
  status: PaymentRecordStatus;
  acknowledgedAt?: Date;
  notes?: string;
  disputeReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const paymentRecordSchema = new Schema<IPaymentRecord>(
  {
    contractId: { type: Schema.Types.ObjectId, ref: 'Contract', required: true, index: true },
    milestoneId: { type: Schema.Types.ObjectId, ref: 'Milestone', required: true, index: true },
    payerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    payeeId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'upi', 'razorpay_direct', 'stripe_direct', 'paypal', 'other'],
      default: 'bank_transfer',
      index: true,
    },
    paymentMethodDetails: { type: String, default: '' },
    reportedDate: { type: Date, default: Date.now },
    externalReference: { type: String, default: '' },
    receiptFileUrl: { type: String, default: '' },
    status: {
      type: String,
      enum: ['not_recorded', 'reported_by_client', 'acknowledged_by_freelancer', 'disputed', 'cancelled'],
      default: 'reported_by_client',
      index: true,
    },
    acknowledgedAt: { type: Date, default: null },
    notes: { type: String, default: '' },
    disputeReason: { type: String, default: '' },
  },
  {
    collection: 'payment_records',
    timestamps: true,
  }
);

paymentRecordSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id?.toString();
    delete ret.__v;
    return ret;
  },
});

export const PaymentRecord: Model<IPaymentRecord> =
  mongoose.models.PaymentRecord ||
  mongoose.model<IPaymentRecord>('PaymentRecord', paymentRecordSchema);
