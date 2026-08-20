export type SearchItemType =
  | 'exercise'
  | 'quiz'
  | 'game'
  | 'page'
  | 'checklist'
  | 'interview-question'
  | 'flashcard';

export interface SearchItem {
  id: string;
  type: SearchItemType;
  title: string;
  description: string;
  url: string;
  category?: string;
  tags?: string[];
  icon?: string;
  date?: string;
}

export const TYPE_LABELS: Record<SearchItemType, string> = {
  exercise: 'Exercises',
  quiz: 'Quizzes',
  game: 'Games',
  page: 'Pages',
  checklist: 'Checklists',
  'interview-question': 'Interview Questions',
  flashcard: 'Flashcards',
};

export const TYPE_COLORS: Record<SearchItemType, string> = {
  exercise: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  quiz: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  game: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
  page: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  checklist: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
  'interview-question':
    'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  flashcard: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
};
