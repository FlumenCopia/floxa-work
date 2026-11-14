export const API_BASE = 'http://localhost:5001/api';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('floxa_work_jwt');
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('floxa_work_refresh_token');
}

export function setAuthSession(token: string, user: any, refreshToken?: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('floxa_work_jwt', token);
  localStorage.setItem('floxa_work_user', JSON.stringify(user));
  if (refreshToken) {
    localStorage.setItem('floxa_work_refresh_token', refreshToken);
  }
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('floxa_work_jwt');
  localStorage.removeItem('floxa_work_refresh_token');
  localStorage.removeItem('floxa_work_user');
}

export function getAuthUser(): any | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('floxa_work_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// 1. Auth API
export async function loginUser(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  setAuthSession(data.token, data.user, data.refreshToken);
  return data;
}

export async function registerUser(payload: {
  email: string;
  password: string;
  name: string;
  handle: string;
  role: string;
}) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  setAuthSession(data.token, data.user, data.refreshToken);
  return data;
}

export async function refreshAuthToken(): Promise<{ token: string; refreshToken: string } | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const data = await res.json();
    if (!res.ok) {
      clearAuthSession();
      return null;
    }
    setAuthSession(data.token, data.user, data.refreshToken);
    return data;
  } catch {
    clearAuthSession();
    return null;
  }
}

export async function logoutUser() {
  const refreshToken = getRefreshToken();
  const token = getAuthToken();
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ refreshToken }),
    });
  } catch (e) {
    // ignore
  } finally {
    clearAuthSession();
  }
}

export async function requestPasswordReset(email: string) {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Password reset request failed');
  return data;
}

export async function resetPassword(token: string, newPassword: string) {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to reset password');
  return data;
}

export async function requestEmailVerification() {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${API_BASE}/auth/request-email-verification`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to request email verification');
  return data;
}

export async function verifyEmail(token: string) {
  const res = await fetch(`${API_BASE}/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to verify email');
  return data;
}

export async function fetchUserSessions() {
  const token = getAuthToken();
  if (!token) return [];
  const res = await fetch(`${API_BASE}/auth/sessions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch sessions');
  return data.sessions || [];
}

export async function revokeUserSession(sessionId: string) {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${API_BASE}/auth/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to revoke session');
  return data;
}

export async function revokeOtherUserSessions() {
  const token = getAuthToken();
  const currentRefreshToken = getRefreshToken();
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${API_BASE}/auth/sessions/revoke-all-others`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ currentRefreshToken }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to revoke other sessions');
  return data;
}

// 2. User Profile API
export async function fetchUserProfile() {
  const token = getAuthToken();
  if (!token) return null;
  const res = await fetch(`${API_BASE}/users/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch user profile');
  return data;
}

export async function updateUserProfile(payload: {
  name?: string;
  handle?: string;
  avatarUrl?: string;
  headline?: string;
  bio?: string;
  skills?: string[] | string;
  hourlyRate?: number;
  minimumProjectBudget?: number;
  availabilityStatus?: string;
}) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/users/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update profile');
  // Update saved user in localStorage
  if (data.user) {
    const existing = getAuthUser() || {};
    localStorage.setItem('floxa_work_user', JSON.stringify({ ...existing, ...data.user }));
  }
  return data;
}

// 3. Briefs API
export async function fetchBriefs(category?: string, clientId?: string, page = 1, limit = 20) {
  const params = new URLSearchParams();
  if (category && category !== 'all') params.set('category', category);
  if (clientId) params.set('clientId', clientId);
  params.set('page', String(page));
  params.set('limit', String(limit));

  const res = await fetch(`${API_BASE}/briefs?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch briefs');
  return data.briefs || [];
}

export async function createBrief(briefData: {
  title: string;
  category: string;
  problemStatement: string;
  deliverablesRequired: string[];
  budgetMin: number;
  budgetMax: number;
  deadlineWeeks?: number;
}) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/briefs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(briefData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create brief');
  return data.brief;
}

// 4. Social Proof-of-Work Feed API
export async function fetchFeed(category?: string, page = 1, limit = 20) {
  const params = new URLSearchParams();
  if (category && category !== 'all') params.set('category', category);
  params.set('page', String(page));
  params.set('limit', String(limit));

  const res = await fetch(`${API_BASE}/feed?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch feed');
  return data.posts || [];
}

export async function createSocialPost(payload: {
  caption: string;
  mediaUrls?: string[];
  mediaType?: string;
  tags?: string[];
  projectCategory?: string;
  caseStudyMetrics?: any;
}) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/feed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to publish post');
  return data.post;
}

export async function likePost(postId: string) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/feed/${postId}/like`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to like post');
  return data;
}

// 5. Proposals API
export async function fetchMyProposals() {
  const token = getAuthToken();
  if (!token) return [];
  const res = await fetch(`${API_BASE}/proposals/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch proposals');
  return data.proposals || [];
}

export async function fetchBriefProposals(
  briefId: string,
  options?: { status?: string; sortBy?: string; search?: string }
) {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const params = new URLSearchParams();
  if (options?.status) params.set('status', options.status);
  if (options?.sortBy) params.set('sortBy', options.sortBy);
  if (options?.search) params.set('search', options.search);

  const res = await fetch(`${API_BASE}/briefs/${briefId}/proposals?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch brief proposals');
  return data;
}

export async function fetchProposalById(id: string) {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${API_BASE}/proposals/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch proposal');
  return data.proposal;
}

export async function shortlistProposal(id: string) {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${API_BASE}/proposals/${id}/shortlist`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update shortlist status');
  return data;
}

export async function declineProposal(id: string, reason?: string) {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${API_BASE}/proposals/${id}/decline`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ reason }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to decline proposal');
  return data;
}

export async function withdrawProposal(id: string) {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${API_BASE}/proposals/${id}/withdraw`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to withdraw proposal');
  return data;
}

export async function compareProposalsApi(briefId: string, proposalIds: string[]) {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${API_BASE}/proposals/compare`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ briefId, proposalIds }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to compare proposals');
  return data;
}

export async function submitProposal(proposalData: {
  briefId: string;
  diagnosticAnswers?: { question: string; answer: string }[];
  problemDiagnosis?: {
    understanding?: string;
    rootCauses?: string[];
    risksAndConstraints?: string[];
    clarifyingQuestions?: string[];
  };
  proposedStrategy?: {
    strategicApproach?: string;
    solutionArchitecture?: string;
    expectedOutcomes?: string[];
    dependencies?: string[];
    alternativeApproaches?: string;
  };
  strategicSliders?: { key: string; label?: string; value: number; rationale?: string }[];
  proposedMilestones: {
    title: string;
    description?: string;
    deliverables?: string[];
    amount: number;
    estimatedDays?: number;
    deliveryDays?: number;
    acceptanceCriteria?: string;
    revisionAssumptions?: string;
  }[];
  totalPrice: number;
  estimatedDays: number;
  assumptionsAndExclusions?: string;
  portfolioItems?: {
    title: string;
    description: string;
    category?: string;
    role?: string;
    techOrSkills?: string[];
    outcome?: string;
    url?: string;
    relevanceExplanation?: string;
  }[];
  portfolioProofUrls?: string[];
  freelancerIntro?: {
    coverNote?: string;
    relevantExperience?: string;
    availability?: string;
  };
}) {
  const token = getAuthToken();
  if (!token) {
    throw new Error('You must be signed in as a freelancer to submit a pitch.');
  }
  const res = await fetch(`${API_BASE}/proposals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(proposalData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to submit proposal');
  return data.proposal;
}

// 6. Contracts & Direct Milestone Payment API (Direct Milestone Billing â€” 0% Escrow Custody)
export async function acceptProposalAndPayAdvance(proposalId: string) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/contracts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ proposalId, clientSignature: 'Approved & Signed via Direct Milestone Billing' }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to initialize contract and pay advance');
  return data;
}

export const acceptProposalAndFundEscrow = acceptProposalAndPayAdvance;

export async function fetchActiveContract() {
  const token = getAuthToken();
  if (!token) return { contract: null, milestones: [] };
  const res = await fetch(`${API_BASE}/contracts/active`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch active contract');
  return data;
}

export async function fetchMyContracts() {
  const token = getAuthToken();
  if (!token) return { contracts: [], milestones: [] };
  const res = await fetch(`${API_BASE}/contracts/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch contracts');
  return data;
}

export async function approveMilestoneDeliverable(milestoneId: string) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/milestones/${milestoneId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to approve deliverable');
  return data;
}

export const approveMilestoneDirect = approveMilestoneDeliverable;

export async function reportMilestonePayment(
  milestoneId: string,
  payload: {
    paymentMethod: string;
    paymentMethodDetails?: string;
    externalReference?: string;
    receiptFileUrl?: string;
    notes?: string;
  }
) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/milestones/${milestoneId}/payment/report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to record direct payment');
  return data;
}

export async function acknowledgeMilestonePayment(milestoneId: string) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/milestones/${milestoneId}/payment/acknowledge`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to acknowledge payment receipt');
  return data;
}

export async function disputeMilestonePayment(milestoneId: string, reason: string) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/milestones/${milestoneId}/payment/dispute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ reason }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to report payment discrepancy');
  return data;
}

export async function submitMilestoneDeliverable(milestoneId: string, payload: { fileUrls?: string[]; notes?: string }) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/milestones/${milestoneId}/deliverable`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to submit milestone deliverable');
  return data;
}

// 7. Live Chat API
export async function fetchChatMessages() {
  const token = getAuthToken();
  if (!token) return [];
  const res = await fetch(`${API_BASE}/messages`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch messages');
  return data.messages || [];
}

export async function sendChatMessage(text: string, recipientId?: string) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ text, recipientId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to send message');
  return data.message;
}

// 8. Centralized File Upload & Download API
export async function uploadFile(file: File, category = 'general', isPublic = false) {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  formData.append('isPublic', String(isPublic));

  const res = await fetch(`${API_BASE}/files/upload`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to upload file');
  return data.file;
}

// 9. Admin Moderation & Stats API
export async function fetchAdminStats() {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/admin/stats`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch admin statistics');
  return data.stats;
}

export async function fetchAdminUsers(page = 1, limit = 20, search = '') {
  const token = getAuthToken();
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set('search', search);

  const res = await fetch(`${API_BASE}/admin/users?${params.toString()}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch users');
  return data;
}

export async function toggleAdminUserVerify(userId: string) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/admin/users/${userId}/verify`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to toggle verification');
  return data;
}

// 10. Phase 9: Discovery, Intelligent Matching, Saved Items & Invitations API
export async function searchFreelancersApi(params: {
  q?: string;
  category?: string;
  skill?: string;
  industry?: string;
  minRate?: number;
  maxRate?: number;
  availability?: string;
  verifiedOnly?: boolean;
  briefId?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.category && params.category !== 'all') query.set('category', params.category);
  if (params.skill) query.set('skill', params.skill);
  if (params.industry) query.set('industry', params.industry);
  if (params.minRate) query.set('minRate', String(params.minRate));
  if (params.maxRate) query.set('maxRate', String(params.maxRate));
  if (params.availability && params.availability !== 'all') query.set('availability', params.availability);
  if (params.verifiedOnly) query.set('verifiedOnly', 'true');
  if (params.briefId) query.set('briefId', params.briefId);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const res = await fetch(`${API_BASE}/discovery/freelancers?${query.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to search freelancers');
  return data;
}

export async function searchProjectsApi(params: {
  q?: string;
  category?: string;
  skill?: string;
  industry?: string;
  minBudget?: number;
  maxBudget?: number;
  status?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.category && params.category !== 'all') query.set('category', params.category);
  if (params.skill) query.set('skill', params.skill);
  if (params.industry) query.set('industry', params.industry);
  if (params.minBudget) query.set('minBudget', String(params.minBudget));
  if (params.maxBudget) query.set('maxBudget', String(params.maxBudget));
  if (params.status && params.status !== 'all') query.set('status', params.status);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const res = await fetch(`${API_BASE}/discovery/projects?${query.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to search projects');
  return data;
}

export async function fetchBriefTalentMatch(briefId: string, freelancerId: string) {
  const res = await fetch(`${API_BASE}/discovery/match?briefId=${briefId}&freelancerId=${freelancerId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to evaluate compatibility');
  return data;
}

export async function saveFreelancerApi(freelancerId: string, notes?: string) {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${API_BASE}/saved/freelancers/${freelancerId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ notes }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to save freelancer');
  return data;
}

export async function removeSavedFreelancerApi(freelancerId: string) {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${API_BASE}/saved/freelancers/${freelancerId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to remove saved freelancer');
  return data;
}

export async function fetchSavedFreelancersApi() {
  const token = getAuthToken();
  if (!token) return [];
  const res = await fetch(`${API_BASE}/saved/freelancers`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch saved freelancers');
  return data.savedFreelancers || [];
}

export async function saveProjectApi(projectId: string, notes?: string) {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${API_BASE}/saved/projects/${projectId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ notes }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to save project');
  return data;
}

export async function removeSavedProjectApi(projectId: string) {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${API_BASE}/saved/projects/${projectId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to remove saved project');
  return data;
}

export async function fetchSavedProjectsApi() {
  const token = getAuthToken();
  if (!token) return [];
  const res = await fetch(`${API_BASE}/saved/projects`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch saved projects');
  return data.savedProjects || [];
}

export async function sendInvitationApi(briefId: string, freelancerId: string, message?: string) {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${API_BASE}/invitations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ briefId, freelancerId, message }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to send invitation');
  return data;
}

export async function fetchInvitationsApi(type: 'sent' | 'received' = 'received') {
  const token = getAuthToken();
  if (!token) return [];
  const res = await fetch(`${API_BASE}/invitations?type=${type}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch invitations');
  return data.invitations || [];
}

export async function acceptInvitationApi(id: string) {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${API_BASE}/invitations/${id}/accept`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to accept invitation');
  return data;
}

export async function declineInvitationApi(id: string) {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${API_BASE}/invitations/${id}/decline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to decline invitation');
  return data;
}

export async function cancelInvitationApi(id: string) {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${API_BASE}/invitations/${id}/cancel`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to cancel invitation');
  return data;
}

