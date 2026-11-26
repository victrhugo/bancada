import type { Metadata } from 'next';
import DbIndexingSimulator from '../../../components/games/db-indexing-simulator';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('db-indexing-simulator');
}

function DbIndexingEducational() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">Entendendo índices de banco de dados</h3>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-3 font-semibold text-sm">Como os índices funcionam</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Estrutura B-tree:</strong> o tipo de índice mais
              comum. Como o índice remissivo de um livro, ordenado para busca rápida.
            </li>
            <li>
              <strong className="text-foreground">Index seek:</strong> com índice, o banco vai direto
              às linhas que correspondem (O(log n)).
            </li>
            <li>
              <strong className="text-foreground">Full table scan:</strong> sem índice, cada linha
              precisa ser verificada (O(n)).
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-sm">Tipos de índice</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Uma coluna:</strong> índice em uma única coluna.
              Ótimo para cláusulas WHERE nessa coluna.
            </li>
            <li>
              <strong className="text-foreground">Composto:</strong> índice em várias colunas. A ordem
              importa: (A, B) não é o mesmo que (B, A).
            </li>
            <li>
              <strong className="text-foreground">Único:</strong> garante unicidade e oferece buscas
              rápidas (e-mails, nomes de usuário).
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 font-semibold text-sm">Quando criar índices</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h5 className="mb-1 font-medium text-sm text-foreground">Bons candidatos</h5>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>Colunas usadas em cláusulas WHERE</li>
              <li>Colunas de JOIN (chaves estrangeiras)</li>
              <li>Colunas de ORDER BY / GROUP BY</li>
              <li>Alta cardinalidade (muitos valores distintos)</li>
            </ul>
          </div>
          <div>
            <h5 className="mb-1 font-medium text-sm text-foreground">Evite indexar</h5>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>Tabelas pequenas (menos de 1.000 linhas)</li>
              <li>Baixa cardinalidade (poucos valores distintos)</li>
              <li>Colunas atualizadas com muita frequência</li>
              <li>Colunas raramente usadas em consultas</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 font-semibold text-sm">As contrapartidas dos índices</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">Armazenamento:</strong> índices ocupam espaço extra
            em disco.
          </li>
          <li>
            <strong className="text-foreground">Desempenho de escrita:</strong> INSERTs e UPDATEs
            ficam mais lentos (o índice também precisa ser atualizado).
          </li>
          <li>
            <strong className="text-foreground">Manutenção:</strong> índices podem se fragmentar com
            o tempo.
          </li>
          <li>
            <strong className="text-foreground">Excesso de índices:</strong> índices demais podem
            atrapalhar mais do que ajudar.
          </li>
        </ul>
      </div>
    </>
  );
}

export default function DbIndexingSimulatorPage() {
  return (
    <SimulatorShell
      slug="db-indexing-simulator"
      educational={<DbIndexingEducational />}
      shareText="Conheça este simulador de índices de banco de dados! Aprenda como os índices aceleram consultas SQL."
    >
      <DbIndexingSimulator />
    </SimulatorShell>
  );
}
