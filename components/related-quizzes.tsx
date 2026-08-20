import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Clock, Calendar } from 'lucide-react';

interface RelatedQuizzesProps {
  quizzes: Array<{
    title: string;
    slug: string;
    date: string;
    readingTime: string;
  }>;
  className?: string;
  title?: string;
}

export function RelatedQuizzes({ quizzes, className, title = 'Quizzes Relacionados' }: RelatedQuizzesProps) {
  if (!quizzes.length) return null;

  return (
    <div className={cn('', className)}>
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <div className="grid gap-6 md:grid-cols-2">
        {quizzes.map((quiz) => (
          <Link
            key={quiz.slug}
            href={`/quizzes/${quiz.slug}`}
            className="group p-4 bg-card rounded-lg border border-border hover:border-primary/50 hover:shadow-md transition-all"
          >
            <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
              {quiz.title}
            </h3>
            <div className="mt-2 flex items-center text-sm text-muted-foreground">
              <Calendar className="mr-1 h-4 w-4" />
              <time dateTime={quiz.date}>{quiz.date}</time>
              <span className="mx-2">|</span>
              <Clock className="mr-1 h-4 w-4" />
              <span>{quiz.readingTime}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
