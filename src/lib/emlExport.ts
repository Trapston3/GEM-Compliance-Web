import JSZip from 'jszip';

export interface EmlItem {
  bidderName: string;
  bidderEmail: string;
  subject: string;
  body: string;
}

/**
 * Formats a single email draft into RFC 822 .eml format
 */
export function formatEmlContent(item: EmlItem): string {
  const sanitizeHeader = (str: string) => str.replace(/[\r\n]+/g, ' ');
  return [
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
