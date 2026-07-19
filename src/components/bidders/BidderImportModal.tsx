'use client';

import React, { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Trash2, Loader2, Info } from 'lucide-react';
import { Dialog, Button, Badge, Card, Input } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { importBidders } from '@/app/actions/bidder';
import * as XLSX from 'xlsx';

interface ParsedBidderRow {
  id: string;
  name: string;
  email: string;
  contactPerson: string;
  phone: string;
  isValid: boolean;
  errors: string[];
  selected: boolean;
}

interface BidderImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenderId: number;
  onSuccess: () => void;
}

export default function BidderImportModal({ isOpen, onClose, tenderId, onSuccess }: BidderImportModalProps) {
  const { toast } = useToast();
  const [rows, setRows] = useState<ParsedBidderRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parse CSV/Excel file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (json.length === 0) {
          toast('The uploaded file is empty.', 'error');
          return;
        }

        const parsedRows: ParsedBidderRow[] = json.map((row, index) => {
          // Normalize column headers
          const name = String(row.name || row.Name || row['Bidder Name'] || row['Company Name'] || '').trim();
          const email = String(row.email || row.Email || row['Email Address'] || '').trim();
          const contactPerson = String(row.contactPerson || row['Contact Person'] || row['Contact Name'] || row.contact || '').trim();
          const phone = String(row.phone || row.Phone || row['Phone Number'] || row.contactNo || row.mobile || '').trim();

          const errors: string[] = [];
          if (!name) errors.push('Missing Bidder Name');
          if (!email) {
            errors.push('Missing Email');
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push('Invalid Email Format');
          }
          if (!contactPerson) errors.push('Missing Contact Person');
          if (!phone) errors.push('Missing Phone Number');

          return {
            id: `row-${index}-${Date.now()}`,
            name,
            email,
            contactPerson,
            phone,
            isValid: errors.length === 0,
            errors,
            selected: errors.length === 0,
          };
        });

        setRows(parsedRows);
      } catch (err: any) {
        toast('Failed to parse file. Please ensure it is a valid CSV or Excel file.', 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleRowChange = (id: string, field: keyof ParsedBidderRow, value: string) => {
    setRows(prev => prev.map(row => {
      if (row.id !== id) return row;
      const updated = { ...row, [field]: value };
      
      const errors: string[] = [];
      if (!updated.name.trim()) errors.push('Missing Bidder Name');
      if (!updated.email.trim()) {
        errors.push('Missing Email');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updated.email.trim())) {
        errors.push('Invalid Email Format');
      }
      if (!updated.contactPerson.trim()) errors.push('Missing Contact Person');
      if (!updated.phone.trim()) errors.push('Missing Phone Number');

      return {
        ...updated,
        isValid: errors.length === 0,
        errors,
        selected: errors.length === 0 ? true : row.selected,
      };
    }));
  };

  const toggleRowSelect = (id: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, selected: !r.selected } : r));
  };

  const deleteRow = (id: string) => {
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const handleImportSubmit = async () => {
    const selectedRows = rows.filter(r => r.selected);
    if (selectedRows.length === 0) {
      toast('Please select at least one valid row to import.', 'error');
      return;
    }

    const invalidSelected = selectedRows.filter(r => !r.isValid);
    if (invalidSelected.length > 0) {
      toast('Some selected rows have validation errors. Please fix or uncheck them.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await importBidders({
        tenderId,
        biddersList: selectedRows.map(r => ({
          name: r.name,
          email: r.email,
          contactPerson: r.contactPerson,
          phone: r.phone,
        })),
      });

      toast(`Successfully imported ${res.count} bidders!`, 'success');
      onSuccess();
      onClose();
      setRows([]);
      setFileName('');
    } catch (err: any) {
      toast(err.message || 'Failed to import bidders', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validCount = rows.filter(r => r.isValid).length;
  const selectedCount = rows.filter(r => r.selected && r.isValid).length;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Import Bidders from CSV/Excel" size="xl">
      <div className="space-y-5">
        {/* Upload Zone if no rows parsed yet */}
        {rows.length === 0 ? (
          <div className="space-y-4">
            <div className="p-8 border-2 border-dashed border-[var(--border-subtle)] hover:border-[var(--brand-primary)] rounded-[var(--radius-lg)] bg-[var(--bg-subtle)]/50 text-center transition-colors">
              <FileSpreadsheet size={36} className="mx-auto mb-3 text-[var(--brand-primary)]" />
              <h4 className="font-bold text-sm text-[var(--text-primary)]">Upload CSV or Excel Spreadsheet</h4>
              <p className="text-xs text-[var(--text-muted)] mt-1 max-w-md mx-auto">
                Expected columns: <strong>name</strong>, <strong>email</strong>, <strong>contactPerson</strong>, <strong>phone</strong>.
              </p>
              <label className="mt-4 inline-flex items-center gap-2 min-h-11 px-5 py-2 rounded-[var(--radius-sm)] bg-[var(--brand-primary)] text-white text-xs font-bold cursor-pointer hover:bg-[var(--brand-primary-hover)] transition-colors shadow-xs">
                <Upload size={16} /> Choose File (.csv, .xlsx)
                <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <Card className="p-4 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
                <Info size={14} className="text-[var(--brand-primary)]" /> Sample Header Template
              </div>
              <p className="font-mono text-[11px] text-[var(--text-muted)] bg-[var(--bg-surface)] p-2 rounded border border-[var(--border-subtle)]">
                name, email, contactPerson, phone
              </p>
            </Card>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Bar */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3.5 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs">
              <div className="flex items-center gap-2">
                <Badge tone={selectedCount > 0 ? 'success' : 'neutral'}>
                  {selectedCount} / {rows.length} Ready to Import
                </Badge>
                {fileName && <span className="text-[var(--text-muted)] font-mono">({fileName})</span>}
              </div>
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-[var(--brand-primary)] hover:underline">
                <Upload size={14} /> Upload Different File
                <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {/* Preview Table */}
            <div className="max-h-[50vh] overflow-y-auto border border-[var(--border-subtle)] rounded-[var(--radius-sm)]">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] font-bold text-[var(--text-secondary)]">
                  <tr>
                    <th className="p-2.5 w-10 text-center">Include</th>
                    <th className="p-2.5">Bidder Name</th>
                    <th className="p-2.5">Email</th>
                    <th className="p-2.5">Contact Person</th>
                    <th className="p-2.5">Phone</th>
                    <th className="p-2.5 w-24">Status</th>
                    <th className="p-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] bg-[var(--bg-surface)]">
                  {rows.map((row) => (
                    <tr key={row.id} className={!row.isValid ? 'bg-[var(--status-danger-bg)]/30' : ''}>
                      <td className="p-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={row.selected}
                          onChange={() => toggleRowSelect(row.id)}
                          className="accent-[var(--brand-primary)] cursor-pointer"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => handleRowChange(row.id, 'name', e.target.value)}
                          className="w-full p-1 border border-[var(--border-subtle)] rounded bg-[var(--bg-surface)] text-[var(--text-primary)] font-semibold"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="email"
                          value={row.email}
                          onChange={(e) => handleRowChange(row.id, 'email', e.target.value)}
                          className="w-full p-1 border border-[var(--border-subtle)] rounded bg-[var(--bg-surface)] text-[var(--text-primary)]"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.contactPerson}
                          onChange={(e) => handleRowChange(row.id, 'contactPerson', e.target.value)}
                          className="w-full p-1 border border-[var(--border-subtle)] rounded bg-[var(--bg-surface)] text-[var(--text-primary)]"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.phone}
                          onChange={(e) => handleRowChange(row.id, 'phone', e.target.value)}
                          className="w-full p-1 border border-[var(--border-subtle)] rounded bg-[var(--bg-surface)] text-[var(--text-primary)]"
                        />
                      </td>
                      <td className="p-2.5">
                        {row.isValid ? (
                          <Badge tone="success">Valid</Badge>
                        ) : (
                          <span className="text-[10px] font-bold text-[var(--status-danger-text)] block" title={row.errors.join(', ')}>
                            {row.errors[0]}
                          </span>
                        )}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => deleteRow(row.id)}
                          className="text-[var(--text-muted)] hover:text-[var(--status-danger-text)] transition-colors cursor-pointer"
                          title="Remove row"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleImportSubmit} isLoading={isSubmitting} disabled={selectedCount === 0}>
                Import {selectedCount} Bidders
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
