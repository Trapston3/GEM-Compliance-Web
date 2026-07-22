import { getReplyDueDate } from './workingDays';

export interface EmailBuilderBidder {
  name: string;
  email: string;
  contactPerson: string;
  phone: string;
}

export interface EmailBuilderTender {
  name: string;
  subjectLine?: string | null;
}

export interface EmailBuilderUser {
  nameHi: string;
  nameEn: string;
  phone: string;
}

export interface EmailBuilderChecklistItem {
  id: number;
  label: string;
  category: string; // 'submission' | 'acceptance' | 'text_note'
  groupOrder: number;
  sortOrder: number;
}

export interface EmailBuilderStatusMap {
  [checklistItemId: number]: string;
}

/**
 * USER-REQUESTED CONTENT SPECIFICATION:
 * Determines if a checklist item label should be considered uppercase (dropping quote marks in email queries).
 * Handles labels with allowed lowercase connector words like "or", "and", "of", "wrt", "for", "to", "in", "on", "with", "by", "as".
 */
export function isUppercaseLabel(label: string): boolean {
  if (!label) return false;
  // Replace allowed connector words with uppercase equivalent before checking case
  const connectorRegex = /\b(or|and|of|wrt|for|to|in|on|with|by|as)\b/gi;
  const normalized = label.replace(connectorRegex, (match) => match.toUpperCase());
  return normalized === normalized.toUpperCase() && /[A-Z]/.test(normalized);
}

/**
 * USER-REQUESTED CONTENT SPECIFICATION:
 * Formats a checklist label for query text. Drops surrounding quotes if the label is uppercase
 * (including uppercase labels with lowercase connector words), otherwise wraps in quotes.
 */
export function formatLabelForQuery(label: string): string {
  return isUppercaseLabel(label) ? label : `"${label}"`;
}

/**
 * Computes a 1-line non-editable summary explaining why a bidder is flagged with pending items
 */
export function getBidderFlaggedSummary(
  checklistItems: EmailBuilderChecklistItem[],
  statuses: EmailBuilderStatusMap
): string {
  let docsCount = 0;
  let clauseCount = 0;

  checklistItems.forEach((item) => {
    const status = statuses[item.id];
    if (item.category === 'submission' && status === 'not_submitted') {
      docsCount++;
    } else if (item.category === 'acceptance' && status === 'not_accepted') {
      clauseCount++;
    } else if (item.category === 'text_note' && status && status !== 'accepted' && status !== 'not_applicable' && status.trim() !== '') {
      clauseCount++;
    }
  });

  if (docsCount === 0 && clauseCount === 0) {
    return 'All required documents submitted and all clauses accepted.';
  }

  const parts: string[] = [];
  if (docsCount > 0) {
    parts.push(`${docsCount} pending document${docsCount === 1 ? '' : 's'}`);
  }
  if (clauseCount > 0) {
    parts.push(`${clauseCount} clause deviation${clauseCount === 1 ? '' : 's'} flagged`);
  }

  return parts.join(', ');
}

export function buildEmailBody(
  bidder: EmailBuilderBidder,
  tender: EmailBuilderTender,
  currentUser: EmailBuilderUser | null,
  checklistItems: EmailBuilderChecklistItem[],
  statuses: EmailBuilderStatusMap
) {
  // Sort items by group_order then sort_order
  const sortedItems = [...checklistItems].sort((a, b) => {
    if (a.groupOrder !== b.groupOrder) {
      return a.groupOrder - b.groupOrder;
    }
    return a.sortOrder - b.sortOrder;
  });

  // Filter items that are pending
  const pendingItems = sortedItems.filter(item => {
    const status = statuses[item.id];
    const isCustomTextItem = item.category === 'text_note';
    if (isCustomTextItem) {
      return !!status && status !== 'accepted' && status !== 'not_applicable' && status.trim() !== '';
    }

    if (item.category === 'submission') {
      return status === 'not_submitted';
    } else if (item.category === 'acceptance') {
      return status === 'not_accepted';
    }
    return false;
  });

  const subject = `Reply to Queries – ${tender.subjectLine || tender.name}`;
  const summaryLine = getBidderFlaggedSummary(checklistItems, statuses);

  // Opening Block
  let body = `प्रिय महोदय/महोदया Dear Sir/Madam,\n\nयह ईमेल उक्त विषय के संदर्भ में आपकी सूचना/अवलोकन/आवश्यक कार्रवाई हेतु ।\nThis email is with reference to your bid against subject tender, kindly submit your replies to the following observations:\n\n`;

  if (pendingItems.length === 0) {
    body += `All documents are submitted and accepted. No pending queries.\n\n`;
  } else {
    // Separate into sections
    const sectionAItems = pendingItems.filter(item => item.groupOrder === 1 || item.groupOrder === 2);
    const sectionBItems = pendingItems.filter(item => item.groupOrder === 3);

    let numberCounter = 1;

    // Render Section A if there are items
    if (sectionAItems.length > 0) {
      body += `A) The following documents are not submitted/partially submitted in your offer:\n`;
      
      for (const item of sectionAItems) {
        const isEmd = item.groupOrder === 2 || item.label.trim().toUpperCase() === 'EMD' || item.label.toUpperCase().includes('EMD');
        if (isEmd) {
          /**
           * USER-REQUESTED CONTENT SPECIFICATION:
           * Replaces generic EMD query line and separate Note line with single combined MSE/EMD query line.
           */
          body += `${numberCounter}. Bidders registered as Micro & Small Enterprises (MSE) with NSIC/Udyam are exempt from EMD submission as specified in PPP-MSE policy; such bidders must instead submit valid MSE proof documents. Kindly submit the valid supporting documents otherwise your offer is liable for rejection.\n`;
        } else {
          const formattedLabel = formatLabelForQuery(item.label);
          body += `${numberCounter}. You have not submitted ${formattedLabel}, kindly submit the same.\n`;
        }
        numberCounter++;
      }
      body += `\n`;
    }

    // Render Section B if there are items
    if (sectionBItems.length > 0) {
      body += `B) Deviations are observed in the following clauses:\n`;
      
      for (const item of sectionBItems) {
        const isCustomTextItem = item.category === 'text_note';
        const formattedLabel = formatLabelForQuery(item.label);
        
        if (isCustomTextItem) {
          const customDeviationText = statuses[item.id];
          body += `${numberCounter}. Regarding ${formattedLabel}: ${customDeviationText}\n`;
        } else {
          body += `${numberCounter}. You have not confirmed acceptance to the ${formattedLabel} clause. Kindly accept the same as per tender terms and conditions without any deviation.\n`;
        }
        numberCounter++;
      }
      body += `\n`;
    }
  }

  // Concluding Line
  const dueDate = getReplyDueDate(new Date());
  body += `Kindly submit your reply latest by ${dueDate}, else your offer will be evaluated based on available documents in your offer.\n\n`;

  // Sign-off Block
  if (currentUser) {
    body += `सादर Regards,\n(${currentUser.nameHi} ${currentUser.nameEn})\nसामग्री विभाग Materials Department\nएमआरपीएल MRPL\nमंगलूरु Mangaluru\nदूरभाष Tel: ${currentUser.phone}\n`;
  } else {
    body += `सादर Regards,\nTender Committee\nसामग्री विभाग Materials Department\nएमआरपीएल MRPL\nमंगलूरु Mangaluru\n`;
  }

  return {
    subject,
    body,
    summaryLine,
  };
}
