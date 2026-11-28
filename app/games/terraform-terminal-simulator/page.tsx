import type { Metadata } from 'next';
import TerraformTerminalSimulator from '@/components/games/terraform-terminal-simulator';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('terraform-terminal-simulator');
}

function TerraformEducational() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">Terraform básico, explicado</h3>
      <p className="mb-6 max-w-3xl text-sm text-muted-foreground">
        Terraform é uma ferramenta de infraestrutura como código (IaC). Em vez de clicar pelo console
        da nuvem, você descreve a infraestrutura que quer em arquivos de configuração, e o Terraform
        descobre como criar, alterar ou destruir recursos para chegar lá. Este laboratório ensina esse
        ciclo na prática. Abaixo está o contexto para acompanhar.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-3 text-sm font-semibold">As peças básicas (HCL)</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">provider:</strong> o plugin que o Terraform usa para
              falar com uma plataforma, como AWS, Azure ou GCP.
            </li>
            <li>
              <strong className="text-foreground">resource:</strong> uma única peça de infraestrutura,
              como uma instância EC2 ou um bucket S3.
            </li>
            <li>
              <strong className="text-foreground">variable:</strong> uma entrada que você muda sem
              editar a configuração principal, como a região ou o tamanho da instância.
            </li>
            <li>
              <strong className="text-foreground">output:</strong> um valor que o Terraform expõe
              depois do apply, como o IP de uma instância, para você ou outras ferramentas lerem.
            </li>
            <li>
              <strong className="text-foreground">state:</strong> o registro do Terraform sobre o que
              ele criou, para saber o que mudar da próxima vez.
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">O fluxo principal</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">terraform init:</strong> baixa os providers e prepara
              o diretório. Rode primeiro.
            </li>
            <li>
              <strong className="text-foreground">terraform validate:</strong> confere se a
              configuração é sintaticamente válida.
            </li>
            <li>
              <strong className="text-foreground">terraform plan:</strong> mostra uma prévia das
              mudanças. <span className="font-mono">+</span> cria, <span className="font-mono">~</span>{' '}
              altera, <span className="font-mono">-</span> destrói.
            </li>
            <li>
              <strong className="text-foreground">terraform apply:</strong> aplica as mudanças e grava
              no state.
            </li>
            <li>
              <strong className="text-foreground">terraform destroy:</strong> remove tudo para parar de
              gerar custo.
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Experimente no laboratório</h4>
        <p className="text-sm text-muted-foreground">
          Rode <code className="text-primary">terraform init</code>, depois{' '}
          <code className="text-primary">plan</code> e <code className="text-primary">apply</code> para
          criar os recursos de exemplo. Em seguida, coloque o painel de configuração no modo{' '}
          <span className="font-mono">editar</span>, mude o{' '}
          <code className="text-primary">instance_type</code> em{' '}
          <span className="font-mono">variables.tf</span> e rode{' '}
          <code className="text-primary">terraform plan</code> de novo. O Terraform mostra um{' '}
          <span className="font-mono">~</span>, uma atualização no lugar, porque sua configuração não
          bate mais com o state. Apague um bloco de resource e o plan mostra um{' '}
          <span className="font-mono">-</span>, uma destruição. Essa diferença entre o desejado e o
          real é o coração do funcionamento do Terraform.
        </p>
      </div>

      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Armadilhas comuns de quem está começando</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>Sempre leia o plan antes do apply. O plan é a sua verificação de segurança.</li>
          <li>O state é a fonte da verdade. Nunca edite à mão e, em times, guarde em um backend remoto.</li>
          <li>Algumas mudanças atualizam no lugar; outras forçam a substituição (aparece como -/+ em um plan real).</li>
          <li>Não deixe segredos em texto puro na configuração nem no state. Use variáveis e um gerenciador de segredos.</li>
          <li>Rode terraform destroy em ambientes descartáveis para não pagar por recursos parados.</li>
        </ul>
      </div>

      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Seguro para o navegador</h4>
        <p className="text-sm text-muted-foreground">
          Este laboratório não cria infraestrutura de verdade. Ele simula uma pequena configuração da
          AWS (um security group, uma instância EC2 e um bucket S3) no navegador, para você ler e
          editar o HCL, rodar o fluxo completo e ver o state mudar sem conta na AWS e sem custo.
        </p>
      </div>
    </>
  );
}

export default function TerraformTerminalSimulatorPage() {
  return (
    <SimulatorShell
      slug="terraform-terminal-simulator"
      fallbackTitle="Simulador de Terraform Básico"
      fallbackDescription="Aprenda o básico de Terraform em um laboratório interativo no navegador. Leia e edite a configuração HCL, rode init, plan, apply e destroy e veja o state reagir às suas mudanças. Sem conta na AWS."
      educational={<TerraformEducational />}
      shareText="Aprenda Terraform no navegador: edite o HCL, rode plan e apply e veja o state mudar neste laboratório interativo."
      seoLearningPoints={[
        'O que é infraestrutura como código (IaC) e por que times usam Terraform',
        'As peças do HCL: provider, resource, variable, output e state',
        'O fluxo principal do Terraform: init, validate, plan, apply e destroy',
        'Como ler um plan: + cria, ~ altera no lugar e - destrói',
        'Como editar a configuração muda o plan em relação ao state existente',
        'Por que destruir ambientes descartáveis para controlar custos',
      ]}
    >
      <TerraformTerminalSimulator />
    </SimulatorShell>
  );
}
