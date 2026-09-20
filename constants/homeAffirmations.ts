import { GoalId } from './data';

export interface HomeAffirmation {
  text: string;
  // Drives the card's ✦ category tag, same GoalId vocabulary as the main
  // library so the tag renders identically.
  category: GoalId;
}

/**
 * The curated set behind "TODAY'S AFFIRMATION" on Home.
 *
 * Deliberately separate from AFFIRMATIONS in data.ts: that pool is the
 * personalised library the Reflect tab pages through (85 per goal, filtered
 * to the user's selected goals). This is one short, strong line per day,
 * shown to everyone, cycling on a monthly loop.
 *
 * KEEP IT AT 30. The rotation is `dayNumber % length`, so any other count
 * still works but stops lining up with a calendar month. Keep each line under
 * ~10 words too — the card renders at 27px serif and longer lines wrap to
 * three lines and crowd the action pills.
 *
 * Seeded from the existing library so the feature works as-is; intended to be
 * replaced wholesale with a curated set.
 */
export const HOME_AFFIRMATIONS: HomeAffirmation[] = [
  { text: 'I trust myself to handle whatever comes.', category: 'confidence' },
  { text: 'My focus turns effort into real progress.', category: 'career' },
  { text: 'I grow a little every single day.', category: 'growth' },
  { text: 'Every breath restores the energy I need.', category: 'health' },
  { text: 'Abundance flows to me through honest effort.', category: 'finance' },
  { text: 'I let people see the real me.', category: 'love' },
  { text: 'I am steady, capable, and grounded.', category: 'confidence' },
  { text: 'I work with purpose, not just urgency.', category: 'career' },
  { text: 'I choose progress over perfection.', category: 'growth' },
  { text: 'I am gentle with myself on hard days.', category: 'health' },
  { text: 'I am free from comparison about money.', category: 'finance' },
  { text: 'I give kindness without keeping score.', category: 'love' },
  { text: 'My worth is not up for debate.', category: 'confidence' },
  { text: 'I bring value to everything I touch.', category: 'career' },
  { text: 'I turn challenges into stepping stones.', category: 'growth' },
  { text: 'I choose calm over stress whenever I can.', category: 'health' },
  { text: 'I trust myself to manage what I earn.', category: 'finance' },
  { text: 'I trust the right people to stay.', category: 'love' },
  { text: 'I trust the quiet strength within me.', category: 'confidence' },
  { text: 'My consistency is quietly building my future.', category: 'career' },
  { text: 'I trust the slow work of becoming.', category: 'growth' },
  { text: 'My body grows stronger and calmer each day.', category: 'health' },
  { text: 'I am creating lasting abundance through patience.', category: 'finance' },
  { text: 'I forgive easily and hold grudges lightly.', category: 'love' },
  { text: 'Every challenge shows me how strong I am.', category: 'confidence' },
  { text: 'My skills grow sharper with steady practice.', category: 'career' },
  { text: 'Every day is a chance to begin again.', category: 'growth' },
  { text: 'I breathe deeply and let tension melt away.', category: 'health' },
  { text: 'I am worthy of financial security and ease.', category: 'finance' },
  { text: 'I am worthy of deep and gentle love.', category: 'love' },
];

const DAY_MS = 24 * 60 * 60 * 1000;

// Days elapsed since the Unix epoch, counted in LOCAL calendar days. Built on
// Date.UTC of the local Y/M/D (the same trick startOfDay uses in the store) so
// a DST shift can't move the boundary off an exact 24h multiple and skip or
// repeat a day.
function dayNumber(now: Date): number {
  return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / DAY_MS);
}

/**
 * Index into HOME_AFFIRMATIONS for the given day.
 *
 * Derived from the date rather than stored, which is what makes this simple:
 * nothing to persist, nothing to migrate, no way to drift out of sync, and it
 * rolls over at local midnight on its own even if the app was never opened.
 * Everyone on the same calendar day sees the same line.
 */
export function homeAffirmationIndex(now: Date = new Date()): number {
  const len = HOME_AFFIRMATIONS.length;
  if (len === 0) return 0;
  return ((dayNumber(now) % len) + len) % len;
}

/**
 * Today's affirmation, optionally offset by `offset` places — the detail
 * screen's arrows pass a running offset to browse forwards and backwards
 * without disturbing what Home shows.
 */
export function homeAffirmationFor(offset: number = 0, now: Date = new Date()): HomeAffirmation {
  const len = HOME_AFFIRMATIONS.length;
  const i = (((homeAffirmationIndex(now) + offset) % len) + len) % len;
  return HOME_AFFIRMATIONS[i];
}
