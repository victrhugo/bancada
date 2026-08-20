import { Metadata } from 'next';
import { interviewQuestions } from '@/content/interview-questions';
import { PracticeSession } from '@/components/interview-questions/practice-session';

export const metadata: Metadata = {
  title: 'Sessão de Prática | Perguntas de Entrevista DevOps',
  description:
    'Treine perguntas de entrevista de DevOps em uma sessão de prática focada. Pense primeiro, revele a resposta modelo e acompanhe o que você já sabe.',
  // Parameterized practice surface; the canonical content lives on the
  // individual question pages and the tier/topic landing pages.
  robots: { index: false, follow: true },
  alternates: { canonical: '/interview-questions' },
};

export default function PracticePage() {
  return (
    <div className="container mx-auto px-4 max-w-3xl py-8 sm:py-10">
      <PracticeSession questions={interviewQuestions} />
    </div>
  );
}
