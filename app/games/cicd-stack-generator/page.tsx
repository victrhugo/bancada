import type { Metadata } from 'next';
import CICDStackGenerator from '../../../components/games/cicd-stack-generator';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('cicd-stack-generator');
}

function CicdStackEducational() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">Como funciona</h3>
      <p className="mb-4 text-sm text-muted-foreground">O Gerador de Stack CI/CD combina ao acaso:</p>
      <ul className="mb-4 space-y-2 text-sm text-muted-foreground">
        <li>
          <strong className="text-foreground">Ferramentas de CI/CD:</strong> GitHub Actions, Jenkins,
          GitLab CI e outras.
        </li>
        <li>
          <strong className="text-foreground">Ferramentas de infraestrutura:</strong> Terraform,
          Ansible, Pulumi e outras.
        </li>
        <li>
          <strong className="text-foreground">Plataformas de nuvem:</strong> AWS, GCP ou até um
          Raspberry Pi.
        </li>
      </ul>
      <p className="mb-4 text-sm text-muted-foreground">
        Gire os rolos para tirar sua stack DevOps perfeita (ou perfeitamente amaldiçoada). Cada
        combinação recebe uma avaliação bem-humorada que você pode compartilhar com o time.
      </p>
      <p className="text-sm text-muted-foreground">
        É só um jogo, mas quem sabe você descobre a sua próxima stack favorita.
      </p>
    </>
  );
}

export default function CICDStackGeneratorPage() {
  return (
    <SimulatorShell
      slug="cicd-stack-generator"
      educational={<CicdStackEducational />}
      shareText="Experimente o Gerador de Stack CI/CD! Tire a sua combinação DevOps perfeita (ou perfeitamente amaldiçoada)!"
    >
      <CICDStackGenerator />
    </SimulatorShell>
  );
}
