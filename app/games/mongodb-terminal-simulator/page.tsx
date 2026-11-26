import type { Metadata } from 'next';
import MongodbTerminalSimulator from '@/components/games/mongodb-terminal-simulator';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('mongodb-terminal-simulator');
}

const seoLearningPoints = [
  'Ler documentos com find() e filtrá-los com um documento de consulta',
  'Retornar só os campos necessários com uma projeção',
  'Comparar valores com $lt, $gt, $gte, $lte e buscar em um conjunto com $in',
  'Moldar um cursor com sort, skip e limit para ordenar e paginar',
  'Contar resultados com countDocuments sem trazer os documentos',
  'Gravar dados com insertOne, updateOne e deleteMany e ler o retorno',
  'Resumir documentos com um pipeline de agregação: $match, $group e $sort',
  'Testar-se no modo Desafio escrevendo consultas a partir de um enunciado em português',
];

function MongodbEducational() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">Sobre este simulador de MongoDB</h3>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-3 text-sm font-semibold">O que você vai aprender</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Como o find() lê documentos e como um documento de consulta os filtra</li>
            <li>Como as projeções retornam só os campos desejados, e como o _id se comporta</li>
            <li>Como operadores como $lt, $gt, $in, $and e $or expressam condições</li>
            <li>Como sort, skip e limit ordenam e paginam um cursor</li>
            <li>Como o countDocuments responde &quot;quantos&quot; sem retornar os documentos</li>
            <li>Como insertOne, updateOne e deleteMany alteram dados e o que retornam</li>
            <li>Como o pipeline de agregação agrupa e resume com $match, $group e $sort</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Operações principais</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Ler:</strong> find, findOne, documentos de
              consulta, projeções, campos com notação de ponto
            </li>
            <li>
              <strong className="text-foreground">Filtrar:</strong> $eq, $ne, $lt, $gt, $gte, $lte,
              $in, $nin, $exists, $and, $or
            </li>
            <li>
              <strong className="text-foreground">Moldar:</strong> sort, skip, limit, countDocuments
            </li>
            <li>
              <strong className="text-foreground">Agregar:</strong> $match, $group com $sum e $avg,
              $sort, $project, $count
            </li>
            <li>
              <strong className="text-foreground">Escrever:</strong> insertOne, insertMany, updateOne,
              updateMany, deleteOne, deleteMany
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Como o playground executa suas consultas</h4>
        <p className="text-sm text-muted-foreground">
          Cada comando roda ao vivo no seu navegador sobre três pequenas coleções (customers,
          products, orders), avaliado por um motor leve de consulta e agregação. Nada é enviado a um
          servidor, então você pode experimentar à vontade. Os dados espelham as tabelas do simulador
          de SQL, para você comparar como os mesmos registros ficam como documentos e como linhas.
        </p>
      </div>

      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Pratique em um MongoDB real</h4>
        <p className="text-sm text-muted-foreground">
          O simulador constrói intuição rápido, mas é rodando os comandos em um banco de verdade que
          eles ficam na memória. Você pode criar um cluster gratuito no{' '}
          <a
            href="https://www.mongodb.com/products/platform/atlas-database"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline underline-offset-2"
          >
            MongoDB Atlas
          </a>{' '}
          ou usar um MongoDB gerenciado na{' '}
          <a
            href="https://www.digitalocean.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline underline-offset-2"
          >
            DigitalOcean
          </a>{' '}
          e colar os mesmos comandos no <code>mongosh</code> para rodá-los de verdade.
        </p>
      </div>

      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Prefere SQL ou quer comparar?</h4>
        <p className="text-sm text-muted-foreground">
          O{' '}
          <a
            href="/games/sql-terminal-simulator"
            className="font-medium text-primary underline underline-offset-2"
          >
            Simulador de Terminal SQL
          </a>{' '}
          usa os mesmos dados de e-commerce em forma de tabelas, para você ver a diferença exata entre
          um find() em documentos e um SELECT em SQL. O simulador de{' '}
          <a
            href="/games/dbms-simulator"
            className="font-medium text-primary underline underline-offset-2"
          >
            Sistemas de Gerenciamento de Banco de Dados
          </a>{' '}
          explica quando um banco de documentos é a ferramenta certa.
        </p>
      </div>

      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Por que aprender MongoDB assim?</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>Consultas em documentos fazem sentido mais rápido quando você muda um filtro e vê os documentos mudarem.</li>
          <li>find(), projeções e o pipeline de agregação cobrem a maior parte do trabalho diário com MongoDB.</li>
          <li>Ler resultados reais constrói o instinto que você precisa para código de aplicação, debugging e entrevistas.</li>
        </ul>
      </div>
    </>
  );
}

export default function MongodbTerminalSimulatorPage() {
  return (
    <SimulatorShell
      slug="mongodb-terminal-simulator"
      fallbackTitle="Simulador de Terminal MongoDB"
      fallbackDescription="Pratique consultas MongoDB em um terminal interativo no navegador. Aprenda find, projeções, operadores, sort, skip, limit, countDocuments, escritas e o pipeline de agregação em um pequeno conjunto de dados de e-commerce."
      educational={<MongodbEducational />}
      seoLearningPoints={seoLearningPoints}
      shareText="Pratique MongoDB no navegador com este simulador interativo, do find() e projeções ao pipeline de agregação."
    >
      <MongodbTerminalSimulator />
    </SimulatorShell>
  );
}
