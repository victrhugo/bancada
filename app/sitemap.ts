import type { MetadataRoute } from 'next';
import { getAllExercises } from '@/lib/exercises';
import { getQuizMetadata } from '@/lib/quiz-loader';
import { getActiveGames } from '@/lib/games';
import { getAllFlashCardSets } from '@/lib/flashcard-loader';
import { getAllChecklists } from '@/lib/checklists';
import { interviewQuestions, getAllTopics } from '@/content/interview-questions';

export const dynamic = 'force-static';

function withLastModified(date?: string | Date | null) {
  return date ? { lastModified: new Date(date) } : {};
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bancada.app';

  // Get all content
  const [exercises, quizzes, games, flashcards, checklists] = await Promise.all([
    getAllExercises(),
    getQuizMetadata(),
    getActiveGames(),
    getAllFlashCardSets(),
    getAllChecklists(),
  ]);

  const latestExerciseDate = exercises[0]?.updatedAt || exercises[0]?.publishedAt;

  // Static routes
  const routes = [
    {
      url: `${baseUrl}`,
      ...withLastModified(latestExerciseDate),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/exercises`,
      ...withLastModified(latestExerciseDate),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/quizzes`,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/flashcards`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/checklists`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/interview-questions`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/games`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/roadmap`,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/roadmaps`,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/search`,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ];

  // Exercise routes
  const exerciseRoutes = exercises.map((exercise) => ({
    url: `${baseUrl}/exercises/${exercise.id}`,
    ...withLastModified(exercise.updatedAt || exercise.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Quiz routes
  const quizRoutes = quizzes.map((quiz) => ({
    url: `${baseUrl}/quizzes/${quiz.id}`,
    ...withLastModified(quiz.createdDate),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Game routes (only active games, excludes coming soon)
  const gameRoutes = games.map((game) => ({
    url: `${baseUrl}${game.href}`,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Flashcard routes
  const flashcardRoutes = flashcards.map((set) => ({
    url: `${baseUrl}/flashcards/${set.id}`,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // Checklist routes
  const checklistRoutes = checklists.map((checklist) => ({
    url: `${baseUrl}/checklists/${checklist.slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // Interview question routes
  const interviewRoutes = interviewQuestions.map((q) => ({
    url: `${baseUrl}/interview-questions/${q.tier}/${q.slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // Interview topic landing pages (e.g. /interview-questions/topic/kubernetes)
  const interviewTopicRoutes = getAllTopics().map((t) => ({
    url: `${baseUrl}/interview-questions/topic/${t.slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  // Roadmap sub-pages
  const roadmapRoutes = ['junior', 'devsecops'].flatMap((slug) => [
    { url: `${baseUrl}/roadmap/${slug}`, changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${baseUrl}/roadmaps/${slug}`, changeFrequency: 'monthly' as const, priority: 0.5 },
  ]);

  return [
    ...routes,
    ...exerciseRoutes,
    ...quizRoutes,
    ...gameRoutes,
    ...flashcardRoutes,
    ...checklistRoutes,
    ...interviewRoutes,
    ...interviewTopicRoutes,
    ...roadmapRoutes,
  ];
}
