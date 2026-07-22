'use client';

import React, { useState } from 'react';
import { Download, FileArchive, FileText } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button, Badge, Card } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { downloadBulkEmlZip, downloadConsolidatedQuerySummary, EmlItem } from '@/lib/emlExport';

interface BulkExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenderName: string;
  drafts: EmlItem[];
}

export default function BulkExportModal({ isOpen, onClose, tenderName, drafts }: BulkExportModalProps) {
  const { toast } = useToast();
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [isExportingTxt, setIsExportingTxt] = useState(false);

  const handleExportZip = async () => {
    if (drafts.length === 0) {
      toast('No bidders with pending queries found to export.', 'error');
      return;
    }

    setIsExportingZip(true);
    try {
      await downloadBulkEmlZip(drafts, tenderName);
      toast(`Exported ${drafts.length} .eml query drafts to ZIP archive!`, 'success');
      onClose();
    } catch (err: any) {
      toast(err.message || 'Failed to export .eml drafts', 'error');
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleExportTxt = () => {
    if (drafts.length === 0) {
      toast('No bidders with pending queries found to export.', 'error');
      return;
    }

    setIsExportingTxt(true);
    try {
      downloadConsolidatedQuerySummary(drafts, tenderName);
      toast(`Exported consolidated queries summary (.txt) for ${drafts.length} bidders!`, 'success');
      onClose();
    } catch (err: any) {
      toast(err.message || 'Failed to export queries summary', 'error');
    } finally {
      setIsExportingTxt(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Bulk Export Compliance Query Drafts" size="md">
      <div className="space-y-5">
        <Card className="p-4 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-primary)]">
            <FileArchive size={18} className="text-[var(--brand-primary)]" />
            <span>Export Options for Department Review & Dispatch</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Choose between individual <code>.eml</code> draft files (with <code>X-Unsent: 1</code> headers for HCL Notes / Outlook) packaged in a <code>.zip</code> archive, or a single consolidated <code>.txt</code> text summary containing all queries for all bidders.
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

        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={handleExportTxt} isLoading={isExportingTxt} disabled={drafts.length === 0}>
            <FileText size={16} /> Export Consolidated (.TXT)
          </Button>
          <Button onClick={handleExportZip} isLoading={isExportingZip} disabled={drafts.length === 0}>
            <Download size={16} /> Export .EML (.ZIP Archive)
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
