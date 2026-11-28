import type { Metadata } from 'next';
import DevOpsMemes from '@/components/games/devops-memes';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('devops-memes');
}

function DevOpsMemesEducational() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">Por que memes de DevOps importam</h3>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-3 font-semibold text-sm">Senso de comunidade</h4>
          <p className="mb-3 text-sm text-muted-foreground">
            Experiências compartilhadas criam laços. Quando rimos das mesmas dores, como problemas de
            DNS, indentação de YAML ou deploy na sexta à tarde, construímos comunidade e empatia.
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>Quebra barreiras entre as pessoas do time</li>
            <li>Gera assunto para networking</li>
            <li>Ajuda quem está chegando a se sentir parte da comunidade</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-sm">Alívio do estresse</h4>
          <p className="mb-3 text-sm text-muted-foreground">
            DevOps pode ser estressante. Rir dos nossos desafios ajuda a lidar com a pressão e lembra
            que ninguém enfrenta essas dificuldades sozinho.
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>Reduz o burnout com humor</li>
            <li>Dá perspectiva sobre os desafios do dia a dia</li>
            <li>Cria uma dinâmica positiva no time</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-sm">Valor educativo</h4>
          <p className="mb-3 text-sm text-muted-foreground">
            Cada meme carrega um fundo de verdade sobre práticas, ferramentas ou cultura DevOps. Eles
            podem puxar conversas sobre boas práticas e aprendizado compartilhado.
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>Destaca antipadrões comuns</li>
            <li>Estimula a reflexão sobre as práticas</li>
            <li>Torna conceitos complexos mais fáceis de lembrar</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-sm">Criação de conteúdo</h4>
          <p className="mb-3 text-sm text-muted-foreground">
            Estes memes funcionam bem em redes sociais, apresentações e posts de blog. Eles deixam
            conteúdo técnico mais envolvente e próximo.
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>Ótimos para palestras</li>
            <li>Aumentam o engajamento nas redes</li>
            <li>Deixam o conteúdo técnico mais acessível</li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 font-semibold text-sm">Como usar estes memes</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h5 className="mb-1 font-medium text-sm text-foreground">Integração do time</h5>
            <p className="text-sm text-muted-foreground">
              Compartilhe no chat do time, use para quebrar o gelo em reuniões ou nas retrospectivas
              para deixar o clima mais leve e estimular uma conversa aberta.
            </p>
          </div>
          <div>
            <h5 className="mb-1 font-medium text-sm text-foreground">Redes sociais</h5>
            <p className="text-sm text-muted-foreground">
              Ótimos para posts no LinkedIn, threads ou blogs de tecnologia. São fáceis de
              compartilhar e a comunidade DevOps se identifica.
            </p>
          </div>
          <div>
            <h5 className="mb-1 font-medium text-sm text-foreground">Apresentações</h5>
            <p className="text-sm text-muted-foreground">
              Use para abrir conversas em palestras, treinamentos ou apresentações do time e deixar o
              conteúdo técnico mais envolvente.
            </p>
          </div>
          <div>
            <h5 className="mb-1 font-medium text-sm text-foreground">Documentação</h5>
            <p className="text-sm text-muted-foreground">
              Coloque um pouco de humor em runbooks, guias de resposta a incidentes ou wikis do time
              para tornar a leitura mais agradável e fácil de lembrar.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default function DevOpsMemesPage() {
  return (
    <SimulatorShell slug="devops-memes" educational={<DevOpsMemesEducational />}>
      <DevOpsMemes />
    </SimulatorShell>
  );
}
