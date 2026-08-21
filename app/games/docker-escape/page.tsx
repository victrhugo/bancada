import type { Metadata } from 'next';
import DockerEscape from '@/components/games/docker-escape';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('docker-escape');
}

const seoLearningPoints = [
  'Por que montar /var/run/docker.sock equivale a entregar root no host',
  'O que --privileged realmente concede, e os dois escapes que habilita',
  'Como --pid=host mais uma capability se combinam num escape completo de container',
  'Por que SYS_ADMIN chega perto de root, mesmo parecendo mais cuidadoso que --privileged',
  'Do que o perfil padrão do AppArmor está silenciosamente te protegendo',
  'Como é um comando docker run reforçado quando toda flag é deliberada',
];

function DockerEscapeEducational() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">Sobre este desafio de segurança de containers</h3>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-3 text-sm font-semibold">O que você vai aprender</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Que a maioria dos escapes de container é uma flag, não um exploit de kernel</li>
            <li>Como o socket do Docker transforma qualquer container em root do host</li>
            <li>Por que duas flags individualmente sobreviváveis podem se combinar em algo bem pior</li>
            <li>O que conceder no lugar, para cada flag perigosa</li>
            <li>Que um container não é uma fronteira de segurança a menos que você a construa</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Por que isso importa</h4>
          <p className="text-sm text-muted-foreground">
            O escaneamento de imagens recebe a atenção, mas um scanner nunca olha para como o
            container é executado. Cada cenário aqui é algo que as pessoas genuinamente publicam,
            geralmente porque um tutorial mandou, e cada um dá o host a um atacante sem precisar de
            um CVE.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            O último cenário não tem nada de errado. Assumir que toda config está quebrada é seu
            próprio modo de falha.
          </p>
        </div>
      </div>
    </>
  );
}

export default function DockerEscapePage() {
  return (
    <SimulatorShell slug="docker-escape" educational={<DockerEscapeEducational />} seoLearningPoints={seoLearningPoints}>
      <DockerEscape />
    </SimulatorShell>
  );
}
