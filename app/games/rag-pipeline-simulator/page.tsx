import type { Metadata } from 'next';
import Link from 'next/link';
import RagPipelineSimulator from '@/components/games/rag-pipeline-simulator';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('rag-pipeline-simulator');
}

const seoLearningPoints = [
  'O que é RAG (Retrieval-Augmented Generation) e quais são as etapas do pipeline',
  'Como o tamanho do chunk e o overlap mudam o que o modelo consegue responder',
  'Por que a busca semântica encontra paráfrases e a busca por palavra-chave encontra códigos exatos',
  'Como a busca híbrida com Reciprocal Rank Fusion combina o melhor das duas',
  'Como um prompt com grounding reduz alucinação e obriga a citar a fonte',
  'O que é prompt injection indireta e por que dados recuperados nunca são instruções',
];

function RagEducational() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">Sobre este simulador de RAG</h3>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-3 text-sm font-semibold">O que você vai aprender</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Como documentos viram chunks e por que o tamanho do chunk importa</li>
            <li>A diferença entre busca semântica, por palavra-chave e híbrida</li>
            <li>O que é recall@k e como reconhecer uma falha de retrieval</li>
            <li>Por que &quot;mais contexto&quot; nem sempre é melhor: ruído e custo em tokens</li>
            <li>Como o grounding transforma uma alucinação em uma recusa honesta</li>
            <li>Como uma instrução escondida em um documento pode sequestrar o assistente</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">As etapas do pipeline</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Indexação:</strong> os documentos são divididos em
              chunks e cada chunk vira um vetor (embedding)
            </li>
            <li>
              <strong className="text-foreground">Busca:</strong> a pergunta vira vetor e os chunks
              mais próximos são recuperados (top-k)
            </li>
            <li>
              <strong className="text-foreground">Prompt:</strong> os trechos entram no contexto
              junto com as regras do assistente
            </li>
            <li>
              <strong className="text-foreground">Geração:</strong> o modelo responde com base nos
              trechos e cita a fonte, ou admite que não sabe
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Roteiro sugerido de experimentos</h4>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">Paráfrase:</strong> troque para busca por
            palavra-chave e veja o recall falhar. Volte para semântica.
          </li>
          <li>
            <strong className="text-foreground">Código exato:</strong> use busca semântica com top-k
            1. Depois mude para híbrida.
          </li>
          <li>
            <strong className="text-foreground">Fato específico:</strong> reduza o chunk para 8
            palavras sem overlap e veja a frase ser cortada. Depois suba para 120 e observe o ruído
            e os tokens.
          </li>
          <li>
            <strong className="text-foreground">Fora do escopo:</strong> desligue o grounding e veja
            a alucinação aparecer.
          </li>
          <li>
            <strong className="text-foreground">Segurança:</strong> indexe o documento malicioso,
            escolha &quot;Fato específico&quot; e desligue o grounding.
          </li>
        </ol>
      </div>

      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Uma simplificação honesta</h4>
        <p className="text-sm text-muted-foreground">
          Para rodar inteiro no navegador, os &quot;embeddings&quot; deste simulador são um modelo
          didático que agrupa sinônimos em conceitos e compara com similaridade de cosseno, e o
          &quot;LLM&quot; é um gerador por regras. Modelos reais são muito mais ricos, mas os
          comportamentos que você observa aqui, paráfrases que funcionam, códigos que escapam,
          frases cortadas, alucinação sem grounding e prompt injection, são os mesmos que aparecem
          em produção.
        </p>
      </div>

      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Continue o módulo de IA</h4>
        <p className="text-sm text-muted-foreground">
          Construa um RAG de verdade no exercício{' '}
          <Link
            href="/exercises/rag-do-zero-pgvector"
            className="font-medium text-primary underline underline-offset-2"
          >
            RAG do Zero com pgvector
          </Link>
          , teste o que aprendeu no{' '}
          <Link
            href="/quizzes/ia-llm-rag-quiz"
            className="font-medium text-primary underline underline-offset-2"
          >
            Quiz de Engenharia de IA
          </Link>{' '}
          e siga o{' '}
          <Link
            href="/roadmap/ia"
            className="font-medium text-primary underline underline-offset-2"
          >
            Roadmap de Engenharia de IA
          </Link>
          .
        </p>
      </div>
    </>
  );
}

export default function RagPipelineSimulatorPage() {
  return (
    <SimulatorShell
      slug="rag-pipeline-simulator"
      fallbackTitle="Simulador de Pipeline RAG"
      fallbackDescription="Veja um pipeline RAG por dentro: chunking, embeddings, busca híbrida, grounding e prompt injection."
      educational={<RagEducational />}
      seoLearningPoints={seoLearningPoints}
      shareText="Entenda RAG na prática: ajuste chunking, top-k e tipo de busca e veja a resposta acertar, recusar ou alucinar."
    >
      <RagPipelineSimulator />
    </SimulatorShell>
  );
}
