import type { Metadata } from 'next';
import BounceTriageSimulator from '@/components/games/bounce-triage-simulator';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('bounce-triage-simulator');
}

const seoLearningPoints = [
  'Como ler um bounce SMTP: o código de resposta, o código de status estendido, e o texto de diagnóstico',
  'A diferença entre hard bounce, soft bounce, bloqueio e reclamação de spam',
  'Por que o dígito da classe 4xx e 5xx é uma dica, não a resposta',
  'Quais bounces suprimir permanentemente e quais tentar de novo com backoff',
  'Por que suprimir um soft bounce silenciosamente custa assinantes reais',
  'Por que tentar de novo um hard bounce danifica sua reputação de envio toda vez',
  'O que uma rejeição DMARC 5.7.26 e um limite de taxa 421 realmente estão dizendo',
];

function BounceTriageEducational() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">Sobre este simulador de triagem de bounce</h3>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-3 text-sm font-semibold">O que você vai aprender</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Como ler um bounce SMTP real sem precisar pesquisar nada</li>
            <li>Quais falhas são permanentes e quais vão entregar na próxima tentativa</li>
            <li>Por que algumas respostas 5xx não têm nada a ver com o destinatário</li>
            <li>O que cada erro custa: assinantes perdidos, ou reputação perdida</li>
            <li>Onde as reclamações se encaixam, e por que pesam muito mais</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Como ler um bounce</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">O código de resposta:</strong> 4xx é temporário, 5xx é
              permanente. Trate como uma dica, não um veredito
            </li>
            <li>
              <strong className="text-foreground">O status estendido:</strong> 5.1.1 caixa inexistente,
              4.2.2 sobre a cota, 5.7.x política ou autenticação
            </li>
            <li>
              <strong className="text-foreground">O texto de diagnóstico:</strong> texto livre, e
              geralmente a parte que realmente conta o que aconteceu
            </li>
            <li>
              <strong className="text-foreground">O próprio endereço:</strong> uma fração surpreendente
              dos hard bounces são simples erros de digitação no cadastro
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">O erro que mais custa</h4>
        <p className="text-sm text-muted-foreground">
          Os dois erros de triagem são caros, em direções opostas. Suprima um soft bounce e você perde
          permanentemente um assinante real porque a caixa dele estava brevemente cheia. Tente de novo
          um hard bounce e você danifica sua reputação de envio toda vez, porque os provedores de caixa
          postal interpretam entregas repetidas a um endereço conhecidamente morto como sinal de que
          você trabalha com uma lista comprada. As respostas 5xx que na verdade são sobre conteúdo ou
          ritmo são onde a maioria erra: o 5 parece permanente, então acabam arquivadas junto com os
          endereços mortos e um problema de template corrigível vira uma lista encolhendo.
        </p>
      </div>

      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Fazendo isso automaticamente em produção</h4>
        <p className="text-sm text-muted-foreground">
          Ninguém faz triagem de bounces manualmente em volume. Em produção, seu provedor envia um
          webhook para cada bounce e reclamação, e seu handler classifica e escreve numa lista de
          supressão que o próximo envio checa antes de enfileirar qualquer coisa. A parte que vale a
          pena observar ao escolher um provedor é se você recebe a resposta real do servidor
          destinatário, como as deste simulador, ou só um rótulo de categoria. &quot;Bounced&quot; não é
          suficiente para agir:{' '}
          <span className="font-mono text-xs">550 5.1.1 user unknown</span> e{' '}
          <span className="font-mono text-xs">550 5.7.1 content rejected</span> são a mesma categoria
          e precisam de respostas opostas.{' '}
          <a
            href="https://smtpfa.st"
            className="font-medium text-primary underline underline-offset-2"
            rel="noopener"
          >
            SMTPfast
          </a>{' '}
          mantém o diagnóstico completo junto da mensagem que o causou, e a supressão é aplicada no
          envio em vez de ser apenas informativa.
        </p>
      </div>

      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Vá mais fundo</h4>
        <p className="text-sm text-muted-foreground">
          O{' '}
          <a
            href="/games/smtp-flow-simulator"
            className="font-medium text-primary underline underline-offset-2"
          >
            simulador de fluxo SMTP
          </a>{' '}
          cobre o handshake de onde vêm esses códigos de bounce, de forma interativa.
        </p>
      </div>

      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Por que aprender assim?</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>Códigos de bounce só ficam memoráveis depois que você erra um.</li>
          <li>Cada resposta aqui é uma que um servidor de e-mail real de fato envia, texto incluído.</li>
          <li>
            Ler rápido é a diferença entre uma lista que continua saudável e um domínio de envio que
            silenciosamente para de alcançar caixas de entrada.
          </li>
        </ul>
      </div>
    </>
  );
}

export default function BounceTriageSimulatorPage() {
  return (
    <SimulatorShell
      slug="bounce-triage-simulator"
      fallbackTitle="Simulador de Triagem de Bounce"
      fallbackDescription="Leia um bounce SMTP real e decida o que ele é e o que fazer a respeito. Doze falhas genuínas do Gmail, Outlook, Postfix e Proofpoint, com explicação do que cada código significa e o que custa errar."
      educational={<BounceTriageEducational />}
      seoLearningPoints={seoLearningPoints}
      shareText="Você consegue fazer a triagem de um bounce SMTP? Doze reais: hard, soft, bloqueado ou reclamação, e o que fazer com cada um."
    >
      <BounceTriageSimulator />
    </SimulatorShell>
  );
}
