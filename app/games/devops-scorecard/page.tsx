import type { Metadata } from 'next';
import DevOpsScorecard from '../../../components/games/devops-scorecard';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('devops-scorecard');
}

function DevOpsScorecardEducational() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">Sobre o Scorecard DevOps</h3>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-3 font-semibold text-sm">Como funciona</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Avalie suas habilidades em 8 áreas centrais de DevOps</li>
            <li>Cada habilidade recebe uma nota de 1 (iniciante) a 5 (especialista)</li>
            <li>Receba retorno imediato e recomendações personalizadas</li>
            <li>Compartilhe o resultado com o time ou nas redes sociais</li>
            <li>Acompanhe sua evolução ao longo do tempo</li>
            <li>Identifique áreas para o seu desenvolvimento profissional</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-sm">Categorias de habilidades</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Fundamentos:</strong> Linux, redes, scripts, Git.
            </li>
            <li>
              <strong className="text-foreground">Infraestrutura como código:</strong> Terraform,
              Ansible, Kubernetes.
            </li>
            <li>
              <strong className="text-foreground">Plataformas de nuvem:</strong> AWS, Azure, GCP,
              multicloud.
            </li>
            <li>
              <strong className="text-foreground">CI/CD:</strong> Jenkins, testes automatizados,
              deploys.
            </li>
            <li>
              <strong className="text-foreground">Monitoramento:</strong> Prometheus, ELK stack,
              observabilidade.
            </li>
            <li>
              <strong className="text-foreground">Segurança:</strong> gestão de segredos, conformidade.
            </li>
            <li>
              <strong className="text-foreground">Habilidades comportamentais:</strong> liderança,
              comunicação.
            </li>
            <li>
              <strong className="text-foreground">Avançado:</strong> SRE, chaos engineering, service
              mesh.
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 font-semibold text-sm">Dicas para a carreira</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>Use o scorecard para encontrar lacunas e montar um plano de estudos.</li>
          <li>Fortaleça os fundamentos antes de partir para áreas especializadas.</li>
          <li>Equilibre habilidades técnicas e comportamentais para crescer na carreira.</li>
          <li>Considere certificações do mercado para validar o seu conhecimento.</li>
          <li>Compartilhe o resultado para puxar conversas sobre desenvolvimento de carreira.</li>
        </ul>
      </div>
    </>
  );
}

export default function DevOpsScorecardPage() {
  return (
    <SimulatorShell
      slug="devops-scorecard"
      educational={<DevOpsScorecardEducational />}
      shareText="Acabei de descobrir o Scorecard DevOps! Ótimo para avaliar habilidades em DevOps e planejar a carreira."
    >
      <DevOpsScorecard />
    </SimulatorShell>
  );
}
