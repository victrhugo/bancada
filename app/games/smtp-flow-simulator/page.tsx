import type { Metadata } from 'next';
import SmtpFlowSimulator from '@/components/games/smtp-flow-simulator';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('smtp-flow-simulator');
}

function SmtpEducationalContent() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">Sobre este simulador de SMTP</h3>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-3 text-sm font-semibold">O que você vai aprender</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Como o envio (submission) pelo SMTP difere do relay entre servidores</li>
            <li>Por que EHLO, STARTTLS, AUTH, MAIL FROM, RCPT TO e DATA acontecem nessa ordem</li>
            <li>Como SPF, DKIM e DMARC afetam a confiança no remetente e a entregabilidade</li>
            <li>Por que respostas SMTP 4xx geram retry, enquanto as 5xx costumam falhar de vez</li>
            <li>Onde filas do provedor, logs, webhooks e tratamento de bounces entram na entrega</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Conceitos principais</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Submission:</strong> envio autenticado da aplicação
              para o relay, normalmente na porta 587
            </li>
            <li>
              <strong className="text-foreground">Relay:</strong> entrega enfileirada do relay de envio
              até o MX do destinatário
            </li>
            <li>
              <strong className="text-foreground">Autenticação:</strong> TLS, SMTP AUTH, SPF, DKIM e
              DMARC
            </li>
            <li>
              <strong className="text-foreground">Entrega:</strong> aceite remoto, retry, bounce e
              chegada à caixa de entrada
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}

export default function SmtpFlowSimulatorPage() {
  return (
    <SimulatorShell
      slug="smtp-flow-simulator"
      fallbackTitle="Simulador do Fluxo SMTP"
      fallbackDescription="Veja como funciona a entrega de e-mail via SMTP, do envio pela aplicação até TLS, autenticação, verificações de DNS do remetente, relay para o MX do destinatário, retries, bounces e chegada à caixa de entrada."
      educational={<SmtpEducationalContent />}
      shareText="Veja como funciona a entrega de e-mail via SMTP, do EHLO e STARTTLS até SPF, DKIM, DMARC, retries e a caixa de entrada."
    >
      <SmtpFlowSimulator />
    </SimulatorShell>
  );
}
