import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { ENV } from './config/env.js';
import { User } from './models/User.model.js';
import { TalentProfile } from './models/TalentProfile.model.js';
import { SocialPost } from './models/SocialPost.model.js';
import { Brief } from './models/Brief.model.js';
import { Proposal } from './models/Proposal.model.js';
import { Contract } from './models/Contract.model.js';
import { Milestone } from './models/Milestone.model.js';
import { ChatMessage } from './models/ChatMessage.model.js';

async function cleanDbAndKeepOnlyUsers() {
  try {
    await mongoose.connect(ENV.DATABASE_URL);
    console.log('[FLOXA Work] Connected to MongoDB.');

    // 1. Wipe all transactional & sample data completely
    await SocialPost.deleteMany({});
    await Brief.deleteMany({});
    await Proposal.deleteMany({});
    await Contract.deleteMany({});
    await Milestone.deleteMany({});
    await ChatMessage.deleteMany({});
    await User.deleteMany({});
    await TalentProfile.deleteMany({});
    console.log('[FLOXA Work] All posts, briefs, proposals, contracts, milestones, and chat messages wiped.');

    // 2. Hash default secure test password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password123!', salt);

    // 3. Create Only Login Users

    // Client Login Account
    const client = await User.create({
      email: 'client@floxa.work',
      passwordHash,
      name: 'Sanjay Mehta',
      handle: 'sanjay_medx',
      role: 'client',
      avatarUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
      isVerified: true,
    });
    console.log(`[FLOXA Work] Client created: ${client.email} (ID: ${client._id})`);

    // Freelancer Login Account
    const freelancer = await User.create({
      email: 'freelancer@floxa.work',
      passwordHash,
      name: 'Aravind V.',
      handle: 'aravind_design',
      role: 'freelancer',
      avatarUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
      isVerified: true,
      floxaDesignLinked: true,
    });
    console.log(`[FLOXA Work] Freelancer created: ${freelancer.email} (ID: ${freelancer._id})`);

    // Basic Freelancer Talent Profile
    await TalentProfile.create({
      userId: freelancer._id,
      headline: 'Brand Identity & Visual Design Systems Lead',
      bio: 'Crafting pixel-perfect brand identities, vector libraries, and modern design tokens.',
      skills: ['Brand Identity', 'Design Systems', 'Figma', 'UI/UX Tokens'],
      hourlyRate: 85,
      minimumProjectBudget: 1500,
      availabilityStatus: 'available',
      availableSpotsThisMonth: 1,
      completedContractsCount: 0,
      escrowVolumeEarned: 0,
      ratingAverage: 5.0,
      ratingCount: 0,
    });

    // Superadmin Login Account
    const admin = await User.create({
      email: 'admin@floxa.work',
      passwordHash,
      name: 'FLOXA Superadmin',
      handle: 'superadmin',
      role: 'admin',
      isVerified: true,
    });
    console.log(`[FLOXA Work] Admin created: ${admin.email} (ID: ${admin._id})`);

    console.log('\n======================================================');
    console.log(' DATABASE CLEANED SUCCESSFULLY');
    console.log(' ONLY LOGIN USERS ARE IN DATABASE. ALL OTHER DATA REMOVED.');
    console.log('======================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[FLOXA Work Seeder Error]:', err);
    process.exit(1);
  }
}

cleanDbAndKeepOnlyUsers();

