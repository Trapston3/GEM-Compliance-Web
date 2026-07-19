'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Grid, 
  BarChart3, 
  Plus, 
  Mail, 
  Edit2, 
  Trash2, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  AlertTriangle,
  Loader2,
  FileText,
  Search,
  Upload,
  Send,
  Info
} from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { addBidder, updateBidder, deleteBidder, updateBidderStatus, markBidderAsDraftedSent } from '@/app/actions/bidder';
import { buildEmailBody, getBidderFlaggedSummary } from '@/lib/emailBuilder';
import { useRouter } from 'next/navigation';
import { Button, Badge, Card, EmptyState, Input, Textarea } from '@/components/ui/primitives';
import BidderImportModal from '@/components/bidders/BidderImportModal';
import * as XLSX from 'xlsx';

interface Status {
  id: number;
  bidderId: number;
  checklistItemId: number;
  status: string;
  updatedAt: Date;
  updatedBy: number | null;
}

interface Bidder {
  id: number;
  tenderId: number;
  name: string;
  email: string;
  contactPerson: string;
  phone: string;
  createdAt: Date;
  statuses: Status[];
  lastDraftedSentAt?: string | Date | null;
  lastDraftedSentBy?: number | null;
  lastDraftedSentByName?: string | null;
}

interface ChecklistItem {
  id: number;
  tenderId: number;
  label: string;
  category: string;
  groupOrder: number;
  sortOrder: number;
  createdAt: Date;
}

interface DeviationTextInputProps {
  bidderId: number;
  itemId: number;
  initialValue: string;
  onSave: (bidderId: number, itemId: number, value: string) => void;
}

function DeviationTextInput({ bidderId, itemId, initialValue, onSave }: DeviationTextInputProps) {
  const [val, setVal] = useState(initialValue);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVal(initialValue);
  }, [initialValue]);

  const handleSave = () => {
    if (val !== initialValue) {
      onSave(bidderId, itemId, val);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <input
      type="text"
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      className="w-full text-xs p-1.5 bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] outline-none focus:border-[var(--brand-primary)] font-medium placeholder:text-[var(--text-muted)]"
      placeholder="Type custom deviations..."
    />
  );
}

interface DashboardProps {
  view: 'overview' | 'bidders' | 'matrix';
  tender: {
    id: number;
    name: string;
    subjectLine: string | null;
  };
  bidders: Bidder[];
  checklistItems: ChecklistItem[];
  currentUser: {
    id: string;
    nameHi: string;
    nameEn: string;
    phone: string;
    email: string;
    role: string;
  };
}

export default function Dashboard({ view, tender, bidders: initialBidders, checklistItems, currentUser }: DashboardProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [bidders, setBidders] = useState<Bidder[]>(initialBidders);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBidders(initialBidders);
  }, [initialBidders]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddingBidder, setIsAddingBidder] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [editingBidder, setEditingBidder] = useState<Bidder | null>(null);
  const [deletingBidder, setDeletingBidder] = useState<Bidder | null>(null);
  const [emailBidder, setEmailBidder] = useState<Bidder | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Bidder Form State
  const [bidderName, setBidderName] = useState('');
  const [bidderEmail, setBidderEmail] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [bidderPhone, setBidderPhone] = useState('');

  // Email Draft Form State
  const [draftSubject, setDraftSubject] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [draftSummary, setDraftSummary] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [confirmResend, setConfirmResend] = useState(false);

  const isRecentlyDraftedSent = useMemo(() => {
    if (!emailBidder?.lastDraftedSentAt) return false;
    const lastSent = new Date(emailBidder.lastDraftedSentAt);
    // eslint-disable-next-line react-hooks/purity
    const diffMs = Date.now() - lastSent.getTime();
    return diffMs < 24 * 60 * 60 * 1000;
  }, [emailBidder]);

  // Compliance Stats
  const stats = useMemo(() => {
    const totalBidders = bidders.length;
    let fullyCompliant = 0;
    let pendingBidders = 0;
    let totalCells = 0;
    let compliantCells = 0;
    let pendingCells = 0;
    let naCells = 0;

    bidders.forEach(bidder => {
      let isBidderPending = false;
      checklistItems.forEach(item => {
        const statusObj = bidder.statuses.find(s => s.checklistItemId === item.id);
        const status = statusObj?.status;
        totalCells++;

        if (item.category === 'submission') {
          if (status === 'submitted') compliantCells++;
          else if (status === 'not_applicable') naCells++;
          else { pendingCells++; isBidderPending = true; }
        } else if (item.category === 'acceptance') {
          if (status === 'accepted') compliantCells++;
          else if (status === 'not_applicable') naCells++;
          else { pendingCells++; isBidderPending = true; }
        } else if (item.category === 'text_note') {
          if (!status || status === 'accepted' || status === 'not_applicable') compliantCells++;
          else { pendingCells++; isBidderPending = true; }
        }
      });

      if (isBidderPending) pendingBidders++;
      else fullyCompliant++;
    });

    const cellPercentage = totalCells > 0 ? Math.round((compliantCells / totalCells) * 100) : 0;
    return { totalBidders, fullyCompliant, pendingBidders, totalCells, compliantCells, pendingCells, naCells, cellPercentage };
  }, [bidders, checklistItems]);

  const filteredBidders = useMemo(() => {
    return bidders.filter(b => {
      const q = searchQuery.toLowerCase();
      return (
        b.name.toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q) ||
        b.contactPerson.toLowerCase().includes(q) ||
        b.phone.toLowerCase().includes(q)
      );
    });
  }, [bidders, searchQuery]);

  const openAddModal = () => {
    setIsAddingBidder(true);
    setBidderName('');
    setBidderEmail('');
    setContactPerson('');
    setBidderPhone('');
  };

  const handleAddBidder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await addBidder({
        tenderId: tender.id,
        name: bidderName,
        email: bidderEmail,
        contactPerson,
        phone: bidderPhone,
      });
      if (res.success) {
        toast('Bidder added successfully', 'success');
        setIsAddingBidder(false);
        router.refresh();
      }
    } catch (err: any) {
      toast(err.message || 'Failed to add bidder', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const openEditModal = (bidder: Bidder) => {
    setEditingBidder(bidder);
    setBidderName(bidder.name);
    setBidderEmail(bidder.email);
    setContactPerson(bidder.contactPerson);
    setBidderPhone(bidder.phone);
  };

  const handleEditBidder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBidder) return;
    setIsSaving(true);
    try {
      const res = await updateBidder({
        id: editingBidder.id,
        name: bidderName,
        email: bidderEmail,
        contactPerson,
        phone: bidderPhone,
      });
      if (res.success) {
        toast('Bidder details updated', 'success');
        setEditingBidder(null);
        router.refresh();
      }
    } catch (err: any) {
      toast(err.message || 'Failed to update bidder', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBidder = async () => {
    if (!deletingBidder) return;
    setIsSaving(true);
    try {
      const res = await deleteBidder(deletingBidder.id);
      if (res.success) {
        toast('Bidder deleted', 'success');
        setDeletingBidder(null);
        router.refresh();
      }
    } catch (err: any) {
      toast(err.message || 'Failed to delete bidder', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const openEmailModal = (bidder: Bidder) => {
    const statusMap: Record<number, string> = {};
    bidder.statuses.forEach(s => { statusMap[s.checklistItemId] = s.status; });

    const userObj = { nameHi: currentUser.nameHi, nameEn: currentUser.nameEn, phone: currentUser.phone };
    const draft = buildEmailBody(
      { name: bidder.name, email: bidder.email, contactPerson: bidder.contactPerson, phone: bidder.phone },
      tender,
      userObj,
      checklistItems,
      statusMap
    );

    const summary = getBidderFlaggedSummary(checklistItems, statusMap);

    setEmailBidder(bidder);
    setDraftSubject(draft.subject);
    setDraftBody(draft.body);
    setDraftSummary(summary);
    setIsCopied(false);
    setConfirmResend(false);
  };

  const handleCopyEmail = async () => {
    if (isRecentlyDraftedSent && !confirmResend) {
      toast('Please confirm re-send by checking the box below.', 'error');
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(draftBody).catch(console.warn);
    }
    setIsCopied(true);
    toast('Email body copied to clipboard', 'success');

    try {
      await markBidderAsDraftedSent({ bidderId: emailBidder!.id, action: 'email.copied' });
      router.refresh();
    } catch (err: any) {
      toast(err.message || 'Failed to update status', 'error');
    }
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleManualMarkAsSent = async () => {
    if (!emailBidder) return;
    if (isRecentlyDraftedSent && !confirmResend) {
      toast('Please confirm re-send by checking the box below.', 'error');
      return;
    }
    try {
      await markBidderAsDraftedSent({ bidderId: emailBidder.id, action: 'email.marked_as_sent' });
      toast('Marked as drafted/sent successfully', 'success');
      setEmailBidder(null);
      router.refresh();
    } catch (err: any) {
      toast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleMailto = async () => {
    if (!emailBidder) return;
    if (isRecentlyDraftedSent && !confirmResend) {
      toast('Please confirm re-send by checking the box below.', 'error');
      return;
    }
    const mailtoUrl = `mailto:${emailBidder.email}?subject=${encodeURIComponent(draftSubject)}&body=${encodeURIComponent(draftBody)}`;
    window.location.href = mailtoUrl;

    try {
      await markBidderAsDraftedSent({ bidderId: emailBidder.id, action: 'email.draft_generated' });
      router.refresh();
    } catch (err: any) {
      toast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleCellStatusChange = async (bidderId: number, itemId: number, newStatus: string) => {
    try {
      setBidders(prev => prev.map(b => {
        if (b.id !== bidderId) return b;
        const existingStatus = b.statuses.find(s => s.checklistItemId === itemId);
        let updatedStatuses = [...b.statuses];
        if (existingStatus) {
          updatedStatuses = updatedStatuses.map(s => s.checklistItemId === itemId ? { ...s, status: newStatus } : s);
        } else {
          updatedStatuses.push({
            id: Date.now(),
            bidderId,
            checklistItemId: itemId,
            status: newStatus,
            updatedAt: new Date(),
            updatedBy: Number(currentUser.id),
          });
        }
        return { ...b, statuses: updatedStatuses };
      }));

      await updateBidderStatus({ bidderId, checklistItemId: itemId, status: newStatus });
      toast('Status updated', 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to update status', 'error');
      router.refresh();
    }
  };

  const downloadExcel = () => {
    const wsData: string[][] = [];

    // 1. Bidder Contact Information Header Block (for self-contained round-trip import)
    wsData.push(["Bidder Name / बोलीदाता का नाम", "Contact Field", ...bidders.map(b => b.name)]);
    wsData.push(["Email Address / ईमेल", "Contact Field", ...bidders.map(b => b.email)]);
    wsData.push(["Contact Person / संपर्क व्यक्ति", "Contact Field", ...bidders.map(b => b.contactPerson)]);
    wsData.push(["Phone Number / फोन नंबर", "Contact Field", ...bidders.map(b => b.phone)]);
    wsData.push([]); // Blank separator row

    // 2. Compliance Matrix Header Row
    const headers = ["Checklist Item / क्राइटेरिया", "Category / श्रेणी", ...bidders.map(b => b.name)];
    wsData.push(headers);

    checklistItems.forEach(item => {
      const row = [item.label, item.category === 'submission' ? 'Submission / प्रलेख' : item.category === 'acceptance' ? 'Acceptance / नियम' : 'Note / टिप्पणी'];
      bidders.forEach(bidder => {
        const statusObj = bidder.statuses.find(s => s.checklistItemId === item.id);
        const status = statusObj?.status;
        let labelText = '';
        if (item.category === 'submission') {
          if (status === 'submitted') labelText = 'Submitted';
          else if (status === 'not_applicable') labelText = 'N/A';
          else labelText = 'Pending';
        } else if (item.category === 'acceptance') {
          if (status === 'accepted') labelText = 'Accepted';
          else if (status === 'not_applicable') labelText = 'N/A';
          else labelText = 'Not Accepted';
        } else {
          labelText = status || '';
        }
        row.push(labelText);
      });
      wsData.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Compliance Matrix");
    XLSX.writeFile(wb, `${tender.name.replace(/[^a-zA-Z0-9]/g, '_')}_Matrix.xlsx`);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
      
      {/* OVERVIEW VIEW */}
      {view === 'overview' && (
        <div className="space-y-6 max-w-[var(--content-max)] mx-auto">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card className="p-4 space-y-1">
              <span className="text-xs font-semibold text-[var(--text-muted)]">Total Bidders</span>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.totalBidders}</p>
            </Card>
            <Card className="p-4 space-y-1">
              <span className="text-xs font-semibold text-[var(--text-muted)]">Fully Compliant</span>
              <p className="text-2xl font-bold text-[var(--status-success)]">{stats.fullyCompliant}</p>
            </Card>
            <Card className="p-4 space-y-1">
              <span className="text-xs font-semibold text-[var(--text-muted)]">Pending Queries</span>
              <p className="text-2xl font-bold text-[var(--status-warning)]">{stats.pendingBidders}</p>
            </Card>
            <Card className="p-4 space-y-1">
              <span className="text-xs font-semibold text-[var(--text-muted)]">Overall Compliance</span>
              <p className="text-2xl font-bold text-[var(--brand-primary)]">{stats.cellPercentage}%</p>
            </Card>
          </div>

          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-base text-[var(--text-primary)]">Tender Overview Details</h3>
            <p className="text-sm text-[var(--text-muted)]">
              This tender has <strong>{stats.totalBidders}</strong> participating bidders and <strong>{checklistItems.length}</strong> configured compliance verification points.
            </p>
          </Card>
        </div>
      )}

      {/* BIDDERS VIEW */}
      {view === 'bidders' && (
        <div className="space-y-6 max-w-[var(--content-max)] mx-auto">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-md">
              <Search size={16} className="pointer-events-none absolute left-3 top-3.5 text-[var(--text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bidders..."
                className="min-h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] pl-10 pr-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setIsImporting(true)}>
                <Download size={16} /> Import Bidders
              </Button>
              <Button onClick={openAddModal}>
                <Plus size={16} /> Add Single Bidder
              </Button>
            </div>
          </div>

          {filteredBidders.length === 0 ? (
            <EmptyState
              title="No bidders found"
              description="Add bidders manually or import them via CSV/Excel spreadsheet."
              action={
                <Button onClick={openAddModal}>
                  <Plus size={16} /> Add Bidder
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredBidders.map((b) => (
                <Card key={b.id} hoverable className="p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-base text-[var(--text-primary)] truncate">{b.name}</h3>
                      <button
                        onClick={() => openEmailModal(b)}
                        className="text-[var(--brand-primary)] hover:underline text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Mail size={14} /> Draft Email
                      </button>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] truncate">{b.email}</p>
                    <div className="text-xs text-[var(--text-secondary)] space-y-0.5 pt-1">
                      <p>Contact: <strong>{b.contactPerson}</strong></p>
                      <p>Phone: <strong>{b.phone}</strong></p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {b.lastDraftedSentAt
                        ? `Last drafted/sent: ${new Date(b.lastDraftedSentAt).toLocaleDateString()} by ${b.lastDraftedSentByName || 'Admin'}`
                        : 'Not yet drafted/sent'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(b)}
                        className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                        title="Edit Bidder"
                      >
                        <Edit2 size={14} />
                      </button>
                      {currentUser.role !== 'guest' && (
                        <button
                          onClick={() => setDeletingBidder(b)}
                          className="p-1 text-[var(--text-muted)] hover:text-[var(--status-danger-text)] cursor-pointer"
                          title="Delete Bidder"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* COMPLIANCE MATRIX VIEW */}
      {view === 'matrix' && (
        <div className="space-y-4 max-w-[var(--content-max)] mx-auto">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-bold text-base text-[var(--text-primary)]">Compliance Verification Matrix</h3>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setIsImporting(true)}>
                <Download size={16} /> Import Bidders
              </Button>
              <Button variant="secondary" onClick={downloadExcel}>
                <Upload size={16} /> Export Excel
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto border border-[var(--border-subtle)] rounded-[var(--radius-md)] bg-[var(--bg-surface)] shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] font-bold text-[var(--text-secondary)]">
                <tr>
                  <th className="p-3 min-w-48 sticky left-0 bg-[var(--bg-subtle)] z-10 border-r border-[var(--border-subtle)]">
                    Criteria Item
                  </th>
                  {bidders.map(b => (
                    <th key={b.id} className="p-3 text-center min-w-36 border-r border-[var(--border-subtle)]">
                      <span className="font-bold block truncate">{b.name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {checklistItems.map(item => (
                  <tr key={item.id} className="hover:bg-[var(--bg-subtle)]/40 transition-colors">
                    <td className="p-3 font-semibold text-[var(--text-primary)] sticky left-0 bg-[var(--bg-surface)] z-10 border-r border-[var(--border-subtle)]">
                      {item.label}
                    </td>
                    {bidders.map(b => {
                      const statusObj = b.statuses.find(s => s.checklistItemId === item.id);
                      const currentStatus = statusObj?.status || (item.category === 'acceptance' ? 'not_accepted' : 'not_submitted');
                      
                      return (
                        <td key={b.id} className="p-2 text-center border-r border-[var(--border-subtle)]">
                          {item.category === 'submission' ? (
                            <div className="inline-flex rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] p-0.5 border border-[var(--border-subtle)] select-none">
                              <button
                                type="button"
                                onClick={() => handleCellStatusChange(b.id, item.id, 'submitted')}
                                className={`px-2 py-1 text-[11px] font-bold rounded transition-all cursor-pointer ${
                                  currentStatus === 'submitted'
                                    ? 'bg-[var(--status-success-bg)] text-[var(--status-success-text)] shadow-xs border border-[var(--status-success)]/30'
                                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                                }`}
                                title="Submitted"
                              >
                                Sub
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCellStatusChange(b.id, item.id, 'not_submitted')}
                                className={`px-2 py-1 text-[11px] font-bold rounded transition-all cursor-pointer ${
                                  currentStatus === 'not_submitted' || !currentStatus
                                    ? 'bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] shadow-xs border border-[var(--status-warning)]/30'
                                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                                }`}
                                title="Pending"
                              >
                                Pen
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCellStatusChange(b.id, item.id, 'not_applicable')}
                                className={`px-2 py-1 text-[11px] font-bold rounded transition-all cursor-pointer ${
                                  currentStatus === 'not_applicable'
                                    ? 'bg-[var(--status-neutral-bg)] text-[var(--status-neutral-text)] shadow-xs border border-[var(--border-subtle)]'
                                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                                }`}
                                title="Not Applicable"
                              >
                                N/A
                              </button>
                            </div>
                          ) : item.category === 'acceptance' ? (
                            <div className="inline-flex rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] p-0.5 border border-[var(--border-subtle)] select-none">
                              <button
                                type="button"
                                onClick={() => handleCellStatusChange(b.id, item.id, 'accepted')}
                                className={`px-2 py-1 text-[11px] font-bold rounded transition-all cursor-pointer ${
                                  currentStatus === 'accepted'
                                    ? 'bg-[var(--status-success-bg)] text-[var(--status-success-text)] shadow-xs border border-[var(--status-success)]/30'
                                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                                }`}
                                title="Accepted"
                              >
                                Acc
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCellStatusChange(b.id, item.id, 'not_accepted')}
                                className={`px-2 py-1 text-[11px] font-bold rounded transition-all cursor-pointer ${
                                  currentStatus === 'not_accepted' || !currentStatus
                                    ? 'bg-[var(--status-danger-bg)] text-[var(--status-danger-text)] shadow-xs border border-[var(--status-danger)]/30'
                                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                                }`}
                                title="Not Accepted / Deviation"
                              >
                                Dev
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCellStatusChange(b.id, item.id, 'not_applicable')}
                                className={`px-2 py-1 text-[11px] font-bold rounded transition-all cursor-pointer ${
                                  currentStatus === 'not_applicable'
                                    ? 'bg-[var(--status-neutral-bg)] text-[var(--status-neutral-text)] shadow-xs border border-[var(--border-subtle)]'
                                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                                }`}
                                title="Not Applicable"
                              >
                                N/A
                              </button>
                            </div>
                          ) : (
                            <DeviationTextInput
                              bidderId={b.id}
                              itemId={item.id}
                              initialValue={currentStatus}
                              onSave={(bId, iId, val) => handleCellStatusChange(bId, iId, val)}
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD SINGLE BIDDER MODAL */}
      <Dialog isOpen={isAddingBidder} onClose={() => setIsAddingBidder(false)} title="Add Single Bidder" size="md">
        <form onSubmit={handleAddBidder} className="space-y-4">
          <Input label="Bidder / Company Name" required value={bidderName} onChange={(e) => setBidderName(e.target.value)} />
          <Input label="Email Address" type="email" required value={bidderEmail} onChange={(e) => setBidderEmail(e.target.value)} />
          <Input label="Contact Person Name" required value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
          <Input label="Phone Number" required value={bidderPhone} onChange={(e) => setBidderPhone(e.target.value)} />

          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="secondary" onClick={() => setIsAddingBidder(false)}>Cancel</Button>
            <Button type="submit" isLoading={isSaving}>Add Bidder</Button>
          </div>
        </form>
      </Dialog>

      {/* EDIT BIDDER MODAL */}
      <Dialog isOpen={editingBidder !== null} onClose={() => setEditingBidder(null)} title="Edit Bidder Details" size="md">
        <form onSubmit={handleEditBidder} className="space-y-4">
          <Input label="Bidder / Company Name" required value={bidderName} onChange={(e) => setBidderName(e.target.value)} />
          <Input label="Email Address" type="email" required value={bidderEmail} onChange={(e) => setBidderEmail(e.target.value)} />
          <Input label="Contact Person Name" required value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
          <Input label="Phone Number" required value={bidderPhone} onChange={(e) => setBidderPhone(e.target.value)} />

          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="secondary" onClick={() => setEditingBidder(null)}>Cancel</Button>
            <Button type="submit" isLoading={isSaving}>Save Changes</Button>
          </div>
        </form>
      </Dialog>

      {/* DELETE BIDDER MODAL */}
      <Dialog isOpen={deletingBidder !== null} onClose={() => setDeletingBidder(null)} title="Delete Bidder" size="sm">
        <div className="space-y-4">
          <p className="text-xs text-[var(--text-secondary)]">
            Are you sure you want to delete bidder <strong>{deletingBidder?.name}</strong>?
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setDeletingBidder(null)}>Cancel</Button>
            <Button variant="danger" isLoading={isSaving} onClick={handleDeleteBidder}>Delete</Button>
          </div>
        </div>
      </Dialog>

      {/* SINGLE BIDDER EMAIL DRAFT MODAL */}
      <Dialog isOpen={emailBidder !== null} onClose={() => setEmailBidder(null)} title={`Compliance Email — ${emailBidder?.name}`} size="lg">
        {emailBidder && (
          <div className="space-y-4">
            {/* Flagged Observations Summary Line */}
            <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
                <Info size={16} className="text-[var(--brand-primary)] shrink-0" />
                <span>Flagged Observations: <strong>{draftSummary}</strong></span>
              </div>
              <Badge tone="warning">Action Required</Badge>
            </div>

            {/* Warning if already sent */}
            {isRecentlyDraftedSent && (
              <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--status-warning-bg)] border border-[var(--status-warning)]/30 text-[var(--status-warning-text)] text-xs font-semibold flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>Already drafted/sent on {new Date(emailBidder.lastDraftedSentAt!).toLocaleDateString()} by {emailBidder.lastDraftedSentByName || 'Admin'}.</span>
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer shrink-0 select-none font-bold">
                  <input
                    type="checkbox"
                    checked={confirmResend}
                    onChange={(e) => setConfirmResend(e.target.checked)}
                    className="accent-[var(--brand-primary)] cursor-pointer"
                  />
                  Confirm Re-send
                </label>
              </div>
            )}

            <Input label="Email Subject" value={draftSubject} onChange={(e) => setDraftSubject(e.target.value)} />
            <Textarea label="Email Body" rows={10} value={draftBody} onChange={(e) => setDraftBody(e.target.value)} className="font-mono text-xs" />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-[var(--border-subtle)] pt-3">
              <span className="text-[10px] text-[var(--text-muted)]">
                Recipient: {emailBidder.contactPerson} &lt;{emailBidder.email}&gt;
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="secondary" size="sm" onClick={handleManualMarkAsSent}>
                  <Send size={14} /> Mark as Sent
                </Button>
                <Button variant="secondary" size="sm" onClick={handleCopyEmail}>
                  {isCopied ? <Check size={14} className="text-[var(--status-success)]" /> : <Copy size={14} />}
                  {isCopied ? 'Copied' : 'Copy Text'}
                </Button>
                <Button size="sm" onClick={handleMailto}>
                  <Mail size={14} /> Open in Mail Client
                </Button>
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* CSV/EXCEL IMPORT MODAL */}
      <BidderImportModal
        isOpen={isImporting}
        onClose={() => setIsImporting(false)}
        tenderId={tender.id}
        checklistLabels={checklistItems.map(i => i.label)}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
