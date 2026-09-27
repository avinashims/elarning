/** PW-style landing pages: /cbse-science, /icse, /up-board, /school-boards */
export const EXAM_LANDING_PAGES = {
  'coding-programs': {
    title: 'Top Programming',
    subtitle: 'Job-oriented live programs — MERN, PHP & WordPress',
    category: '',
    examTrack: '',
    defaultStream: '',
    classLevels: [],
    boardLinks: [
      { label: 'MERN Full Stack', path: '/mern-full-stack?came_from=exam_cards' },
      { label: 'PHP Program', path: '/php-program?came_from=exam_cards' },
      { label: 'WordPress Program', path: '/wordpress-program?came_from=exam_cards' },
    ],
  },
  'mern-full-stack': {
    title: 'MERN Full Stack Program',
    subtitle: 'MongoDB, Express, React & Node — build full-stack apps with live mentorship',
    category: 'mern-stack',
    examTrack: 'MERN',
    defaultStream: '',
    classLevels: [],
    boardLinks: [],
  },
  'php-program': {
    title: 'PHP Program',
    subtitle: 'Backend PHP, MySQL, and modern workflow for web developers',
    category: 'php',
    examTrack: 'PHP',
    defaultStream: '',
    classLevels: [],
    boardLinks: [],
  },
  'wordpress-program': {
    title: 'WordPress Program',
    subtitle: 'Sites, themes, plugins & WooCommerce for freelancers and agencies',
    category: 'wordpress',
    examTrack: 'WordPress',
    defaultStream: '',
    classLevels: [],
    boardLinks: [],
  },
  'school-boards': {
    title: 'School Boards',
    subtitle: 'CBSE, ICSE & UP Board batches for Class 9–12',
    category: '',
    examTrack: '',
    defaultStream: '',
    classLevels: [],
    boardLinks: [
      { label: 'CBSE Science', path: '/cbse-science?came_from=exam_cards' },
      { label: 'ICSE', path: '/icse?came_from=exam_cards' },
      { label: 'UP Board', path: '/up-board?came_from=exam_cards' },
    ],
  },
  'cbse-science': {
    title: 'CBSE Science',
    subtitle: 'Live batches for Class 9–12 Science — Physics, Chemistry, Maths & Biology',
    category: 'cbse',
    examTrack: 'CBSE',
    defaultStream: 'science',
    classLevels: ['Class 9', 'Class 10', 'Class 11', 'Class 12'],
    boardLinks: [],
  },
  cbse: {
    title: 'CBSE',
    subtitle: 'All CBSE board batches',
    category: 'cbse',
    examTrack: 'CBSE',
    defaultStream: '',
    classLevels: ['Class 9', 'Class 10', 'Class 11', 'Class 12'],
    boardLinks: [],
  },
  icse: {
    title: 'ICSE',
    subtitle: 'ICSE board batches for Class 6–10',
    category: 'icse',
    examTrack: 'ICSE',
    defaultStream: '',
    classLevels: ['Class 8', 'Class 9', 'Class 10'],
    boardLinks: [],
  },
  'up-board': {
    title: 'UP Board',
    subtitle: 'UPMSP batches in Hindi medium',
    category: 'up-board',
    examTrack: 'UP Board',
    defaultStream: '',
    classLevels: ['Class 10', 'Class 11', 'Class 12'],
    boardLinks: [],
  },
};

export function resolveExamLandingSlug(param) {
  if (!param) return null;
  return EXAM_LANDING_PAGES[param] ? param : null;
}
