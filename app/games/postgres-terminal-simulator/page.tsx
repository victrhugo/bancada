import type { Metadata } from 'next';
import PostgresTerminalSimulator from '@/components/games/postgres-terminal-simulator';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('postgres-terminal-simulator');
}

const seoLearningPoints = [
  'Explorar um banco com meta-comandos do psql como \\dt, \\d, \\di e \\l',
  'Ler um plano real de EXPLAIN e reconhecer um sequential scan',
  'Criar um índice B-tree e ver o plano mudar para bitmap index scan',
  'Comparar o custo estimado (de 3971 para 145) e usar EXPLAIN ANALYZE para ver as linhas reais',
  'Envolver alterações em BEGIN e desfazê-las com segurança usando ROLLBACK',
  'Entender por que o prompt muda para shop=*# dentro de uma transação aberta',
  'Diferenciar meta-comandos do cliente psql do SQL enviado ao servidor Postgres',
];

function PostgresTerminalEducational() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">Sobre este simulador de PostgreSQL</h3>
      <p className="mb-6 max-w-3xl text-sm text-muted-foreground">
        Este laboratório complementa o Simulador de Terminal SQL, mas ensina a{' '}
        <em>ferramenta e o motor</em> em vez da linguagem SQL. Você pratica o cliente psql e o
        comportamento do planejador e do armazenamento do Postgres: meta-comandos, EXPLAIN, índices e
        transações.
      </p>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-3 text-sm font-semibold">O que você vai aprender</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Como os meta-comandos do psql (\dt, \d, \di, \l, \conninfo) inspecionam um banco</li>
            <li>Como o EXPLAIN mostra o plano que o planejador executaria, sem executá-lo</li>
            <li>Por que um filtro sem índice vira um sequential scan completo</li>
            <li>Como o CREATE INDEX transforma esse scan em bitmap index scan e reduz o custo</li>
            <li>Como o EXPLAIN ANALYZE mostra as linhas reais e onde o tempo é gasto de verdade</li>
            <li>Como BEGIN, COMMIT e ROLLBACK tornam as alterações seguras de desfazer</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Comandos principais do psql</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Explorar:</strong> \dt, \d NOME, \di, \l, \conninfo,
              \x, \timing, \?
            </li>
            <li>
              <strong className="text-foreground">Consultar:</strong> SELECT count(*) FROM orders;,
              SELECT * FROM customers;
            </li>
            <li>
              <strong className="text-foreground">Planejar:</strong> EXPLAIN e EXPLAIN ANALYZE em uma
              consulta filtrada
            </li>
            <li>
              <strong className="text-foreground">Otimizar:</strong> CREATE INDEX na coluna usada no
              filtro
            </li>
            <li>
              <strong className="text-foreground">Transações:</strong> BEGIN, DELETE, ROLLBACK, COMMIT
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Como este laboratório funciona</h4>
        <p className="text-sm text-muted-foreground">
          Nada se conecta a um servidor real. O laboratório simula um pequeno banco de e-commerce
          (customers, products, orders, order_items) e uma tabela big_events com 200.000 linhas. Cada
          listagem de meta-comando, plano de EXPLAIN e tabela no formato do psql foi reproduzida a
          partir de saídas reais do PostgreSQL. O custo caindo de 3971 para 145 depois que você cria o
          índice é exatamente o que o Postgres informa, então a intuição que você constrói aqui vale
          para um banco de verdade.
        </p>
      </div>

      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Pratique em um Postgres real</h4>
        <p className="text-sm text-muted-foreground">
          O simulador constrói intuição, mas é rodando esses comandos em um banco de verdade que eles
          ficam na memória. Você pode{' '}
          <a
            href="https://neon.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline underline-offset-2"
          >
            criar um Postgres gratuito em segundos no Neon
          </a>{' '}
          e rodar \dt, EXPLAIN e transações de verdade, ou{' '}
          <a
            href="https://www.digitalocean.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline underline-offset-2"
          >
            usar um PostgreSQL gerenciado na DigitalOcean
          </a>
          . Carregue uma tabela, rode EXPLAIN antes e depois do CREATE INDEX e compare os planos com o
          que você viu aqui.
        </p>
      </div>

      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Por que aprender Postgres assim?</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>O EXPLAIN deixa de assustar depois que você vê um seq scan virar index scan.</li>
          <li>A maior parte do trabalho diário com banco é um punhado de meta-comandos e leitura de planos.</li>
          <li>Saber que o ROLLBACK desfaz uma transação aberta é o que torna seguro experimentar.</li>
        </ul>
      </div>
      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Aprenda também o lado do SQL</h4>
        <p className="text-sm text-muted-foreground">
          Este laboratório é sobre a ferramenta psql e o planejador de consultas. Para praticar a
          escrita das consultas em si, experimente o{' '}
          <a
            href="/games/sql-terminal-simulator"
            className="font-medium text-primary underline underline-offset-2"
          >
            Simulador de Terminal SQL
          </a>
          .
        </p>
      </div>
    </>
  );
}

export default function PostgresTerminalSimulatorPage() {
  return (
    <SimulatorShell
      slug="postgres-terminal-simulator"
      fallbackTitle="Simulador de Terminal PostgreSQL"
      fallbackDescription="Pratique o psql e o motor do Postgres em um terminal interativo no navegador. Aprenda meta-comandos, planos de EXPLAIN, índices e transações em um pequeno banco de e-commerce com saídas verificadas no PostgreSQL."
      educational={<PostgresTerminalEducational />}
      seoLearningPoints={seoLearningPoints}
      shareText="Pratique psql, EXPLAIN, índices e transações no navegador com este simulador interativo de terminal PostgreSQL."
    >
      <PostgresTerminalSimulator />
    </SimulatorShell>
  );
}
