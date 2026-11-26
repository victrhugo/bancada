import type { Metadata } from 'next';
import SqlTerminalSimulator from '@/components/games/sql-terminal-simulator';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('sql-terminal-simulator');
}

const seoLearningPoints = [
  'Escrever consultas SELECT e projetar só as colunas necessárias',
  'Filtrar linhas com WHERE usando operadores de comparação e LIKE',
  'Ordenar e limitar resultados com ORDER BY, DESC e LIMIT',
  'Resumir dados com count, sum, avg, min, max, GROUP BY e HAVING',
  'Combinar tabelas com JOINs e manter linhas sem correspondência com LEFT JOIN',
  'Alterar dados com INSERT, UPDATE e DELETE e ler os command tags que eles retornam',
  'Comparar linhas com uma subconsulta e nomear subconsultas com WITH (CTEs)',
  'Ranquear linhas dentro de grupos usando window functions',
  'Testar-se no modo Desafio escrevendo consultas a partir de um enunciado em português',
];

function SqlTerminalEducational() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">Sobre este simulador de SQL</h3>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-3 text-sm font-semibold">O que você vai aprender</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Como o SELECT lê linhas e como projetar colunas específicas</li>
            <li>Como o WHERE filtra linhas com operadores como =, &lt;, &gt;, &lt;&gt; e LIKE</li>
            <li>Como ORDER BY, ASC/DESC e LIMIT moldam o resultado</li>
            <li>Como DISTINCT e as agregações count, sum, avg, min e max resumem dados</li>
            <li>Como o GROUP BY agrupa linhas e o HAVING filtra esses grupos</li>
            <li>Como JOINs, LEFT JOINs, subconsultas e window functions trabalham entre tabelas</li>
            <li>Como INSERT, UPDATE e DELETE alteram dados, e como CTEs (WITH) nomeiam uma subconsulta</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Comandos principais</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Ler:</strong> SELECT, SELECT DISTINCT, projeção de
              colunas, prefixos tabela.coluna, aliases com AS
            </li>
            <li>
              <strong className="text-foreground">Filtrar:</strong> WHERE com AND/OR, operadores de
              comparação, LIKE e literais numéricos vs texto
            </li>
            <li>
              <strong className="text-foreground">Agregar:</strong> count, sum, avg, min, max, round,
              GROUP BY, HAVING
            </li>
            <li>
              <strong className="text-foreground">Moldar:</strong> ORDER BY, LIMIT
            </li>
            <li>
              <strong className="text-foreground">Relacionar:</strong> JOIN, LEFT JOIN, subconsultas,
              WITH (CTEs) e a window function rank()
            </li>
            <li>
              <strong className="text-foreground">Escrever:</strong> INSERT, UPDATE, DELETE e seus
              command tags no psql
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Como o playground executa suas consultas</h4>
        <p className="text-sm text-muted-foreground">
          Consultas SELECT em uma única tabela são avaliadas ao vivo no seu navegador, em um pequeno
          schema de e-commerce (customers, products, orders, order_items). As lições guiadas de join,
          subconsulta e window functions retornam saídas capturadas de uma instância real do
          PostgreSQL, então os resultados batem com o que o Postgres de fato retorna. Nada é enviado a
          um servidor, então você pode experimentar à vontade.
        </p>
      </div>

      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Pratique em um Postgres real</h4>
        <p className="text-sm text-muted-foreground">
          O simulador é ótimo para construir intuição, mas é rodando essas consultas em um banco de
          verdade que elas ficam na memória. Você pode{' '}
          <a
            href="https://neon.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline underline-offset-2"
          >
            criar um Postgres gratuito em segundos no Neon
          </a>{' '}
          e colar as mesmas consultas para rodá-las de verdade, ou{' '}
          <a
            href="https://www.digitalocean.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline underline-offset-2"
          >
            usar um PostgreSQL gerenciado na DigitalOcean
          </a>
          . Carregue uma ou duas tabelas e refaça as lições daqui com os seus próprios dados.
        </p>
      </div>
      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Por que aprender SQL assim?</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>SQL faz sentido mais rápido quando você muda a consulta e vê as linhas mudarem na hora.</li>
          <li>O mesmo punhado de cláusulas (SELECT, WHERE, GROUP BY, JOIN) cobre a maioria das consultas do dia a dia.</li>
          <li>Ler resultados reais constrói o instinto que você precisa para relatórios, debugging e entrevistas.</li>
        </ul>
      </div>
    </>
  );
}

export default function SqlTerminalSimulatorPage() {
  return (
    <SimulatorShell
      slug="sql-terminal-simulator"
      fallbackTitle="Simulador de Terminal SQL"
      fallbackDescription="Pratique SQL em um terminal interativo no navegador. Aprenda SELECT, WHERE, ORDER BY, DISTINCT, agregações, GROUP BY, HAVING, JOINs, subconsultas e window functions em um pequeno schema de e-commerce."
      educational={<SqlTerminalEducational />}
      seoLearningPoints={seoLearningPoints}
      shareText="Pratique SQL no navegador com este simulador interativo de terminal SQL, do SELECT aos JOINs e window functions."
    >
      <SqlTerminalSimulator />
    </SimulatorShell>
  );
}
