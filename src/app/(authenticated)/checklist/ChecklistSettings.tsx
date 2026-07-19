'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import ChecklistEditor from '@/components/ChecklistEditor';
import { addChecklistItem, updateChecklistItem, deleteChecklistItem } from '@/app/actions/checklist';

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
  const isSuperuser = currentUserRole === 'superuser';

  const handleAddItem = async (newItem: { label: string; category: string; groupOrder: number }) => {
    await addChecklistItem({
      tenderId,
      label: newItem.label,
      category: newItem.category as any,
    });
    router.refresh();
  };

  const handleUpdateItem = async (id: number | string, changes: { label?: string; category?: string; groupOrder?: number }) => {
    await updateChecklistItem({
      id: Number(id),
      label: changes.label || '',
      category: (changes.category || 'submission') as any,
    });
    router.refresh();
  };

  const handleDeleteItem = async (id: number | string) => {
    await deleteChecklistItem(Number(id));
    router.refresh();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <ChecklistEditor
        items={items}
        canDelete={isSuperuser}
        onAddItem={handleAddItem}
        onUpdateItem={handleUpdateItem}
        onDeleteItem={handleDeleteItem}
        title="Tender Compliance Checklist Setup"
        description="Configure verification points and document submission criteria for this tender."
      />
    </div>
  );
}
