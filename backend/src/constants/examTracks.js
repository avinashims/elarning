const EXAM_TRACKS = [
  { slug: 'iit-jee', name: 'IIT JEE', icon: '🎯', tagline: 'Main + Advanced prep' },
  { slug: 'neet', name: 'NEET', icon: '🩺', tagline: 'Medical entrance batches' },
  { slug: 'ssc', name: 'SSC / Govt', icon: '📋', tagline: 'SSC, Railway, Banking' },
  { slug: 'cbse', name: 'CBSE / School', icon: '📚', tagline: 'Class 6–12 foundation' },
  { slug: 'icse', name: 'ICSE', icon: '📖', tagline: 'ICSE board batches' },
  { slug: 'up-board', name: 'UP Board', icon: '🏫', tagline: 'UPMSP classes 9–12' },
  { slug: 'upsc', name: 'UPSC', icon: '🏛️', tagline: 'Civil services prep' },
  { slug: 'gate', name: 'GATE', icon: '⚙️', tagline: 'Engineering PG exams' },
];

/** PW-style browse cards on home (School Boards, UPSC, Govt, etc.) */
const EXPLORE_CATEGORIES = [
  {
    slug: 'school-boards',
    title: 'School Boards',
    icon: '🎒',
    explorePath: '/school-boards?came_from=exam_cards',
    pills: [
      { label: 'CBSE', path: '/cbse-science?came_from=exam_cards' },
      { label: 'ICSE', path: '/icse?came_from=exam_cards' },
      { label: 'UP Board', path: '/up-board?came_from=exam_cards' },
    ],
  },
  {
    slug: 'upsc',
    title: 'UPSC',
    icon: '👥',
    explorePath: '/batches?examTrack=UPSC&came_from=exam_cards',
    pills: [],
  },
  {
    slug: 'govt-jobs',
    title: 'Govt Job Exams',
    icon: '🏛️',
    explorePath: '/batches?examTrack=SSC&came_from=exam_cards',
    pills: [
      { label: 'SSC', path: '/batches?examTrack=SSC&came_from=exam_cards' },
      { label: 'Banking', path: '/batches?q=banking&came_from=exam_cards' },
      { label: 'Teaching', path: '/batches?q=teaching&came_from=exam_cards' },
    ],
  },
  {
    slug: 'iit-jee',
    title: 'IIT JEE',
    icon: '🎯',
    explorePath: '/batches?examTrack=IIT-JEE&came_from=exam_cards',
    pills: [
      { label: 'JEE Main', path: '/batches?examTrack=IIT-JEE&q=main&came_from=exam_cards' },
      { label: 'JEE Advanced', path: '/batches?examTrack=IIT-JEE&q=advanced&came_from=exam_cards' },
    ],
  },
  {
    slug: 'neet',
    title: 'NEET',
    icon: '🩺',
    explorePath: '/batches?examTrack=NEET&came_from=exam_cards',
    pills: [
      { label: 'Class 11', path: '/batches?examTrack=NEET&classLevel=Class%2011&came_from=exam_cards' },
      { label: 'Class 12', path: '/batches?examTrack=NEET&classLevel=Class%2012&came_from=exam_cards' },
    ],
  },
  {
    slug: 'gate',
    title: 'GATE',
    icon: '⚙️',
    explorePath: '/batches?examTrack=GATE&came_from=exam_cards',
    pills: [],
  },
];

const DEFAULT_BATCH_FEATURES = [
  'Live interactive classes',
  'Recorded lectures',
  'DPP & practice sheets',
  'Mock tests & analytics',
  'Doubt support',
];

module.exports = { EXAM_TRACKS, EXPLORE_CATEGORIES, DEFAULT_BATCH_FEATURES };
