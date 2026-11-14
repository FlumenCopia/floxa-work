export const API_BASE = 'http://localhost:5001/api';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('floxa_work_jwt');
}

export function setAuthSession(token: string, user: any) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('floxa_work_jwt', token);
  localStorage.setItem('floxa_work_user', JSON.stringify(user));
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('floxa_work_jwt');
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
  setAuthSession(data.token, data.user);
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
  setAuthSession(data.token, data.user);
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

export async function submitProposal(proposalData: {
  briefId: string;
  diagnosticAnswers: { question: string; answer: string }[];
  strategicSliders?: { key: string; value: number }[];
  proposedMilestones: { title: string; description?: string; amount: number; estimatedDays?: number; deliveryDays?: number }[];
  totalPrice: number;
  estimatedDays: number;
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

export async function approveMilestoneDirect(milestoneId: string) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/milestones/${milestoneId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to approve milestone and pay talent');
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

