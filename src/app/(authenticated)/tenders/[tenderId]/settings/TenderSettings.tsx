'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteTender, duplicateTender, setTenderStatus, updateTender } from '@/app/actions/tender';
import { useToast } from '@/components/ui/toast';
import { Button, Card, Input, Textarea } from '@/components/ui/primitives';

export default function TenderSettings({ tender, role }: { tender: any; role: string }) {
  const [name, setName] = useState(tender.name);
  const [subjectLine, setSubjectLine] = useState(tender.subjectLine || '');
  const [confirm, setConfirm] = useState('');
  const [duplicateName, setDuplicateName] = useState(`${tender.name} Copy`);
  const [isSaving, setIsSaving] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateTender({ id: tender.id, name, subjectLine: subjectLine || null });
      toast('Tender details saved successfully', 'success');
      router.refresh();
    } catch (e: any) {
      toast(e.message || 'Failed to save tender details', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async () => {
    setIsSaving(true);
    try {
      await setTenderStatus(tender.id, tender.status === 'active' ? 'archived' : 'active');
      toast(tender.status === 'active' ? 'Tender archived' : 'Tender restored', 'success');
      router.push('/tenders');
    } catch (e: any) {
      toast(e.message || 'Failed to update tender status', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicate = async () => {
    if (!duplicateName.trim()) {
      toast('Please enter a name for the duplicated tender', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const res = await duplicateTender(tender.id, duplicateName.trim());
      toast('Tender duplicated successfully', 'success');
      router.push(`/tenders/${res.tenderId}`);
    } catch (e: any) {
      toast(e.message || 'Failed to duplicate tender', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    if (confirm !== tender.name) {
      toast('Tender name confirmation does not match', 'error');
      return;
    }
    setIsSaving(true);
    try {
      await deleteTender(tender.id, confirm);
      toast('Tender permanently deleted', 'success');
      router.push('/tenders');
    } catch (e: any) {
      toast(e.message || 'Failed to delete tender', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--bg-app)] p-4 pb-24 sm:p-8 sm:pb-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Tender Details Form */}
        <Card className="p-6">
          <h2 className="text-base font-bold text-[var(--text-primary)] mb-4">General Details</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label="Tender Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Textarea
              label="Email Subject Line"
              rows={3}
              value={subjectLine}
              onChange={(e) => setSubjectLine(e.target.value)}
            />
            <div className="pt-2">
              <Button type="submit" isLoading={isSaving}>
                Save Details
              </Button>
            </div>
          </form>
        </Card>

        {/* Duplicate Tender */}
        <Card className="p-6">
          <h2 className="text-base font-bold text-[var(--text-primary)] mb-2">Duplicate Tender</h2>
          <p className="text-xs text-[var(--text-muted)] mb-4">
            Create a copy of this tender with all checklist criteria pre-populated.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              value={duplicateName}
              onChange={(e) => setDuplicateName(e.target.value)}
              placeholder="New tender name"
            />
            <Button variant="secondary" onClick={handleDuplicate} isLoading={isSaving} className="shrink-0">
              Duplicate
            </Button>
          </div>
        </Card>

        {/* Lifecycle / Archive */}
        <Card className="p-6">
          <h2 className="text-base font-bold text-[var(--text-primary)] mb-1">Tender Lifecycle Status</h2>
          <p className="text-xs text-[var(--text-muted)] mb-4">
            Current Status: <strong className="capitalize text-[var(--text-primary)]">{tender.status}</strong>
          </p>
          <Button variant="secondary" onClick={handleArchive} isLoading={isSaving}>
            {tender.status === 'active' ? 'Archive Tender' : 'Restore Tender'}
          </Button>
        </Card>

        {/* Danger Zone: Delete */}
        <Card className="p-6 border-[var(--status-danger)]/30 bg-[var(--status-danger-bg)]/20 space-y-4">
          <div>
            <h2 className="text-base font-bold text-[var(--status-danger-text)]">Delete Tender</h2>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Permanently delete this tender, including all associated bidder records and evaluation matrix statuses.
            </p>
          </div>

          {role === 'guest' ? (
            <p className="text-xs font-semibold text-[var(--status-danger-text)]">
              Guest users are restricted from deleting tenders.
            </p>
          ) : (
            <div className="space-y-3">
              <Input
                placeholder={`Type "${tender.name}" to confirm`}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              <Button
                variant="danger"
                disabled={confirm !== tender.name}
                isLoading={isSaving}
                onClick={handleRemove}
              >
                Delete Permanently
              </Button>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
