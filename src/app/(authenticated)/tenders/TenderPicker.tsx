'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Archive, ArrowUpDown, FilePlus2, FolderOpen, Search, RotateCcw, X, Layers, Copy, History } from 'lucide-react';
import { createTender } from '@/app/actions/tender';
import { useToast } from '@/components/ui/toast';
import { Badge, Button, Card, EmptyState, PageHeader, Input, Textarea, Select, Dialog } from '@/components/ui/primitives';

type Tender = {
  id: number;
  name: string;
  subjectLine: string | null;
  status: 'active' | 'archived';
  ownerId: number;
  ownerName?: string | null;
  bidderCount?: number;
  checklistCount?: number;
  createdAt: Date;
  updatedAt: Date;
};

type Template = {
  id: number;
  name: string;
  description: string | null;
  isDefault?: boolean;
};

export default function TenderPicker({
  initialTenders,
  templates = [],
  currentUserRole,
  currentUserId,
}: {
  initialTenders: Tender[];
  templates?: Template[];
  currentUserRole: string;
  currentUserId: number;
}) {
  const [showArchived, setShowArchived] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'updated' | 'name'>('updated');

  // Form State
  const [name, setName] = useState('');
  const [subjectLine, setSubjectLine] = useState('');
  const [sourceType, setSourceType] = useState<'master' | 'duplicate' | 'archived'>('master');
  const [sourceTenderId, setSourceTenderId] = useState('');
  const [archivedTemplateId, setArchivedTemplateId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();
  const isSuperuser = currentUserRole === 'superuser';

  const defaultTemplate = useMemo(() => templates.find(t => t.isDefault) || templates[0], [templates]);
  const archivedTemplates = useMemo(() => templates.filter(t => !t.isDefault), [templates]);

  const list = useMemo(() => {
    return initialTenders
      .filter((t) => (showArchived ? t.status === 'archived' : t.status === 'active'))
      .filter((t) => `${t.name} ${t.subjectLine || ''} ${t.ownerName || ''}`.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (sort === 'name' ? a.name.localeCompare(b.name) : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
  }, [initialTenders, search, showArchived, sort]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      toast('Tender name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      let selectedTemplateId: number | null = null;
      let selectedSourceTenderId: number | null = null;

      if (sourceType === 'master') {
        selectedTemplateId = defaultTemplate ? defaultTemplate.id : null;
      } else if (sourceType === 'archived' && archivedTemplateId) {
        selectedTemplateId = Number(archivedTemplateId);
      } else if (sourceType === 'duplicate' && sourceTenderId) {
        selectedSourceTenderId = Number(sourceTenderId);
      }

      const result = await createTender({
        name: name.trim(),
        subjectLine: subjectLine.trim() || null,
        sourceTenderId: selectedSourceTenderId,
        templateId: selectedTemplateId,
      });

      toast('Tender created successfully', 'success');
      window.location.href = `/tenders/${result.tenderId}`;
    } catch (error: any) {
      toast(error.message || 'Could not create tender', 'error');
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--bg-app)] p-4 pb-24 sm:p-8 sm:pb-8">
      <div className="mx-auto max-w-[var(--content-max)] space-y-6">
        <PageHeader
          title={showArchived ? 'Archived Tenders' : 'Active Tenders'}
          description="Each tender maintains an isolated bidder database, checklist setup, and compliance history."
          actions={
            <>
              <Button variant="secondary" onClick={() => setShowArchived(!showArchived)}>
                {showArchived ? <RotateCcw size={16} /> : <Archive size={16} />}
                {showArchived ? 'Active Tenders' : 'Archived'}
              </Button>
              <Button onClick={() => setShowCreate(true)}>
                <FilePlus2 size={16} /> New Tender
              </Button>
            </>
          }
        />

        {/* Search & Filter Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-xl">
            <Search size={16} className="pointer-events-none absolute left-3 top-3.5 text-[var(--text-muted)]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tenders by name, subject, or owner..."
              className="min-h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] pl-10 pr-3 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--brand-primary)]"
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => setSort(sort === 'updated' ? 'name' : 'updated')}
            className="self-start sm:self-auto"
          >
            <ArrowUpDown size={15} /> Sort: {sort === 'updated' ? 'Recently Updated' : 'Name'}
          </Button>
        </div>

        {/* Tenders Grid or Empty State */}
        {list.length === 0 ? (
          <EmptyState
            title={search ? 'No tenders match your search' : `No ${showArchived ? 'archived' : 'active'} tenders yet`}
            description={
              search
                ? 'Try a different tender name, subject, or owner.'
                : 'Create a new tender to start tracking bidder compliance queries.'
            }
            action={
              search ? (
                <Button variant="secondary" onClick={() => setSearch('')}>
                  <X size={15} /> Clear Search
                </Button>
              ) : (
                <Button onClick={() => setShowCreate(true)}>
                  <FilePlus2 size={16} /> Create Tender
                </Button>
              )
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((tender) => {
              const isOtherOwner = isSuperuser && tender.ownerId !== currentUserId;
              return (
                <Card key={tender.id} hoverable className="flex min-h-64 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="rounded-[var(--radius-sm)] bg-[var(--brand-primary)]/10 p-2.5 text-[var(--brand-primary)]">
                      <FolderOpen size={20} />
                    </div>
                    <Badge tone={tender.status === 'active' ? 'success' : 'neutral'}>
                      {tender.status === 'active' ? 'Active' : 'Archived'}
                    </Badge>
                  </div>

                  <div className="mt-5 min-w-0 flex-1">
                    <h2 className="truncate text-lg font-bold text-[var(--text-primary)]">{tender.name}</h2>
                    <p className="mt-1 line-clamp-2 min-h-10 text-sm text-[var(--text-muted)]">
                      {tender.subjectLine || 'No subject line specified'}
                    </p>
                    {isOtherOwner && (
                      <p className="mt-3 text-xs font-semibold text-[var(--status-note)]">
                        Owner: {tender.ownerName || 'Another user'}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--border-subtle)] pt-4 text-xs">
                    <div>
                      <span className="block text-[var(--text-muted)]">Bidders</span>
                      <strong className="text-sm text-[var(--text-primary)]">{tender.bidderCount ?? 0}</strong>
                    </div>
                    <div>
                      <span className="block text-[var(--text-muted)]">Checklist Items</span>
                      <strong className="text-sm text-[var(--text-primary)]">{tender.checklistCount ?? 0}</strong>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 pt-2">
                    <span className="text-xs text-[var(--text-muted)]">
                      Updated {new Date(tender.updatedAt).toLocaleDateString()}
                    </span>
                    <Link href={`/tenders/${tender.id}/overview`}>
                      <Button size="sm">Open Tender</Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE TENDER MODAL */}
      <Dialog isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Tender" size="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Tender Name / Reference Number"
            placeholder="e.g. MRPL/CR/2026/045"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Textarea
            label="Email Subject Line (Optional)"
            placeholder="e.g. Compliance Queries for Tender MRPL/CR/2026/045"
            rows={2}
            value={subjectLine}
            onChange={(e) => setSubjectLine(e.target.value)}
          />

          <div className="space-y-3 pt-2">
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Starting Point Checklist
            </label>

            <div className="space-y-2">
              {/* Option 1: Master Default Template */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-[var(--radius-sm)] border cursor-pointer transition-colors ${
                  sourceType === 'master'
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)]'
                }`}
              >
                <input
                  type="radio"
                  name="sourceType"
                  checked={sourceType === 'master'}
                  onChange={() => setSourceType('master')}
                  className="mt-0.5 accent-[var(--brand-primary)] cursor-pointer"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-primary)]">
                    <Layers size={16} className="text-[var(--brand-primary)]" />
                    <span>Master Template (Default)</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    Use the active company-wide master checklist template (
                    {defaultTemplate ? defaultTemplate.name : 'Standard MRPL Checklist'}).
                  </p>
                </div>
              </label>

              {/* Option 2: Duplicate Existing Tender */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-[var(--radius-sm)] border cursor-pointer transition-colors ${
                  sourceType === 'duplicate'
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)]'
                }`}
              >
                <input
                  type="radio"
                  name="sourceType"
                  checked={sourceType === 'duplicate'}
                  onChange={() => setSourceType('duplicate')}
                  className="mt-0.5 accent-[var(--brand-primary)] cursor-pointer"
                />
                <div className="space-y-2 w-full">
                  <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-primary)]">
                    <Copy size={16} className="text-[var(--brand-primary)]" />
                    <span>Duplicate an Existing Tender</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    Copy verification criteria from one of your previously configured tenders.
                  </p>
                  {sourceType === 'duplicate' && (
                    <Select
                      required
                      value={sourceTenderId}
                      onChange={(e) => setSourceTenderId(e.target.value)}
                    >
                      <option value="">Choose a tender to copy criteria from...</option>
                      {initialTenders
                        .filter((t) => t.ownerId === currentUserId || isSuperuser)
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                    </Select>
                  )}
                </div>
              </label>

              {/* Option 3: Choose Archived Template */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-[var(--radius-sm)] border cursor-pointer transition-colors ${
                  sourceType === 'archived'
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)]'
                }`}
              >
                <input
                  type="radio"
                  name="sourceType"
                  checked={sourceType === 'archived'}
                  onChange={() => setSourceType('archived')}
                  className="mt-0.5 accent-[var(--brand-primary)] cursor-pointer"
                />
                <div className="space-y-2 w-full">
                  <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-primary)]">
                    <History size={16} className="text-[var(--brand-primary)]" />
                    <span>Choose an Archived Template</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    Select a prior version or custom archived template profile.
                  </p>
                  {sourceType === 'archived' && (
                    <Select
                      required
                      value={archivedTemplateId}
                      onChange={(e) => setArchivedTemplateId(e.target.value)}
                    >
                      <option value="">Select an archived template profile...</option>
                      {archivedTemplates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </Select>
                  )}
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create Tender
            </Button>
          </div>
        </form>
      </Dialog>
    </main>
  );
}
