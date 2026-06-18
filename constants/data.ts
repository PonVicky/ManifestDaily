export type GoalId = 'career' | 'finance' | 'confidence' | 'health' | 'love' | 'growth';

export interface Goal {
  id: GoalId;
  label: string;
  icon: string;
}

export const GOALS: Goal[] = [
  { id: 'career', label: 'Career Success', icon: 'target' },
  { id: 'finance', label: 'Financial Freedom', icon: 'star' },
  { id: 'confidence', label: 'Confidence', icon: 'sparkle' },
  { id: 'health', label: 'Better Health', icon: 'wind' },
  { id: 'love', label: 'Better Relationships', icon: 'heart' },
  { id: 'growth', label: 'Personal Growth', icon: 'sun' },
];

export const AFFIRMATIONS: Record<GoalId, string[]> = {
  confidence: [
    'I am becoming the person I aspire to be.',
    'I trust myself to handle whatever comes.',
    'My confidence grows with every quiet step I take.',
    'I belong in every room I choose to enter.',
    'My voice matters, and I speak it with calm.',
    'I am enough, exactly as I am right now.',
    'I meet doubt with patience and keep moving.',
    'I am proud of how far I have already come.',
    'I stand tall in who I am becoming.',
    'I let go of the need for everyone to approve.',
    'My worth is not up for debate.',
    'I trust the quiet strength within me.',
    'I act with courage even when I feel unsure.',
    'I treat myself with the kindness I deserve.',
    'I am steady, capable, and grounded.',
    'I release comparison and honor my own path.',
    'Every challenge shows me how strong I am.',
    'I speak to myself like someone I love.',
    'I carry myself with quiet self-respect.',
    'I am allowed to take up space.',
    'My past does not define what I can do next.',
    'I choose self-belief over self-doubt today.',
    'I am learning to trust my own decisions.',
    'I am calm under pressure and clear in my mind.',
    'I forgive my mistakes and grow from them.',
    'I deserve good things and I welcome them in.',
    'I am resilient; I rise after every setback.',
    'My confidence is built one honest step at a time.',
    'I honor my needs without apology.',
    'I am exactly where I need to be to grow.',
  ],
  career: [
    'I am building work that gives my days meaning.',
    'Opportunity moves toward my steady, focused effort.',
    'I lead with clarity and a calm, certain mind.',
    'My focus turns effort into real progress.',
    'I bring value to everything I touch.',
    'I am open to opportunities I cannot yet see.',
    'I do meaningful work, one focused hour at a time.',
    'My skills grow sharper with steady practice.',
    'I handle challenges with patience and creativity.',
    'I am worthy of the success I am building.',
    'I set clear goals and move toward them daily.',
    'I trust my ability to learn what I need.',
    'I work with purpose, not just urgency.',
    'I make decisions with confidence and care.',
    'My consistency is quietly building my future.',
    'I attract collaborators who respect my work.',
    'I turn setbacks into lessons that serve me.',
    'I am calm, capable, and ready for what comes.',
    'I deserve to be recognized for my contributions.',
    'I protect my energy for the work that matters.',
    'I am growing into the leader I want to be.',
    'I trust the timing of my career.',
    'My ambition and my peace can coexist.',
    'I finish what I start with steady resolve.',
    'I am resourceful and I find a way forward.',
    'Each focused day compounds into mastery.',
    'I welcome feedback as a path to growth.',
    'I create more than I consume.',
    'I am building something I am proud of.',
    'My best work comes from a calm, clear mind.',
  ],
  finance: [
    'I am creating lasting abundance through patience.',
    'I give money direction, and it follows my intention.',
    'My future self is grateful for the choices I make today.',
    'I am a careful, confident steward of my money.',
    'Abundance flows to me through honest effort.',
    'I make calm, wise decisions with my finances.',
    'I am building wealth one steady choice at a time.',
    'I spend in line with what truly matters to me.',
    'I release fear and approach money with clarity.',
    'I am worthy of financial security and ease.',
    'Every dollar I save is a vote for my freedom.',
    'I trust myself to manage what I earn.',
    'I am patient; wealth grows slowly and surely.',
    'I welcome new sources of income with openness.',
    'I am free from comparison about money.',
    'I give generously from a place of plenty.',
    'My habits today shape my freedom tomorrow.',
    'I am grounded and calm about my finances.',
    'I deserve to enjoy the fruits of my work.',
    'I plan ahead and my future feels secure.',
    'I am learning more about money every day.',
    'I let go of guilt and make peace with money.',
    'I attract opportunities to grow my resources.',
    'I live within my means and still feel rich.',
    'My relationship with money is calm and healthy.',
    'I am building a foundation that lasts.',
    'I make room for abundance by spending wisely.',
    'I trust that I will always have enough.',
    'I invest in my future with quiet confidence.',
    'Financial freedom is a path I walk daily.',
  ],
  health: [
    'My body grows stronger and calmer each day.',
    'Every breath restores the energy I need.',
    'I honor my body with rest, movement, and care.',
    'I listen to what my body is telling me.',
    'I nourish myself with food that gives me life.',
    'I move my body in ways that feel good.',
    'Rest is productive, and I allow myself to rest.',
    'I am gentle with myself on hard days.',
    'My health is built through small daily choices.',
    'I breathe deeply and let tension melt away.',
    'I treat my body as a home worth caring for.',
    'I drink water and feel my energy return.',
    'Sleep heals me, and I welcome it fully.',
    'I am patient with my body as it heals.',
    'I choose calm over stress whenever I can.',
    'My mind grows quieter with every slow breath.',
    'I am grateful for all my body does for me.',
    'I make space for stillness in my day.',
    'I release what I cannot control and breathe.',
    'Movement is a gift I give myself.',
    'I am steadily building strength and calm.',
    'I forgive my body and thank it instead.',
    'I let go of tension in my shoulders and jaw.',
    'I deserve to feel rested and well.',
    'I care for my mind as gently as my body.',
    'Each healthy choice makes the next one easier.',
    'I am present in my body, here and now.',
    'I give myself permission to slow down.',
    'My energy renews with rest and good care.',
    'I am healing, growing, and feeling more alive.',
  ],
  love: [
    'I give and receive love with an open heart.',
    'I attract people who value exactly who I am.',
    'I am fully present for the ones I love.',
    'I am worthy of deep and gentle love.',
    'I let people see the real me.',
    'I listen with patience and an open mind.',
    'I bring warmth to every connection I make.',
    'I release old hurt to make room for love.',
    'I love myself first, and love others from there.',
    'I communicate my needs with honesty and care.',
    'I am surrounded by people who lift me up.',
    'I forgive easily and hold grudges lightly.',
    'I show up for the people who matter to me.',
    'I am safe to be open and tender.',
    'I trust the right people to stay.',
    'I give kindness without keeping score.',
    'I am patient with those I love, and with myself.',
    'I deserve relationships that feel like peace.',
    'I welcome love into my life with open arms.',
    'I speak gently, even in disagreement.',
    'I let love in without fear of losing it.',
    'My presence is a gift to those around me.',
    'I nurture my friendships with time and care.',
    'I am loved more than I often realize.',
    'I set kind boundaries that protect my heart.',
    'I choose connection over perfection.',
    'I appreciate the people in my life today.',
    'I am open, warm, and easy to love.',
    'I give the love I wish to receive.',
    'My heart grows softer and braver each day.',
  ],
  growth: [
    'Each day I move a little closer to my best self.',
    'I welcome change as the path to who I am becoming.',
    'I am patient and kind with my own becoming.',
    'I grow a little every single day.',
    'I embrace discomfort as a sign of growth.',
    'I am curious, open, and willing to learn.',
    'Mistakes are lessons, and I am learning well.',
    'I let go of who I was to become who I am.',
    'I am building better habits one day at a time.',
    'I trust the slow work of becoming.',
    'I choose progress over perfection.',
    'I am proud of the small steps I take.',
    'I stay open to new ideas and perspectives.',
    'Every day is a chance to begin again.',
    'I release the need to have it all figured out.',
    'I am exactly where I need to be in my journey.',
    'I turn challenges into stepping stones.',
    'I give myself grace as I grow.',
    'I am becoming wiser with every experience.',
    'I welcome feedback that helps me improve.',
    'My potential is not fixed; it expands.',
    'I show up for myself, even imperfectly.',
    'I celebrate how far I have come.',
    'I am planting seeds that will bloom in time.',
    'I choose growth even when it is hard.',
    'I am gentle with the parts of me still learning.',
    'Small, steady effort changes everything.',
    'I trust myself to keep moving forward.',
    'I am open to becoming more than I am today.',
    'Every quiet step forward is worth taking.',
  ],
};

// Combined, de-duplicated pool of affirmations across ALL selected goals,
// interleaved round-robin (one from each goal in turn) so a multi-goal user's
// feed is mixed rather than running through one goal's full set before the
// next. Falls back to 'confidence' when no goal is selected.
export function affirmationPool(goals: GoalId[]): string[] {
  const ids = goals.length ? goals : (['confidence'] as GoalId[]);
  const seen = new Set<string>();
  const pool: string[] = [];
  const maxLen = Math.max(...ids.map((id) => AFFIRMATIONS[id].length));
  for (let i = 0; i < maxLen; i++) {
    for (const id of ids) {
      const text = AFFIRMATIONS[id][i];
      if (text && !seen.has(text)) {
        seen.add(text);
        pool.push(text);
      }
    }
  }
  return pool;
}

// Reverse-lookup the goal an affirmation belongs to (for the ✦ goal tag).
export function goalIdForAffirmation(text: string): GoalId | undefined {
  return (Object.keys(AFFIRMATIONS) as GoalId[]).find((id) =>
    AFFIRMATIONS[id].includes(text),
  );
}

export const REMINDER_OPTIONS = [
  { id: 'morning', label: 'Morning', time: '7:00 – 9:00 AM', icon: 'sun' },
  { id: 'afternoon', label: 'Afternoon', time: '12:00 – 2:00 PM', icon: 'target' },
  { id: 'evening', label: 'Evening', time: '7:00 – 9:00 PM', icon: 'moon' },
] as const;

export type ReminderTime = (typeof REMINDER_OPTIONS)[number]['id'];

// Canonical chronological order, used to normalize a set of picked times.
const REMINDER_ORDER = REMINDER_OPTIONS.map((o) => o.id);

// Sort a set of reminder times into morning → afternoon → evening order.
export function sortReminderTimes(times: ReminderTime[]): ReminderTime[] {
  return [...times].sort((a, b) => REMINDER_ORDER.indexOf(a) - REMINDER_ORDER.indexOf(b));
}

export const SOUNDS = [
  { id: 'rain', label: 'Rain', icon: 'rain' },
  { id: 'ocean', label: 'Ocean', icon: 'ocean' },
  { id: 'forest', label: 'Forest', icon: 'forest' },
] as const;

export type SoundId = 'rain' | 'ocean' | 'forest';

export const FOCUS_DURATIONS = [15, 25, 45] as const;
// Presets above are 15/25/45, but a custom duration (any whole number of
// minutes) can also be picked via the duration wheel on the Focus screen.
export type FocusDuration = number;

export const PAYWALL_PLANS = [
  {
    id: 'weekly',
    label: 'Weekly',
    price: '$2.99/week',
    note: '3-day free trial',
    badge: null,
  },
  {
    id: 'annual',
    label: 'Annual',
    price: '$39.99/year',
    note: '7-day free trial · $3.33/mo',
    badge: 'Most Popular',
  },
  {
    id: 'monthly',
    label: 'Monthly',
    price: '$7.99/month',
    note: 'Billed monthly',
    badge: null,
  },
  {
    id: 'lifetime',
    label: 'Lifetime',
    price: '$99.99 once',
    note: 'Pay once, yours forever',
    badge: null,
  },
] as const;

export const PAYWALL_FEATURES = [
  { icon: 'sparkle', text: 'Unlimited personalized affirmations' },
  { icon: 'focus', text: 'Every focus length & ambient sound' },
  { icon: 'progress', text: 'Full activity history & insights' },
];
