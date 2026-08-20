import { Home, Target, Trophy, Layers, ListChecks, Briefcase, Gamepad2, Map } from 'lucide-react';

export interface MainNavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const mainNavigation: MainNavItem[] = [
  { label: 'Início', href: '/', icon: Home },
  { label: 'Exercícios', href: '/exercises', icon: Target },
  { label: 'Quizzes', href: '/quizzes', icon: Trophy },
  { label: 'Flashcards', href: '/flashcards', icon: Layers },
  { label: 'Checklists', href: '/checklists', icon: ListChecks },
  { label: 'Perguntas de Entrevista', href: '/interview-questions', icon: Briefcase },
  { label: 'Jogos', href: '/games', icon: Gamepad2 },
  { label: 'Roadmap', href: '/roadmap', icon: Map },
];
