import type { Metadata } from 'next';
import OAuthOidcFlowSimulator from '@/components/games/oauth-oidc-flow-simulator';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('oauth-oidc-flow-simulator');
}

function OAuthOidcEducational() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">Sobre este simulador de OAuth/OIDC</h3>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-3 text-sm font-semibold">O que você vai aprender</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Como o authorization code + PKCE passa por requisições no navegador e pelo back-channel</li>
            <li>Por que state, nonce, validação de redirect URI e PKCE são proteções diferentes</li>
            <li>A diferença entre ID token, access token e refresh token</li>
            <li>Como as APIs validam audience, issuer, expiração e scope</li>
            <li>Por que a rotação de refresh tokens importa</li>
            <li>Como os erros comuns de OAuth aparecem em sessões reais de debugging</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Fluxos cobertos</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Login:</strong> URL de autorização, redirect,
              login, consentimento, callback
            </li>
            <li>
              <strong className="text-foreground">Tokens:</strong> troca do code, validação do ID
              token, chamadas ao UserInfo e à API
            </li>
            <li>
              <strong className="text-foreground">Sessões:</strong> cookies de sessão seguros e
              limites de onde guardar tokens
            </li>
            <li>
              <strong className="text-foreground">Falhas:</strong> redirect URIs erradas, scopes amplos
              demais, access tokens expirados
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">OAuth vs OIDC</h4>
        <p className="text-sm text-muted-foreground">
          O OAuth delega acesso a APIs. O OpenID Connect adiciona identidade por cima do OAuth, com o
          scope <strong className="text-foreground">openid</strong>, ID tokens e claims padronizadas
          sobre a identidade do usuário.
        </p>
      </div>

      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Seguro para o navegador</h4>
        <p className="text-sm text-muted-foreground">
          Este simulador não se conecta a um provedor de identidade real. Ele reproduz as mensagens e
          as decisões de validação no navegador, para você entender o fluxo antes de integrar um
          provedor real como Auth0, Okta, Entra ID, Cognito, Keycloak ou Clerk.
        </p>
      </div>
    </>
  );
}

export default function OAuthOidcFlowSimulatorPage() {
  return (
    <SimulatorShell
      slug="oauth-oidc-flow-simulator"
      fallbackTitle="Simulador de Fluxos OAuth/OIDC"
      fallbackDescription="Visualize os fluxos do OAuth 2.0 e do OpenID Connect em um simulador interativo no navegador. Aprenda authorization code + PKCE, tokens, scopes, refresh, callbacks e erros comuns de autenticação."
      educational={<OAuthOidcEducational />}
      shareText="Aprenda OAuth e OpenID Connect com este simulador interativo de fluxos."
    >
      <OAuthOidcFlowSimulator />
    </SimulatorShell>
  );
}
