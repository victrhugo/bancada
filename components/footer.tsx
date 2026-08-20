import { Logo } from '@/components/ui/logo';
import { EasterEggTerminal } from '@/components/easter-egg-terminal';
import { BackgroundDecoration } from './footer/background-decoration';
import { FooterSection } from './footer/footer-section';
import { practiceSection, learnSection } from './footer/footer-data';

export function Footer() {
  return (
    <footer className="border-t border-border/50 relative overflow-hidden print:hidden bg-background">
      <BackgroundDecoration />

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="md:col-span-1 space-y-4">
            <Logo size={48} href="/" showText />
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Exercícios práticos, quizzes e simuladores para praticar habilidades de DevOps.
            </p>
          </div>

          <FooterSection section={practiceSection} label="practice" />
          <FooterSection section={learnSection} label="learn" />
        </div>

        {/* Footer bottom — terminal-style bar */}
        <div className="mt-12 pt-6 border-t border-border/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono text-muted-foreground">
            <p className="tabular-nums">
              <span className="text-green-500/70">$</span> echo &quot;
              <span className="text-foreground">&copy; {new Date().getFullYear()} Bancada</span>
              &quot;
            </p>
            <EasterEggTerminal variant="text" />
            <p>
              <span className="text-green-500/70">$</span> uptime{' '}
              <span className="text-muted-foreground/70">#</span>{' '}
              <span className="text-foreground">feito para quem aprende praticando</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
