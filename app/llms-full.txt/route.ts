import { getAllExercises } from '@/lib/exercises';

export const dynamic = 'force-static';

/**
 * llms-full.txt provides the full text of key content so LLMs can ingest
 * actual answers rather than just a table of contents.
 *
 * We include the full text of all exercises. Quizzes, flashcards,
 * checklists, interview questions, games, and simulators are intentionally
 * excluded since they are not prose-based.
 */
export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bancada.app';

  const exercises = await getAllExercises();

  const sections: string[] = [];

  // Header
  sections.push('# Bancada - Full Content Export');
  sections.push('');
  sections.push(
    '> Complete text content from Bancada. This file is structured for LLM ingestion. Each piece of content is separated by a horizontal rule and prefixed with its canonical URL.'
  );
  sections.push('');
  sections.push(`Site: ${baseUrl}`);
  sections.push(`Generated: ${new Date().toISOString()}`);
  sections.push(`Content: ${exercises.length} exercises`);
  sections.push('');
  sections.push('---');
  sections.push('');

  // Exercises
  sections.push('## Exercises');
  sections.push('');
  for (const exercise of exercises) {
    const url = `${baseUrl}/exercises/${exercise.id}`;
    sections.push(`### ${exercise.title}`);
    sections.push('');
    sections.push(`URL: ${url}`);
    if (exercise.description) {
      sections.push(`Description: ${exercise.description}`);
    }
    if (exercise.difficulty) {
      sections.push(`Difficulty: ${exercise.difficulty}`);
    }
    if (exercise.estimatedTime) {
      sections.push(`Time: ${exercise.estimatedTime}`);
    }
    sections.push('');

    // Include learning objectives if available
    if (exercise.learningObjectives && exercise.learningObjectives.length > 0) {
      sections.push('**Learning objectives:**');
      for (const obj of exercise.learningObjectives) {
        sections.push(`- ${obj}`);
      }
      sections.push('');
    }

    // Include steps
    if (exercise.steps && exercise.steps.length > 0) {
      sections.push('**Steps:**');
      sections.push('');
      for (let i = 0; i < exercise.steps.length; i++) {
        const step = exercise.steps[i];
        sections.push(`**Step ${i + 1}: ${step.title}**`);
        sections.push('');
        if (step.description) {
          sections.push(step.description);
          sections.push('');
        }
      }
    }

    sections.push('---');
    sections.push('');
  }

  const body = sections.join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
