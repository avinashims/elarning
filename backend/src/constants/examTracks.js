const EXAM_TRACKS = [
  { slug: 'iit-jee', name: 'IIT JEE', icon: '🎯', tagline: 'Main + Advanced prep' },
  { slug: 'neet', name: 'NEET', icon: '🩺', tagline: 'Medical entrance batches' },
  { slug: 'ssc', name: 'SSC / Govt', icon: '📋', tagline: 'SSC, Railway, Banking' },
  { slug: 'cbse', name: 'CBSE / School', icon: '📚', tagline: 'Class 6–12 foundation' },
  { slug: 'upsc', name: 'UPSC', icon: '🏛️', tagline: 'Civil services prep' },
  { slug: 'gate', name: 'GATE', icon: '⚙️', tagline: 'Engineering PG exams' },
];

const DEFAULT_BATCH_FEATURES = [
  'Live interactive classes',
  'Recorded lectures',
  'DPP & practice sheets',
  'Mock tests & analytics',
  'Doubt support',
];

module.exports = { EXAM_TRACKS, DEFAULT_BATCH_FEATURES };
