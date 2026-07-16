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
  category: string; // 'submission' | 'acceptance'
  groupOrder: number;
  sortOrder: number;
}

export interface EmailBuilderStatusMap {
  [checklistItemId: number]: string;
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
    const isCustomTextItem = item.label.toLowerCase() === 'any other deviations';
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

  // Opening Block
  let body = `प्रिय महोदय/महोदया Dear Sir/Madam,\n\nयह ईमेल उक्त विषय के संदर्भ में आपकी सूचना/अवलोकन/आवश्यक कार्रवाई हेतु ।\nThis email is with reference to your bid against subject tender, kindly submit your replies to the following observations:\n\n`;

  if (pendingItems.length === 0) {
    body += `All documents are submitted and accepted. No pending queries.\n\n`;
  } else {
    // Separate into sections
    // Section A: Group 1 and Group 2 (submission)
    // Section B: Group 3 (acceptance)
    const sectionAItems = pendingItems.filter(item => item.groupOrder === 1 || item.groupOrder === 2);
    const sectionBItems = pendingItems.filter(item => item.groupOrder === 3);

    let numberCounter = 1;

    // Render Section A if there are items
    if (sectionAItems.length > 0) {
      body += `A) The following documents are not submitted/partially submitted in your offer:\n`;
      
      for (const item of sectionAItems) {
        // If it is EMD (Group 2) and pending, insert exemption note first
        if (item.groupOrder === 2) {
          body += `\nNote: Bidders registered as Micro & Small Enterprises (MSE) with NSIC/Udyam are exempt from EMD submission; such bidders must instead submit valid MSE proof documents.\n`;
        }
        
        body += `${numberCounter}. You have not submitted "${item.label}", kindly submit the same.\n`;
        numberCounter++;
      }
      body += `\n`;
    }

    // Render Section B if there are items
    if (sectionBItems.length > 0) {
      body += `B) Deviations are observed in the following clauses:\n`;
      
      for (const item of sectionBItems) {
        const isCustomTextItem = item.label.toLowerCase() === 'any other deviations';
        if (isCustomTextItem) {
          const customDeviationText = statuses[item.id];
          body += `${numberCounter}. Regarding "ANY OTHER DEVIATIONS": ${customDeviationText}\n`;
        } else {
          body += `${numberCounter}. You have not confirmed acceptance to the ${item.label} clause. Kindly accept the same as per tender terms and conditions without any deviation.\n`;
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
  };
}
