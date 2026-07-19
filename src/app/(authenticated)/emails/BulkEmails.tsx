'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Mail, 
  Copy, 
  Check, 
  ChevronRight, 
  Sparkles, 
  Download, 
  Send, 
  AlertTriangle,
  Info
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { buildEmailBody, getBidderFlaggedSummary } from '@/lib/emailBuilder';
import { markBidderAsDraftedSent } from '@/app/actions/bidder';
import { useRouter } from 'next/navigation';
import { Button, Badge, Card, Textarea, Input } from '@/components/ui/primitives';
import BulkExportModal from '@/components/emails/BulkExportModal';
import type { EmlItem } from '@/lib/emlExport';

interface Status {
  id: number;
  bidderId: number;
  checklistItemId: number;
  status: string;
}

interface Bidder {
  id: number;
  name: string;
  email: string;
  contactPerson: string;
  phone: string;
  statuses: Status[];
  lastDraftedSentAt?: string | Date | null;
  lastDraftedSentBy?: number | null;
  lastDraftedSentByName?: string | null;
}

interface ChecklistItem {
  id: number;
  label: string;
  category: string;
  groupOrder: number;
  sortOrder: number;
}

interface BulkEmailsProps {
  tender: {
    name: string;
    subjectLine: string | null;
  };
  bidders: Bidder[];
  checklistItems: ChecklistItem[];
  currentUser: {
    nameHi: string;
    nameEn: string;
    phone: string;
  };
}

export default function BulkEmails({ tender, bidders, checklistItems, currentUser }: BulkEmailsProps) {
  const { toast } = useToast();
  const router = useRouter();

  const [activeBidderId, setActiveBidderId] = useState<number | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Compute drafts for all bidders
  const drafts = useMemo(() => {
    const bidderDrafts: Record<number, { subject: string; body: string; summaryLine: string; pendingCount: number }> = {};
    
    bidders.forEach(bidder => {
      const statusMap: Record<number, string> = {};
      let pendingCount = 0;

      bidder.statuses.forEach(s => {
        statusMap[s.checklistItemId] = s.status;
      });

      checklistItems.forEach(item => {
        const status = statusMap[item.id];
        if (item.category === 'submission') {
          if (status !== 'submitted' && status !== 'not_applicable') pendingCount++;
        } else if (item.category === 'acceptance') {
          if (status !== 'accepted' && status !== 'not_applicable') pendingCount++;
        } else if (item.category === 'text_note') {
          if (status && status !== 'accepted' && status !== 'not_applicable' && status.trim() !== '') pendingCount++;
        }
      });

      if (pendingCount > 0) {
        const userObj = {
          nameHi: currentUser.nameHi,
          nameEn: currentUser.nameEn,
          phone: currentUser.phone,
        };

        const draft = buildEmailBody(
          { name: bidder.name, email: bidder.email, contactPerson: bidder.contactPerson, phone: bidder.phone },
          tender,
          userObj,
          checklistItems,
          statusMap
        );

        bidderDrafts[bidder.id] = {
          subject: draft.subject,
          body: draft.body,
          summaryLine: draft.summaryLine,
          pendingCount
        };
      }
    });

    return bidderDrafts;
  }, [bidders, checklistItems, tender, currentUser]);

  const biddersWithPendingQueries = useMemo(() => {
    return bidders.filter(b => !!drafts[b.id]);
  }, [bidders, drafts]);

  useEffect(() => {
    if (activeBidderId === null && biddersWithPendingQueries.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveBidderId(biddersWithPendingQueries[0].id);
    }
  }, [biddersWithPendingQueries, activeBidderId]);

  const activeBidder = bidders.find(b => b.id === activeBidderId);
  const activeDraft = activeBidderId ? drafts[activeBidderId] : null;

  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const [confirmResend, setConfirmResend] = useState(false);

  const isRecentlyDraftedSent = useMemo(() => {
    if (!activeBidder?.lastDraftedSentAt) return false;
    const lastSent = new Date(activeBidder.lastDraftedSentAt);
    // eslint-disable-next-line react-hooks/purity
    const diffMs = Date.now() - lastSent.getTime();
    return diffMs < 24 * 60 * 60 * 1000;
  }, [activeBidder]);

  useEffect(() => {
    if (activeDraft) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditedSubject(activeDraft.subject);
      setEditedBody(activeDraft.body);
      setIsCopied(false);
      setConfirmResend(false);
    }
  }, [activeBidderId, activeDraft]);

  const bulkExportItems: EmlItem[] = useMemo(() => {
    return biddersWithPendingQueries.map(b => ({
      bidderName: b.name,
      bidderEmail: b.email,
      subject: drafts[b.id]?.subject || '',
      body: drafts[b.id]?.body || '',
    }));
  }, [biddersWithPendingQueries, drafts]);

  const handleCopy = async () => {
    if (isRecentlyDraftedSent && !confirmResend) {
      toast('Please confirm re-send by checking the box below.', 'error');
      return;
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(editedBody).catch(console.warn);
    }
    
    setIsCopied(true);
    toast('Email body copied to clipboard', 'success');

    try {
      await markBidderAsDraftedSent({ bidderId: activeBidderId!, action: 'email.copied' });
      router.refresh();
    } catch (err: any) {
      toast(err.message || 'Failed to update status', 'error');
    }

    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleManualMarkAsSent = async () => {
    if (!activeBidderId) return;
    if (isRecentlyDraftedSent && !confirmResend) {
      toast('Please confirm re-send by checking the box below.', 'error');
      return;
    }

    try {
      await markBidderAsDraftedSent({ bidderId: activeBidderId, action: 'email.marked_as_sent' });
      toast('Logged status: Last drafted/sent updated', 'success');
      router.refresh();
    } catch (err: any) {
      toast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleMailto = async () => {
    if (!activeBidder) return;
    if (isRecentlyDraftedSent && !confirmResend) {
      toast('Please confirm re-send by checking the box below.', 'error');
      return;
    }

    const mailtoUrl = `mailto:${activeBidder.email}?subject=${encodeURIComponent(editedSubject)}&body=${encodeURIComponent(editedBody)}`;
    window.location.href = mailtoUrl;

    try {
      await markBidderAsDraftedSent({ bidderId: activeBidderId!, action: 'email.draft_generated' });
      router.refresh();
    } catch (err: any) {
      toast(err.message || 'Failed to update status', 'error');
    }
  };

  if (biddersWithPendingQueries.length === 0) {
    return (
      <Card className="mx-auto mt-8 flex max-w-2xl flex-col items-center justify-center p-8 text-center">
        <div className="rounded-full bg-[var(--status-success-bg)] p-4 text-[var(--status-success)] mb-3">
          <Sparkles size={32} />
        </div>
        <h3 className="text-base font-bold text-[var(--text-primary)]">All Bidders Are Compliant</h3>
        <p className="mt-1 text-xs text-[var(--text-muted)] max-w-md">
          Excellent! There are no bidders with pending documents or unaccepted clauses. Compliance email drafting is not required.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border-subtle)] pb-3">
        <div>
          <h3 className="font-bold text-sm text-[var(--text-primary)]">
            Compliance Email Workspace
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            Draft, customize, export, or mark emails as sent for bidders requiring queries.
          </p>
        </div>
        <Button variant="secondary" onClick={() => setShowExportModal(true)}>
          <Download size={16} /> Bulk Export .EML (.ZIP)
        </Button>
      </div>

      {/* Main Split View */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 pb-20 md:grid-cols-3 md:pb-0">
        
        {/* Left Panel: Bidders list */}
        <Card className="flex h-full flex-col overflow-hidden p-3 md:col-span-1">
          <div className="flex items-center justify-between px-2 py-2 border-b border-[var(--border-subtle)] mb-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--text-secondary)]">
              Pending Queries ({biddersWithPendingQueries.length})
            </h4>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {biddersWithPendingQueries.map(b => {
              const isActive = b.id === activeBidderId;
              const draftInfo = drafts[b.id];
              return (
                <button
                  key={b.id}
                  onClick={() => setActiveBidderId(b.id)}
                  className={`w-full text-left p-3 rounded-[var(--radius-sm)] border flex items-center justify-between cursor-pointer transition-all duration-150 ${
                    isActive
                      ? 'bg-[var(--brand-primary)]/10 border-[var(--brand-primary)] text-[var(--text-primary)] shadow-xs'
                      : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
                  }`}
                >
                  <div className="overflow-hidden pr-2 flex-1">
                    <span className="font-bold text-xs truncate block">{b.name}</span>
                    <span className="text-[10px] text-[var(--text-muted)] truncate block mt-0.5">{b.email}</span>
                    <span className="text-[9px] text-[var(--text-muted)] truncate block mt-1">
                      {b.lastDraftedSentAt
                        ? `Last drafted/sent: ${new Date(b.lastDraftedSentAt).toLocaleDateString()} by ${b.lastDraftedSentByName || 'Admin'}`
                        : 'Not yet drafted/sent'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge tone="warning">
                      {draftInfo?.pendingCount} Obs
                    </Badge>
                    <ChevronRight size={14} className="opacity-40" />
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Right Panel: Active Draft Workspace */}
        <Card className="md:col-span-2 p-5 flex flex-col h-full overflow-hidden">
          {activeBidder && activeDraft ? (
            <div className="flex-1 flex flex-col space-y-4 h-full min-h-0">
              
              {/* Flagged Item Summary Header Line */}
              <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
                  <Info size={16} className="text-[var(--brand-primary)] shrink-0" />
                  <span>Flagged Observations: <strong>{activeDraft.summaryLine}</strong></span>
                </div>
                <Badge tone="warning">Action Required</Badge>
              </div>

              {/* Warning Message if Recently Drafted */}
              {isRecentlyDraftedSent && (
                <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--status-warning-bg)] border border-[var(--status-warning)]/30 text-[var(--status-warning-text)] text-xs font-semibold flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="shrink-0" />
                    <span>Already drafted/sent on {new Date(activeBidder.lastDraftedSentAt!).toLocaleDateString()} by {activeBidder.lastDraftedSentByName || 'Admin'}.</span>
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

              {/* Subject Input */}
              <Input
                label="Email Subject"
                value={editedSubject}
                onChange={(e) => setEditedSubject(e.target.value)}
              />

              {/* Body Textarea */}
              <div className="flex-1 flex flex-col min-h-0 space-y-1">
                <label className="block text-xs font-bold text-[var(--text-secondary)]">Email Body</label>
                <textarea
                  value={editedBody}
                  onChange={(e) => setEditedBody(e.target.value)}
                  className="w-full flex-1 text-xs p-3.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] text-[var(--text-primary)] font-mono outline-none transition-colors focus:border-[var(--brand-primary)] leading-relaxed overflow-y-auto resize-y"
                />
              </div>

              {/* Footer Action Bar */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-[var(--border-subtle)] pt-3 shrink-0">
                <span className="text-[10px] text-[var(--text-muted)]">
                  * Draft changes are populated into standard RFC 822 mailto links or copied directly.
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={handleManualMarkAsSent}>
                    <Send size={14} /> Mark as Sent
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleCopy}>
                    {isCopied ? <Check size={14} className="text-[var(--status-success)]" /> : <Copy size={14} />}
                    {isCopied ? 'Copied' : 'Copy Text'}
                  </Button>
                  <Button size="sm" onClick={handleMailto}>
                    <Mail size={14} /> Open in Mail Client
                  </Button>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6 text-[var(--text-muted)] text-sm italic">
              Select a bidder on the left to preview their compliance email.
            </div>
          )}
        </Card>
      </div>

      {/* Bulk Export ZIP Modal */}
      <BulkExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        tenderName={tender.name}
        drafts={bulkExportItems}
      />
    </div>
  );
}
