# FLOXA WORK — Phase 10: Task Management Documentation

## 1. Overview
The Task Management engine allows project participants to break contractual milestone commitments into granular, trackable work items.

---

## 2. Task Model Specifications (`Task.model.ts`)
- `contractId`: ObjectId ref to Contract (Required, Indexed).
- `milestoneId`: ObjectId ref to Milestone (Optional, links task to milestone progress).
- `title`: String (Required, trimmed).
- `description`: String.
- `assignedTo`: ObjectId ref to User (Must be contract client or freelancer).
- `createdBy`: ObjectId ref to User.
- `priority`: `'low' | 'medium' | 'high' | 'urgent'` (Default: `'medium'`).
- `status`: `'todo' | 'in_progress' | 'in_review' | 'blocked' | 'completed'`.
- `dueDate`: Date (Indexed).
- `completedAt`: Date (Set automatically on transition to `'completed'`).
- `comments`: Array of `{ userId, userName, userAvatar, text, createdAt }`.
- `attachments`: Array of file URLs.
- `isArchived`: Boolean (Default: `false`).

---

## 3. Security & Validation Rules
1. **Contract Isolation:** A task can only be retrieved, modified, or commented on by verified participants of the associated contract (`403 Forbidden` for outsiders).
2. **Milestone Integrity:** If a task references a milestone, that milestone must belong to the same contract.
3. **Status Transitions:** Only valid enum statuses are permitted; invalid transitions are rejected with `400 Bad Request`.
4. **Automated Audit Logging:** Every task creation, status update, or completion automatically logs an event to `ContractActivity` and notifies assigned users.
