export type SubmissionStatus = 'submitted' | 'not_submitted' | 'not_applicable';
export type AcceptanceStatus = 'accepted' | 'not_accepted' | 'not_applicable';
export type TextNoteStatus = 'has_note' | 'empty';

export type ChecklistStatus =
  | { category: 'submission'; status: SubmissionStatus }
  | { category: 'acceptance'; status: AcceptanceStatus }
  | { category: 'text_note'; status: TextNoteStatus };

export type StatusTone =
  | 'submitted'
  | 'pending-submission'
  | 'not-accepted'
  | 'not-applicable'
  | 'note-added'
  | 'note-empty';

export interface StatusPresentation {
  tone: StatusTone;
  label: string;
  description: string;
  className: string;
}

const presentations: Record<StatusTone, Omit<StatusPresentation, 'className'>> = {
  submitted: { tone: 'submitted', label: 'Submitted', description: 'Required document submitted or clause accepted.' },
  'pending-submission': { tone: 'pending-submission', label: 'Pending submission', description: 'Required document has not been submitted.' },
  'not-accepted': { tone: 'not-accepted', label: 'Not accepted', description: 'The bidder has not accepted this clause.' },
  'not-applicable': { tone: 'not-applicable', label: 'Not applicable', description: 'This criterion does not apply.' },
  'note-added': { tone: 'note-added', label: 'Note added', description: 'A text note is available for this criterion.' },
  'note-empty': { tone: 'note-empty', label: 'No note', description: 'No text note has been added.' },
};

export function getStatusPresentation(status: ChecklistStatus): StatusPresentation {
  const tone: StatusTone = status.category === 'submission'
    ? status.status === 'submitted' ? 'submitted' : status.status === 'not_submitted' ? 'pending-submission' : 'not-applicable'
    : status.category === 'acceptance'
      ? status.status === 'accepted' ? 'submitted' : status.status === 'not_accepted' ? 'not-accepted' : 'not-applicable'
      : status.status === 'has_note' ? 'note-added' : 'note-empty';

  return {
    ...presentations[tone],
    className: `mrpl-status mrpl-status-${tone}`,
  };
}
