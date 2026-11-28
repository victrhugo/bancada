import type { Metadata } from 'next';
import SSLTLSHandshakeSimulator from '@/components/games/ssl-tls-handshake-simulator';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('ssl-tls-handshake');
}

function SslTlsEducational() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">Entendendo o handshake SSL/TLS</h3>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-3 font-semibold text-sm">O que você vai aprender</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Como os handshakes do TLS 1.2 e do TLS 1.3 diferem</li>
            <li>O processo de validação da cadeia de certificados</li>
            <li>Mecanismos de troca de chaves (RSA, ECDHE)</li>
            <li>A negociação da cipher suite</li>
            <li>Cenários comuns de falha no TLS</li>
            <li>Perfect Forward Secrecy (PFS)</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-sm">Versões do TLS</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">TLS 1.3:</strong> a versão mais recente, com
              handshake de 1 RTT, PFS obrigatório e algoritmos inseguros removidos.
            </li>
            <li>
              <strong className="text-foreground">TLS 1.2:</strong> ainda muito usada, com handshake
              de 2 RTTs e PFS opcional.
            </li>
            <li>
              <strong className="text-foreground">TLS 1.0/1.1:</strong> descontinuadas; não devem ser
              usadas por causa de vulnerabilidades de segurança.
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 font-semibold text-sm">Conceitos-chave</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">Certificado:</strong> documento digital que associa
            uma chave pública a uma identidade.
          </li>
          <li>
            <strong className="text-foreground">Cipher suite:</strong> conjunto de algoritmos de
            criptografia, autenticação e troca de chaves.
          </li>
          <li>
            <strong className="text-foreground">PFS:</strong> garante que as chaves de sessão não
            sejam comprometidas mesmo que a chave privada do servidor seja.
          </li>
          <li>
            <strong className="text-foreground">AEAD:</strong> Authenticated Encryption with
            Associated Data (por exemplo, AES-GCM).
          </li>
        </ul>
      </div>

      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 font-semibold text-sm">Boas práticas</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>Use TLS 1.3 quando possível e TLS 1.2 como mínimo.</li>
          <li>Desative cipher suites fracas (RC4, DES, export ciphers).</li>
          <li>Ative o HSTS para evitar ataques de downgrade de protocolo.</li>
          <li>Mantenha os certificados atualizados e com validade curta.</li>
          <li>Use registros de Certificate Transparency (CT).</li>
        </ul>
      </div>
    </>
  );
}

export default function SSLTLSHandshakePage() {
  return (
    <SimulatorShell
      slug="ssl-tls-handshake"
      educational={<SslTlsEducational />}
      shareText="Conheça este simulador de handshake SSL/TLS! Aprenda como conexões seguras funcionam."
    >
      <SSLTLSHandshakeSimulator />
    </SimulatorShell>
  );
}
