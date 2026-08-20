import { getAllExercises } from '@/lib/exercises';
import { getQuizMetadata } from '@/lib/quiz-loader';
import { getActiveGames } from '@/lib/games';
import { getAllFlashCardSets } from '@/lib/flashcard-loader';
import { getAllChecklists } from '@/lib/checklists';
import { interviewQuestions } from '@/content/interview-questions';

export const dynamic = 'force-static';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bancada.app';

  const [exercises, quizzes, games, flashcards, checklists] = await Promise.all([
    getAllExercises(),
    getQuizMetadata(),
    getActiveGames(),
    getAllFlashCardSets(),
    getAllChecklists(),
  ]);

  const md = `# Bancada

> Bancada is a free practice platform for DevOps engineers: hands-on exercises, quizzes, flashcards, checklists, interview questions, and interactive simulators. Content covers Docker, Kubernetes, Terraform, CI/CD, Linux, AWS, Git, Python, and more.

- Last updated: ${new Date().toISOString().split('T')[0]}
- Content: ${exercises.length} exercises, ${quizzes.length} quizzes, ${flashcards.length} flashcard decks, ${checklists.length} checklists, ${interviewQuestions.length} interview questions, ${games.length} interactive simulators
- License: Open source (GitHub)

## Pages

- [Home](${baseUrl}): DevOps practice platform with exercises, quizzes, and simulators
- [Exercises](${baseUrl}/exercises): Hands-on labs with step-by-step instructions
- [Quizzes](${baseUrl}/quizzes): Test your DevOps knowledge with interactive quizzes
- [Flashcards](${baseUrl}/flashcards): Review key concepts with spaced-repetition flashcards
- [Checklists](${baseUrl}/checklists): Actionable security and best-practice checklists
- [Interview Questions](${baseUrl}/interview-questions): DevOps interview prep for junior to senior
- [Games](${baseUrl}/games): ${games.length}+ interactive DevOps simulators and learning tools
- [Roadmap](${baseUrl}/roadmap): DevOps learning path from beginner to expert
- [Roadmaps](${baseUrl}/roadmaps): Structured learning paths (Junior, DevSecOps)

## Exercises

${exercises.map((e) => `- [${e.title}](${baseUrl}/exercises/${e.id}): ${e.description} (${e.difficulty}, ${e.estimatedTime})`).join('\n')}

## Quizzes

${quizzes.map((q) => `- [${q.title}](${baseUrl}/quizzes/${q.id}): ${q.description || ''}`).join('\n')}

## Flashcards

${flashcards.map((f) => `- [${f.title}](${baseUrl}/flashcards/${f.id}): ${f.description || ''} (${f.cardCount} cards)`).join('\n')}

## Checklists

${checklists.map((c) => `- [${c.title}](${baseUrl}/checklists/${c.slug}): ${c.description || ''}`).join('\n')}

## Interview Questions

${interviewQuestions.map((q) => `- [${q.title}](${baseUrl}/interview-questions/${q.tier}/${q.slug}): ${q.question}`).join('\n')}

## Interactive Simulators & Games

${games.map((g) => `- [${g.title}](${baseUrl}${g.href}): ${g.description}`).join('\n')}
`;

  return new Response(md, { headers: { 'Content-Type': 'text/plain' } });
}
