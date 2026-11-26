import type { Metadata } from 'next';
import BCDRSimulator from '@/components/games/bcdr-simulator';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('bcdr-simulator');
}

function BcdrEducational() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">Entendendo BCDR</h3>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-3 font-semibold text-sm">O que você vai aprender</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>RTO (Recovery Time Objective) e RPO (Recovery Point Objective)</li>
            <li>Sites de recuperação de desastres hot, warm e cold</li>
            <li>Frequência de backup e estratégias de replicação de dados</li>
            <li>Failover automatizado e procedimentos manuais</li>
            <li>As contrapartidas entre custo e tempo de recuperação</li>
            <li>Planejamento para cenários reais de desastre</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-sm">Tipos de site de DR</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Hot site:</strong> replicação em tempo real e
              failover instantâneo. O custo mais alto, com tempo fora do ar mínimo.
            </li>
            <li>
              <strong className="text-foreground">Warm site:</strong> backups regulares e recuperação
              em horas. Equilíbrio entre custo e recuperação.
            </li>
            <li>
              <strong className="text-foreground">Cold site:</strong> infraestrutura básica e
              recuperação em dias. O menor custo, com o maior tempo fora do ar.
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 font-semibold text-sm">Métricas principais</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">RTO:</strong> o tempo máximo aceitável fora do ar
            depois de um desastre.
          </li>
          <li>
            <strong className="text-foreground">RPO:</strong> a perda máxima aceitável de dados (o
            quão antigo pode ser o último backup).
          </li>
          <li>
            <strong className="text-foreground">MTTR:</strong> Mean Time To Recovery, o tempo médio
            para restaurar o serviço.
          </li>
          <li>
            <strong className="text-foreground">MTPD:</strong> Maximum Tolerable Period of Disruption,
            o período máximo tolerável de interrupção.
          </li>
        </ul>
      </div>

      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 font-semibold text-sm">Boas práticas</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>Alinhe a estratégia de DR à criticidade do negócio e ao orçamento.</li>
          <li>Teste os procedimentos de failover com regularidade (pelo menos a cada trimestre).</li>
          <li>Documente runbooks para todos os cenários de desastre.</li>
          <li>Use diversidade geográfica nos sites de DR.</li>
          <li>Automatize o failover sempre que possível para reduzir erro humano.</li>
        </ul>
      </div>
    </>
  );
}

export default function BCDRSimulatorPage() {
  return (
    <SimulatorShell
      slug="bcdr-simulator"
      educational={<BcdrEducational />}
      shareText="Conheça este simulador de BCDR! Aprenda estratégias de recuperação de desastres de forma interativa."
    >
      <BCDRSimulator />
    </SimulatorShell>
  );
}
