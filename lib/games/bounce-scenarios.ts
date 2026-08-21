/**
 * Real-world SMTP bounce scenarios for the bounce triage simulator.
 *
 * Codes and diagnostic strings follow RFC 3463 enhanced status codes and the
 * wording major providers actually send. The teaching point of the whole game
 * is that the SMTP class digit (4 vs 5) is a hint, not the answer: plenty of
 * 5xx responses are really "slow down" and a couple of 4xx ones will never
 * succeed no matter how long you retry.
 */

export type BounceKind = 'hard' | 'soft' | 'block' | 'complaint';
export type BounceAction = 'suppress' | 'retry' | 'fix-content' | 'slow-down';

export interface BounceScenario {
  id: string;
  /** What the receiving server actually said. */
  response: string;
  /** Who it was addressed to, for flavour and the occasional typo clue. */
  recipient: string;
  /** Where the bounce came from, since providers differ in wording. */
  provider: string;
  kind: BounceKind;
  action: BounceAction;
  /** Shown after answering: what the code means. */
  explanation: string;
  /** Shown after answering: what it costs you to get this one wrong. */
  consequence: string;
}

export const KIND_LABELS: Record<BounceKind, string> = {
  hard: 'Hard bounce',
  soft: 'Soft bounce',
  block: 'Bloqueado',
  complaint: 'Reclamação',
};

export const KIND_HINTS: Record<BounceKind, string> = {
  hard: 'Permanente. Esse endereço nunca vai aceitar e-mail.',
  soft: 'Temporário. O mesmo endereço pode aceitar mais tarde.',
  block: 'O endereço está ok. Estão recusando você, esta mensagem, ou este ritmo de envio.',
  complaint: 'O destinatário marcou como spam.',
};

export const ACTION_LABELS: Record<BounceAction, string> = {
  suppress: 'Suprimir permanentemente',
  retry: 'Tentar novamente com backoff',
  'fix-content': 'Corrigir a mensagem, depois tentar de novo',
  'slow-down': 'Reduzir o ritmo, depois tentar de novo',
};

export const BOUNCE_SCENARIOS: BounceScenario[] = [
  {
    id: 'user-unknown',
    response: '550 5.1.1 <jhon@exmaple.com>: Recipient address rejected: User unknown in virtual mailbox table',
    recipient: 'jhon@exmaple.com',
    provider: 'Postfix',
    kind: 'hard',
    action: 'suppress',
    explanation:
      '5.1.1 é a resposta canônica de "caixa de e-mail inexistente". Repare no próprio endereço: jhon em exmaple.com é um duplo erro de digitação de john em example.com, que é o que a maioria dos hard bounces realmente é. Alguém digitou o próprio endereço errado no cadastro.',
    consequence:
      'Tentar de novo custa reputação toda vez. Uma taxa crescente de hard bounces é a forma mais rápida de ser limitado (throttled), e os provedores de caixa postal interpretam envios repetidos para um endereço conhecidamente morto como sinal de que você está enviando para uma lista comprada.',
  },
  {
    id: 'mailbox-full',
    response: '452 4.2.2 The email account that you tried to reach is over quota',
    recipient: 'sarah@company.com',
    provider: 'Gmail',
    kind: 'soft',
    action: 'retry',
    explanation:
      '4.2.2 significa que a caixa existe e a pessoa é real, só ficaram sem espaço. Esse é o soft bounce de livro-texto.',
    consequence:
      'Suprimir aqui é o erro caro. Você perde permanentemente um assinante real porque ele ficou brevemente sem cota. Tente de novo com backoff, e só desista depois de falhar consistentemente por dias.',
  },
  {
    id: 'greylisted',
    response: '450 4.7.1 <mail@yourdomain.com>: Recipient address rejected: Greylisted, try again in 300 seconds',
    recipient: 'ops@smallbusiness.co.uk',
    provider: 'Postgrey',
    kind: 'soft',
    action: 'retry',
    explanation:
      'O greylisting rejeita deliberadamente a primeira tentativa de um remetente desconhecido, partindo da teoria de que software de spam não tenta de novo e servidores de e-mail de verdade tentam. Espere o intervalo indicado e a nova tentativa geralmente é aceita.',
    consequence:
      'Tratar greylisting como falha significa que você nunca entrega para toda uma classe de domínios pequenos auto-hospedados. A nova tentativa é todo o propósito do mecanismo: é um teste que você passa se comportando como um servidor de e-mail real.',
  },
  {
    id: 'spam-content',
    response: '550 5.7.1 Message rejected due to content restrictions',
    recipient: 'team@enterprise.com',
    provider: 'Proofpoint',
    kind: 'block',
    action: 'fix-content',
    explanation:
      'Um 5xx que não tem nada a ver com o endereço. A caixa está ok e o destinatário é real; um filtro de conteúdo se opôs a algo na mensagem. Causas comuns são um encurtador de link, um IP nu numa URL, um tipo de anexo, ou um texto que soa como phishing.',
    consequence:
      'Suprimir aqui descarta um destinatário válido por um problema que está no seu template. Corrija a mensagem e ela entrega. A armadilha é que o 5 em 550 parece permanente, então uma triagem ingênua arquiva junto com os endereços mortos.',
  },
  {
    id: 'gmail-unauthenticated',
    response: '550-5.7.26 Unauthenticated email from yourdomain.com is not accepted due to domain\'s DMARC policy.',
    recipient: 'user@gmail.com',
    provider: 'Gmail',
    kind: 'block',
    action: 'fix-content',
    explanation:
      'Nada a ver com o destinatário. Sua política de DMARC disse ao Gmail para rejeitar e-mail que falha na autenticação, e essa mensagem falhou. Geralmente é alinhamento de SPF ou DKIM: o domínio do From não bate com o domínio que de fato autenticou.',
    consequence:
      'Suprimir destinatários por isso esconde um bug de autenticação atrás de uma lista encolhendo. Toda mensagem que você envia está falhando da mesma forma. Corrija o DNS ou o domínio de assinatura e a classe inteira desaparece.',
  },
  {
    id: 'rate-limited',
    response: '421 4.7.0 Too many messages from your IP. Please try again later.',
    recipient: 'contact@bigcorp.com',
    provider: 'Outlook',
    kind: 'block',
    action: 'slow-down',
    explanation:
      'Um 421 fecha a conexão. O provedor está dizendo que o ritmo é o problema, não o e-mail. Comum quando um domínio de envio novo manda uma rajada em vez de ir aumentando aos poucos.',
    consequence:
      'Tentar de novo imediatamente no mesmo ritmo piora as coisas e pode bloquear o IP temporariamente. Reduza a concorrência, espalhe o envio, e deixe a reputação se construir.',
  },
  {
    id: 'domain-not-found',
    response: '550 5.1.2 Domain not found. The domain in the recipient address does not exist.',
    recipient: 'contact@companythatfolded.io',
    provider: 'Generic MTA',
    kind: 'hard',
    action: 'suppress',
    explanation:
      '5.1.2 significa que o domínio não tem registro MX ou A. A empresa fechou, o domínio expirou, ou nunca existiu de verdade. Não há servidor para aceitar esse e-mail.',
    consequence:
      'Esse nunca se recupera, então tentar de novo é puro desperdício. Vale checar a lista inteira: se muitos endereços compartilham um domínio morto, uma empresa fechando pode silenciosamente apodrecer um pedaço da sua audiência.',
  },
  {
    id: 'complaint-feedback-loop',
    response: 'Feedback-Type: abuse\nUser-Agent: Yahoo!-Mail-Feedback/2.0\nOriginal-Rcpt-To: reader@yahoo.com',
    recipient: 'reader@yahoo.com',
    provider: 'Yahoo (ARF feedback loop)',
    kind: 'complaint',
    action: 'suppress',
    explanation:
      'Isso nem é um bounce. É um relatório ARF de um feedback loop: a mensagem foi entregue, e o destinatário apertou "denunciar como spam". Você só vê isso se estiver inscrito nos feedback loops do provedor.',
    consequence:
      'Suprima imediata e permanentemente. Alguém que te denunciou como spam nunca é uma oportunidade de reengajamento, e reclamações pesam muito mais que bounces. O Google começa a limitar por volta de 0,3%, que são três pessoas a cada mil.',
  },
  {
    id: 'relay-denied',
    response: '554 5.7.1 <recipient@partner.com>: Relay access denied',
    recipient: 'recipient@partner.com',
    provider: 'Postfix',
    kind: 'block',
    action: 'fix-content',
    explanation:
      'O servidor destinatário não se considera responsável por aquele domínio, então recusa fazer o relay. Geralmente um registro MX desatualizado apontando para um servidor que não hospeda mais o domínio, ou um endereço interno mal roteado.',
    consequence:
      'Não é culpa do destinatário e não se resolve tentando de novo. Precisa de um ajuste de DNS ou roteamento do lado deles, então isso é uma conversa de suporte, não uma ação de higiene de lista.',
  },
  {
    id: 'temporary-server-failure',
    response: '451 4.3.0 Temporary server error. Please try again later. (SRV-1)',
    recipient: 'hello@startup.dev',
    provider: 'Outlook',
    kind: 'soft',
    action: 'retry',
    explanation:
      '4.3.0 é o servidor destinatário admitindo seu próprio problema. Não há nada errado com o endereço, seu conteúdo, ou sua reputação.',
    consequence:
      'Tente de novo com backoff e quase sempre entrega. O único erro aqui é desistir cedo demais, ou martelar com tentativas imediatas e transformar um erro transitório num bloqueio por limite de taxa.',
  },
  {
    id: 'blocked-listing',
    response: '554 5.7.1 Service unavailable; Client host [203.0.113.42] blocked using Spamhaus SBL',
    recipient: 'anyone@anywhere.com',
    provider: 'Generic MTA',
    kind: 'block',
    action: 'slow-down',
    explanation:
      'Seu IP de envio está numa blocklist pública. Não há nada de errado com esse destinatário, e isso vai afetar tudo que você enviar até ser resolvido.',
    consequence:
      'O sinal urgente da lista: pare de enviar, descubra o que causou a listagem (geralmente um pico de reclamações ou atingir uma spam trap), corrija, então peça a remoção da lista. Continuar enviando enquanto listado aprofunda o buraco.',
  },
  {
    id: 'disabled-mailbox',
    response: '550 5.2.1 The email account that you tried to reach is disabled.',
    recipient: 'former.employee@company.com',
    provider: 'Gmail',
    kind: 'hard',
    action: 'suppress',
    explanation:
      '5.2.1 significa que a caixa existe mas foi desativada, que é o que acontece com um endereço de trabalho depois que alguém sai da empresa. Não vai voltar.',
    consequence:
      'Suprima. Vale também trazer isso à tona com o cliente, já que uma lista B2B silenciosamente se enche de ex-funcionários e a taxa de bounce vai subindo até começar a custar entregabilidade.',
  },
];
