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
  MailWarning,
  Loader2,
  FileText,
  Search
} from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { addBidder, updateBidder, deleteBidder, updateBidderStatus } from '@/app/actions/bidder';
import { buildEmailBody } from '@/lib/emailBuilder';
import { useRouter } from 'next/navigation';
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
      className="w-full text-xs p-1.5 bg-slate-50 dark:bg-zinc-800 text-slate-800 dark:text-zinc-250 border border-slate-200 dark:border-zinc-700 rounded focus:outline-none focus:border-indigo-500 font-medium"
      placeholder="Type custom deviations..."
    />
  );
}

interface DashboardProps {
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

export default function Dashboard({ tender, bidders: initialBidders, checklistItems, currentUser }: DashboardProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [bidders, setBidders] = useState<Bidder[]>(initialBidders);

  useEffect(() => {
    setBidders(initialBidders);
  }, [initialBidders]);

  const [activeTab, setActiveTab] = useState<'overview' | 'bidders' | 'matrix'>('overview');
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isAddingBidder, setIsAddingBidder] = useState(false);
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
  const [isCopied, setIsCopied] = useState(false);

  // Status map of active bidder statuses
  const bidderMap = useMemo(() => {
    const map: Record<number, Bidder> = {};
    bidders.forEach(b => {
      map[b.id] = b;
    });
    return map;
  }, [bidders]);

  // Computed Compliance Stats
  const stats = useMemo(() => {
    let totalBidders = bidders.length;
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
          if (status === 'submitted') {
            compliantCells++;
          } else if (status === 'not_applicable') {
            naCells++;
          } else {
            pendingCells++;
            isBidderPending = true;
          }
        } else {
          if (status === 'accepted') {
            compliantCells++;
          } else if (status === 'not_applicable') {
            naCells++;
          } else {
            pendingCells++;
            isBidderPending = true;
          }
        }
      });

      if (isBidderPending) {
        pendingBidders++;
      } else {
        fullyCompliant++;
      }
    });

    const cellPercentage = totalCells > 0 ? Math.round((compliantCells / totalCells) * 100) : 0;

    return {
      totalBidders,
      fullyCompliant,
      pendingBidders,
      totalCells,
      compliantCells,
      pendingCells,
      naCells,
      cellPercentage
    };
  }, [bidders, checklistItems]);

  // Filtered Bidders List
  const filteredBidders = useMemo(() => {
    return bidders.filter(b => {
      const query = searchQuery.toLowerCase();
      return (
        b.name.toLowerCase().includes(query) ||
        b.email.toLowerCase().includes(query) ||
        b.contactPerson.toLowerCase().includes(query) ||
        b.phone.toLowerCase().includes(query)
      );
    });
  }, [bidders, searchQuery]);

  // Open Add Bidder Modal
  const openAddModal = () => {
    setIsAddingBidder(true);
    setBidderName('');
    setBidderEmail('');
    setContactPerson('');
    setBidderPhone('');
  };

  // Add Bidder Submit
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
        toast('Bidder added and default compliance seeded', 'success');
        setIsAddingBidder(false);
        router.refresh();
      }
    } catch (err: any) {
      toast(err.message || 'Failed to add bidder', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Open Edit Bidder Modal
  const openEditModal = (bidder: Bidder) => {
    setEditingBidder(bidder);
    setBidderName(bidder.name);
    setBidderEmail(bidder.email);
    setContactPerson(bidder.contactPerson);
    setBidderPhone(bidder.phone);
  };

  // Edit Bidder Submit
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
        toast('Bidder details updated successfully', 'success');
        setEditingBidder(null);
        router.refresh();
      }
    } catch (err: any) {
      toast(err.message || 'Failed to update bidder', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Bidder Submit
  const handleDeleteBidder = async () => {
    if (!deletingBidder) return;
    setIsSaving(true);
    try {
      const res = await deleteBidder(deletingBidder.id);
      if (res.success) {
        toast('Bidder and associated statuses deleted', 'success');
        setDeletingBidder(null);
        router.refresh();
      }
    } catch (err: any) {
      toast(err.message || 'Failed to delete bidder', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Open Email Modal
  const openEmailModal = (bidder: Bidder) => {
    // Build status map
    const statusMap: Record<number, string> = {};
    bidder.statuses.forEach(s => {
      statusMap[s.checklistItemId] = s.status;
    });

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

    setEmailBidder(bidder);
    setDraftSubject(draft.subject);
    setDraftBody(draft.body);
    setIsCopied(false);
  };

  // Copy Email Body to Clipboard
  const handleCopyEmail = () => {
    navigator.clipboard.writeText(draftBody);
    setIsCopied(true);
    toast('Email body copied to clipboard', 'success');
    
    // Log copy activity client-side by letting server know
    // We can do this asynchronously
    fetch('/api/logs', {
      method: 'POST',
      body: JSON.stringify({ action: 'email.copied', bidderName: emailBidder?.name }),
    }).catch(() => {});
    
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Launch Mailto Link
  const handleMailto = () => {
    if (!emailBidder) return;
    
    const mailtoUrl = `mailto:${emailBidder.email}?subject=${encodeURIComponent(draftSubject)}&body=${encodeURIComponent(draftBody)}`;
    window.location.href = mailtoUrl;

    // Log mailto click
    fetch('/api/logs', {
      method: 'POST',
      body: JSON.stringify({ action: 'email.draft_generated', bidderName: emailBidder?.name }),
    }).catch(() => {});
  };

  // Excel Export
  const downloadExcel = () => {
    const wsData = [];
    
    // Header Row
    const headers = ["Checklist Item / क्राइटेरिया", "Category", ...bidders.map(b => b.name)];
    wsData.push(headers);
    
    // Data Rows
    checklistItems.forEach(item => {
      const row = [
        item.label,
        item.category === 'submission' ? 'Submission / प्रलेख' : 'Acceptance / नियम'
      ];
      
      bidders.forEach(bidder => {
        const statusObj = bidder.statuses.find(s => s.checklistItemId === item.id);
        const status = statusObj?.status;

        let labelText = '';
        if (item.category === 'submission') {
          if (status === 'submitted') labelText = 'Submitted / प्रस्तुत';
          else if (status === 'not_applicable') labelText = 'N/A';
          else labelText = 'Pending / लंबित';
        } else {
          if (status === 'accepted') labelText = 'Accepted / स्वीकृत';
          else if (status === 'not_applicable') labelText = 'N/A';
          else labelText = 'Not Accepted / अस्वीकृत';
        }
        row.push(labelText);
      });
      wsData.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Compliance Matrix");
    XLSX.writeFile(wb, `${tender.name}_Compliance_Matrix.xlsx`);
    toast('Excel sheet exported successfully', 'success');
  };

  // Status Cell Change Handler
  const handleStatusChange = async (bidderId: number, checklistItemId: number, newStatus: string) => {
    // 1. Capture old status for rollback
    const bidder = bidders.find(b => b.id === bidderId);
    if (!bidder) return;
    const oldStatusObj = bidder.statuses.find(s => s.checklistItemId === checklistItemId);
    const oldStatus = oldStatusObj?.status || '';

    // 2. Perform optimistic update on the client state
    setBidders(prevBidders => {
      return prevBidders.map(b => {
        if (b.id !== bidderId) return b;
        
        // Find if status object exists
        const statusExists = b.statuses.some(s => s.checklistItemId === checklistItemId);
        let updatedStatuses;
        
        if (statusExists) {
          updatedStatuses = b.statuses.map(s => {
            if (s.checklistItemId === checklistItemId) {
              return { ...s, status: newStatus, updatedAt: new Date() };
            }
            return s;
          });
        } else {
          updatedStatuses = [
            ...b.statuses,
            {
              id: Date.now(), // dummy temporary id
              bidderId,
              checklistItemId,
              status: newStatus,
              updatedAt: new Date(),
              updatedBy: parseInt(currentUser.id, 10),
            }
          ];
        }
        
        return {
          ...b,
          statuses: updatedStatuses
        };
      });
    });

    // 3. Make background DB update
    try {
      const res = await updateBidderStatus({
        bidderId,
        checklistItemId,
        status: newStatus,
      });
      if (res.success) {
        toast('Compliance cell updated', 'success');
        // Revalidate in background to keep data in sync, but do not block UI
        router.refresh();
      }
    } catch (err: any) {
      toast(err.message || 'Failed to update compliance cell', 'error');
      
      // Rollback to old status
      setBidders(prevBidders => {
        return prevBidders.map(b => {
          if (b.id !== bidderId) return b;
          return {
            ...b,
            statuses: b.statuses.map(s => {
              if (s.checklistItemId === checklistItemId) {
                return { ...s, status: oldStatus };
              }
              return s;
            })
          };
        });
      });
    }
  };

  // Bidder stats helper
  const getBidderStats = (bidder: Bidder) => {
    let compliant = 0;
    let pending = 0;
    let na = 0;

    checklistItems.forEach(item => {
      const statusObj = bidder.statuses.find(s => s.checklistItemId === item.id);
      const status = statusObj?.status;

      if (item.category === 'submission') {
        if (status === 'submitted') compliant++;
        else if (status === 'not_applicable') na++;
        else pending++;
      } else {
        if (status === 'accepted') compliant++;
        else if (status === 'not_applicable') na++;
        else pending++;
      }
    });

    const total = checklistItems.length;
    const progress = total > 0 ? Math.round((compliant / total) * 100) : 0;

    return { compliant, pending, na, progress };
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-zinc-950">
      
      {/* Subheader Toolbar */}
      <div className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 px-6 py-3 flex items-center justify-between shrink-0">
        
        {/* Navigation Tabs */}
        <div className="flex bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-zinc-700 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-250'
            }`}
          >
            <BarChart3 size={14} />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('bidders')}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
              activeTab === 'bidders'
                ? 'bg-white dark:bg-zinc-700 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-250'
            }`}
          >
            <Users size={14} />
            Bidder Catalogue
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
              activeTab === 'matrix'
                ? 'bg-white dark:bg-zinc-700 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-250'
            }`}
          >
            <Grid size={14} />
            Checklist Matrix
          </button>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2">
          {activeTab === 'matrix' && (
            <button
              onClick={downloadExcel}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 font-semibold text-xs py-1.5 px-3.5 rounded-lg cursor-pointer transition-colors"
            >
              <Download size={13} /> Export Excel
            </button>
          )}

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-1.5 px-3.5 rounded-lg shadow-sm cursor-pointer transition-colors"
          >
            <Plus size={14} /> Add Bidder
          </button>
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto h-full">

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Bidders</span>
                  <p className="text-3xl font-extrabold text-slate-850 dark:text-white">{stats.totalBidders}</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Fully Compliant Bidders</span>
                  <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-500">{stats.fullyCompliant}</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Bidders with Pending Queries</span>
                  <p className="text-3xl font-extrabold text-rose-600 dark:text-rose-500">{stats.pendingBidders}</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Criteria Items Defined</span>
                  <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-500">{checklistItems.length}</p>
                </div>
              </div>

              {/* Progress Summary Card */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Overall Compliance Breakdown
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Distribution of document submissions and clause acceptances across all bidder cells.
                </p>

                <div className="relative mt-6">
                  {/* Distribution Bar */}
                  <div className="h-6 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-500" 
                      style={{ width: `${stats.totalCells > 0 ? (stats.compliantCells / stats.totalCells) * 100 : 0}%` }}
                      title="Submitted / Accepted"
                    />
                    <div 
                      className="bg-rose-500 h-full transition-all duration-500" 
                      style={{ width: `${stats.totalCells > 0 ? (stats.pendingCells / stats.totalCells) * 100 : 0}%` }}
                      title="Pending / Not Accepted"
                    />
                    <div 
                      className="bg-slate-400 dark:bg-zinc-650 h-full transition-all duration-500" 
                      style={{ width: `${stats.totalCells > 0 ? (stats.naCells / stats.totalCells) * 100 : 0}%` }}
                      title="Not Applicable"
                    />
                  </div>

                  {/* Labels */}
                  <div className="flex items-center gap-6 mt-4 text-xs font-semibold text-slate-500 dark:text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-emerald-500 rounded-full" />
                      <span>Compliant: {stats.compliantCells} ({stats.totalCells > 0 ? Math.round((stats.compliantCells / stats.totalCells) * 100) : 0}%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-rose-500 rounded-full" />
                      <span>Pending/Observations: {stats.pendingCells} ({stats.totalCells > 0 ? Math.round((stats.pendingCells / stats.totalCells) * 100) : 0}%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-slate-400 dark:bg-zinc-650 rounded-full" />
                      <span>Not Applicable: {stats.naCells} ({stats.totalCells > 0 ? Math.round((stats.naCells / stats.totalCells) * 100) : 0}%)</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* BIDDER CATALOGUE TAB */}
          {activeTab === 'bidders' && (
            <div className="space-y-4">
              
              {/* Search input */}
              <div className="relative max-w-md w-full bg-white dark:bg-zinc-900 rounded-xl shadow-sm">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  placeholder="Search bidders by name or contact..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-white"
                />
              </div>

              {/* Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredBidders.map(bidder => {
                  const details = getBidderStats(bidder);
                  return (
                    <div 
                      key={bidder.id} 
                      className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
                    >
                      {/* Header */}
                      <div>
                        <div className="flex items-start justify-between">
                          <h4 className="font-bold text-sm text-slate-850 dark:text-white truncate max-w-[200px]" title={bidder.name}>
                            {bidder.name}
                          </h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            details.pending === 0 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50'
                          }`}>
                            {details.pending === 0 ? 'Compliant' : `${details.pending} Pending`}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-1">Contact: {bidder.contactPerson}</p>
                      </div>

                      {/* Stats & Progress */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
                          <span>Progress</span>
                          <span>{details.progress}% Complete</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-zinc-850 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-600 h-full transition-all duration-300"
                            style={{ width: `${details.progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase">
                          <span className="text-emerald-600 dark:text-emerald-500">{details.compliant} Yes</span>
                          <span className="text-rose-600 dark:text-rose-500">{details.pending} Observations</span>
                          <span>{details.na} N/A</span>
                        </div>
                      </div>

                      {/* Details & Actions */}
                      <div className="border-t border-slate-100 dark:border-zinc-800 pt-3 space-y-3">
                        <div className="text-[10px] text-slate-500 space-y-1">
                          <p className="truncate"><strong className="text-slate-600 dark:text-zinc-400">Email:</strong> {bidder.email}</p>
                          <p><strong className="text-slate-600 dark:text-zinc-400">Tel:</strong> {bidder.phone}</p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEmailModal(bidder)}
                            className="flex-1 flex items-center justify-center gap-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 font-bold text-[10px] py-1.5 rounded-lg cursor-pointer transition-colors"
                          >
                            <Mail size={12} /> Compliance Email
                          </button>
                          <button
                            onClick={() => openEditModal(bidder)}
                            className="p-1.5 border border-slate-200 dark:border-zinc-700 text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-250 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors"
                            title="Edit Bidder"
                          >
                            <Edit2 size={12} />
                          </button>
                          {currentUser.role !== 'guest' && (
                            <button
                              onClick={() => setDeletingBidder(bidder)}
                              className="p-1.5 border border-rose-200 dark:border-rose-900 text-rose-500 hover:text-rose-700 dark:hover:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg cursor-pointer transition-colors"
                              title="Delete Bidder"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CHECKLIST MATRIX TAB (Spreadsheet scroll view) */}
          {activeTab === 'matrix' && (
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full max-h-[calc(100vh-220px)]">
              <div className="overflow-auto flex-1 relative">
                <table className="border-collapse w-max min-w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-zinc-800/50 text-slate-500 dark:text-zinc-400">
                      {/* Sticky Top-Left Corner cell */}
                      <th className="sticky left-0 top-0 z-35 bg-slate-50 dark:bg-zinc-850 p-4 font-bold text-left border-r border-b border-slate-250 dark:border-zinc-750 shadow-[inset_-1px_-1px_0_var(--border-color)]">
                        Checklist Criteria / क्राइटेरिया
                      </th>
                      {/* Bidder Column Headers */}
                      {bidders.map(bidder => (
                        <th 
                          key={bidder.id} 
                          className="sticky top-0 z-10 bg-slate-50 dark:bg-zinc-850 p-4 font-bold border-r border-b border-slate-250 dark:border-zinc-750 text-left min-w-[200px] shadow-[inset_0_-1px_0_var(--border-color)]"
                        >
                          <div className="flex flex-col">
                            <span className="text-slate-800 dark:text-slate-100 font-extrabold truncate max-w-[180px]">{bidder.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium truncate max-w-[180px]">{bidder.email}</span>
                            <div className="flex items-center gap-1.5 mt-2">
                              <button
                                onClick={() => openEmailModal(bidder)}
                                className="p-1 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-zinc-700 rounded text-[9px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Mail size={10} /> Email
                              </button>
                              <button
                                onClick={() => openEditModal(bidder)}
                                className="p-1 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 rounded text-[9px] cursor-pointer transition-colors"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-zinc-850">
                    {checklistItems.map(item => {
                      const isSubmission = item.category === 'submission';
                      const isCustomTextItem = item.label.toLowerCase() === 'any other deviations';

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/20 dark:hover:bg-zinc-800/10">
                          {/* Sticky Left Criteria Label Column */}
                          <td className="sticky left-0 z-20 bg-white dark:bg-zinc-900 p-4 border-r border-slate-250 dark:border-zinc-750 font-bold text-slate-800 dark:text-slate-200 shadow-[inset_-1px_0_0_var(--border-color)] max-w-[280px] break-words">
                            <div className="space-y-1">
                              <span className="leading-tight block">{item.label}</span>
                              <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                                isSubmission 
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                  : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                              }`}>
                                {isSubmission ? 'Submission' : 'Acceptance'}
                              </span>
                            </div>
                          </td>

                          {/* Bidder Compliance Status Cells */}
                          {bidders.map(bidder => {
                            const statusObj = bidder.statuses.find(s => s.checklistItemId === item.id);
                            const currentStatus = statusObj?.status;

                            if (isCustomTextItem) {
                              return (
                                <td 
                                  key={bidder.id} 
                                  className="p-4 border-r border-slate-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 min-w-[220px]"
                                >
                                  <DeviationTextInput
                                    bidderId={bidder.id}
                                    itemId={item.id}
                                    initialValue={currentStatus || ''}
                                    onSave={handleStatusChange}
                                  />
                                </td>
                              );
                            }

                            return (
                              <td 
                                key={bidder.id} 
                                className="p-4 border-r border-slate-200 dark:border-zinc-850 bg-white dark:bg-zinc-900"
                              >
                                <div className="inline-flex bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-slate-200 dark:border-zinc-750">
                                  {isSubmission ? (
                                    <>
                                      <button
                                        onClick={() => handleStatusChange(bidder.id, item.id, 'submitted')}
                                        className={`px-2 py-1 text-[10px] font-bold rounded-md cursor-pointer transition-colors ${
                                          currentStatus === 'submitted'
                                            ? 'bg-emerald-600 text-white shadow-sm'
                                            : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                                        }`}
                                      >
                                        Sub
                                      </button>
                                      <button
                                        onClick={() => handleStatusChange(bidder.id, item.id, 'not_submitted')}
                                        className={`px-2 py-1 text-[10px] font-bold rounded-md cursor-pointer transition-colors ${
                                          currentStatus === 'not_submitted'
                                            ? 'bg-rose-600 text-white shadow-sm'
                                            : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                                        }`}
                                      >
                                        Pen
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => handleStatusChange(bidder.id, item.id, 'accepted')}
                                        className={`px-2 py-1 text-[10px] font-bold rounded-md cursor-pointer transition-colors ${
                                          currentStatus === 'accepted'
                                            ? 'bg-emerald-600 text-white shadow-sm'
                                            : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                                        }`}
                                      >
                                        Acc
                                      </button>
                                      <button
                                        onClick={() => handleStatusChange(bidder.id, item.id, 'not_accepted')}
                                        className={`px-2 py-1 text-[10px] font-bold rounded-md cursor-pointer transition-colors ${
                                          currentStatus === 'not_accepted'
                                            ? 'bg-rose-600 text-white shadow-sm'
                                            : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                                        }`}
                                      >
                                        Dev
                                      </button>
                                    </>
                                  )}
                                  <button
                                    onClick={() => handleStatusChange(bidder.id, item.id, 'not_applicable')}
                                    className={`px-2 py-1 text-[10px] font-bold rounded-md cursor-pointer transition-colors ${
                                      currentStatus === 'not_applicable'
                                        ? 'bg-slate-400 dark:bg-zinc-600 text-white shadow-sm'
                                        : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                                    }`}
                                  >
                                    N/A
                                  </button>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ADD BIDDER DIALOG MODAL */}
      <Dialog
        isOpen={isAddingBidder}
        onClose={() => setIsAddingBidder(false)}
        title="Add New Bidder"
        size="sm"
      >
        <form onSubmit={handleAddBidder} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block">Bidder Name / Company</label>
            <input
              type="text"
              required
              value={bidderName}
              onChange={(e) => setBidderName(e.target.value)}
              placeholder="e.g. Acme Corporation"
              className="w-full text-xs p-2 bg-slate-50 dark:bg-zinc-800 text-slate-800 dark:text-white border border-slate-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block">Email Address</label>
            <input
              type="email"
              required
              value={bidderEmail}
              onChange={(e) => setBidderEmail(e.target.value)}
              placeholder="bidder@domain.com"
              className="w-full text-xs p-2 bg-slate-50 dark:bg-zinc-800 text-slate-800 dark:text-white border border-slate-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block">Contact Person</label>
              <input
                type="text"
                required
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="John Doe"
                className="w-full text-xs p-2 bg-slate-50 dark:bg-zinc-800 text-slate-800 dark:text-white border border-slate-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block">Phone / Tel</label>
              <input
                type="text"
                required
                value={bidderPhone}
                onChange={(e) => setBidderPhone(e.target.value)}
                placeholder="099-XXXXXXX"
                className="w-full text-xs p-2 bg-slate-50 dark:bg-zinc-800 text-slate-800 dark:text-white border border-slate-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsAddingBidder(false)}
              className="px-4 py-2 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-555 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSaving && <Loader2 size={12} className="animate-spin" />}
              Create Bidder
            </button>
          </div>
        </form>
      </Dialog>

      {/* EDIT BIDDER DIALOG MODAL */}
      <Dialog
        isOpen={editingBidder !== null}
        onClose={() => setEditingBidder(null)}
        title={`Edit Details for ${editingBidder?.name}`}
        size="sm"
      >
        <form onSubmit={handleEditBidder} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block">Bidder Name / Company</label>
            <input
              type="text"
              required
              value={bidderName}
              onChange={(e) => setBidderName(e.target.value)}
              className="w-full text-xs p-2 bg-slate-50 dark:bg-zinc-800 text-slate-800 dark:text-white border border-slate-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block">Email Address</label>
            <input
              type="email"
              required
              value={bidderEmail}
              onChange={(e) => setBidderEmail(e.target.value)}
              className="w-full text-xs p-2 bg-slate-50 dark:bg-zinc-800 text-slate-800 dark:text-white border border-slate-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block">Contact Person</label>
              <input
                type="text"
                required
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 dark:bg-zinc-800 text-slate-800 dark:text-white border border-slate-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block">Phone / Tel</label>
              <input
                type="text"
                required
                value={bidderPhone}
                onChange={(e) => setBidderPhone(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 dark:bg-zinc-800 text-slate-800 dark:text-white border border-slate-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setEditingBidder(null)}
              className="px-4 py-2 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-555 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSaving && <Loader2 size={12} className="animate-spin" />}
              Save Details
            </button>
          </div>
        </form>
      </Dialog>

      {/* DELETE BIDDER CONFIRMATION DIALOG MODAL */}
      <Dialog
        isOpen={deletingBidder !== null}
        onClose={() => setDeletingBidder(null)}
        title="Delete Bidder"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
            Are you sure you want to delete bidder <strong>{deletingBidder?.name}</strong>?
          </p>
          <p className="text-xs text-rose-500 font-bold bg-rose-955/20 border border-rose-900/30 p-2.5 rounded-lg">
            ⚠️ This will permanently delete all of this bidder's records and compliance statuses. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setDeletingBidder(null)}
              className="px-4 py-2 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteBidder}
              disabled={isSaving}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-555 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSaving && <Loader2 size={12} className="animate-spin" />}
              Delete Bidder
            </button>
          </div>
        </div>
      </Dialog>

      {/* EMAIL DRAFT VIEW DIALOG MODAL */}
      <Dialog
        isOpen={emailBidder !== null}
        onClose={() => setEmailBidder(null)}
        title={`Bilingual Compliance Email for ${emailBidder?.name}`}
        size="lg"
      >
        <div className="space-y-4">
          {tender.subjectLine === null && (
            <div className="p-2 border border-amber-900/30 bg-amber-955/20 text-amber-500 rounded-lg text-[10px] font-bold">
              ℹ️ Tip: Customize the formal Subject Line suffix on the sidebar settings panel.
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">Subject</label>
            <input
              type="text"
              value={draftSubject}
              onChange={(e) => setDraftSubject(e.target.value)}
              className="w-full text-xs p-2 bg-slate-50 dark:bg-zinc-950 border border-slate-250 dark:border-zinc-800 rounded-lg font-semibold text-slate-800 dark:text-white focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">Email Body</label>
            <textarea
              value={draftBody}
              onChange={(e) => setDraftBody(e.target.value)}
              rows={15}
              className="w-full text-xs p-3 bg-slate-50 dark:bg-zinc-955 border border-slate-250 dark:border-zinc-800 rounded-lg font-mono text-slate-800 dark:text-zinc-300 focus:outline-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 dark:border-zinc-800 pt-3">
            <span className="text-[10px] text-slate-400">
              * Click "Copy Text" or click "Open in Mail Client" to launch standard mailto link.
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyEmail}
                className="px-4 py-2 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
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
      </Dialog>

    </div>
  );
}
