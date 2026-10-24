import assert from 'node:assert/strict';
import { getLatestThursdayWeekRange } from '../src/services/thursdayWeekRange';

const date = (year: number, monthIndex: number, day: number) => new Date(year, monthIndex, day, 12, 0, 0);

assert.deepEqual(
  getLatestThursdayWeekRange(date(2026, 9, 22)),
  { start: '2026-10-16', end: '2026-10-22' },
  'Thursday should include the current Friday–Thursday week'
);
assert.deepEqual(
  getLatestThursdayWeekRange(date(2026, 9, 23)),
  { start: '2026-10-16', end: '2026-10-22' },
  'Friday should default to the most recently completed Thursday'
);
assert.deepEqual(
  getLatestThursdayWeekRange(date(2026, 9, 25)),
  { start: '2026-10-16', end: '2026-10-22' },
  'Sunday should retain the latest completed Friday–Thursday week'
);
assert.deepEqual(
  getLatestThursdayWeekRange(date(2026, 9, 20)),
  { start: '2026-10-09', end: '2026-10-15' },
  'Tuesday should show the previous completed business week'
);

console.log('Thursday report week-range validation passed.');
