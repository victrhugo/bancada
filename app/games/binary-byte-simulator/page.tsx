import type { Metadata } from 'next';
import BinaryByteSimulator from '@/components/games/binary-byte-simulator';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('binary-byte-simulator');
}

const seoLearningPoints = [
  'Como o binário funciona: cada bit é uma posição com um valor, e o número é a soma das posições acesas',
  'Por que um byte vai de 0 a 255, e por que canais de cor e octetos de IPv4 também param em 255',
  'Como o "vai um" percorre os bits quando você conta para cima',
  'Como os números do chmod funcionam: o que 755 e 644 significam e como viram rwxr-xr-x',
  'Por que uma chave privada SSH precisa de 600, e por que 777 quase nunca é a resposta certa',
  'Como uma máscara de sub-rede é feita de bits, por que ela precisa ser uma sequência contínua de 1s e de onde vêm /24 e /26',
  'Por que deslocar os bits para a esquerda dobra o número até o bit mais alto cair para fora',
];

function BinaryEducational() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">Sobre este simulador binário</h3>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-3 text-sm font-semibold">O que você vai aprender</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>O que bit e byte realmente são, virando os bits você mesmo</li>
            <li>Como ler qualquer número binário sem fazer contas de cabeça</li>
            <li>De onde vêm os números do chmod e como montar um do zero</li>
            <li>Por que uma máscara de sub-rede é só uma sequência de 1s, e o que o número depois da barra conta</li>
            <li>Por que contar em binário faz o "vai um" percorrer os bits</li>
            <li>O que um deslocamento de bits faz com um valor, e por que ele é usado como multiplicação e divisão rápidas</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Os três modos</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Byte:</strong> oito bits, com o decimal, o hexadecimal
              e a soma das posições atualizando enquanto você vira os bits
            </li>
            <li>
              <strong className="text-foreground">Permissões:</strong> nove bits para dono, grupo e
              outros, mostrando o octal, a string do <code>ls -l</code> e o comando chmod
            </li>
            <li>
              <strong className="text-foreground">Máscara de sub-rede:</strong> trinta e dois bits em
              quatro octetos, mostrando a máscara com pontos, o tamanho do prefixo e quantos hosts são
              utilizáveis
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Comece pelo botão Contar</h4>
        <p className="text-sm text-muted-foreground">
          A coisa mais útil da página é o botão <strong>Contar</strong>. Um bloco só mostra 0 ou 1;
          quando um bloco que já está em 1 precisa crescer, ele volta para 0 e passa o &quot;vai um&quot;
          para o vizinho. Observe esse &quot;vai um&quot; andar a partir da direita e todo o resto do
          binário fica mais fácil: por que 8 é um único bit aceso, por que 7 acende todos os bits abaixo
          dele e por que somar 1 a 255 faz o byte voltar a 0.
        </p>
      </div>

      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Por que as permissões são três grupos de três</h4>
        <p className="text-sm text-muted-foreground">
          Um conjunto de permissões tem nove bits: leitura, escrita e execução, para o dono, para o
          grupo e para todos os outros. Três bits guardam um valor de 0 a 7, que é exatamente um dígito
          octal, e é só por isso que os números do chmod são escritos em octal e não em decimal. Monte
          755 no simulador e o padrão deixa de ser algo para decorar: o dono tem os três bits acesos, e
          os outros dois grupos têm leitura e execução, mas não escrita.
        </p>
      </div>

      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Por que uma máscara de sub-rede não pode ter buracos</h4>
        <p className="text-sm text-muted-foreground">
          Uma máscara divide o endereço em uma parte de rede e uma parte de host, e essa divisão
          acontece em um único ponto, então os 1s precisam vir seguidos a partir da esquerda. Tente
          virar um bit no meio da sequência: o simulador vai dizer que a máscara é inválida, como o seu
          roteador diria. É por essa regra que uma máscara pode ser escrita como um único número,{' '}
          <code>/24</code>, em vez de um padrão, e por que pegar mais um bit emprestado divide o
          espaço de endereços pela metade a cada vez.
        </p>
      </div>

      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">De onde vem essa ideia</h4>
        <p className="text-sm text-muted-foreground">
          Museus de computação guardam versões de madeira feitas à mão deste simulador: oito blocos em
          um trilho, virados com os dedos, ao lado das máquinas a válvula que eles explicam. Funcionam
          porque o binário deixa de ser abstrato no momento em que vira algo físico que você move com o
          polegar. Este é o mesmo aparelho, com as partes que um engenheiro encontra no dia a dia.
        </p>
      </div>

      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Continue</h4>
        <p className="text-sm text-muted-foreground">
          Depois que os bits fizerem sentido, o{' '}
          <a
            href="/games/linux-terminal"
            className="font-medium text-primary underline underline-offset-2"
          >
            simulador de terminal Linux
          </a>{' '}
          coloca o chmod para funcionar em uma árvore de arquivos real, e o{' '}
          <a
            href="/games/aws-vpc-simulator"
            className="font-medium text-primary underline underline-offset-2"
          >
            simulador de AWS VPC
          </a>{' '}
          usa máscaras de sub-rede para dividir uma rede.
        </p>
      </div>
    </>
  );
}

export default function BinaryByteSimulatorPage() {
  return (
    <SimulatorShell
      slug="binary-byte-simulator"
      fallbackTitle="Simulador de Bits e Bytes"
      fallbackDescription="Vire oito bits com as mãos e veja o valor mudar. Os mesmos blocos viram um byte, um conjunto de permissões do chmod e uma máscara de sub-rede, e o binário deixa de ser abstrato."
      educational={<BinaryEducational />}
      seoLearningPoints={seoLearningPoints}
      shareText="Vire os bits e veja o número mudar. Um simulador binário interativo que também explica permissões do chmod e máscaras de sub-rede."
    >
      <BinaryByteSimulator />
    </SimulatorShell>
  );
}
