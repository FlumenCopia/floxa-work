'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  ExternalLink,
  Layers,
  CheckCircle2,
  Upload,
  AlertCircle,
  FileCheck,
  Send,
  X,
  Paperclip,
  ShieldCheck,
  CreditCard,
  Building,
  Check,
  AlertTriangle,
  Receipt,
  ListTodo,
  MessageSquare,
  FolderArchive,
  History,
  Flag,
  Plus,
  ChevronRight,
  Filter,
  User,
  Calendar,
  Sparkles,
  Download,
  FileText,
  CornerDownRight,
  Scale,
  Star,
  AlertOctagon,
  Image as ImageIcon,
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

const IMAGE_EXTENSIONS = /\.(png|jpe?g|webp|gif|svg|bmp)(\?.*)?$/i;

function renderChatMessage(content: string, isSelf: boolean) {
  if (!content) return null;
  const pattern = /(!?\[(?:File:\s*)?([^\]]+)\]\((https?:\/\/[^\s\)]+|\/[^\s\)]+)\))/gi;
  const match = pattern.exec(content);
  if (!match) {
    return <span>{content}</span>;
  }

  const name = match[2].trim();
  let url = match[3].trim();
  const isImage = IMAGE_EXTENSIONS.test(name) || IMAGE_EXTENSIONS.test(url.split('?')[0]);

  if (isImage) {
    let previewUrl = url;
    if (previewUrl.includes('/download')) {
      previewUrl = previewUrl.replace(/\/download(\?.*)?$/, '/view$1');
    }
    return (
      <div className="space-y-1.5 max-w-xs">
        <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-black/10 bg-black/5 hover:opacity-95 transition-opacity">
          <img src={previewUrl} alt={name} className="w-full max-h-48 object-cover rounded-xl" />
        </a>
        <div className="flex items-center justify-between text-[10px] opacity-80 px-1">
          <span className="truncate">{name}</span>
          <a href={url} download={name} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-0.5 ml-2 shrink-0">
            <Download size={10} />
            <span>Save</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 p-2 rounded-xl border max-w-xs ${isSelf ? 'bg-white/20 border-white/30 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
      <FileText size={16} className="shrink-0" />
      <div className="min-w-0 flex-1 text-[11px] font-medium truncate">{name}</div>
      <a href={url} download={name} target="_blank" rel="noopener noreferrer" className="p-1 hover:opacity-75 transition-opacity">
        <Download size={12} />
      </a>
    </div>
  );
}
import {
  fetchActiveContract,
  fetchWorkspaceDetailsApi,
  approveMilestoneDeliverable,
  submitMilestoneDeliverable,
  requestMilestoneRevisionApi,
  fetchContractTasksApi,
  createContractTaskApi,
  updateTaskApi,
  addTaskCommentApi,
  fetchContractActivityApi,
  fetchContractFilesApi,
  confirmProjectCloseoutApi,
  fetchContractMessagesApi,
  sendContractMessageApi,
  reportMilestonePayment,
  acknowledgeMilestonePayment,
  disputeMilestonePayment,
  uploadFile,
  getAuthUser,
  submitContractReviewApi,
  fetchContractReviewStatusApi,
  openContractDisputeApi,
  fetchContractDisputesApi,
  fetchDisputeDetailsApi,
  sendDisputeMessageApi,
  API_BASE,
} from '@/lib/api';

export const WorkspaceView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'milestones' | 'tasks' | 'discussion' | 'files' | 'activity' | 'closeout' | 'disputes' | 'reviews'>('milestones');
  const [activeMilestoneNum, setActiveMilestoneNum] = useState(1);
  const [workspaceData, setWorkspaceData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Deliverable Submission Modal State (Freelancer)
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isUploadingDeliverable, setIsUploadingDeliverable] = useState(false);
  const [submissionTitle, setSubmissionTitle] = useState('');
  const [deliverableNotes, setDeliverableNotes] = useState('');
  const [deliverableFileName, setDeliverableFileName] = useState('Deliverable_Handover_Bundle.zip');

  // Revision Request Modal State (Client)
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState('');

  // Record Payment Modal State (Client)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'upi' | 'razorpay_direct' | 'stripe_direct' | 'paypal' | 'other'>('bank_transfer');
  const [externalReference, setExternalReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [receiptFileUrl, setReceiptFileUrl] = useState('');

  // Dispute Modal State
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  // Task Management State
  const [tasks, setTasks] = useState<any[]>([]);
  const [taskFilterStatus, setTaskFilterStatus] = useState<string>('all');
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [activeTaskIdForComment, setActiveTaskIdForComment] = useState<string | null>(null);
  const [taskCommentText, setTaskCommentText] = useState('');

  // Discussion & Chat State
  const [discussionMessages, setDiscussionMessages] = useState<any[]>([]);
  const [newDiscussionText, setNewDiscussionText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Files & Activity State
  const [contractFiles, setContractFiles] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  // Closeout State
  const [closeoutNotes, setCloseoutNotes] = useState('');
  const [isConfirmingCloseout, setIsConfirmingCloseout] = useState(false);

  // Reviews State
  const [reviewStatus, setReviewStatus] = useState<any | null>(null);
  const [reviewForm, setReviewForm] = useState({
    overallRating: 5,
    communicationRating: 5,
    professionalismRating: 5,
    qualityRating: 5,
    reliabilityRating: 5,
    reviewText: '',
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Disputes State
  const [contractDisputes, setContractDisputes] = useState<any[]>([]);
  const [activeDisputeDetails, setActiveDisputeDetails] = useState<any | null>(null);
  const [disputeMessages, setDisputeMessages] = useState<any[]>([]);
  const [newDisputeMsg, setNewDisputeMsg] = useState('');
  const [isOpeningDispute, setIsOpeningDispute] = useState(false);
  const [disputeForm, setDisputeForm] = useState({
    category: 'deliverable_quality',
    title: '',
    description: '',
    desiredOutcome: '',
  });

  const currentUser = getAuthUser();
  const isClient = currentUser?.role === 'client';

  const loadWorkspace = async () => {
    setIsLoading(true);
    try {
      const active = await fetchActiveContract();
      if (active && active.contract) {
        const full = await fetchWorkspaceDetailsApi(active.contract._id || active.contract.id);
        setWorkspaceData(full);
        setTasks(full.tasks || []);
        setActivities(full.activities || []);
      } else {
        setWorkspaceData(null);
      }
    } catch {
      setWorkspaceData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, []);

  // Fetch tab-specific data on tab switch
  useEffect(() => {
    if (!workspaceData?.contract?._id) return;
    const contractId = workspaceData.contract._id;

    if (activeTab === 'tasks') {
      fetchContractTasksApi(contractId, { status: taskFilterStatus !== 'all' ? taskFilterStatus : undefined })
        .then((t) => setTasks(t))
        .catch(() => {});
    } else if (activeTab === 'discussion') {
      fetchContractMessagesApi(contractId)
        .then((m) => setDiscussionMessages(m))
        .catch(() => {});
    } else if (activeTab === 'files') {
      fetchContractFilesApi(contractId)
        .then((f) => setContractFiles(f))
        .catch(() => {});
    } else if (activeTab === 'activity') {
      fetchContractActivityApi(contractId)
        .then((a) => setActivities(a.activities || []))
        .catch(() => {});
    } else if (activeTab === 'reviews') {
      fetchContractReviewStatusApi(contractId)
        .then((r) => setReviewStatus(r))
        .catch(() => {});
    } else if (activeTab === 'disputes') {
      fetchContractDisputesApi(contractId)
        .then((d) => setContractDisputes(d.disputes || []))
        .catch(() => {});
    }
  }, [activeTab, taskFilterStatus, workspaceData?.contract?._id]);

  if (isLoading) {
    return (
      <div className="floxa-card py-16 text-center text-slate-500">
        <div className="inline-block animate-spin w-6 h-6 border-2 border-[#0084ff] border-t-transparent rounded-full mb-3" />
        <div className="text-xs font-medium">Loading live project collaboration workspace from database...</div>
      </div>
    );
  }

  if (!workspaceData || !workspaceData.contract) {
    return (
      <div className="floxa-card py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#0084ff]/10 border border-[#0084ff]/25 flex items-center justify-center mx-auto text-[#0084ff]">
          <Layers size={26} />
        </div>
        <div className="max-w-md mx-auto space-y-1.5">
          <h3 className="text-base font-bold text-slate-900">No Active Project Workspace</h3>
          <p className="text-xs text-slate-500 leading-relaxed font-normal">
            A dedicated project workspace is initialized when a client accepts a Mini-Discovery proposal and both parties sign the digital project agreement.
          </p>
        </div>
      </div>
    );
  }

  const { contract, milestones = [], paymentRecords = [], closeoutChecklist, taskStats } = workspaceData;
  const brief = contract.briefId || {};
  const clientInfo = contract.clientId || {};
  const freelancerInfo = contract.freelancerId || {};

  const currentMilestone =
    milestones.find((m: any) => m.milestoneNumber === activeMilestoneNum) || milestones[0];

  const deliverableStatus = currentMilestone?.deliverableStatus || 'in_progress';
  const paymentStatus = currentMilestone?.paymentStatus || 'not_recorded';

  const isDeliverableApproved = deliverableStatus === 'approved';
  const isDeliverableInReview = deliverableStatus === 'in_review';
  const isRevisionRequested = deliverableStatus === 'revision_requested';
  const isPaymentReported = paymentStatus === 'reported_by_client';
  const isPaymentAcknowledged = paymentStatus === 'acknowledged_by_freelancer';
  const isPaymentDisputed = paymentStatus === 'disputed';

  // 1. Deliverable Handover Submission (Freelancer)
  const handleSubmitDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMilestone) return;
    try {
      await submitMilestoneDeliverable(currentMilestone._id || currentMilestone.id, {
        title: submissionTitle || `Milestone ${currentMilestone.milestoneNumber} Deliverable Package`,
        fileUrls: [deliverableFileName],
        notes: deliverableNotes || 'Handover deliverables uploaded for client review.',
      });
      setIsSubmitModalOpen(false);
      setSubmissionTitle('');
      setDeliverableNotes('');
      setActionMessage({
        type: 'success',
        text: `Deliverable for Milestone ${currentMilestone.milestoneNumber} submitted! Client inspection window open.`,
      });
      await loadWorkspace();
    } catch (err: any) {
      alert(err.message || 'Failed to submit deliverable');
    }
  };

  // 2. Client Requests Revision
  const handleRequestRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMilestone || !revisionFeedback.trim()) return;
    try {
      await requestMilestoneRevisionApi(currentMilestone._id || currentMilestone.id, revisionFeedback);
      setIsRevisionModalOpen(false);
      setRevisionFeedback('');
      setActionMessage({
        type: 'success',
        text: `Revision requested for Milestone ${currentMilestone.milestoneNumber}. Freelancer notified.`,
      });
      await loadWorkspace();
    } catch (err: any) {
      alert(err.message || 'Failed to request revision');
    }
  };

  // 3. Deliverable Approval by Client
  const handleApproveDeliverable = async () => {
    if (!currentMilestone) return;
    setIsProcessing(true);
    setActionMessage(null);
    try {
      await approveMilestoneDeliverable(currentMilestone._id || currentMilestone.id);
      setActionMessage({
        type: 'success',
        text: `Milestone ${currentMilestone.milestoneNumber} deliverable approved! You can now arrange direct external payment with the freelancer.`,
      });
      await loadWorkspace();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to approve deliverable',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Client Reports Direct Payment
  const handleReportPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMilestone) return;
    setIsProcessing(true);
    try {
      await reportMilestonePayment(currentMilestone._id || currentMilestone.id, {
        paymentMethod,
        externalReference,
        notes: paymentNotes,
        receiptFileUrl,
      });
      setIsPaymentModalOpen(false);
      setExternalReference('');
      setPaymentNotes('');
      setReceiptFileUrl('');
      setActionMessage({
        type: 'success',
        text: `Direct payment reported for Milestone ${currentMilestone.milestoneNumber}. Freelancer notified to acknowledge receipt.`,
      });
      await loadWorkspace();
    } catch (err: any) {
      alert(err.message || 'Failed to record payment');
    } finally {
      setIsProcessing(false);
    }
  };

  // 5. Freelancer Acknowledges Direct Payment
  const handleAcknowledgePayment = async () => {
    if (!currentMilestone) return;
    setIsProcessing(true);
    try {
      await acknowledgeMilestonePayment(currentMilestone._id || currentMilestone.id);
      setActionMessage({
        type: 'success',
        text: `Confirmed! Payment receipt acknowledged for Milestone ${currentMilestone.milestoneNumber}.`,
      });
      await loadWorkspace();
    } catch (err: any) {
      alert(err.message || 'Failed to acknowledge payment');
    } finally {
      setIsProcessing(false);
    }
  };

  // 6. Dispute Payment
  const handleDisputePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMilestone || !disputeReason) return;
    setIsProcessing(true);
    try {
      await disputeMilestonePayment(currentMilestone._id || currentMilestone.id, disputeReason);
      setIsDisputeModalOpen(false);
      setDisputeReason('');
      setActionMessage({
        type: 'error',
        text: `Payment reported as disputed. Mediation channel opened.`,
      });
      await loadWorkspace();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to dispute payment',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 7. Create Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      await createContractTaskApi(contract._id, {
        title: newTaskTitle.trim(),
        description: newTaskDesc.trim(),
        priority: newTaskPriority,
        dueDate: newTaskDueDate || undefined,
        milestoneId: currentMilestone?._id || undefined,
      });
      setIsCreateTaskModalOpen(false);
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskDueDate('');
      const updatedTasks = await fetchContractTasksApi(contract._id);
      setTasks(updatedTasks);
    } catch (err: any) {
      alert(err.message || 'Failed to create task');
    }
  };

  // 8. Toggle Task Status
  const handleToggleTaskStatus = async (task: any) => {
    const nextStatus = task.status === 'completed' ? 'in_progress' : 'completed';
    try {
      await updateTaskApi(task._id, { status: nextStatus });
      const updatedTasks = await fetchContractTasksApi(contract._id);
      setTasks(updatedTasks);
    } catch (err: any) {
      alert(err.message || 'Failed to update task');
    }
  };

  // 9. Add Task Comment
  const handleAddTaskComment = async (taskId: string) => {
    if (!taskCommentText.trim()) return;
    try {
      await addTaskCommentApi(taskId, taskCommentText.trim());
      setTaskCommentText('');
      const updatedTasks = await fetchContractTasksApi(contract._id);
      setTasks(updatedTasks);
    } catch (err: any) {
      alert(err.message || 'Failed to add comment');
    }
  };

  // 10. Send Discussion Message
  const handleSendDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscussionText.trim()) return;
    setIsSendingMessage(true);
    try {
      const msg = await sendContractMessageApi(contract._id, newDiscussionText.trim());
      setDiscussionMessages((prev) => [...prev, msg]);
      setNewDiscussionText('');
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
    } finally {
      setIsSendingMessage(false);
    }
  };

  // 11. Confirm Closeout
  const handleConfirmCloseout = async () => {
    setIsConfirmingCloseout(true);
    try {
      await confirmProjectCloseoutApi(contract._id, closeoutNotes);
      setActionMessage({
        type: 'success',
        text: 'Closeout confirmed. Project status updated.',
      });
      await loadWorkspace();
    } catch (err: any) {
      alert(err.message || 'Failed to confirm closeout');
    } finally {
      setIsConfirmingCloseout(false);
    }
  };

  // 12. Phase 11 Reviews & Disputes Handlers
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract?._id) return;
    setIsSubmittingReview(true);
    setActionMessage(null);
    try {
      const res = await submitContractReviewApi(contract._id, reviewForm);
      setActionMessage({ type: 'success', text: res.message || 'Review submitted successfully!' });
      const status = await fetchContractReviewStatusApi(contract._id);
      setReviewStatus(status);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to submit review' });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleOpenDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract?._id) return;
    setIsOpeningDispute(true);
    setActionMessage(null);
    try {
      await openContractDisputeApi(contract._id, disputeForm);
      setActionMessage({ type: 'success', text: 'Dispute opened. Platform mediation initiated.' });
      setDisputeForm({ category: 'deliverable_quality', title: '', description: '', desiredOutcome: '' });
      const d = await fetchContractDisputesApi(contract._id);
      setContractDisputes(d.disputes || []);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to open dispute' });
    } finally {
      setIsOpeningDispute(false);
    }
  };

  const handleLoadDisputeDetails = async (disputeId: string) => {
    try {
      const res = await fetchDisputeDetailsApi(disputeId);
      setActiveDisputeDetails(res.dispute);
      setDisputeMessages(res.messages || []);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to load dispute' });
    }
  };

  const handleSendDisputeMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDisputeDetails?._id && !activeDisputeDetails?.id) return;
    const dispId = activeDisputeDetails._id || activeDisputeDetails.id;
    if (!newDisputeMsg.trim()) return;
    try {
      await sendDisputeMessageApi(dispId, newDisputeMsg.trim());
      setNewDisputeMsg('');
      const res = await fetchDisputeDetailsApi(dispId);
      setDisputeMessages(res.messages || []);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to send message' });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* 1. PROJECT WORKSPACE HEADER CARD */}
      <div className="floxa-card p-6 bg-gradient-to-r from-slate-900 to-slate-950 text-white rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#0084ff]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-[#0084ff] text-white tracking-wider">
                {contract.status === 'completed' ? 'Project Completed' : 'Active Collaboration Workspace'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Contract ID: {contract._id?.slice(-8)}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {brief.title || 'Client Project Agreement'}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Client:</span>
                <span className="font-semibold text-white">{clientInfo.name || 'Client'}</span>
              </div>
              <span className="text-slate-600">•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Specialist:</span>
                <span className="font-semibold text-white">{freelancerInfo.name || 'Specialist'}</span>
              </div>
              <span className="text-slate-600">•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Agreed Price:</span>
                <span className="font-mono font-bold text-[#0084ff]">
                  {formatCurrency(contract.totalBudget, contract.currency || 'USD')}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3.5 px-4 backdrop-blur-md">
            <div className="text-center px-2">
              <div className="text-lg font-black text-[#0084ff] font-mono">
                {milestones.filter((m: any) => m.deliverableStatus === 'approved').length}/{milestones.length}
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Milestones
              </div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center px-2">
              <div className="text-lg font-black text-emerald-400 font-mono">
                {taskStats?.completed || 0}/{taskStats?.total || 0}
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Tasks Done
              </div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center px-2">
              <div className="text-lg font-black text-indigo-400 font-mono">
                {closeoutChecklist?.isFullyClosed ? '100%' : closeoutChecklist?.isCloseoutReady ? '90%' : '50%'}
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Handover
              </div>
            </div>
          </div>
        </div>

        {/* Action Message Banner */}
        {actionMessage && (
          <div
            className={`mt-4 p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between ${
              actionMessage.type === 'success'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/15 border border-red-500/30 text-red-300'
            }`}
          >
            <span>{actionMessage.text}</span>
            <button onClick={() => setActionMessage(null)} className="opacity-70 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* 2. WORKSPACE TAB NAVIGATION */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 max-w-full min-w-0">
        <button
          onClick={() => setActiveTab('milestones')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'milestones'
              ? 'bg-[#0084ff] text-white shadow-md shadow-[#0084ff]/25'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Layers size={14} />
          <span>Milestones & Deliverables</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'tasks'
              ? 'bg-[#0084ff] text-white shadow-md shadow-[#0084ff]/25'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <ListTodo size={14} />
          <span>Task Board</span>
          {taskStats?.total > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/15">
              {taskStats.total}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('discussion')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'discussion'
              ? 'bg-[#0084ff] text-white shadow-md shadow-[#0084ff]/25'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <MessageSquare size={14} />
          <span>Discussion</span>
        </button>

        <button
          onClick={() => setActiveTab('files')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'files'
              ? 'bg-[#0084ff] text-white shadow-md shadow-[#0084ff]/25'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <FolderArchive size={14} />
          <span>Files & Vault</span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'activity'
              ? 'bg-[#0084ff] text-white shadow-md shadow-[#0084ff]/25'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <History size={14} />
          <span>Activity Timeline</span>
        </button>

        <button
          onClick={() => setActiveTab('closeout')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'closeout'
              ? 'bg-[#0084ff] text-white shadow-md shadow-[#0084ff]/25'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Flag size={14} />
          <span>Project Handover</span>
          {closeoutChecklist?.isCloseoutReady && !closeoutChecklist?.isFullyClosed && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'reviews'
              ? 'bg-[#0084ff] text-white shadow-md shadow-[#0084ff]/25'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Star size={14} />
          <span>Verified Review</span>
          {contract.status === 'completed' && (
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('disputes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'disputes'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/25'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Scale size={14} />
          <span>Disputes & Mediation</span>
          {contract.status === 'disputed' && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-red-100 text-red-700 font-bold">
              ACTIVE
            </span>
          )}
        </button>
      </div>

      {/* ========================================================
          TAB 1: MILESTONES & DELIVERABLES WORKFLOW
          ======================================================== */}
      {activeTab === 'milestones' && (
        <div className="space-y-6">
          {/* Milestone Selector Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {milestones.map((m: any) => {
              const isSelected = m.milestoneNumber === activeMilestoneNum;
              const isApproved = m.deliverableStatus === 'approved';
              const isInReview = m.deliverableStatus === 'in_review';
              const isRev = m.deliverableStatus === 'revision_requested';

              return (
                <button
                  key={m._id || m.id}
                  onClick={() => setActiveMilestoneNum(m.milestoneNumber)}
                  className={`p-4 rounded-2xl text-left border transition-all ${
                    isSelected
                      ? 'bg-white border-[#0084ff] ring-2 ring-[#0084ff]/20 shadow-md'
                      : 'bg-white/80 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-500">Milestone {m.milestoneNumber}</span>
                    <span className="font-mono text-[#0084ff]">{formatCurrency(m.amount, m.currency || contract.currency || 'USD')}</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 truncate mt-1">{m.title}</div>
                  <div className="mt-2 flex items-center gap-1.5">
                    {isApproved ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Deliverable Approved
                      </span>
                    ) : isRev ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        Revision Requested
                      </span>
                    ) : isInReview ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0084ff]/10 text-[#0084ff] border border-[#0084ff]/20 animate-pulse">
                        In Client Review
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        In Progress
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detailed Milestone Inspection Card */}
          {currentMilestone && (
            <div className="floxa-card p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#0084ff]">
                    Milestone {currentMilestone.milestoneNumber} of {milestones.length}
                  </span>
                  <h2 className="text-lg font-black text-slate-900 mt-0.5">
                    {currentMilestone.title}
                  </h2>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {currentMilestone.description || 'Full milestone deliverable execution.'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-black font-mono text-[#0084ff]">
                    {formatCurrency(currentMilestone.amount, currentMilestone.currency || contract.currency || 'USD')}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">Contractual Value</div>
                </div>
              </div>

              {/* TWO SEPARATE STATE MACHINES: DELIVERABLE STATE vs EXTERNAL PAYMENT STATE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* DELIVERABLE WORKFLOW BOX */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">1. Deliverable Review State</span>
                    <span
                      className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
                        isDeliverableApproved
                          ? 'bg-emerald-100 text-emerald-800'
                          : isRevisionRequested
                          ? 'bg-amber-100 text-amber-800'
                          : isDeliverableInReview
                          ? 'bg-[#0084ff]/15 text-[#0084ff]'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {deliverableStatus.toUpperCase().replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {isDeliverableApproved
                      ? 'Deliverable accepted and approved by the client.'
                      : isRevisionRequested
                      ? 'Client requested adjustments. See revision feedback below.'
                      : isDeliverableInReview
                      ? 'Deliverable package is currently under client review.'
                      : 'Specialist is actively developing this milestone.'}
                  </p>

                  {/* Actions for Deliverable */}
                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    {!isClient && (
                      <button
                        onClick={() => setIsSubmitModalOpen(true)}
                        className="btn-cyan-pill text-xs px-4 py-2"
                      >
                        <Upload size={13} />
                        <span>
                          {currentMilestone.submissions?.length > 0 ? 'Resubmit Revision' : 'Submit Deliverable'}
                        </span>
                      </button>
                    )}

                    {isClient && isDeliverableInReview && (
                      <>
                        <button
                          onClick={handleApproveDeliverable}
                          disabled={isProcessing}
                          className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                        >
                          <Check size={14} />
                          <span>Approve Deliverable</span>
                        </button>
                        <button
                          onClick={() => setIsRevisionModalOpen(true)}
                          className="px-4 py-2 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                        >
                          <AlertTriangle size={14} />
                          <span>Request Revision</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* PAYMENT SETTLEMENT BOX (0% PLATFORM CUSTODY) */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">2. Direct Payment Settlement</span>
                    <span
                      className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
                        isPaymentAcknowledged
                          ? 'bg-emerald-100 text-emerald-800'
                          : isPaymentReported
                          ? 'bg-[#0084ff]/15 text-[#0084ff]'
                          : isPaymentDisputed
                          ? 'bg-red-100 text-red-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {paymentStatus.toUpperCase().replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {isPaymentAcknowledged
                      ? 'Freelancer confirmed payment receipt in their external account.'
                      : isPaymentReported
                      ? 'Client recorded external payment. Awaiting freelancer confirmation.'
                      : isPaymentDisputed
                      ? 'Payment record marked disputed.'
                      : 'Direct payment to be settled via bank transfer, UPI, or direct Stripe invoice.'}
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    {isClient && !isPaymentAcknowledged && (
                      <button
                        onClick={() => setIsPaymentModalOpen(true)}
                        className="btn-cyan-pill text-xs px-4 py-2"
                      >
                        <Receipt size={13} />
                        <span>Record Direct Payment</span>
                      </button>
                    )}

                    {!isClient && isPaymentReported && (
                      <>
                        <button
                          onClick={handleAcknowledgePayment}
                          disabled={isProcessing}
                          className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                        >
                          <CheckCircle2 size={14} />
                          <span>Confirm Receipt</span>
                        </button>
                        <button
                          onClick={() => setIsDisputeModalOpen(true)}
                          className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                        >
                          <AlertCircle size={14} />
                          <span>Dispute</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* SUBMISSION VERSION HISTORY (Preserved without overwriting) */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <History size={14} className="text-[#0084ff]" />
                  <span>Deliverable Submissions & Revision History</span>
                </h3>

                {currentMilestone.submissions && currentMilestone.submissions.length > 0 ? (
                  <div className="space-y-2.5">
                    {currentMilestone.submissions.map((sub: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs space-y-1.5 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-[#0084ff]">
                            Version {sub.version || idx + 1}: {sub.title || 'Deliverable Package'}
                          </span>
                          <span className="text-[10.5px] text-slate-400 font-mono">
                            {new Date(sub.submittedAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-slate-700 leading-relaxed font-normal">{sub.notes}</p>
                        <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
                          <Paperclip size={12} />
                          <span>Files: {(sub.fileUrls || []).join(', ')}</span>
                          {sub.reviewStatus && (
                            <span className="ml-auto font-bold uppercase text-[10px]">
                              Status: {sub.reviewStatus}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 text-slate-500 text-xs text-center border border-dashed border-slate-200">
                    No deliverables submitted for this milestone yet.
                  </div>
                )}

                {/* Revision requests list */}
                {currentMilestone.revisionRequests && currentMilestone.revisionRequests.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-amber-800">Client Feedback Requests:</span>
                    {currentMilestone.revisionRequests.map((rev: any, rIdx: number) => (
                      <div
                        key={rIdx}
                        className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1"
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span>Revision Request #{rIdx + 1}</span>
                          <span className="text-[10px] font-mono text-amber-700">
                            {new Date(rev.requestedAt).toLocaleString()}
                          </span>
                        </div>
                        <p>{rev.feedback}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 2: TASK MANAGEMENT BOARD
          ======================================================== */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Filter Status:</span>
              <select
                value={taskFilterStatus}
                onChange={(e) => setTaskFilterStatus(e.target.value)}
                className="text-xs p-1.5 px-3 rounded-xl border border-slate-200 bg-white font-medium"
              >
                <option value="all">All Tasks</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <button
              onClick={() => setIsCreateTaskModalOpen(true)}
              className="btn-cyan-pill text-xs px-4 py-2 inline-flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Create Task</span>
            </button>
          </div>

          {tasks.length === 0 ? (
            <div className="floxa-card py-16 text-center space-y-3">
              <ListTodo size={32} className="mx-auto text-slate-300" />
              <div className="text-sm font-bold text-slate-800">No Project Tasks Yet</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Break milestone objectives down into actionable tasks to track team progress.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {tasks.map((task) => (
                <div
                  key={task._id || task.id}
                  className="floxa-card p-4 space-y-3 hover:border-slate-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleTaskStatus(task)}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          task.status === 'completed'
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 hover:border-[#0084ff]'
                        }`}
                      >
                        {task.status === 'completed' && <Check size={12} />}
                      </button>
                      <h4
                        className={`text-sm font-bold ${
                          task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {task.title}
                      </h4>
                    </div>

                    <span
                      className={`text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        task.priority === 'urgent'
                          ? 'bg-red-100 text-red-700'
                          : task.priority === 'high'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>

                  {task.description && (
                    <p className="text-xs text-slate-600 leading-relaxed font-normal pl-7">
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500 pl-7">
                    <div className="flex items-center gap-3">
                      {task.dueDate && (
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar size={12} />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      <span className="capitalize">{task.status.replace('_', ' ')}</span>
                    </div>

                    <button
                      onClick={() =>
                        setActiveTaskIdForComment(
                          activeTaskIdForComment === task._id ? null : task._id
                        )
                      }
                      className="text-[#0084ff] font-bold hover:underline flex items-center gap-1"
                    >
                      <MessageSquare size={12} />
                      <span>{task.comments?.length || 0} Comments</span>
                    </button>
                  </div>

                  {/* Task Comments Accordion */}
                  {activeTaskIdForComment === task._id && (
                    <div className="pt-2 pl-7 space-y-2 border-t border-slate-100">
                      {(task.comments || []).map((c: any, cIdx: number) => (
                        <div key={cIdx} className="p-2 rounded-lg bg-slate-50 text-[11px] space-y-0.5">
                          <div className="flex items-center justify-between font-bold text-slate-800">
                            <span>{c.userName || 'Team member'}</span>
                            <span className="text-[9.5px] text-slate-400 font-mono">
                              {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-slate-600">{c.text}</p>
                        </div>
                      ))}

                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          placeholder="Add comment..."
                          value={taskCommentText}
                          onChange={(e) => setTaskCommentText(e.target.value)}
                          className="flex-1 text-xs p-1.5 px-2.5 rounded-lg border border-slate-200"
                        />
                        <button
                          onClick={() => handleAddTaskComment(task._id)}
                          className="btn-cyan-pill text-[11px] px-3 py-1.5"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 3: PROJECT DISCUSSION (CONTRACT SCOPED)
          ======================================================== */}
      {activeTab === 'discussion' && (
        <div className="floxa-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Project Workspace Channel</h3>
              <p className="text-xs text-slate-500">Private encrypted discussion between client and specialist.</p>
            </div>
            <span className="text-xs font-mono text-emerald-600 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Contract Room Active
            </span>
          </div>

          <div className="h-80 overflow-y-auto space-y-3 p-3 bg-slate-50/60 rounded-2xl border border-slate-200">
            {discussionMessages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Start discussion regarding milestone deliverables or technical questions.
              </div>
            ) : (
              discussionMessages.map((msg: any) => {
                const isSelf = msg.senderId?._id === currentUser?.id || msg.senderId === currentUser?.id;
                return (
                  <div
                    key={msg._id || msg.id}
                    className={`flex flex-col max-w-md ${isSelf ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium mb-1">
                      <span>{msg.senderId?.name || (isSelf ? 'You' : 'Counterpart')}</span>
                      <span>•</span>
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        isSelf
                          ? 'bg-[#0084ff] text-white rounded-br-none shadow-sm'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'
                      }`}
                    >
                      {renderChatMessage(msg.text, isSelf)}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={handleSendDiscussion} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Post a message in this contract room..."
              value={newDiscussionText}
              onChange={(e) => setNewDiscussionText(e.target.value)}
              className="flex-1 p-2.5 px-4 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0084ff]/20 bg-white"
            />
            <button
              type="submit"
              disabled={isSendingMessage || !newDiscussionText.trim()}
              className="btn-cyan-pill text-xs px-5 py-2.5"
            >
              <Send size={13} />
              <span>Send</span>
            </button>
          </form>
        </div>
      )}

      {/* ========================================================
          TAB 4: DELIVERABLES & FILES VAULT
          ======================================================== */}
      {activeTab === 'files' && (
        <div className="floxa-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Project Files Vault</h3>
              <p className="text-xs text-slate-500">Secure resource-level protected deliverables and handover packages.</p>
            </div>
            <span className="text-xs text-slate-500 font-mono font-medium">
              {contractFiles.length} Total Files
            </span>
          </div>

          {contractFiles.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <FolderArchive size={32} className="mx-auto text-slate-300" />
              <div className="text-sm font-bold text-slate-800">No Files Uploaded Yet</div>
              <p className="text-xs text-slate-500">
                Files uploaded during milestone deliverable submissions will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {contractFiles.map((f, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#0084ff]/10 text-[#0084ff] flex items-center justify-center shrink-0">
                      <FileText size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {f.filename}
                      </div>
                      <div className="text-[10px] text-slate-400 capitalize">
                        Source: {f.source.replace('_', ' ')}
                      </div>
                    </div>
                  </div>

                  <a
                    href={`${API_BASE}/files/${encodeURIComponent(f.filename)}/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-[#0084ff] shrink-0"
                    title="Secure Download"
                  >
                    <Download size={14} />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 5: ACTIVITY TIMELINE
          ======================================================== */}
      {activeTab === 'activity' && (
        <div className="floxa-card p-6 space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Project Audit & Activity Log</h3>
            <p className="text-xs text-slate-500">Chronological history of milestone submissions, reviews, and closeout actions.</p>
          </div>

          {activities.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              No project activities recorded yet.
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              {activities.map((act) => (
                <div key={act._id || act.id} className="relative space-y-1">
                  <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[#0084ff] ring-4 ring-white" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">{act.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(act.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">{act.details}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 6: PROJECT CLOSEOUT & HANDOVER
          ======================================================== */}
      {activeTab === 'closeout' && (
        <div className="floxa-card p-6 space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Project Handover & Closeout Verification</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Formal project completion requires dual confirmation from both client and freelancer.
            </p>
          </div>

          {/* Checklist */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
            <span className="font-extrabold uppercase tracking-wider text-slate-700">Closeout Checklist</span>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2
                  size={15}
                  className={closeoutChecklist?.allMilestonesApproved ? 'text-emerald-600' : 'text-slate-300'}
                />
                <span className={closeoutChecklist?.allMilestonesApproved ? 'text-slate-900 font-medium' : 'text-slate-500'}>
                  All contractual milestones have been approved
                </span>
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2
                  size={15}
                  className={!closeoutChecklist?.hasUnresolvedRevisions ? 'text-emerald-600' : 'text-slate-300'}
                />
                <span className={!closeoutChecklist?.hasUnresolvedRevisions ? 'text-slate-900 font-medium' : 'text-slate-500'}>
                  No outstanding revision requests remain open
                </span>
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2
                  size={15}
                  className={closeoutChecklist?.clientCloseoutConfirmed ? 'text-emerald-600' : 'text-slate-300'}
                />
                <span className={closeoutChecklist?.clientCloseoutConfirmed ? 'text-slate-900 font-medium' : 'text-slate-500'}>
                  Client handover confirmation:{' '}
                  {closeoutChecklist?.clientCloseoutConfirmed ? 'Confirmed ✓' : 'Pending'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2
                  size={15}
                  className={closeoutChecklist?.freelancerCloseoutConfirmed ? 'text-emerald-600' : 'text-slate-300'}
                />
                <span className={closeoutChecklist?.freelancerCloseoutConfirmed ? 'text-slate-900 font-medium' : 'text-slate-500'}>
                  Freelancer work completion confirmation:{' '}
                  {closeoutChecklist?.freelancerCloseoutConfirmed ? 'Confirmed ✓' : 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Dual Confirmation Status */}
          {closeoutChecklist?.isFullyClosed ? (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg">
                <Check size={24} strokeWidth={3} />
              </div>
              <h4 className="text-base font-black text-emerald-900">Project Agreement Successfully Completed</h4>
              <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
                Both parties have formally confirmed final deliverable handover. All external financial arrangements have been coordinated directly.
              </p>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <label className="block text-xs font-bold text-slate-800">
                Confirm Handover & Leave Closeout Statement:
              </label>
              <textarea
                rows={3}
                placeholder={
                  isClient
                    ? 'Confirm all project source files, credentials, and documentation have been received.'
                    : 'Confirm all required deliverables and documentation have been transferred.'
                }
                value={closeoutNotes}
                onChange={(e) => setCloseoutNotes(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0084ff]/20 bg-white"
              />

              <button
                onClick={handleConfirmCloseout}
                disabled={isConfirmingCloseout}
                className="btn-cyan-pill text-xs px-6 py-2.5 font-bold"
              >
                <CheckCircle2 size={15} />
                <span>
                  {isClient ? 'Confirm Client Handover' : 'Confirm Freelancer Completion'}
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 7: VERIFIED REVIEWS & DOUBLE-BLIND REPUTATION (PHASE 11)
          ======================================================== */}
      {activeTab === 'reviews' && (
        <div className="floxa-card p-6 space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Star size={16} className="text-amber-500" fill="#f59e0b" />
                <span>Verified Contract Reviews & Feedback</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cryptographically anchored reviews with double-blind publication to eliminate retaliatory ratings.
              </p>
            </div>
            {reviewStatus?.isMutualPublished && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Mutual Reviews Published ✓
              </span>
            )}
          </div>

          {contract.status !== 'completed' ? (
            <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-3">
              <ShieldCheck size={36} className="mx-auto text-slate-400" />
              <h4 className="text-sm font-bold text-slate-800">Review Window Unlocks Upon Completion</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                To guarantee genuine proof-of-work integrity, reviews can only be submitted after both client and freelancer confirm final project closeout. Current status: <strong className="uppercase">{contract.status}</strong>.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Double-Blind Status Banner */}
              <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-[#0084ff]" />
                  <span>Double-Blind Anti-Retaliation Policy</span>
                </div>
                <p className="leading-relaxed">
                  Neither participant can read the other’s review until both have submitted theirs, or the submission window concludes. This guarantees authentic, unbiased professional feedback.
                </p>
              </div>

              {/* Review Submission Form */}
              {!reviewStatus?.myReviewSubmitted ? (
                <form onSubmit={handleSubmitReview} className="space-y-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                    Submit Your Verified Evaluation
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Overall Rating</label>
                      <select
                        value={reviewForm.overallRating}
                        onChange={(e) => setReviewForm({ ...reviewForm, overallRating: Number(e.target.value) })}
                        className="w-full p-2 rounded-lg border border-slate-200 text-xs font-semibold"
                      >
                        <option value={5}>5 - Exceptional</option>
                        <option value={4}>4 - Very Good</option>
                        <option value={3}>3 - Satisfactory</option>
                        <option value={2}>2 - Needs Improvement</option>
                        <option value={1}>1 - Unsatisfactory</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Communication</label>
                      <select
                        value={reviewForm.communicationRating}
                        onChange={(e) => setReviewForm({ ...reviewForm, communicationRating: Number(e.target.value) })}
                        className="w-full p-2 rounded-lg border border-slate-200 text-xs font-semibold"
                      >
                        <option value={5}>5 / 5</option>
                        <option value={4}>4 / 5</option>
                        <option value={3}>3 / 5</option>
                        <option value={2}>2 / 5</option>
                        <option value={1}>1 / 5</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Quality</label>
                      <select
                        value={reviewForm.qualityRating}
                        onChange={(e) => setReviewForm({ ...reviewForm, qualityRating: Number(e.target.value) })}
                        className="w-full p-2 rounded-lg border border-slate-200 text-xs font-semibold"
                      >
                        <option value={5}>5 / 5</option>
                        <option value={4}>4 / 5</option>
                        <option value={3}>3 / 5</option>
                        <option value={2}>2 / 5</option>
                        <option value={1}>1 / 5</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Reliability</label>
                      <select
                        value={reviewForm.reliabilityRating}
                        onChange={(e) => setReviewForm({ ...reviewForm, reliabilityRating: Number(e.target.value) })}
                        className="w-full p-2 rounded-lg border border-slate-200 text-xs font-semibold"
                      >
                        <option value={5}>5 / 5</option>
                        <option value={4}>4 / 5</option>
                        <option value={3}>3 / 5</option>
                        <option value={2}>2 / 5</option>
                        <option value={1}>1 / 5</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Professionalism</label>
                      <select
                        value={reviewForm.professionalismRating}
                        onChange={(e) => setReviewForm({ ...reviewForm, professionalismRating: Number(e.target.value) })}
                        className="w-full p-2 rounded-lg border border-slate-200 text-xs font-semibold"
                      >
                        <option value={5}>5 / 5</option>
                        <option value={4}>4 / 5</option>
                        <option value={3}>3 / 5</option>
                        <option value={2}>2 / 5</option>
                        <option value={1}>1 / 5</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Professional Evaluation Statement (Min 10 characters)
                    </label>
                    <textarea
                      rows={4}
                      value={reviewForm.reviewText}
                      onChange={(e) => setReviewForm({ ...reviewForm, reviewText: e.target.value })}
                      placeholder="Detail your collaboration experience, delivery quality, timeliness, and communication..."
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#0084ff]/20"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingReview || reviewForm.reviewText.trim().length < 10}
                    className="btn-cyan-pill text-xs px-6 py-2.5 font-bold"
                  >
                    <Star size={14} />
                    <span>Submit Verified Review</span>
                  </button>
                </form>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 size={16} />
                    <span>You have submitted your verified review for this contract.</span>
                  </div>
                  {!reviewStatus?.counterpartReviewSubmitted && (
                    <p className="text-xs text-emerald-700">
                      Your counterpart has not yet submitted theirs. Review contents will remain double-blind until they do.
                    </p>
                  )}
                </div>
              )}

              {/* Published Mutual Reviews Display */}
              {reviewStatus?.isMutualPublished && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {reviewStatus.myReview && (
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span>Your Submitted Review</span>
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star size={13} fill="#f59e0b" />
                          <span>{reviewStatus.myReview.overallRating} / 5</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                        &ldquo;{reviewStatus.myReview.reviewText}&rdquo;
                      </p>
                    </div>
                  )}

                  {reviewStatus.counterpartReview && (
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span>Counterpart Review for You</span>
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star size={13} fill="#f59e0b" />
                          <span>{reviewStatus.counterpartReview.overallRating} / 5</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                        &ldquo;{reviewStatus.counterpartReview.reviewText}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 8: DISPUTE RESOLUTION & EVIDENCE MEDIATION (PHASE 11)
          ======================================================== */}
      {activeTab === 'disputes' && (
        <div className="floxa-card p-6 space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Scale size={16} className="text-red-600" />
                <span>Project Dispute Resolution & Mediation Thread</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Structured evidence review and platform mediation for project disagreements.
              </p>
            </div>
            {contract.status === 'disputed' && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                Dispute Active
              </span>
            )}
          </div>

          {/* Non-Custodial Legal Notice */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertOctagon size={14} className="text-amber-600" />
              <span>Non-Custodial Direct Settlement Disclosure</span>
            </div>
            <p className="leading-relaxed">
              FLOXA Work is a direct settlement coordinator and does not hold user funds in escrow. Dispute resolution provides platform mediation, factual review, and conduct evaluation.
            </p>
          </div>

          {/* Active Dispute Thread or Dispute Creator */}
          {activeDisputeDetails ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{activeDisputeDetails.title}</h4>
                  <div className="text-[11px] text-slate-500">Category: <span className="font-mono font-semibold uppercase">{activeDisputeDetails.category}</span></div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-800 uppercase">
                  Status: {activeDisputeDetails.status}
                </span>
              </div>

              {/* Dispute Message Thread */}
              <div className="space-y-3 max-h-96 overflow-y-auto p-4 rounded-xl bg-slate-50/50 border border-slate-200">
                {disputeMessages.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">No messages in dispute thread yet.</div>
                ) : (
                  disputeMessages.map((msg: any) => (
                    <div key={msg._id || msg.id} className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-800">{msg.senderId?.name || 'Participant'}</span>
                        <span className="text-slate-400 font-mono">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-xs text-slate-700 leading-relaxed">{renderChatMessage(msg.text, false)}</div>
                    </div>
                  ))
                )}
              </div>

              {/* Post Dispute Message */}
              <form onSubmit={handleSendDisputeMessage} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Post response or additional context to the dispute thread..."
                  value={newDisputeMsg}
                  onChange={(e) => setNewDisputeMsg(e.target.value)}
                  className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs"
                />
                <button type="submit" className="btn-cyan-pill text-xs px-5 py-2 font-bold">
                  Send
                </button>
              </form>
            </div>
          ) : contractDisputes.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">Active Contract Disputes</h4>
              {contractDisputes.map((disp: any) => (
                <div key={disp._id || disp.id} className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-bold text-slate-900">{disp.title}</h5>
                    <div className="text-xs text-slate-500 font-mono">Status: {disp.status} | Category: {disp.category}</div>
                  </div>
                  <button
                    onClick={() => handleLoadDisputeDetails(disp._id || disp.id)}
                    className="btn-cyan-pill text-xs px-4 py-1.5 font-bold"
                  >
                    Open Thread
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={handleOpenDispute} className="space-y-4 p-5 rounded-2xl bg-white border border-slate-200">
              <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                Initiate Project Mediation & Dispute
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Dispute Category</label>
                  <select
                    value={disputeForm.category}
                    onChange={(e) => setDisputeForm({ ...disputeForm, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  >
                    <option value="deliverable_quality">Deliverable Quality Disagreement</option>
                    <option value="scope_disagreement">Scope of Work Disagreement</option>
                    <option value="missed_deadlines">Missed Deadlines & Delays</option>
                    <option value="communication_conduct">Communication / Unprofessional Conduct</option>
                    <option value="payment_disagreement">External Payment Reconciliation Issue</option>
                    <option value="commitment_breach">Breach of Commitments</option>
                    <option value="other">Other Issue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Dispute Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Incomplete revision deliverables on Milestone 2"
                    value={disputeForm.title}
                    onChange={(e) => setDisputeForm({ ...disputeForm, title: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Detailed Description of Disagreement</label>
                <textarea
                  rows={4}
                  placeholder="Clearly explain the facts, timeline, missed milestones, or quality issues..."
                  value={disputeForm.description}
                  onChange={(e) => setDisputeForm({ ...disputeForm, description: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-red-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Desired Outcome</label>
                <input
                  type="text"
                  placeholder="e.g. Deliverable revision without additional charges or mutual agreement cancellation"
                  value={disputeForm.desiredOutcome}
                  onChange={(e) => setDisputeForm({ ...disputeForm, desiredOutcome: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isOpeningDispute || !disputeForm.title || !disputeForm.description}
                className="px-6 py-2.5 rounded-full text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                Submit Dispute for Platform Mediation
              </button>
            </form>
          )}
        </div>
      )}

      {/* ========================================================
          MODALS FOR WORKFLOW ACTIONS
          ======================================================== */}
      {/* Modal: Deliverable Handover Submission */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Submit Milestone {currentMilestone.milestoneNumber} Deliverable
              </h3>
              <button onClick={() => setIsSubmitModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitDeliverable} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Package Title</label>
                <input
                  type="text"
                  placeholder="e.g. Design Tokens & Typography v1"
                  value={submissionTitle}
                  onChange={(e) => setSubmissionTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deliverable File</label>
                <input
                  type="text"
                  value={deliverableFileName}
                  onChange={(e) => setDeliverableFileName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Submission Notes</label>
                <textarea
                  rows={3}
                  placeholder="Describe included assets, documentation links, and instructions..."
                  value={deliverableNotes}
                  onChange={(e) => setDeliverableNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-cyan-pill text-xs px-5 py-2">
                  Submit Deliverable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Revision Request */}
      {isRevisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Request Changes for Milestone {currentMilestone.milestoneNumber}
              </h3>
              <button onClick={() => setIsRevisionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRequestRevision} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Required Changes & Clear Explanation:
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Specify exact adjustments needed before deliverable approval..."
                  value={revisionFeedback}
                  onChange={(e) => setRevisionFeedback(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRevisionModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md">
                  Send Revision Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Task */}
      {isCreateTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Create New Project Task</h3>
              <button onClick={() => setIsCreateTaskModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Audit typography tokens for contrast"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Task details and acceptance checklist..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e: any) => setNewTaskPriority(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateTaskModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-cyan-pill text-xs px-5 py-2">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Client Records External Payment */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Record Direct Payment for Milestone {currentMilestone.milestoneNumber}
              </h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleReportPayment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">External Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e: any) => setPaymentMethod(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white"
                >
                  <option value="bank_transfer">Direct Bank Transfer (NEFT/RTGS/Wire)</option>
                  <option value="upi">UPI (GPay, PhonePe, Paytm)</option>
                  <option value="stripe_direct">Direct Stripe Invoice</option>
                  <option value="razorpay_direct">Direct Razorpay Link</option>
                  <option value="paypal">PayPal</option>
                  <option value="other">Other Mutually Agreed Method</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">UTR / External Reference ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UTR-20261114-88492"
                  value={externalReference}
                  onChange={(e) => setExternalReference(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Notes for the freelancer..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button type="submit" disabled={isProcessing} className="btn-cyan-pill text-xs px-5 py-2">
                  Confirm Payment Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Dispute Payment */}
      {isDisputeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-red-600">Dispute Payment Record</h3>
              <button onClick={() => setIsDisputeModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            {/* Non-Custodial Disclosure */}
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-xs text-amber-800">
                <AlertCircle size={13} />
                <span>Non-Custodial Mediation Notice</span>
              </div>
              <p className="text-slate-600">
                FLOXA Work does not hold or escrow funds. Reporting an unreceived payment pauses milestone signoff and alerts platform moderation to review UTR / transfer evidence with both parties.
              </p>
            </div>

            <form onSubmit={handleDisputePayment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dispute Explanation</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain why this payment record does not match received funds in your account..."
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDisputeModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md">
                  Submit Dispute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
