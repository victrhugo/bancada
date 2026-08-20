const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://bancada.app';

const ORGANIZATION_ID = `${SITE_URL}/#organization`;

export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: 'Bancada',
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/logo.png`,
    },
    description:
      'Bancada é uma plataforma de prática para engenheiros de DevOps: exercícios, quizzes, flashcards, checklists e simuladores interativos.',
    knowsAbout: [
      'DevOps',
      'Kubernetes',
      'Docker',
      'Infrastructure as Code',
      'CI/CD',
      'Cloud Computing',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebsiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: 'Bancada',
    description: 'Exercícios, quizzes, flashcards e simuladores para praticar DevOps',
    publisher: {
      '@id': ORGANIZATION_ID,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function LearningResourceSchema({
  title,
  description,
  difficulty,
  estimatedTime,
  learningObjectives,
  technologies,
  url,
  learningResourceType = 'hands-on exercise',
}: {
  title: string;
  description: string;
  difficulty?: string;
  estimatedTime: string;
  learningObjectives?: string[];
  technologies?: string[];
  url: string;
  learningResourceType?: string;
}) {
  // Convert "75 minutes" -> "PT75M", "2 hours" -> "PT2H"
  const timeMatch = estimatedTime.match(/(\d+)\s*(min|hour|hr)/i);
  const isoDuration = timeMatch
    ? timeMatch[2].toLowerCase().startsWith('h')
      ? `PT${timeMatch[1]}H`
      : `PT${timeMatch[1]}M`
    : `PT${estimatedTime.replace(/\D/g, '')}M`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: title,
    description,
    url: `${SITE_URL}${url}`,
    learningResourceType,
    ...(difficulty
      ? { educationalLevel: difficulty.charAt(0).toUpperCase() + difficulty.slice(1) }
      : {}),
    timeRequired: isoDuration,
    ...(learningObjectives && learningObjectives.length > 0
      ? { teaches: learningObjectives }
      : {}),
    ...(technologies && technologies.length > 0
      ? {
          about: technologies.map((tech) => ({
            '@type': 'Thing',
            name: tech,
          })),
        }
      : {}),
    interactivityType: 'active',
    isAccessibleForFree: true,
    inLanguage: 'pt-BR',
    provider: {
      '@id': ORGANIZATION_ID,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function SoftwareApplicationSchema({
  name,
  description,
  url,
  category,
  keywords,
}: {
  name: string;
  description: string;
  url: string;
  category?: string;
  keywords?: string[];
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': ['SoftwareApplication', 'LearningResource'],
    name,
    description,
    url: `${SITE_URL}${url}`,
    applicationCategory: 'EducationalApplication',
    applicationSubCategory: category || 'DevOps Simulator',
    operatingSystem: 'Web Browser',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    learningResourceType: 'Simulation',
    educationalUse: ['practice', 'self-directed learning'],
    interactivityType: 'active',
    isAccessibleForFree: true,
    inLanguage: 'pt-BR',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    provider: {
      '@id': ORGANIZATION_ID,
    },
    ...(keywords && keywords.length > 0 ? { keywords: keywords.join(', ') } : {}),
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function FAQSchema({ questions }: { questions: { question: string; answer: string }[] }) {
  if (!questions || questions.length === 0) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Single question-and-answer page (interview questions). QAPage fits a page
 * whose main entity is one question with an accepted answer; FAQPage above is
 * for pages listing several Q&As.
 */
export function QAPageSchema({
  question,
  answer,
  url,
}: {
  question: string;
  answer: string;
  url: string;
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    mainEntity: {
      '@type': 'Question',
      name: question,
      text: question,
      answerCount: 1,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
        url: `${SITE_URL}${url}`,
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function BreadcrumbSchema({ items }: { items: { name: string; url: string }[] }) {
  const itemListElement = items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: `${SITE_URL}${item.url}`,
  }));

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: itemListElement,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
