import type { Metadata } from 'next';
import DnsSimulator from '../../../components/games/dns-simulator';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('dns-simulator');
}

function DnsEducational() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">Entendendo a resolução DNS</h3>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-3 font-semibold text-sm">Hierarquia do DNS</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Servidores raiz (.):</strong> o topo da hierarquia do
              DNS. Treze grupos de servidores raiz pelo mundo direcionam as consultas para os
              servidores de TLD.
            </li>
            <li>
              <strong className="text-foreground">Servidores de TLD (.com, .org):</strong> gerenciam
              os domínios de topo e apontam para os nameservers autoritativos.
            </li>
            <li>
              <strong className="text-foreground">Servidores autoritativos:</strong> guardam os
              registros DNS de fato de cada domínio.
            </li>
            <li>
              <strong className="text-foreground">Resolvers recursivos:</strong> o seu provedor de
              internet ou de DNS (como 1.1.1.1 ou 8.8.8.8), que faz o trabalho da consulta.
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-sm">Tipos de registro DNS</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Registro A:</strong> liga o domínio a um endereço
              IPv4 (por exemplo, 192.168.1.1).
            </li>
            <li>
              <strong className="text-foreground">Registro AAAA:</strong> liga o domínio a um endereço
              IPv6 (por exemplo, 2001:db8::1).
            </li>
            <li>
              <strong className="text-foreground">Registro CNAME:</strong> um apelido que aponta para
              outro nome de domínio.
            </li>
            <li>
              <strong className="text-foreground">Registro MX:</strong> o servidor de e-mail do
              domínio.
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 font-semibold text-sm">Conceitos-chave</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">TTL (Time To Live):</strong> por quanto tempo um
            registro DNS pode ficar em cache antes de ser atualizado.
          </li>
          <li>
            <strong className="text-foreground">Consulta recursiva:</strong> o resolver faz todo o
            trabalho e devolve a resposta final.
          </li>
          <li>
            <strong className="text-foreground">Consulta iterativa:</strong> cada servidor devolve uma
            indicação, e o cliente segue a cadeia.
          </li>
          <li>
            <strong className="text-foreground">Cache de DNS:</strong> acontece no navegador, no
            sistema operacional e no resolver, para acelerar as consultas.
          </li>
        </ul>
      </div>
    </>
  );
}

export default function DnsSimulatorPage() {
  return (
    <SimulatorShell slug="dns-simulator" educational={<DnsEducational />}>
      <DnsSimulator />
    </SimulatorShell>
  );
}
