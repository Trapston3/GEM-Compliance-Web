'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Edit2, ShieldAlert, FileText, CheckCircle2, HelpCircle, Save, X } from 'lucide-react';
import { Button, Badge, Card, Dialog, Input, Select, Textarea } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';

export interface ChecklistEditorItem {
  id?: number;
  label: string;
  category: string; // 'submission' | 'acceptance' | 'text_note'
  groupOrder: number;
  sortOrder?: number;
}

interface ChecklistEditorProps {
  items: ChecklistEditorItem[];
  canDelete?: boolean;
  onAddItem?: (newItem: { label: string; category: string; groupOrder: number }) => Promise<void> | void;
  onUpdateItem?: (id: number | string, changes: { label?: string; category?: string; groupOrder?: number }) => Promise<void> | void;
  onDeleteItem?: (id: number | string) => Promise<void> | void;
  onChangeItems?: (items: ChecklistEditorItem[]) => void;
  title?: string;
  description?: string;
}

const GROUP_TITLES: Record<number, string> = {
  1: '1. Technical & Commercial Submissions',
  2: '2. EMD & Earnest Money Guarantees',
  3: '3. Procurement Terms & Acceptance Clauses',
};

const CATEGORY_LABELS: Record<string, string> = {
  submission: 'Submission Check (Required Document)',
  acceptance: 'Acceptance Check (Standard Clause)',
  text_note: 'Text Note (Freeform Comment)',
};

export default function ChecklistEditor({
  items,
  canDelete = true,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onChangeItems,
  title = 'Configure Compliance Criteria',
  description = 'Add, modify, or reorder verification points for tender evaluation.',
}: ChecklistEditorProps) {
  const { toast } = useToast();

  // Add Item Dialog state
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newCategory, setNewCategory] = useState<'submission' | 'acceptance' | 'text_note'>('submission');
  const [newGroupOrder, setNewGroupOrder] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Item Dialog state
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<ChecklistEditorItem | null>(null);

  // Delete Confirmation Dialog state
  const [deletingItem, setDeletingItem] = useState<ChecklistEditorItem | null>(null);

  // Group items by groupOrder
  const groups = [1, 2, 3];
  const itemsByGroup: Record<number, ChecklistEditorItem[]> = { 1: [], 2: [], 3: [] };
  
  items.forEach((item, index) => {
    const groupKey = item.groupOrder in itemsByGroup ? item.groupOrder : 1;
    itemsByGroup[groupKey].push({ ...item, sortOrder: item.sortOrder ?? index + 1 });
  });

  // Handle Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) {
      toast('Please enter a criteria label', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedLabel = newLabel.trim().toUpperCase();
      if (onAddItem) {
        await onAddItem({ label: formattedLabel, category: newCategory, groupOrder: newGroupOrder });
      } else if (onChangeItems) {
        const updated = [...items, { label: formattedLabel, category: newCategory, groupOrder: newGroupOrder, sortOrder: items.length + 1 }];
        onChangeItems(updated);
      }
      toast('Criteria item added successfully', 'success');
      setNewLabel('');
      setNewCategory('submission');
      setNewGroupOrder(1);
      setIsAdding(false);
    } catch (err: any) {
      toast(err.message || 'Failed to add item', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.label.trim()) {
      toast('Label cannot be empty', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedLabel = editingItem.label.trim().toUpperCase();
      if (onUpdateItem && editingItem.id !== undefined) {
        await onUpdateItem(editingItem.id, {
          label: formattedLabel,
          category: editingItem.category,
          groupOrder: editingItem.groupOrder,
        });
      } else if (onChangeItems && editingItemIndex !== null) {
        const updated = [...items];
        updated[editingItemIndex] = {
          ...editingItem,
          label: formattedLabel,
        };
        onChangeItems(updated);
      }
      toast('Criteria item updated', 'success');
      setEditingItem(null);
      setEditingItemIndex(null);
    } catch (err: any) {
      toast(err.message || 'Failed to update item', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Confirm
  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    setIsSubmitting(true);
    try {
      if (onDeleteItem && deletingItem.id !== undefined) {
        await onDeleteItem(deletingItem.id);
      } else if (onChangeItems) {
        const updated = items.filter(item => item !== deletingItem && item.id !== deletingItem.id);
        onChangeItems(updated);
      }
      toast('Criteria item deleted', 'success');
      setDeletingItem(null);
    } catch (err: any) {
      toast(err.message || 'Failed to delete item', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <Card className="p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
            <FileText size={18} className="text-[var(--brand-primary)]" />
            {title}
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">{description}</p>
        </div>
        <Button onClick={() => setIsAdding(true)}>
          <Plus size={16} /> Add Criteria Item
        </Button>
      </Card>

      {/* Permission Banner Notice */}
      {!canDelete && (
        <div className="p-3.5 rounded-[var(--radius-sm)] bg-[var(--status-warning-bg)] border border-[var(--status-warning)]/30 text-[var(--status-warning-text)] text-xs font-semibold flex items-center gap-2">
          <ShieldAlert size={16} className="shrink-0 text-[var(--status-warning)]" />
          <span>Superuser permissions are required to permanently delete criteria items. You can rename or update categories.</span>
        </div>
      )}

      {/* Groups Display */}
      {groups.map((groupNum) => {
        const groupItems = itemsByGroup[groupNum] || [];
        return (
          <Card key={groupNum} className="overflow-hidden">
            <div className="bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] px-5 py-3 flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--text-secondary)]">
                {GROUP_TITLES[groupNum] || `Group ${groupNum}`}
              </h4>
              <Badge tone="neutral">{groupItems.length} Items</Badge>
            </div>

            {groupItems.length === 0 ? (
              <div className="p-6 text-center text-xs text-[var(--text-muted)] italic">
                No verification criteria items in this section.
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-subtle)]">
                {groupItems.map((item) => {
                  const originalIndex = items.findIndex(i => (i.id && item.id ? i.id === item.id : i === item));
                  return (
                    <div key={item.id ?? item.label} className="p-4 flex items-center justify-between gap-4 hover:bg-[var(--bg-subtle)]/50 transition-colors">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[var(--text-primary)] truncate block">
                            {item.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge tone={item.category === 'submission' ? 'success' : item.category === 'acceptance' ? 'warning' : 'note'}>
                            {item.category === 'submission' ? 'Required Document' : item.category === 'acceptance' ? 'Clause Check' : 'Text Comment'}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItem({ ...item });
                            setEditingItemIndex(originalIndex >= 0 ? originalIndex : null);
                          }}
                          className="inline-flex min-h-9 px-2.5 items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                        >
                          <Edit2 size={13} /> Edit
                        </button>

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => setDeletingItem(item)}
                            className="inline-flex min-h-9 px-2.5 items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--status-danger)]/30 text-xs font-semibold text-[var(--status-danger-text)] hover:bg-[var(--status-danger-bg)] transition-colors cursor-pointer"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}

      {/* ADD ITEM DIALOG MODAL */}
      <Dialog
        isOpen={isAdding}
        onClose={() => setIsAdding(false)}
        title="Add Checklist Criteria Item"
        size="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Criteria Label (Upper Case Recommended)"
            placeholder="e.g. ISO 9001 CERTIFICATE"
            required
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
          />

          <Select
            label="Evaluation Category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as any)}
          >
            <option value="submission">Submission Check (Required Document)</option>
            <option value="acceptance">Acceptance Check (Standard Clause)</option>
            <option value="text_note">Text Note (Freeform Comment)</option>
          </Select>

          <Select
            label="Group Section"
            value={newGroupOrder}
            onChange={(e) => setNewGroupOrder(Number(e.target.value))}
          >
            <option value={1}>Group 1: Technical & Commercial Submissions</option>
            <option value={2}>Group 2: EMD & Earnest Money Guarantees</option>
            <option value={3}>Group 3: Procurement Terms & Acceptance Clauses</option>
          </Select>

          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="secondary" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Add Item
            </Button>
          </div>
        </form>
      </Dialog>

      {/* EDIT ITEM DIALOG MODAL */}
      <Dialog
        isOpen={editingItem !== null}
        onClose={() => setEditingItem(null)}
        title="Edit Checklist Criteria Item"
        size="md"
      >
        {editingItem && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <Input
              label="Criteria Label"
              required
              value={editingItem.label}
              onChange={(e) => setEditingItem({ ...editingItem, label: e.target.value })}
            />

            <Select
              label="Evaluation Category"
              value={editingItem.category}
              onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
            >
              <option value="submission">Submission Check (Required Document)</option>
              <option value="acceptance">Acceptance Check (Standard Clause)</option>
              <option value="text_note">Text Note (Freeform Comment)</option>
            </Select>

            <Select
              label="Group Section"
              value={editingItem.groupOrder}
              onChange={(e) => setEditingItem({ ...editingItem, groupOrder: Number(e.target.value) })}
            >
              <option value={1}>Group 1: Technical & Commercial Submissions</option>
              <option value={2}>Group 2: EMD & Earnest Money Guarantees</option>
              <option value={3}>Group 3: Procurement Terms & Acceptance Clauses</option>
            </Select>

            <div className="flex justify-end gap-3 pt-3">
              <Button type="button" variant="secondary" onClick={() => setEditingItem(null)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG MODAL */}
      <Dialog
        isOpen={deletingItem !== null}
        onClose={() => setDeletingItem(null)}
        title="Delete Criteria Item"
        size="sm"
      >
        {deletingItem && (
          <div className="space-y-4">
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Are you sure you want to delete criteria item <strong>{deletingItem.label}</strong>?
            </p>
            <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--status-danger-bg)] border border-[var(--status-danger)]/30 text-[var(--status-danger-text)] text-xs font-semibold">
              Warning: Deleting this criteria item will remove all corresponding evaluation statuses across active bidders.
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setDeletingItem(null)}>
                Cancel
              </Button>
              <Button type="button" variant="danger" isLoading={isSubmitting} onClick={handleDeleteConfirm}>
                Confirm Delete
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
