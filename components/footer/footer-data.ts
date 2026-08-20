export interface FooterLink {
  href: string;
  label: string;
}

export interface FooterSection {
  title: string;
  links: FooterLink[];
}

export const practiceSection: FooterSection = {
  title: 'Praticar',
  links: [
    { href: '/exercises', label: 'Exercícios' },
    { href: '/quizzes', label: 'Quizzes' },
    { href: '/flashcards', label: 'Flashcards' },
    { href: '/checklists', label: 'Checklists' },
    { href: '/interview-questions', label: 'Perguntas de Entrevista' },
  ],
};

export const learnSection: FooterSection = {
  title: 'Aprender',
  links: [
    { href: '/games', label: 'Jogos' },
    { href: '/roadmap', label: 'Roadmap' },
    { href: '/roadmaps', label: 'Todos os Roadmaps' },
    { href: '/search', label: 'Busca' },
  ],
};
