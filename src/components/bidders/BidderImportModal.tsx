'use client';

import React, { useState } from 'react';
import { Upload, FileSpreadsheet, Trash2, Info, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button, Badge, Card, Select } from '@/components/ui/primitives';
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

interface ColumnDetectionInfo {
  columnIndex: number;
  headerName: string;
  field: 'name' | 'email' | 'contactPerson' | 'phone' | 'excluded';
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

interface BidderImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenderId: number;
  onSuccess: () => void;
  checklistLabels?: string[];
}

export default function BidderImportModal({
  isOpen,
  onClose,
  tenderId,
  onSuccess,
  checklistLabels = [],
}: BidderImportModalProps) {
  const { toast } = useToast();
  const [rows, setRows] = useState<ParsedBidderRow[]>([]);
  const [detections, setDetections] = useState<ColumnDetectionInfo[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Local Heuristic Column Auto-Detector & Checklist Guard
  const detectColumnsAndParse = (dataArray: any[][]) => {
    if (dataArray.length === 0) return { parsedRows: [], detectionsList: [] };

    // Check if uploaded file is an exported Compliance Matrix with transposed Contact Block
    const firstRowStr = dataArray[0]?.join(' ').toLowerCase() || '';
    const isTransposedExport = firstRowStr.includes('bidder name') || firstRowStr.includes('बोलीदाता');

    if (isTransposedExport) {
      // Round-Trip Parser for Exported Matrix
      let nameRowIdx = -1, emailRowIdx = -1, contactRowIdx = -1, phoneRowIdx = -1;
      
      dataArray.slice(0, 10).forEach((row, idx) => {
        const rowLabel = String(row[0] || '').toLowerCase();
        if (rowLabel.includes('bidder name') || rowLabel.includes('बोलीदाता')) nameRowIdx = idx;
        else if (rowLabel.includes('email') || rowLabel.includes('ईमेल')) emailRowIdx = idx;
        else if (rowLabel.includes('contact person') || rowLabel.includes('संपर्क')) contactRowIdx = idx;
        else if (rowLabel.includes('phone') || rowLabel.includes('फोन')) phoneRowIdx = idx;
      });

      if (nameRowIdx !== -1) {
        const bidderCols = dataArray[nameRowIdx].length;
        const parsedRows: ParsedBidderRow[] = [];

        for (let col = 2; col < bidderCols; col++) {
          const name = String(dataArray[nameRowIdx]?.[col] || '').trim();
          const email = emailRowIdx !== -1 ? String(dataArray[emailRowIdx]?.[col] || '').trim() : '';
          const contactPerson = contactRowIdx !== -1 ? String(dataArray[contactRowIdx]?.[col] || '').trim() : '';
          const phone = phoneRowIdx !== -1 ? String(dataArray[phoneRowIdx]?.[col] || '').trim() : '';

          if (!name && !email) continue;

          const errors: string[] = [];
          if (!name) errors.push('Missing Bidder Name');
          if (!email) errors.push('Missing Email');
          else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid Email Format');
          if (!contactPerson) errors.push('Missing Contact Person');
          if (!phone) errors.push('Missing Phone Number');

          parsedRows.push({
            id: `roundtrip-${col}-${Date.now()}`,
            name,
            email,
            contactPerson,
            phone,
            isValid: errors.length === 0,
            errors,
            selected: errors.length === 0,
          });
        }

        const detectionsList: ColumnDetectionInfo[] = [
          { columnIndex: 0, headerName: 'Exported Contact Block', field: 'name', confidence: 'high', reasoning: 'Matched Exported Matrix Contact Block' }
        ];

        return { parsedRows, detectionsList };
      }
    }

    // Standard Tabular Parser with Heuristic Detection & Exclusion Guard
    const headerRow = dataArray[0] || [];
    const bodyRows = dataArray.slice(1);
    const colCount = Math.max(...dataArray.map(r => r.length));

    const normalizedChecklistLabels = checklistLabels.map(l => l.toLowerCase().replace(/[^a-z0-9]+/g, ''));

    const detectionsList: ColumnDetectionInfo[] = [];

    for (let c = 0; c < colCount; c++) {
      const headerText = String(headerRow[c] || '').trim();
      const colValues = bodyRows.map(r => String(r[c] || '').trim()).filter(Boolean);

      // Check Checklist Exclusion Guard
      const checklistMatchCount = colValues.filter(val => {
        const normalizedVal = val.toLowerCase().replace(/[^a-z0-9]+/g, '');
        return normalizedChecklistLabels.some(label => label.includes(normalizedVal) || normalizedVal.includes(label));
      }).length;

      if (colValues.length > 0 && (checklistMatchCount / colValues.length) > 0.4) {
        detectionsList.push({
          columnIndex: c,
          headerName: headerText || `Column ${c + 1}`,
          field: 'excluded',
          confidence: 'high',
          reasoning: 'Excluded: Values match checklist criteria text',
        });
        continue;
      }

      // Check Email Pattern
      const emailMatches = colValues.filter(val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)).length;
      if (colValues.length > 0 && (emailMatches / colValues.length) > 0.5) {
        detectionsList.push({
          columnIndex: c,
          headerName: headerText || `Column ${c + 1}`,
          field: 'email',
          confidence: 'high',
          reasoning: 'Matched email pattern (local regex)',
        });
        continue;
      }

      // Check Phone Pattern
      const phoneMatches = colValues.filter(val => {
        const digitsOnly = val.replace(/\D/g, '');
        return digitsOnly.length >= 7 && digitsOnly.length <= 15;
      }).length;

      const headerLower = headerText.toLowerCase();
      if (headerLower.includes('phone') || headerLower.includes('mobile') || headerLower.includes('tel') || (colValues.length > 0 && (phoneMatches / colValues.length) > 0.6)) {
        detectionsList.push({
          columnIndex: c,
          headerName: headerText || `Column ${c + 1}`,
          field: 'phone',
          confidence: headerLower.includes('phone') ? 'high' : 'medium',
          reasoning: headerLower.includes('phone') ? 'Matched header "phone"' : 'Matched digit sequence pattern',
        });
        continue;
      }

      // Header Synonym Match for Name / Contact
      if (headerLower.includes('name') || headerLower.includes('bidder') || headerLower.includes('company') || headerLower.includes('vendor')) {
        detectionsList.push({
          columnIndex: c,
          headerName: headerText || `Column ${c + 1}`,
          field: 'name',
          confidence: 'high',
          reasoning: 'Matched header synonym for Bidder Name',
        });
        continue;
      }

      if (headerLower.includes('contact') || headerLower.includes('person') || headerLower.includes('representative')) {
        detectionsList.push({
          columnIndex: c,
          headerName: headerText || `Column ${c + 1}`,
          field: 'contactPerson',
          confidence: 'high',
          reasoning: 'Matched header synonym for Contact Person',
        });
        continue;
      }

      // Unclassified text column -> Positional fallback
      detectionsList.push({
        columnIndex: c,
        headerName: headerText || `Column ${c + 1}`,
        field: 'excluded',
        confidence: 'low',
        reasoning: 'Unclassified text column',
      });
    }

    // Resolve unassigned positional fields if any
    const assignedFields = new Set(detectionsList.map(d => d.field));
    if (!assignedFields.has('name')) {
      const firstUnassigned = detectionsList.find(d => d.field === 'excluded' && !d.reasoning.includes('Checklist'));
      if (firstUnassigned) {
        firstUnassigned.field = 'name';
        firstUnassigned.confidence = 'low';
        firstUnassigned.reasoning = 'Positional guess for Bidder Name';
      }
    }

    if (!assignedFields.has('contactPerson')) {
      const secondUnassigned = detectionsList.find(d => d.field === 'excluded' && !d.reasoning.includes('Checklist'));
      if (secondUnassigned) {
        secondUnassigned.field = 'contactPerson';
        secondUnassigned.confidence = 'low';
        secondUnassigned.reasoning = 'Positional guess for Contact Person';
      }
    }

    // Build Rows
    const nameCol = detectionsList.find(d => d.field === 'name')?.columnIndex;
    const emailCol = detectionsList.find(d => d.field === 'email')?.columnIndex;
    const contactCol = detectionsList.find(d => d.field === 'contactPerson')?.columnIndex;
    const phoneCol = detectionsList.find(d => d.field === 'phone')?.columnIndex;

    const parsedRows: ParsedBidderRow[] = bodyRows.map((row, index) => {
      const name = nameCol !== undefined ? String(row[nameCol] || '').trim() : '';
      const email = emailCol !== undefined ? String(row[emailCol] || '').trim() : '';
      const contactPerson = contactCol !== undefined ? String(row[contactCol] || '').trim() : '';
      const phone = phoneCol !== undefined ? String(row[phoneCol] || '').trim() : '';

      const errors: string[] = [];
      if (!name) errors.push('Missing Bidder Name');
      if (!email) errors.push('Missing Email');
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid Email Format');
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
    }).filter(r => r.name || r.email);

    return { parsedRows, detectionsList };
  };

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
        const rawArray: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (rawArray.length === 0) {
          toast('The uploaded file is empty.', 'error');
          return;
        }

        const { parsedRows, detectionsList } = detectColumnsAndParse(rawArray);
        setRows(parsedRows);
        setDetections(detectionsList);
        toast(`Parsed ${parsedRows.length} bidders with smart column detection`, 'success');
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
      if (!updated.email.trim()) errors.push('Missing Email');
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updated.email.trim())) errors.push('Invalid Email Format');
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
      setDetections([]);
      setFileName('');
    } catch (err: any) {
      toast(err.message || 'Failed to import bidders', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCount = rows.filter(r => r.selected && r.isValid).length;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Smart Import Bidders (CSV / Excel)" size="xl">
      <div className="space-y-5">
        {/* Upload Zone */}
        {rows.length === 0 ? (
          <div className="space-y-4">
            <div className="p-8 border-2 border-dashed border-[var(--border-subtle)] hover:border-[var(--brand-primary)] rounded-[var(--radius-lg)] bg-[var(--bg-subtle)]/50 text-center transition-colors">
              <FileSpreadsheet size={36} className="mx-auto mb-3 text-[var(--brand-primary)]" />
              <h4 className="font-bold text-sm text-[var(--text-primary)]">Upload CSV or Excel Spreadsheet</h4>
              <p className="text-xs text-[var(--text-muted)] mt-1 max-w-md mx-auto">
                Features local heuristic auto-detection (email, phone, name) and checklist criteria exclusion guard.
              </p>
              <label className="mt-4 inline-flex items-center gap-2 min-h-11 px-5 py-2 rounded-[var(--radius-sm)] bg-[var(--brand-primary)] text-white text-xs font-bold cursor-pointer hover:bg-[var(--brand-primary-hover)] transition-colors shadow-xs">
                <Upload size={16} /> Choose File (.csv, .xlsx)
                <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <Card className="p-4 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
                <Info size={14} className="text-[var(--brand-primary)]" /> Smart Local Heuristics & Exclusions
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                Automatically detects column fields using regex patterns and header text. If a column contains checklist criteria labels, it is safely excluded from bidder fields.
              </p>
            </Card>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Auto-Detection Summary Bar */}
            <div className="p-3.5 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Badge tone={selectedCount > 0 ? 'success' : 'neutral'}>
                    {selectedCount} / {rows.length} Ready to Import
                  </Badge>
                  {fileName && <span className="text-[var(--text-muted)] font-mono">({fileName})</span>}
                </div>
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-[var(--brand-primary)] hover:underline">
                  <Upload size={14} /> Change File
                  <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              {detections.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1 border-t border-[var(--border-subtle)] text-[11px]">
                  {detections.map((d, i) => (
                    <span
                      key={i}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        d.field === 'excluded'
                          ? 'bg-[var(--status-neutral-bg)] text-[var(--text-muted)] border-[var(--border-subtle)]'
                          : d.confidence === 'high'
                          ? 'bg-[var(--status-success-bg)] text-[var(--status-success-text)] border-[var(--status-success)]/30'
                          : 'bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] border-[var(--status-warning)]/30'
                      }`}
                      title={d.reasoning}
                    >
                      {d.field === 'excluded' ? <ShieldAlert size={11} /> : <CheckCircle2 size={11} />}
                      <strong>{d.headerName}</strong>: {d.field} ({d.reasoning})
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Preview Table */}
            <div className="max-h-[50vh] overflow-y-auto border border-[var(--border-subtle)] rounded-[var(--radius-sm)]">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] font-bold text-[var(--text-secondary)] z-10">
                  <tr>
                    <th className="p-2.5 w-10 text-center">Include</th>
                    <th className="p-2.5">Bidder Name</th>
                    <th className="p-2.5">Email Address</th>
                    <th className="p-2.5">Contact Person</th>
                    <th className="p-2.5">Phone Number</th>
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
