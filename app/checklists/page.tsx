import { Metadata } from 'next';
import { getAllChecklists } from '@/lib/checklists';
import { PageHero } from '@/components/page-hero';
import { ChecklistsList } from '@/components/checklists/checklists-list';
import { ListChecks } from 'lucide-react';

export const metadata: Metadata = {
 title: 'Checklists de DevOps e Segurança | Bancada',
 description: 'Checklists interativos de DevOps, segurança e boas práticas de nuvem. Acompanhe seu progresso e garanta que nada seja esquecido.',
 keywords: ['devops checklists', 'security checklists', 'kubernetes checklist', 'aws security', 'ci/cd pipeline'],
 authors: [{ name: 'Bancada' }],
 creator: 'Bancada',
 publisher: 'Bancada',
 applicationName: 'Bancada',
 robots: {
   index: true,
   follow: true,
   googleBot: {
     index: true,
     follow: true,
     'max-video-preview': -1,
     'max-image-preview': 'large',
     'max-snippet': -1,
   },
 },
 alternates: {
   canonical: '/checklists',
 },
 openGraph: {
  title: 'Checklists de DevOps e Segurança - Bancada',
  description: 'Checklists interativos de DevOps, segurança e boas práticas de nuvem. Acompanhe seu progresso, garanta que nada seja esquecido e exporte em markdown.',
  type: 'website',
  url: '/checklists',
  siteName: 'Bancada',
  locale: 'en_US',
  images: [
    {
      url: '/images/checklists/checklists-og.png',
      width: 1200,
      height: 630,
      alt: 'Checklists de DevOps e Segurança',
    },
  ],
 },
 twitter: {
  card: 'summary_large_image',
  site: '@TheDevOpsDaily',
  creator: '@TheDevOpsDaily',
  title: 'Checklists de DevOps e Segurança - Bancada',
  description: 'Checklists interativos de DevOps, segurança e boas práticas de nuvem. Acompanhe seu progresso e garanta que nada seja esquecido.',
  images: ['/images/checklists/checklists-og.png'],
 },
};

export default async function ChecklistsPage() {
  const checklists = await getAllChecklists();
  const categories = Array.from(new Set(checklists.map((c) => c.category)));

  return (
    <div className="min-h-screen">
      <PageHero
        title="Checklists de DevOps e Segurança"
        description="Checklists interativos de DevOps, segurança e boas práticas de nuvem. Acompanhe seu progresso e garanta que nada seja esquecido."
        icon={ListChecks}
        breadcrumbs={[{ label: 'Checklists' }]}
        stats={[
          { label: 'checklists', value: checklists.length },
          { label: 'categorias', value: categories.length },
        ]}
      />

      {/* Checklists List with Filters */}
      <section className="py-8 container mx-auto px-4 mb-16 max-w-7xl">
        <ChecklistsList checklists={checklists} />
      </section>

      {/* Pro Tips Section */}
      <section className="py-8 container mx-auto px-4 mb-16 max-w-7xl">
        <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Dicas Úteis
          </h3>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li>Seu progresso é salvo automaticamente no navegador</li>
            <li>Clique em qualquer item do checklist para expandir e ver mais detalhes</li>
            <li>Exporte os checklists em markdown para compartilhar com sua equipe</li>
            <li>Use o botão de compartilhar para obter um link direto para qualquer checklist</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
