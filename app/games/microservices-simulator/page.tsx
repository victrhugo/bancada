import type { Metadata } from 'next';
import MicroservicesSimulator from '../../../components/games/microservices-simulator';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('microservices-simulator');
}

function MicroservicesEducational() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">Entendendo a arquitetura de microsserviços</h3>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-3 font-semibold text-sm">O que você vai aprender</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Padrões de arquitetura: microsserviços vs monolito</li>
            <li>Comunicação entre serviços (síncrona vs assíncrona)</li>
            <li>Escala independente de cada serviço</li>
            <li>Tratamento de falhas e padrões de resiliência</li>
            <li>Service discovery e API gateways</li>
            <li>Os desafios dos sistemas distribuídos</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-sm">Principais benefícios</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Deploy independente:</strong> publique cada serviço
              separadamente.
            </li>
            <li>
              <strong className="text-foreground">Diversidade de tecnologia:</strong> use a melhor
              ferramenta para cada serviço.
            </li>
            <li>
              <strong className="text-foreground">Isolamento de falhas:</strong> uma falha não se
              espalha em cascata.
            </li>
            <li>
              <strong className="text-foreground">Escala independente:</strong> escale cada serviço
              conforme a demanda.
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-md border border-primary/20 bg-primary/5 p-4">
          <h4 className="mb-2 font-semibold text-sm">Quando usar microsserviços</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>Aplicações grandes e complexas</li>
            <li>Times de desenvolvimento grandes (mais de 50 pessoas)</li>
            <li>Requisitos que mudam rapidamente</li>
            <li>Necessidade de deploys independentes</li>
            <li>Necessidades de escala diferentes por componente</li>
          </ul>
        </div>
        <div className="rounded-md border border-primary/20 bg-primary/5 p-4">
          <h4 className="mb-2 font-semibold text-sm">Quando evitar</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>Aplicações pequenas</li>
            <li>Times pequenos (menos de 10 pessoas)</li>
            <li>Aplicações CRUD simples</li>
            <li>Funcionalidades muito acopladas entre si</li>
            <li>Quando a latência de rede é crítica</li>
          </ul>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 font-semibold text-sm">Dicas</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>Comece com um monolito e divida quando for necessário.</li>
          <li>Use API gateways para centralizar roteamento e autenticação.</li>
          <li>Implemente circuit breakers para evitar falhas em cascata.</li>
          <li>Monitore traces distribuídos por todos os serviços.</li>
          <li>Use filas de mensagens para comunicação assíncrona.</li>
          <li>Cada serviço deve ter o próprio banco de dados.</li>
        </ul>
      </div>

      <div className="mt-6">
        <h4 className="mb-3 font-semibold text-sm">Exemplos reais</h4>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-md border bg-background p-3 text-sm">
            <strong className="text-foreground">Netflix:</strong>
            <p className="mt-1 text-muted-foreground">Centenas de microsserviços atendendo bilhões de requisições.</p>
          </div>
          <div className="rounded-md border bg-background p-3 text-sm">
            <strong className="text-foreground">Amazon:</strong>
            <p className="mt-1 text-muted-foreground">Dividiu o monolito em microsserviços no início dos anos 2000.</p>
          </div>
          <div className="rounded-md border bg-background p-3 text-sm">
            <strong className="text-foreground">Uber:</strong>
            <p className="mt-1 text-muted-foreground">Migrou de um monolito para milhares de microsserviços.</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default function MicroservicesSimulatorPage() {
  return (
    <SimulatorShell
      slug="microservices-simulator"
      educational={<MicroservicesEducational />}
      shareText="Conheça este simulador de arquitetura de microsserviços! Ótimo para aprender sistemas distribuídos."
    >
      <MicroservicesSimulator />
    </SimulatorShell>
  );
}
