'use client';

import React, { useState, useMemo } from 'react';
import { 
  Mail, 
  Copy, 
  Check, 
  User, 
  Loader2, 
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { buildEmailBody } from '@/lib/emailBuilder';

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

  const [activeBidderId, setActiveBidderId] = useState<number | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Draft subjects/bodies in local states so edits aren't lost immediately on tab switches, or compile on the fly
  // Compiling on the fly with overrides is very clean. Let's compute drafts for all bidders.
  const drafts = useMemo(() => {
    const bidderDrafts: Record<number, { subject: string; body: string; pendingCount: number }> = {};
    
    bidders.forEach(bidder => {
      // Get status map
      const statusMap: Record<number, string> = {};
      let pendingCount = 0;

      bidder.statuses.forEach(s => {
        statusMap[s.checklistItemId] = s.status;
      });

      checklistItems.forEach(item => {
        const status = statusMap[item.id];
        if (item.category === 'submission') {
          if (status === 'not_submitted') pendingCount++;
        } else {
          if (status === 'not_accepted') pendingCount++;
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
          pendingCount
        };
      }
    });

    return bidderDrafts;
  }, [bidders, checklistItems, tender, currentUser]);

  // List of bidders with drafts
  const biddersWithPendingQueries = useMemo(() => {
    return bidders.filter(b => !!drafts[b.id]);
  }, [bidders, drafts]);

  // Automatically select the first bidder in list if activeBidderId is null
  React.useEffect(() => {
    if (activeBidderId === null && biddersWithPendingQueries.length > 0) {
      setActiveBidderId(biddersWithPendingQueries[0].id);
    }
  }, [biddersWithPendingQueries, activeBidderId]);

  // Active Bidder details
  const activeBidder = bidders.find(b => b.id === activeBidderId);
  const activeDraft = activeBidderId ? drafts[activeBidderId] : null;

  // Track edits to subject/body
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');

  // Update edit fields when active bidder changes
  React.useEffect(() => {
    if (activeDraft) {
      setEditedSubject(activeDraft.subject);
      setEditedBody(activeDraft.body);
      setIsCopied(false);
    }
  }, [activeBidderId, activeDraft]);

  const handleCopy = () => {
    navigator.clipboard.writeText(editedBody);
    setIsCopied(true);
    toast('Email body copied to clipboard', 'success');

    // Log copy activity client-side
    fetch('/api/logs', {
      method: 'POST',
      body: JSON.stringify({ action: 'email.copied', bidderName: activeBidder?.name }),
    }).catch(() => {});

    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleMailto = () => {
    if (!activeBidder) return;
    const mailtoUrl = `mailto:${activeBidder.email}?subject=${encodeURIComponent(editedSubject)}&body=${encodeURIComponent(editedBody)}`;
    window.location.href = mailtoUrl;

    // Log mailto activity
    fetch('/api/logs', {
      method: 'POST',
      body: JSON.stringify({ action: 'email.draft_generated', bidderName: activeBidder?.name }),
    }).catch(() => {});
  };

  if (biddersWithPendingQueries.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm max-w-2xl mx-auto mt-8 text-center space-y-4">
        <div className="bg-emerald-500/10 text-emerald-600 p-4 rounded-full">
          <Sparkles size={36} />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">All Bidders Are Compliant</h3>
          <p className="text-xs text-slate-400 mt-1">
            Excellent! There are no bidders with pending documents or unaccepted clauses. Compliance email drafting is not required.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-0">
      
      {/* Left Panel: Bidders list */}
      <div className="md:col-span-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col h-full overflow-hidden shadow-sm">
        <h3 className="font-bold text-slate-800 dark:text-slate-250 text-xs uppercase tracking-wider mb-3 px-1">
          Bidders requiring queries ({biddersWithPendingQueries.length})
        </h3>
        
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {biddersWithPendingQueries.map(b => {
            const isActive = b.id === activeBidderId;
            const draftInfo = drafts[b.id];
            return (
              <button
                key={b.id}
                onClick={() => setActiveBidderId(b.id)}
                className={`w-full text-left p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-900 dark:bg-indigo-950/20 dark:border-indigo-900/60 dark:text-indigo-400'
                    : 'bg-white border-slate-200 hover:border-slate-300 dark:bg-zinc-900 dark:border-zinc-850 dark:hover:border-zinc-700 text-slate-700 dark:text-zinc-350'
                }`}
              >
                <div className="overflow-hidden pr-2">
                  <span className="font-bold text-xs truncate block">{b.name}</span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 truncate block mt-0.5">{b.email}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[9px] font-extrabold bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5 rounded-full uppercase shrink-0">
                    {draftInfo?.pendingCount} Obs
                  </span>
                  <ChevronRight size={14} className="opacity-40" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Panel: Active Draft Workspace */}
      <div className="md:col-span-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col h-full overflow-hidden shadow-sm">
        {activeBidder && activeDraft ? (
          <div className="flex-1 flex flex-col space-y-4 h-full min-h-0">
            {/* Active Header Info */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-850 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  Drafting compliance email for {activeBidder.name}
                </h3>
                <span className="text-[10px] text-slate-400">
                  Recipient: <strong className="text-slate-650 dark:text-zinc-350">{activeBidder.contactPerson} &lt;{activeBidder.email}&gt;</strong>
                </span>
              </div>
            </div>

            {/* Subject Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">Subject</label>
              <input
                type="text"
                value={editedSubject}
                onChange={(e) => setEditedSubject(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-800 dark:text-white font-semibold focus:outline-none"
              />
            </div>

            {/* Body Textarea */}
            <div className="flex-1 flex flex-col min-h-0 space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">Email Body</label>
              <textarea
                value={editedBody}
                onChange={(e) => setEditedBody(e.target.value)}
                className="w-full flex-1 text-xs p-3.5 bg-slate-50 dark:bg-zinc-955 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-800 dark:text-zinc-200 font-mono focus:outline-none leading-relaxed overflow-y-auto"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-zinc-850 pt-3 shrink-0">
              <span className="text-[9px] text-slate-400">
                * Review and customize before sending. Mailto link will open in local mail client (Outlook/Thunderbird).
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  {isCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  {isCopied ? 'Copied' : 'Copy Text'}
                </button>
                <button
                  onClick={handleMailto}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Mail size={12} /> Open in Mail Client
                </button>
              </div>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 text-slate-400">
            Select a bidder on the left to display their compiled compliance email.
          </div>
        )}
      </div>

    </div>
  );
}
