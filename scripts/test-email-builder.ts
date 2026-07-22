import { isUppercaseLabel, formatLabelForQuery, buildEmailBody } from '../src/lib/emailBuilder';

console.log('Testing isUppercaseLabel & formatLabelForQuery...');

const testCases = [
  { label: 'DECLARATION ON BANNING or HOLIDAY LISTING', expectedUppercase: true, expectedFormatted: 'DECLARATION ON BANNING or HOLIDAY LISTING' },
  { label: 'UNDERTAKING WRT COMPLIANCE OF RESTRICTIONS FOR COUNTRIES WHICH SHARE LAND BORDER WITH INDIA', expectedUppercase: true, expectedFormatted: 'UNDERTAKING WRT COMPLIANCE OF RESTRICTIONS FOR COUNTRIES WHICH SHARE LAND BORDER WITH INDIA' },
  { label: 'SIGNED MRPL GPC & TD', expectedUppercase: true, expectedFormatted: 'SIGNED MRPL GPC & TD' },
  { label: 'PRICE REDUCTION SCHEDULE (PRS) CLAUSE', expectedUppercase: true, expectedFormatted: 'PRICE REDUCTION SCHEDULE (PRS) CLAUSE' },
  { label: 'EMD', expectedUppercase: true, expectedFormatted: 'EMD' },
  { label: 'sample document', expectedUppercase: false, expectedFormatted: '"sample document"' },
  { label: 'Partially uppercase Document', expectedUppercase: false, expectedFormatted: '"Partially uppercase Document"' },
];

let failed = 0;
for (const tc of testCases) {
  const isUp = isUppercaseLabel(tc.label);
  const formatted = formatLabelForQuery(tc.label);
  const passIsUp = isUp === tc.expectedUppercase;
  const passFormatted = formatted === tc.expectedFormatted;

  if (passIsUp && passFormatted) {
    console.log(`✓ PASS: "${tc.label}" -> ${formatted}`);
  } else {
    console.error(`✗ FAIL: "${tc.label}" -> got isUp:${isUp}, formatted:${formatted}; expected isUp:${tc.expectedUppercase}, formatted:${tc.expectedFormatted}`);
    failed++;
  }
}

// Test buildEmailBody for combined EMD query line
console.log('\nTesting buildEmailBody for combined EMD query sentence...');
const mockBidder = { name: 'Test Bidder', email: 'test@example.com', contactPerson: 'John', phone: '123' };
const mockTender = { name: 'Test Tender', subjectLine: 'Test Subject' };
const mockUser = { nameHi: 'अजय', nameEn: 'Ajay', phone: '999' };
const mockChecklistItems = [
  { id: 1, label: 'DECLARATION ON BANNING or HOLIDAY LISTING', category: 'submission', groupOrder: 1, sortOrder: 1 },
  { id: 2, label: 'EMD', category: 'submission', groupOrder: 2, sortOrder: 2 },
  { id: 3, label: 'PRICE REDUCTION SCHEDULE (PRS) CLAUSE', category: 'acceptance', groupOrder: 3, sortOrder: 3 },
];
const mockStatuses = {
  1: 'not_submitted',
  2: 'not_submitted',
  3: 'not_accepted',
};

const result = buildEmailBody(mockBidder, mockTender, mockUser, mockChecklistItems, mockStatuses);

console.log('--- GENERATED EMAIL BODY ---');
console.log(result.body);
console.log('----------------------------');

if (result.body.includes('Note: Bidders registered as Micro')) {
  console.error('✗ FAIL: Body still contains separate Note: line!');
  failed++;
} else {
  console.log('✓ PASS: No separate Note: line found.');
}

const expectedEmdLine = 'Bidders registered as Micro & Small Enterprises (MSE) with NSIC/Udyam are exempt from EMD submission as specified in PPP-MSE policy; such bidders must instead submit valid MSE proof documents. Kindly submit the valid supporting documents otherwise your offer is liable for rejection.';
if (result.body.includes(expectedEmdLine)) {
  console.log('✓ PASS: Body contains exact combined EMD query line.');
} else {
  console.error('✗ FAIL: Body does not contain exact combined EMD query line!');
  failed++;
}

if (result.body.includes('DECLARATION ON BANNING or HOLIDAY LISTING') && !result.body.includes('"DECLARATION ON BANNING or HOLIDAY LISTING"')) {
  console.log('✓ PASS: DECLARATION ON BANNING or HOLIDAY LISTING rendered without quotes!');
} else {
  console.error('✗ FAIL: Quote stripping failed for DECLARATION ON BANNING or HOLIDAY LISTING!');
  failed++;
}

if (failed === 0) {
  console.log('\nALL UNIT TESTS PASSED CLEANLY!');
  process.exit(0);
} else {
  console.error(`\n${failed} UNIT TESTS FAILED!`);
  process.exit(1);
}
