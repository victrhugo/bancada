import type { Metadata } from 'next';
import AwsVpcSimulator from '../../../components/games/aws-vpc-simulator';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('aws-vpc-simulator');
}

function AwsVpcEducational() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">Entendendo redes na AWS VPC</h3>
      <p className="mb-6 text-sm text-muted-foreground">
        Uma Virtual Private Cloud (VPC) é uma parte isolada da nuvem da AWS só sua, onde você cria
        recursos em uma rede virtual que você mesmo define. Pense nela como o seu próprio data center
        privado na nuvem, com controle total sobre a rede.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-3 font-semibold text-sm">Componentes principais</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">VPC (Virtual Private Cloud):</strong> a sua parte
              isolada da nuvem AWS, onde você cria recursos em uma rede virtual definida por você.
              Cada VPC tem a própria faixa de IPs (bloco CIDR), normalmente algo como 10.0.0.0/16.
            </li>
            <li>
              <strong className="text-foreground">Sub-rede pública:</strong> uma sub-rede com rota
              para o Internet Gateway. Os recursos aqui podem ter IP público e ser acessados
              diretamente da internet. Servidores web e load balancers costumam ficar aqui.
            </li>
            <li>
              <strong className="text-foreground">Sub-rede privada:</strong> uma sub-rede sem acesso
              direto à internet. Os recursos ficam protegidos da exposição pública. Bancos de dados,
              servidores de aplicação e cargas sensíveis costumam ficar aqui.
            </li>
            <li>
              <strong className="text-foreground">Internet Gateway:</strong> permite a comunicação
              entre a VPC e a internet. Ele escala horizontalmente, é redundante e altamente
              disponível. Você conecta um IGW por VPC.
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-sm">Conceitos de fluxo de tráfego</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">NAT Gateway:</strong> permite que instâncias em
              sub-redes privadas acessem a internet (para atualizações e chamadas de API) sem ficarem
              acessíveis de fora. O NAT Gateway precisa ficar em uma sub-rede pública e custa cerca de
              US$ 0,045/hora, mais a transferência de dados.
            </li>
            <li>
              <strong className="text-foreground">Tabela de rotas:</strong> contém as regras (rotas)
              que definem para onde o tráfego de rede vai. Sub-redes públicas mandam 0.0.0.0/0 para o
              IGW; sub-redes privadas mandam 0.0.0.0/0 para o NAT Gateway.
            </li>
            <li>
              <strong className="text-foreground">Bloco CIDR:</strong> a faixa de IPs da VPC e das
              sub-redes. A VPC pode usar 10.0.0.0/16 (65.536 IPs), com sub-redes como 10.0.1.0/24 (256
              IPs) para a pública e 10.0.2.0/24 para a privada.
            </li>
            <li>
              <strong className="text-foreground">Availability Zone:</strong> locais isolados dentro
              de uma região, para alta disponibilidade. A boa prática é distribuir as sub-redes em
              várias AZs (por exemplo, us-east-1a e us-east-1b) para tolerar falhas.
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 font-semibold text-sm">Padrões de arquitetura comuns</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">Servidor web público:</strong> IGW + sub-rede pública
            + EC2 com IP público. Uma configuração simples para sites estáticos ou APIs.
          </li>
          <li>
            <strong className="text-foreground">Aplicação em três camadas:</strong> sub-rede pública
            (ALB), depois sub-rede privada (servidores de aplicação), depois sub-rede privada (banco de
            dados).
          </li>
          <li>
            <strong className="text-foreground">Privada com NAT:</strong> instâncias EC2 privadas que
            precisam de saída para a internet (atualizações, APIs) por meio do NAT Gateway.
          </li>
        </ul>
      </div>

      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 font-semibold text-sm">Conceitos-chave</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">Pública vs privada:</strong> sub-redes públicas
            mandam 0.0.0.0/0 para o IGW; as privadas, para o NAT.
          </li>
          <li>
            <strong className="text-foreground">Custo do NAT Gateway:</strong> cerca de US$ 32/mês,
            mais a transferência de dados. Considere instâncias NAT em ambientes de desenvolvimento.
          </li>
          <li>
            <strong className="text-foreground">Camadas de segurança:</strong> Security Groups
            (stateful) e NACLs (stateless) protegem os recursos.
          </li>
          <li>
            <strong className="text-foreground">Alta disponibilidade:</strong> distribua em várias
            AZs, com sub-redes em cada uma.
          </li>
          <li>
            <strong className="text-foreground">VPC Peering:</strong> conecta VPCs para comunicação
            privada entre contas ou regiões.
          </li>
          <li>
            <strong className="text-foreground">Elastic IP:</strong> IP público fixo que pode ser
            associado a recursos em sub-redes públicas.
          </li>
        </ul>
      </div>

      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 font-semibold text-sm">Boas práticas de segurança</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">Privilégio mínimo:</strong> abra apenas as portas
            necessárias nos Security Groups.
          </li>
          <li>
            <strong className="text-foreground">Defesa em profundidade:</strong> use Security Groups
            e NACLs juntos.
          </li>
          <li>
            <strong className="text-foreground">Privado por padrão:</strong> coloque os recursos em
            sub-redes privadas, a menos que precisem de acesso público.
          </li>
          <li>
            <strong className="text-foreground">VPC Flow Logs:</strong> ative os flow logs para
            monitorar e investigar o tráfego.
          </li>
          <li>
            <strong className="text-foreground">Endpoints:</strong> use VPC endpoints para acessar
            serviços da AWS sem passar pela internet.
          </li>
        </ul>
      </div>
    </>
  );
}

export default function AwsVpcSimulatorPage() {
  return (
    <SimulatorShell
      slug="aws-vpc-simulator"
      educational={<AwsVpcEducational />}
      shareText="Conheça este simulador de redes AWS VPC! Aprenda como funcionam VPCs, sub-redes e NAT Gateways."
    >
      <AwsVpcSimulator />
    </SimulatorShell>
  );
}
