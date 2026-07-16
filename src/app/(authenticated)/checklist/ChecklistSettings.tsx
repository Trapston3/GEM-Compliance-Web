'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Loader2,
  FileCheck,
  AlertTriangle,
  MoveDown,
  MoveUp
} from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { addChecklistItem, updateChecklistItem, deleteChecklistItem } from '@/app/actions/checklist';
import { useRouter } from 'next/navigation';

interface ChecklistItem {
  id: number;
  label: string;
  category: string;
  groupOrder: number;
  sortOrder: number;
  createdAt: Date;
}

interface ChecklistSettingsProps {
  items: ChecklistItem[];
  tenderId: number;
  currentUserRole: string;
}

export default function ChecklistSettings({ items, tenderId, currentUserRole }: ChecklistSettingsProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<ChecklistItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState<'submission' | 'acceptance' | 'text_note'>('submission');
  
  // Category change warning state
  const [showCategoryWarning, setShowCategoryWarning] = useState(false);

  // Add Item Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await addChecklistItem({
        tenderId,
        label,
        category,
      });
      if (res.success) {
        toast('Checklist item added successfully', 'success');
        setIsAdding(false);
        setLabel('');
        setCategory('submission');
        router.refresh();
      }
    } catch (err: any) {
      toast(err.message || 'Failed to add item', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (item: ChecklistItem) => {
    setEditingItem(item);
    setLabel(item.label);
    setCategory(item.category as any);
    setShowCategoryWarning(false);
  };

  // Close Edit Modal
  const closeEditModal = () => {
    setEditingItem(null);
    setLabel('');
    setCategory('submission');
    setShowCategoryWarning(false);
  };

  // Edit Item Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    // Check if category changed to prompt confirmation
    const isCategoryChanged = editingItem.category !== category;
    if (isCategoryChanged && !showCategoryWarning) {
      setShowCategoryWarning(true);
      return; // Stop here to show warning confirmation
    }

    setIsSaving(true);
    try {
      const res = await updateChecklistItem({
        id: editingItem.id,
        label,
        category,
      });
      if (res.success) {
        toast('Checklist item updated successfully', 'success');
        closeEditModal();
        router.refresh();
      }
    } catch (err: any) {
      toast(err.message || 'Failed to update item', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Item Submit
  const handleDeleteSubmit = async () => {
    if (!deletingItem) return;
    setIsSaving(true);
    try {
      const res = await deleteChecklistItem(deletingItem.id);
      if (res.success) {
        toast('Checklist item deleted successfully', 'success');
        setDeletingItem(null);
        router.refresh();
      }
    } catch (err: any) {
      toast(err.message || 'Failed to delete item', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Group items by groupOrder
  const group1Items = items.filter(i => i.groupOrder === 1);
  const group2Items = items.filter(i => i.groupOrder === 2); // EMD
  const group3Items = items.filter(i => i.groupOrder === 3);

  const isGuest = currentUserRole === 'guest';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Top action bar */}
      <div className="flex justify-between items-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
            Configure Compliance Criteria
          </h3>
          <p className="text-xs text-slate-500">
            Define requirements for documents submission (Section A) and clauses acceptance (Section B).
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2 px-4 rounded-xl shadow-sm cursor-pointer transition-colors"
        >
          <Plus size={14} /> Add Criteria
        </button>
      </div>

      {/* Checklist Sections Display */}
      <div className="space-y-6">
        
        {/* Section A - Group 1 (General Document Submission) */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 dark:bg-zinc-800/30 border-b border-slate-100 dark:border-zinc-800">
            <h4 className="font-bold text-xs text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
              Section A: Required Document Submissions (Group 1)
            </h4>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
            {group1Items.map((item) => (
              <li key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50/30 dark:hover:bg-zinc-800/10 text-xs">
                <span className="font-semibold text-slate-800 dark:text-zinc-200">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-500 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 rounded font-bold uppercase shrink-0">
                    {item.category === 'text_note' ? 'Text Note' : 'Submission'}
                  </span>
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1 border border-slate-200 dark:border-zinc-700 text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded cursor-pointer"
                    title="Edit Item"
                  >
                    <Edit2 size={12} />
                  </button>
                  {!isGuest && (
                    <button
                      onClick={() => setDeletingItem(item)}
                      className="p-1 border border-rose-200 dark:border-rose-900 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded cursor-pointer"
                      title="Delete Item"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Section A - Group 2 (EMD Exemptions) */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 dark:bg-zinc-800/30 border-b border-slate-100 dark:border-zinc-800">
            <h4 className="font-bold text-xs text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
              Section A: Earnest Money Deposit (Group 2)
            </h4>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
            {group2Items.map((item) => (
              <li key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50/30 dark:hover:bg-zinc-800/10 text-xs">
                <div className="space-y-1">
                  <span className="font-semibold text-slate-800 dark:text-zinc-200 block">{item.label}</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-500 italic block">
                    * Renders with conditional MSE Exemption notice immediately preceding it.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-500 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 rounded font-bold uppercase shrink-0">
                    {item.category === 'text_note' ? 'Text Note' : 'Submission'}
                  </span>
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1 border border-slate-200 dark:border-zinc-700 text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded cursor-pointer"
                    title="Edit Item"
                  >
                    <Edit2 size={12} />
                  </button>
                  {!isGuest && (
                    <button
                      onClick={() => setDeletingItem(item)}
                      className="p-1 border border-rose-200 dark:border-rose-900 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded cursor-pointer"
                      title="Delete Item"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Section B - Group 3 (Terms Acceptance Clauses) */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 dark:bg-zinc-800/30 border-b border-slate-100 dark:border-zinc-800">
            <h4 className="font-bold text-xs text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
              Section B: Deviation Check Clauses (Group 3)
            </h4>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
            {group3Items.map((item) => (
              <li key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50/30 dark:hover:bg-zinc-800/10 text-xs">
                <span className="font-semibold text-slate-800 dark:text-zinc-200">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-500 bg-indigo-500/10 px-2 py-0.5 border border-indigo-500/20 rounded font-bold uppercase shrink-0">
                    {item.category === 'text_note' ? 'Text Note' : 'Acceptance'}
                  </span>
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1 border border-slate-200 dark:border-zinc-700 text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded cursor-pointer"
                    title="Edit Item"
                  >
                    <Edit2 size={12} />
                  </button>
                  {!isGuest && (
                    <button
                      onClick={() => setDeletingItem(item)}
                      className="p-1 border border-rose-200 dark:border-rose-900 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded cursor-pointer"
                      title="Delete Item"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* ADD DIALOG MODAL */}
      <Dialog
        isOpen={isAdding}
        onClose={() => setIsAdding(false)}
        title="Add Compliance Criteria"
        size="sm"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block">Criteria Label / Name</label>
            <input
              type="text"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. ISO CERTIFICATE"
              className="w-full text-xs p-2 bg-slate-50 dark:bg-zinc-800 text-slate-800 dark:text-white border border-slate-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block">Evaluation Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full text-xs p-2 bg-slate-50 dark:bg-zinc-800 text-slate-800 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="submission">Document Submission (default status: Pending)</option>
              <option value="acceptance">Tender Clause Acceptance (default status: Not Accepted)</option>
              <option value="text_note">Free-text Deviation Note</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSaving && <Loader2 size={12} className="animate-spin" />}
              Add Criteria
            </button>
          </div>
        </form>
      </Dialog>

      {/* EDIT DIALOG MODAL WITH RESET WARNING */}
      <Dialog
        isOpen={editingItem !== null}
        onClose={closeEditModal}
        title="Edit Compliance Criteria"
        size="sm"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block">Criteria Label / Name</label>
            <input
              type="text"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full text-xs p-2 bg-slate-50 dark:bg-zinc-800 text-slate-800 dark:text-white border border-slate-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block">Evaluation Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full text-xs p-2 bg-slate-50 dark:bg-zinc-800 text-slate-800 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="submission">Document Submission</option>
              <option value="acceptance">Tender Clause Acceptance</option>
              <option value="text_note">Free-text Deviation Note</option>
            </select>
          </div>

          {showCategoryWarning && (
            <div className="p-3 border border-rose-900/30 bg-rose-950/20 text-rose-500 rounded-lg space-y-2 text-xs">
              <div className="flex items-start gap-1.5 font-bold">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>CRITICAL WARNING: Category Change Detected</span>
              </div>
              <p className="leading-relaxed">
                Changing this criteria category from <strong>{editingItem?.category}</strong> to <strong>{category}</strong> will render all previously recorded compliance cell values semantically invalid. 
              </p>
              <p className="font-bold">
                ALL bidders' status records for this item will be RESET to default values ({category === 'acceptance' ? 'Not Accepted' : 'Pending'}). This action will write to the audit log and cannot be undone.
              </p>
              <p className="italic text-[10px] text-slate-400">
                To confirm this change, press "Confirm Reset & Save" below.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={closeEditModal}
              className="px-4 py-2 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`px-4 py-2 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                showCategoryWarning ? 'bg-rose-600 hover:bg-rose-500' : 'bg-indigo-600 hover:bg-indigo-500'
              }`}
            >
              {isSaving && <Loader2 size={12} className="animate-spin" />}
              {showCategoryWarning ? 'Confirm Reset & Save' : 'Save Details'}
            </button>
          </div>
        </form>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG MODAL */}
      <Dialog
        isOpen={deletingItem !== null}
        onClose={() => setDeletingItem(null)}
        title="Delete Compliance Criteria"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-3 border border-rose-900/30 bg-rose-950/20 text-rose-500 rounded-lg space-y-2 text-xs">
            <div className="flex items-start gap-1.5 font-bold">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>WARNING: Deleting Compliance Item</span>
            </div>
            <p className="leading-relaxed">
              Are you sure you want to delete the compliance criteria <strong>"{deletingItem?.label}"</strong>?
            </p>
            <p className="font-bold">
              This will permanently erase all status data recorded for all bidders for this item! This action cannot be undone.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setDeletingItem(null)}
              className="px-4 py-2 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteSubmit}
              disabled={isSaving}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSaving && <Loader2 size={12} className="animate-spin" />}
              Delete Criteria
            </button>
          </div>
        </div>
      </Dialog>

    </div>
  );
}
