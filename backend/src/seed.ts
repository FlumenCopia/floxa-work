
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { ENV } from './config/env.js';
import { User } from './models/User.model.js';
import { TalentProfile } from './models/TalentProfile.model.js';
import { SocialPost } from './models/SocialPost.model.js';
import { Brief } from './models/Brief.model.js';

async function seed() {
  try {
    await mongoose.connect(ENV.DATABASE_URL);
    console.log('[FLOXA Work Seeder] Connected to MongoDB.');

    // Clear existing collections if desired
    await User.deleteMany({});
    await TalentProfile.deleteMany({});
    await SocialPost.deleteMany({});
    await Brief.deleteMany({});

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password123!', salt);

    // 1. Create Freelancer
    const freelancer = await User.create({
      email: 'freelancer@floxa.work',
      passwordHash,
      name: 'Aravind V.',
      handle: 'aravind_design',
      role: 'freelancer',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
      isVerified: true,
      floxaDesignLinked: true,
    });

    await TalentProfile.create({
      userId: freelancer._id,
      headline: 'Brand Identity & Visual Design Systems Lead',
      bio: 'Crafting pixel-perfect brand identities, vector libraries, and modern design tokens.',
      skills: ['Brand Identity', 'Design Systems', 'Figma', 'UI/UX Tokens'],
      hourlyRate: 85,
      minimumProjectBudget: 1500,
      availabilityStatus: 'available',
      availableSpotsThisMonth: 1,
      completedContractsCount: 14,
      escrowVolumeEarned: 28400,
      ratingAverage: 5.0,
      ratingCount: 14,
      services: [
        {
          title: 'Brand Identity & Visual System Kit',
          description: 'Comprehensive brand identity sprint: vector logos, typography hierarchy, responsive colour tokens, and 20-page brand guidelines PDF.',
          price: 1200,
          currency: 'USD',
          deliveryDays: 5,
          deliverables: [
            'Vector Logo Master Files (SVG, AI, PNG)',
            'Brand Style Guide & Token Spec PDF',
            'Typography & Color Palette Tokens',
            'Social Media Kit & Favicon Suite'
          ],
          revisions: 3,
        },
        {
          title: 'High-Conversion SaaS UI/UX Design Sprint',
          description: 'End-to-end design of 5 core web/mobile app screens with interactive Figma prototype, auto-layout components, and developer handover specs.',
          price: 1800,
          currency: 'USD',
          deliveryDays: 7,
          deliverables: [
            '5 Production-Ready Screen Designs (Desktop & Mobile)',
            'Interactive Clickable Figma Prototype',
            'Atomic UI Component Library (Buttons, Forms, Cards)',
            'Dev Handoff Notes & Asset Exports'
          ],
          revisions: 2,
        },
        {
          title: 'Full Design System Architecture',
          description: 'Scalable corporate design system for multi-product ecosystems: token architecture, 50+ modular components, and dark/light mode variants.',
          price: 2600,
          currency: 'USD',
          deliveryDays: 12,
          deliverables: [
            '50+ Dynamic Auto-Layout Components',
            'Semantic Token Architecture (Light/Dark)',
            'Interactive Documentation in Figma',
            'Code-ready CSS/Tailwind Variable Map'
          ],
          revisions: 4,
        }
      ],
    });

    // 2. Create Client
    const client = await User.create({
      email: 'client@floxa.work',
      passwordHash,
      name: 'Sanjay Mehta',
      handle: 'sanjay_medx',
      role: 'client',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
      isVerified: true,
    });

    // 3. Create Admin
    await User.create({
      email: 'admin@floxa.work',
      passwordHash,
      name: 'FLOXA Superadmin',
      handle: 'superadmin',
      role: 'admin',
      isVerified: true,
    });

    // 4. Create Social Proof-of-Work post
    await SocialPost.create({
      authorId: freelancer._id,
      caption:
        'Brand Identity & Design System for an AI Fintech startup in Bangalore. Completed discovery with 3 visual archetypes, delivered complete vector system, logo package & typography guidelines.',
      mediaUrls: [
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80',
      ],
      mediaType: 'image',
      tags: ['BrandIdentity', 'DesignSystem', 'Fintech', 'FLOXADesign'],
      projectCategory: 'branding',
      caseStudyMetrics: {
        timeTakenDays: 11,
        deliverableType: 'Complete Brand Kit',
        verifiedFloxaWork: true,
      },
      likesCount: 42,
      commentsCount: 7,
    });

    // 5. Create Sample Brief
    await Brief.create({
      clientId: client._id,
      title: 'Visual Identity & Design System for HealthTech AI Platform',
      category: 'branding',
      problemStatement:
        'We are modernizing clinical trial patient intake. Our current brand feels too academic and cold. We need a warm, ultra-approachable identity and design tokens for web and mobile.',
      targetAudience: 'Clinical researchers and everyday patients',
      deliverablesRequired: [
        'Logo suite',
        'Typography & Color Tokens',
        'Figma UI Component Kit',
        'Guidelines PDF',
      ],
      sliders: [
        { key: 'speed_vs_craft', leftLabel: 'Speed / MVP', rightLabel: 'High Craft', value: 75 },
        { key: 'vibe', leftLabel: 'Clinical & Formal', rightLabel: 'Warm & Approachable', value: 85 },
      ],
      budgetMin: 1800,
      budgetMax: 2800,
      currency: 'USD',
      deadlineWeeks: 3,
      magicLinkToken: 'demo_brief_magic_token_1234567890abcdef',
    });

    console.log('[FLOXA Work Seeder] Seed successfully completed!');
    console.log('--- CREDENTIALS ---');
    console.log('Freelancer: freelancer@floxa.work / Password123!');
    console.log('Client: client@floxa.work / Password123!');
    console.log('Admin: admin@floxa.work / Password123!');
    process.exit(0);
  } catch (err) {
    console.error('[FLOXA Work Seeder] Error:', err);
    process.exit(1);
  }
}

seed();
