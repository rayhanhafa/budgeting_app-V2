import assert from 'assert';
import { getWibMidnight } from '../src/utils/timezone.js';

const tests = [
  { name: 'Hari X, 16:59:00 UTC', input: '2026-09-08T16:59:00Z', expected: '2026-09-08T00:00:00.000Z' },
  { name: 'Hari X, 17:00:00 UTC', input: '2026-09-08T17:00:00Z', expected: '2026-09-09T00:00:00.000Z' },
  { name: 'Hari X, 17:00:01 UTC', input: '2026-09-08T17:00:01Z', expected: '2026-09-09T00:00:00.000Z' },
  { name: 'Hari X, 00:00:00 UTC', input: '2026-09-08T00:00:00Z', expected: '2026-09-08T00:00:00.000Z' },
  { name: 'Akhir bulan, 16:59 UTC (30 Sept)', input: '2026-09-30T16:59:00Z', expected: '2026-09-30T00:00:00.000Z' },
  { name: 'Akhir bulan, 17:00 UTC (30 Sept)', input: '2026-09-30T17:00:00Z', expected: '2026-10-01T00:00:00.000Z' },
  { name: 'Akhir tahun, 31 Des 17:00 UTC', input: '2026-12-31T17:00:00Z', expected: '2027-01-01T00:00:00.000Z' }
];

console.log('--- RUNNING TIMEZONE UNIT TESTS (VIA IMPORT) ---');
let passed = 0;
tests.forEach((t, index) => {
  try {
    const result = getWibMidnight(new Date(t.input)).toISOString();
    assert.strictEqual(result, t.expected);
    console.log(`[PASS] Case ${index+1}: ${t.name} | Output: ${result}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] Case ${index+1}: ${t.name}`);
    console.error(`       Expected: ${t.expected}`);
    console.error(`       Got: ${err.actual}`);
  }
});
console.log('-----------------------------------');
console.log(`Results: ${passed}/${tests.length} tests passed.`);
