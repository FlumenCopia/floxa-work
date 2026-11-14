import mongoose from 'mongoose';
import { User } from '../models/User.model.js';
import { TalentProfile } from '../models/TalentProfile.model.js';
import { Brief } from '../models/Brief.model.js';
import { Proposal } from '../models/Proposal.model.js';
import { Contract } from '../models/Contract.model.js';
import { Milestone } from '../models/Milestone.model.js';
import { PaymentRecord } from '../models/PaymentRecord.model.js';
import { Task } from '../models/Task.model.js';
import { ContractActivity } from '../models/ContractActivity.model.js';
import { Notification } from '../models/Notification.model.js';
import { Review } from '../models/Review.model.js';
import { Dispute } from '../models/Dispute.model.js';
import { UserReport } from '../models/UserReport.model.js';
import { UserBlock } from '../models/UserBlock.model.js';
import { Session } from '../models/Session.model.js';
import { AuditLog } from '../models/AuditLog.model.js';

export interface IndexAuditReport {
  collection: string;
  indexes: string[];
  totalIndexes: number;
}

/**
 * Ensures optimal compound and single-field indexes exist across all production models
 * without dropping or mutating existing collections.
 */
export async function syncAndVerifyDatabaseIndexes(): Promise<IndexAuditReport[]> {
  const reports: IndexAuditReport[] = [];

  const models: Array<{ name: string; model: mongoose.Model<any> }> = [
    { name: 'users', model: User },
    { name: 'talentprofiles', model: TalentProfile },
    { name: 'briefs', model: Brief },
    { name: 'proposals', model: Proposal },
    { name: 'contracts', model: Contract },
    { name: 'milestones', model: Milestone },
    { name: 'paymentrecords', model: PaymentRecord },
    { name: 'tasks', model: Task },
    { name: 'contractactivities', model: ContractActivity },
    { name: 'notifications', model: Notification },
    { name: 'reviews', model: Review },
    { name: 'disputes', model: Dispute },
    { name: 'userreports', model: UserReport },
    { name: 'userblocks', model: UserBlock },
    { name: 'sessions', model: Session },
    { name: 'auditlogs', model: AuditLog },
  ];

  for (const { name, model } of models) {
    try {
      // Create declared indexes
      await model.syncIndexes();

      // Fetch active index names
      const rawIndexes = await model.collection.indexes();
      const indexNames = rawIndexes.map((idx) => Object.keys(idx.key).join('_') + (idx.unique ? ' [UNIQUE]' : ''));

      reports.push({
        collection: name,
        indexes: indexNames,
        totalIndexes: indexNames.length,
      });
    } catch (err: any) {
      console.warn(`[Index Manager] Warning indexing ${name}:`, err.message);
      reports.push({
        collection: name,
        indexes: [`ERROR: ${err.message}`],
        totalIndexes: 0,
      });
    }
  }

  return reports;
}

