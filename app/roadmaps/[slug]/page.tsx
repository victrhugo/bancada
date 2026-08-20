import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

// Import the roadmap page components
import JuniorRoadmapPage from '@/app/roadmap/junior/page';
import DevSecOpsRoadmapPage from '@/app/roadmap/devsecops/page';

const validRoadmaps = ['junior', 'devsecops'] as const;
type RoadmapSlug = (typeof validRoadmaps)[number];

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return validRoadmaps.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  if (!validRoadmaps.includes(slug as RoadmapSlug)) {
    return {};
  }

  const metadata: Record<RoadmapSlug, Metadata> = {
    junior: {
      title: { absolute: 'Roadmap DevOps Júnior - Comece Sua Jornada em DevOps' },
      description:
        'Um roadmap amigável para iniciantes, criado especialmente para futuros engenheiros de DevOps. Uma trilha de aprendizado clara e focada, sem sobrecarga.',
      alternates: {
        canonical: '/roadmaps/junior',
      },
      openGraph: {
        title: 'Roadmap DevOps Júnior - Comece Sua Jornada em DevOps',
        description:
          'Um roadmap amigável para iniciantes, criado especialmente para futuros engenheiros de DevOps. Uma trilha de aprendizado clara e focada, sem sobrecarga.',
        url: 'https://bancada.app/roadmaps/junior',
        type: 'website',
        images: [
          {
            url: 'https://bancada.app/images/junior-roadmap-og.png',
            width: 1200,
            height: 630,
            alt: 'Roadmap DevOps Júnior - Comece Sua Jornada',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Roadmap DevOps Júnior - Comece Sua Jornada em DevOps',
        description:
          'Um roadmap para futuros engenheiros de DevOps. Uma trilha de aprendizado clara e focada, sem sobrecarga.',
        images: ['https://bancada.app/images/junior-roadmap-og.png'],
      },
    },
    devsecops: {
      title: { absolute: 'Roadmap DevSecOps - DevOps com Foco em Segurança' },
      description:
        'Domine a integração de práticas de segurança no pipeline de DevOps. Aprenda a construir sistemas seguros, em conformidade e resilientes.',
      alternates: {
        canonical: '/roadmaps/devsecops',
      },
      openGraph: {
        title: 'Roadmap DevSecOps - DevOps com Foco em Segurança',
        description:
          'Domine a integração de práticas de segurança no pipeline de DevOps. Aprenda a construir sistemas seguros, em conformidade e resilientes.',
        url: 'https://bancada.app/roadmaps/devsecops',
        type: 'website',
        images: [
          {
            url: 'https://bancada.app/images/devsecops-roadmap-og.png',
            width: 1200,
            height: 630,
            alt: 'Roadmap DevSecOps - DevOps com Foco em Segurança',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Roadmap DevSecOps - DevOps com Foco em Segurança',
        description:
          'Domine as práticas de segurança no pipeline de DevOps. Construa sistemas seguros, em conformidade e resilientes.',
        images: ['https://bancada.app/images/devsecops-roadmap-og.png'],
      },
    },
  };

  return metadata[slug as RoadmapSlug];
}

export default async function RoadmapPage({ params }: PageProps) {
  const { slug } = await params;

  if (!validRoadmaps.includes(slug as RoadmapSlug)) {
    notFound();
  }

  // Render the appropriate roadmap component
  switch (slug) {
    case 'junior':
      return <JuniorRoadmapPage />;
    case 'devsecops':
      return <DevSecOpsRoadmapPage />;
    default:
      notFound();
  }
}
