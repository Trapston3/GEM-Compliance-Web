import JSZip from 'jszip';

export interface EmlItem {
  bidderName: string;
  bidderEmail: string;
  subject: string;
  body: string;
}

/**
 * USER-REQUESTED EML SPECIFICATION:
 * Formats a single email draft into RFC 822 .eml format with X-Unsent draft headers so HCL Notes,
 * MS Outlook, and Thunderbird open exported files as editable new-message compose drafts rather than archived sent messages.
 */
export function formatEmlContent(item: EmlItem): string {
  const sanitizeHeader = (str: string) => str.replace(/[\r\n]+/g, ' ');
  return [
    `X-Unsent: 1`,
    `X-Notes-Item: Memo; name=Form`,
    `X-Notes-Item: 1; name=IsDraft`,
    `To: ${sanitizeHeader(item.bidderEmail)}`,
    `Subject: ${sanitizeHeader(item.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: 8bit`,
    ``,
    item.body,
  ].join('\r\n');
}

/**
 * Bundles multiple email drafts into a downloadable ZIP archive containing .eml files
 */
export async function downloadBulkEmlZip(items: EmlItem[], tenderName: string) {
  const zip = new JSZip();
  const folderName = `Compliance_Queries_${tenderName.replace(/[^a-zA-Z0-9_-]+/g, '_')}`;
  const folder = zip.folder(folderName) || zip;

  items.forEach((item, index) => {
    const sanitizedBidder = item.bidderName.replace(/[^a-zA-Z0-9_-]+/g, '_');
    const filename = `${String(index + 1).padStart(2, '0')}_${sanitizedBidder}.eml`;
    const emlContent = formatEmlContent(item);
    folder.file(filename, emlContent);
  });

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${folderName}_EML_Drafts.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * USER-REQUESTED CONSOLIDATED TEXT EXPORT SPECIFICATION:
 * Formats all bidder query drafts into a single consolidated text summary file (.txt).
 */
export function formatConsolidatedSummary(items: EmlItem[], tenderName: string): string {
  let text = `=======================================================\n`;
  text += `TENDER COMPLIANCE QUERIES SUMMARY: ${tenderName}\n`;
  text += `Generated on: ${new Date().toLocaleDateString()}\n`;
  text += `Total Flagged Bidders: ${items.length}\n`;
  text += `=======================================================\n\n`;

  items.forEach((item, index) => {
    text += `BIDDER ${index + 1}: ${item.bidderName}\n`;
    text += `EMAIL: ${item.bidderEmail}\n`;
    text += `SUBJECT: ${item.subject}\n`;
    text += `-------------------------------------------------------\n`;
    text += `${item.body}\n`;
    text += `=======================================================\n\n`;
  });

  return text;
}

/**
 * Downloads a single consolidated text file containing queries for all flagged bidders.
 */
export function downloadConsolidatedQuerySummary(items: EmlItem[], tenderName: string) {
  const content = formatConsolidatedSummary(items, tenderName);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const filename = `Compliance_Queries_${tenderName.replace(/[^a-zA-Z0-9_-]+/g, '_')}_Summary.txt`;
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
