import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import GenericQuiz from '@/components/games/generic-quiz';
import { ReportIssue } from '@/components/report-issue';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';
import { getQuizById } from '@/lib/quiz-loader';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('git-quiz');
}

function GitQuizEducational() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">Sobre o Quiz de Comandos Git</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        O Quiz de Comandos Git é uma ferramenta interativa para entender Git a partir de cenários
        reais. Em vez de decorar comandos, você aprende resolvendo problemas práticos que aparecem no
        dia a dia do desenvolvimento.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-3 font-semibold text-sm">O que você vai aprender</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Como resolver conflitos de merge</li>
            <li>Quando usar rebase ou merge</li>
            <li>Como limpar o histórico de commits</li>
            <li>Como usar stash e organizar o fluxo de trabalho</li>
            <li>Operações avançadas como cherry-pick</li>
            <li>Como desfazer erros com segurança</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-sm">Níveis de dificuldade</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Iniciante:</strong> merges básicos e resolução de
              conflitos.
            </li>
            <li>
              <strong className="text-foreground">Intermediário:</strong> rebase, stash e otimização
              do fluxo de trabalho.
            </li>
            <li>
              <strong className="text-foreground">Avançado:</strong> rebase interativo e cenários
              complexos.
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 font-semibold text-sm">Dica</h4>
        <p className="text-sm text-muted-foreground">
          Cada cenário se baseia em situações reais do dia a dia. As explicações ajudam a entender não
          só <em>o que</em> fazer, mas <em>por que</em> cada comando do Git funciona assim.
        </p>
      </div>

      <div className="mt-6">
        <ReportIssue title="Quiz de Comandos Git" type="quiz" slug="git-quiz" variant="compact" />
      </div>
    </>
  );
}

export default async function GitQuizPage() {
  const quizConfig = await getQuizById('git-quiz');

  if (!quizConfig) {
    notFound();
  }

  return (
    <SimulatorShell
      slug="git-quiz"
      educational={<GitQuizEducational />}
      shareText="Teste suas habilidades de Git com o Quiz de Comandos Git! Conflitos de merge, rebase e fluxos complexos."
    >
      <GenericQuiz quizConfig={quizConfig} />
    </SimulatorShell>
  );
}
