import Link from 'next/link';
import { Bot, Database, FileSearch, MessagesSquare, Quote, Sparkles, Zap } from 'lucide-react';
import { TutorChat } from '@/components/tutor/tutor-chat';

const STEPS = [
  {
    icon: Database,
    title: '1. Base de conhecimento',
    text: 'No build, o conteúdo da Bancada (quizzes, flashcards, exercícios, checklists, perguntas de entrevista, simuladores e a trilha de IA) vira cerca de 1.700 trechos pequenos, cada um com título e link.',
  },
  {
    icon: FileSearch,
    title: '2. Busca híbrida',
    text: 'Sua pergunta é buscada de dois jeitos: por palavras-chave (BM25) e por significado (embeddings do Gemini, comparados por similaridade de cosseno). Os dois rankings são combinados com Reciprocal Rank Fusion.',
  },
  {
    icon: Sparkles,
    title: '3. Geração com contexto',
    text: 'Os 6 trechos mais relevantes vão para um LLM (Gemini Flash, plano gratuito) com a instrução de responder só com base neles. Se o modelo não responder, você ainda recebe os trechos.',
  },
  {
    icon: Quote,
    title: '4. Citações',
    text: 'Cada afirmação aponta para a fonte com [n]. Clique na fonte para estudar o conteúdo original.',
  },
  {
    icon: MessagesSquare,
    title: '5. Memória e reescrita',
    text: 'O tutor lembra das últimas mensagens. Antes de buscar, ele reescreve continuações como "e no Kubernetes?" numa pergunta completa, para a busca encontrar os trechos certos.',
  },
  {
    icon: Zap,
    title: '6. Streaming e contexto da página',
    text: 'A resposta aparece enquanto é escrita. No balão flutuante, os trechos da página em que você está ganham prioridade na busca.',
  },
];

export default function TutorPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Bot className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Tutor com IA</h1>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          Pergunte sobre DevOps, cloud, Kubernetes, bancos de dados ou engenharia de IA. O tutor
          responde em português usando o conteúdo da Bancada como base e cita de onde tirou cada
          informação.
        </p>
      </div>

      <TutorChat />

      <section className="mt-12">
        <h2 className="mb-2 text-xl font-semibold">Como o tutor funciona (RAG na prática)</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Este tutor é um exemplo real do que você estuda na{' '}
          <Link href="/roadmap/ia" className="text-primary underline-offset-4 hover:underline">
            trilha de Engenharia de IA
          </Link>{' '}
          e no{' '}
          <Link
            href="/games/rag-pipeline-simulator"
            className="text-primary underline-offset-4 hover:underline"
          >
            simulador de pipeline RAG
          </Link>
          .
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {STEPS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-lg border bg-card p-4">
              <div className="mb-2 flex items-center gap-2 font-medium">
                <Icon className="h-4 w-4 text-primary" />
                {title}
              </div>
              <p className="text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
