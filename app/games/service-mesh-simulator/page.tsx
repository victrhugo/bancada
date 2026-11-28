import type { Metadata } from 'next';
import ServiceMeshSimulator from '../../../components/games/service-mesh-simulator';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('service-mesh-simulator');
}

function ServiceMeshEducational() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">Entendendo o service mesh</h3>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-3 font-semibold text-sm">Conceitos principais</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Sidecar proxy:</strong> um proxy (como o Envoy)
              publicado ao lado de cada serviço para cuidar de todo o tráfego de rede.
            </li>
            <li>
              <strong className="text-foreground">Control plane:</strong> gerencia e configura os
              sidecar proxies (por exemplo, o Istiod ou o controller do Linkerd).
            </li>
            <li>
              <strong className="text-foreground">Data plane:</strong> o conjunto de sidecar proxies
              que de fato lida com o tráfego.
            </li>
            <li>
              <strong className="text-foreground">mTLS:</strong> o TLS mútuo criptografa a comunicação
              entre serviços e verifica as identidades.
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-sm">Gerenciamento de tráfego</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Divisão de tráfego:</strong> manda uma porcentagem
              do tráfego para versões diferentes (deploys canary).
            </li>
            <li>
              <strong className="text-foreground">Retries:</strong> repete automaticamente requisições
              que falharam, com backoff exponencial.
            </li>
            <li>
              <strong className="text-foreground">Circuit breaker:</strong> evita falhas em cascata
              interrompendo requisições para serviços com problema.
            </li>
            <li>
              <strong className="text-foreground">Timeouts:</strong> definem o tempo máximo de espera
              para que requisições não fiquem penduradas.
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 font-semibold text-sm">Principais benefícios</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">Segurança:</strong> criptografia mTLS automática, sem
            mudar o código.
          </li>
          <li>
            <strong className="text-foreground">Observabilidade:</strong> métricas, logs e traces
            detalhados de toda a comunicação entre serviços.
          </li>
          <li>
            <strong className="text-foreground">Resiliência:</strong> retries, circuit breakers e
            timeouts prontos.
          </li>
          <li>
            <strong className="text-foreground">Controle de tráfego:</strong> deploys canary, testes
            A/B e espelhamento de tráfego.
          </li>
        </ul>
      </div>

      <div className="mt-6">
        <h4 className="mb-3 font-semibold text-sm">Service meshes populares</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md border bg-background p-4">
            <h5 className="mb-2 font-semibold text-sm">Istio</h5>
            <p className="text-sm text-muted-foreground">
              Usa proxies Envoy e um control plane completo (Istiod), com amplos recursos de
              gerenciamento de tráfego e segurança. É o mais adotado.
            </p>
          </div>
          <div className="rounded-md border bg-background p-4">
            <h5 className="mb-2 font-semibold text-sm">Linkerd</h5>
            <p className="text-sm text-muted-foreground">
              Bem leve, usa proxies próprios escritos em Rust, consome poucos recursos, tem
              configuração mais simples e é um projeto graduado da CNCF.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ServiceMeshSimulatorPage() {
  return (
    <SimulatorShell slug="service-mesh-simulator" educational={<ServiceMeshEducational />}>
      <ServiceMeshSimulator />
    </SimulatorShell>
  );
}
