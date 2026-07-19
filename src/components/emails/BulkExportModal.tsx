'use client';

import React, { useState } from 'react';
import { Download, FileArchive } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button, Badge, Card } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { downloadBulkEmlZip, EmlItem } from '@/lib/emlExport';

interface BulkExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenderName: string;
  drafts: EmlItem[];
}

export default function BulkExportModal({ isOpen, onClose, tenderName, drafts }: BulkExportModalProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (drafts.length === 0) {
      toast('No bidders with pending queries found to export.', 'error');
      return;
    }

    setIsExporting(true);
    try {
      await downloadBulkEmlZip(drafts, tenderName);
      toast(`Exported ${drafts.length} .eml query drafts to ZIP archive!`, 'success');
      onClose();
    } catch (err: any) {
      toast(err.message || 'Failed to export .eml drafts', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Bulk Export Compliance Query Drafts (.eml / .zip)" size="md">
      <div className="space-y-5">
        <Card className="p-4 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-primary)]">
            <FileArchive size={18} className="text-[var(--brand-primary)]" />
            <span>Universally Importable .EML Drafts</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Generates standard RFC 822 <code>.eml</code> files populated with recipient details, subject lines, and observation bullet points, packaged as a single <code>.zip</code> archive.
          </p>
          <p className="text-xs font-semibold text-[var(--text-secondary)]">
            Compatible with HCL Verse / Notes, Microsoft Outlook, Thunderbird, and standard webmail clients.
          </p>
        </Card>

        {/* Recipients List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Pending Query Recipients ({drafts.length})
            </h4>
            <Badge tone={drafts.length > 0 ? 'warning' : 'neutral'}>
              {drafts.length} Bidders Flagged
            </Badge>
          </div>

          <div className="max-h-48 overflow-y-auto border border-[var(--border-subtle)] rounded-[var(--radius-sm)] divide-y divide-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs">
            {drafts.length === 0 ? (
              <div className="p-4 text-center text-[var(--text-muted)] italic">
                No bidders currently require compliance queries for this tender.
              </div>
            ) : (
              drafts.map((draft, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="font-bold text-[var(--text-primary)] block truncate">{draft.bidderName}</span>
                    <span className="text-[11px] text-[var(--text-muted)] block truncate">{draft.bidderEmail}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--text-muted)] shrink-0">
                    {draft.bidderName.replace(/[^a-zA-Z0-9_-]+/g, '_')}.eml
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleExport} isLoading={isExporting} disabled={drafts.length === 0}>
            <Download size={16} /> Download .ZIP Archive ({drafts.length} .eml files)
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
