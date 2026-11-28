import type { Metadata } from 'next';
import TcpVsUdpSimulator from '@/components/games/tcp-vs-udp';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('tcp-vs-udp');
}

function TcpVsUdpEducational() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">Entendendo TCP vs UDP</h3>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-3 font-semibold text-sm">TCP (Transmission Control Protocol)</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Orientado a conexão, com handshake de 3 vias</li>
            <li>Garante a entrega e a ordem dos dados</li>
            <li>Retransmite automaticamente pacotes perdidos</li>
            <li>Controle de fluxo e de congestionamento</li>
            <li>Mais overhead, mas confiável</li>
            <li>Ideal para: HTTP, FTP, e-mail, transferência de arquivos</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-sm">UDP (User Datagram Protocol)</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Sem conexão. Não precisa de handshake.</li>
            <li>Sem garantia de entrega nem de ordem</li>
            <li>Sem retransmissão: envia e esquece.</li>
            <li>Overhead mínimo, muito rápido</li>
            <li>Menor latência e maior throughput</li>
            <li>Ideal para: streaming, jogos, VoIP, DNS</li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 font-semibold text-sm">Quando usar cada protocolo</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">Use TCP</strong> quando a integridade dos dados é
            crítica (bancos, downloads de arquivos, páginas web).
          </li>
          <li>
            <strong className="text-foreground">Use UDP</strong> quando a velocidade importa mais que
            a confiabilidade (vídeo ao vivo, jogos multiplayer).
          </li>
          <li>Algumas aplicações usam os dois: consultas DNS via UDP, transferências de zona via TCP.</li>
          <li>Protocolos modernos como o QUIC combinam vantagens dos dois (HTTP/3).</li>
        </ul>
      </div>
    </>
  );
}

export default function TcpVsUdpPage() {
  return (
    <SimulatorShell slug="tcp-vs-udp" educational={<TcpVsUdpEducational />}>
      <TcpVsUdpSimulator />
    </SimulatorShell>
  );
}
