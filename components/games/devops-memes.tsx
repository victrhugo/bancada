'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  RefreshCcw,
  Share2,
  Copy,
  Laugh,
  Lightbulb,
  Coffee,
  Zap,
  Sparkles,
  Download,
  ChevronRight,
  Shuffle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// DevOps Engineer memes database with categories - 120+ memes!
const DEVOPS_MEMES = {
  infrastructure: [
    "Você já depurou mais DNS do que abraçou a sua família.",
    "Para você, “está tudo pegando fogo” é só mais uma terça-feira.",
    "Você já perguntou “já tentou desligar e ligar o datacenter inteiro?”",
    "Seu maior medo não é a morte, é um single point of failure.",
    "Você já batizou componentes da infra com nomes de personagens de série e se arrependeu.",
    "Você já usou Infrastructure as Code para provisionar a rede de casa.",
    "Sua definição de “serverless” inclui “os servidores de outra pessoa”.",
    'Você entende mais de permissões de arquivo no Linux do que das próprias emoções.',
    "O nome do seu Wi-Fi é o do seu load balancer favorito.",
    "Você já explicou latência de rede comparando com entrega de pizza.",
    'Você sabe o que é um erro 503, mas não sabe o que significa SOS.',
    "Você já disse que um servidor “tem problemas de personalidade”.",
    "O roteador da sua casa tem monitoramento melhor que a produção de muita empresa.",
    'Você sabe quando um servidor está num dia ruim só de olhar as métricas.',
    "Seu pet tem o nome do seu provedor de nuvem favorito.",
    'Você conhece mais máscaras de sub-rede do que o próprio bairro.',
    "Você já chamou um servidor de “ela”, com todo o carinho.",
    "Seu perfil de namoro lista “alta disponibilidade” como requisito.",
    "Você já explicou por que a internet caiu usando as camadas do modelo OSI.",
    "Você trata load balancers como se fossem da família.",
    "Seus relacionamentos com servidores duraram mais que com pessoas.",
    'Você sabe de cor o IP dos seus sites favoritos.',
    "Você dá apelidos para os servidores de acordo com as manias deles.",
    'Você prevê falha de servidor melhor do que a previsão do tempo.',
  ],
  automation: [
    "Você automatizou a cafeteira, mas ainda faz deploy em produção na mão.",
    "Sua ideia de “teste manual” envolve pelo menos três pipelines de CI/CD.",
    "Este ano você escreveu mais YAML do que código de verdade.",
    'Você automatiza tudo, menos lembrar de automatizar tudo.',
    'Seu pipeline de deploy tem mais estágios que um lançamento de foguete.',
    "Você já disse “funciona no meu pipeline” como se isso tranquilizasse alguém.",
    'Seu pipeline de CI/CD demora mais para rodar do que o tempo de desenvolvimento.',
    "Você deu nome aos servidores de build e conversa com eles quando estão lentos.",
    'Você mede seu valor pela quantidade de checks verdes no pipeline.',
    "Você automatizou o pedido do almoço, mas ainda reinicia serviços na mão.",
    'Seus playbooks de Ansible têm mais roles que uma peça de Shakespeare.',
    "Você já escreveu um script que escreve scripts que escrevem outros scripts.",
    'Você automatiza o update da daily, mas esquece de automatizar o trabalho em si.',
    'Seu Jenkins tem mais plugins que o seu navegador tem extensões.',
    "Você criou um pipeline que faz deploy de pipelines que fazem deploy de outros pipelines.",
    'Você lembra melhor da sintaxe do cron do que do próprio aniversário.',
    "Você já automatizou um “hello world” de 15 jeitos diferentes.",
    'Seu workflow do GitHub Actions é maior que muito romance.',
    "Você criou um bot para te lembrar de checar os outros bots.",
    'Você automatizou a resposta de férias, mas esqueceu de tirar as férias.',
    "Você automatizou a rotina da manhã, mas ainda esquece de tomar café.",
    'Seus aliases de shell são mais complexos que algumas linguagens de programação.',
    "Você escreveu um script que gera desculpas para o build quebrado.",
    'Você automatiza a formatação do código, mas organiza a mesa na mão.',
  ],
  monitoring: [
    'Suas fotos de férias são prints de dashboards mostrando 99,99% de uptime.',
    'Você sabe exatamente qual emoji representa cada status de serviço no Slack.',
    "A luz de injeção do carro não te preocupa, porque não chegou alerta no PagerDuty.",
    'Suas opiniões sobre ferramentas de monitoramento são mais fortes que as políticas.',
    'Quando algo quebra, seu primeiro instinto é olhar os logs, até da cafeteira.',
    "Você já depurou um problema lendo folhas de chá (e por folhas de chá, entenda logs).",
    'Você sabe a saúde da infra inteira pela cor das notificações do celular.',
    "Os bichos de pelúcia do seu filho têm nomes de métricas de monitoramento.",
    'Você sabe o que é uso normal de CPU melhor que os seus sinais vitais.',
    "Você já acordou com um alerta de um serviço que nem lembrava que existia.",
    'Seu celular tem mais apps de monitoramento do que de redes sociais.',
    "Você avalia restaurantes pelo uptime (quantas vezes estão abertos de verdade).",
    "Você configurou monitoramento para os eletrodomésticos.",
    'Você sabe a diferença entre um pico e uma anomalia no seu padrão de sono.',
    "Você criou dashboards para acompanhar a própria produtividade.",
    'Para você, o monitor de batimentos é só mais uma fonte de dados.',
    "Você já resolveu briga de família com análise de causa raiz.",
    'Você acompanha a performance do Wi-Fi mais de perto que a conta bancária.',
    "Você configurou alertas para quando as plantas precisam de água.",
    'Você lê gráfico do Grafana mais rápido que cardápio de restaurante.',
  ],
  development: [
    "Você já disse “na minha máquina funciona” falando do cluster de produção.",
    "Para você, “código legado” é qualquer coisa escrita há mais de 3 meses.",
    'Você sonha em YAML e acorda gritando por causa da indentação.',
    "Você já teve discussões acaloradas sobre o jeito certo de organizar um monorepo.",
    "Você já quis dar `git blame` nos problemas da vida real.",
    "Você tem opinião forte sobre tabs ou espaços (e você está certo).",
    "Para você, “funciona local” é um conceito mítico, tipo unicórnio.",
    "Você já escreveu mais linhas de Dockerfile do que de poesia na vida.",
    "Seu navegador tem mais abas abertas que comanda de bar no Réveillon.",
    'Você sabe os status codes HTTP melhor que a data do aniversário de namoro.',
    "Você já disse “não é bug, é feature” sobre drift de infraestrutura.",
    'Seus code reviews são mais detalhados que seus check-ups médicos.',
    "Você já nomeou variáveis com seus sentimentos (geralmente “frustrado” e “confuso”).",
    "Você comenta melhor o código do que os posts nas redes sociais.",
    'Você entende conflito de merge melhor que conflito de relacionamento.',
    "Este ano você usou o Stack Overflow mais do que qualquer outro site.",
    'Seu histórico do git conta uma história melhor que o seu diário.',
    "Você tem comentários TODO mais velhos que alguns devs júnior.",
    "Você depura problema em produção mais rápido do que descobre por que o código não roda local.",
    "Você dá nome às branches de acordo com o humor do dia.",
    'Você sabe mais atalhos de teclado do que contatos no celular.',
    "Você já refatorou código mais vezes do que mudou os móveis de lugar.",
  ],
  culture: [
    'Você tem mais chaves SSH do que chaves de casa.',
    'Seus favoritos do navegador são 90% documentação e 10% Stack Overflow.',
    "Seus pets têm nome de pods do Kubernetes.",
    "Você já explicou microsserviços para a sua avó usando a cozinha como exemplo.",
    'Sua lista pessoal de tarefas fica no Jira.',
    "Você já esteve numa reunião em que alguém sugeriu resolver um problema de pessoas com Kubernetes.",
    'Sua ideia de noite romântica é fazer pair programming num script de deploy.',
    'Sua história de ninar favorita é a calculadora de preços da AWS.',
    "Você já descreveu seu trabalho como “extintor de incêndio profissional”.",
    'Para você, esporte radical é deploy em produção na sexta à tarde.',
    "Você já disse “não é bug, é race condition” com a maior cara séria.",
    "Sua pasta de favoritos “Ferramentas DevOps” tem mais itens que a sua lista de contatos.",
    "Você sabe o que significa “funciona no meu cluster”, e isso já não tem graça.",
    "Você usou mais “blame” no git do que em discussões da vida real.",
    'Sua ideia de férias é um fim de semana sem incidente em produção.',
    "Você já explicou Kubernetes comparando com montar móvel de caixa.",
    'Sua caneca tem mais adesivos de eventos de tecnologia que o seu notebook.',
    'Você mede o tempo em ciclos de deploy, não em horas.',
    "O nome do seu Wi-Fi só faz sentido para outros profissionais de DevOps.",
    "Você sabe mais do uptime dos servidores do que do seu horário de sono.",
    "Você já usou dívida técnica como desculpa para dívida pessoal.",
    'Seu papo de elevador é sobre as últimas vulnerabilidades de segurança.',
    "Você já explicou escalabilidade para quem não é de TI usando restaurante como exemplo.",
    'Você conhece mais gente de DevOps do que vizinhos.',
    "Você já usou “isso está fora do escopo” numa conversa pessoal.",
    'Seus contatos de emergência incluem o serviço de monitoramento.',
    "Você já comemorou mais um deploy bem-sucedido do que conquistas pessoais.",
    'Você sabe a diferença entre hotfix e feature nos relacionamentos.',
  ],
};

// Get all memes as a flat array
const ALL_MEMES = Object.values(DEVOPS_MEMES).flat();

// Meme categories for filtering
const MEME_CATEGORIES = [
  { id: 'all', label: 'Todos os memes', emoji: '🎯', count: ALL_MEMES.length },
  {
    id: 'infrastructure',
    label: 'Infraestrutura',
    emoji: '🏗️',
    count: DEVOPS_MEMES.infrastructure.length,
  },
  { id: 'automation', label: 'Automação', emoji: '🤖', count: DEVOPS_MEMES.automation.length },
  { id: 'monitoring', label: 'Monitoramento', emoji: '📊', count: DEVOPS_MEMES.monitoring.length },
  { id: 'development', label: 'Desenvolvimento', emoji: '💻', count: DEVOPS_MEMES.development.length },
  { id: 'culture', label: 'Cultura', emoji: '🎭', count: DEVOPS_MEMES.culture.length },
];

// Simple reactions without counters
const REACTIONS = [
  { emoji: '😂', label: 'LOL!', shortcut: '1' },
  { emoji: '💯', label: 'Isso!', shortcut: '2' },
  { emoji: '🔥', label: 'Brabo!', shortcut: '3' },
  { emoji: '😭', label: 'Real demais!', shortcut: '4' },
  { emoji: '🎯', label: 'Na mosca!', shortcut: '5' },
  { emoji: '⚡', label: 'Me identifiquei!', shortcut: '6' },
];

export default function DevOpsMemes() {
  const [currentMeme, setCurrentMeme] = useState('');
  const [currentCategory, setCurrentCategory] = useState('all');
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentReaction, setCurrentReaction] = useState<string | null>(null);
  const [memeHistory, setMemeHistory] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Generate initial meme
  useEffect(() => {
    generateNewMeme();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        generateNewMeme();
      } else if (e.key >= '1' && e.key <= '6') {
        const reactionIndex = parseInt(e.key) - 1;
        if (REACTIONS[reactionIndex]) {
          handleReaction(REACTIONS[reactionIndex].emoji);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const getCurrentMemes = () => {
    if (currentCategory === 'all') {
      return ALL_MEMES;
    }
    return DEVOPS_MEMES[currentCategory as keyof typeof DEVOPS_MEMES] || [];
  };

  const generateNewMeme = () => {
    if (isAnimating) return;

    setIsAnimating(true);

    // Add a small delay for animation effect
    setTimeout(() => {
      const availableMemes = getCurrentMemes();
      let randomMeme = availableMemes[Math.floor(Math.random() * availableMemes.length)];

      // Avoid showing the same meme twice in a row
      let attempts = 0;
      while (randomMeme === currentMeme && availableMemes.length > 1 && attempts < 10) {
        randomMeme = availableMemes[Math.floor(Math.random() * availableMemes.length)];
        attempts++;
      }

      setCurrentMeme(randomMeme);
      setCurrentReaction(null);
      setMemeHistory((prev) => [randomMeme, ...prev.slice(0, 4)]); // Keep last 5 memes

      setIsAnimating(false);
    }, 300);
  };

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
  };

  const copyToClipboard = async () => {
    const text = `Talvez você seja de DevOps se...\n\n${currentMeme}\n\n#DevOps #Memes #HumorTech`;

    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const shareOnSocial = (platform: string) => {
    const text = encodeURIComponent(
      `Talvez você seja de DevOps se... ${currentMeme} #DevOps #Memes`
    );
    const url = encodeURIComponent(window.location.href);

    let shareUrl = '';

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${text}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${text}`;
        break;
      case 'reddit':
        shareUrl = `https://reddit.com/submit?title=${text}&url=${url}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=550,height=420');
    }
  };

  const handleReaction = (emoji: string) => {
    setCurrentReaction(emoji);

    // Trigger confetti for special reactions
    if (['💯', '🔥'].includes(emoji)) {
      triggerConfetti();
    }

    // Reset reaction after 3 seconds
    setTimeout(() => setCurrentReaction(null), 3000);
  };

  const downloadMeme = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 600;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#f97316');
    gradient.addColorStop(1, '#dc2626');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';

    const title = 'Talvez você seja de DevOps se...';
    ctx.fillText(title, canvas.width / 2, 150);

    ctx.font = '24px Arial';
    const words = currentMeme.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach((word) => {
      const testLine = currentLine + word + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > canvas.width - 100 && currentLine !== '') {
        lines.push(currentLine);
        currentLine = word + ' ';
      } else {
        currentLine = testLine;
      }
    });
    lines.push(currentLine);

    lines.forEach((line, index) => {
      ctx.fillText(line, canvas.width / 2, 250 + index * 40);
    });

    // Download
    const link = document.createElement('a');
    link.download = 'devops-meme.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 800),
                y: -10,
                rotate: 0,
              }}
              animate={{
                y: (typeof window !== 'undefined' ? window.innerHeight : 600) + 10,
                rotate: 360,
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 800),
              }}
              transition={{
                duration: 2,
                ease: 'easeOut',
                delay: Math.random() * 0.3,
              }}
            >
              <div className="w-2 h-2 bg-linear-to-r from-orange-400 to-red-500 rounded-full" />
            </motion.div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <Badge
              variant="outline"
              className="px-4 py-2 text-sm bg-linear-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 border-orange-200 dark:border-orange-700"
            >
              <Laugh className="w-4 h-4 mr-2" />
              {ALL_MEMES.length}+ Memes
            </Badge>
          </div>

          <h2 className="text-4xl md:text-6xl font-bold mb-4 bg-linear-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
            🧪 You Might Be a DevOps Engineer If...
          </h2>

          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Memes de DevOps hilários (e dolorosamente verdadeiros) gerados na hora. Cada clique traz uma nova
            dose de realidade! Perfeito para compartilhar os perrengues de DevOps com o mundo. 🔥
          </p>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="flex flex-wrap justify-center gap-3">
            {MEME_CATEGORIES.map((category) => (
              <Button
                key={category.id}
                variant={currentCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentCategory(category.id)}
                className={cn(
                  'transition-all duration-200',
                  currentCategory === category.id
                    ? 'bg-linear-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white'
                    : 'border-orange-200 hover:bg-orange-50 dark:border-orange-700 dark:hover:bg-orange-950/20'
                )}
              >
                <span className="mr-2">{category.emoji}</span>
                {category.label}
                <Badge variant="secondary" className="ml-2 text-xs">
                  {category.count}
                </Badge>
              </Button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Main Meme Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="relative overflow-hidden border-2 border-primary/20 bg-linear-to-br from-orange-50/50 via-white to-red-50/50 dark:from-orange-950/20 dark:via-background dark:to-red-950/20 shadow-xl">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/10 rounded-full blur-xl animate-pulse" />
            <div
              className="absolute -bottom-10 -left-10 w-40 h-40 bg-red-500/10 rounded-full blur-xl animate-pulse"
              style={{ animationDelay: '1s' }}
            />
          </div>

          <CardHeader className="text-center pb-6 relative z-10">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
            >
              <div className="mx-auto mb-6 p-6 bg-linear-to-br from-orange-500 to-red-600 rounded-full w-fit shadow-xl">
                <Zap className="h-10 w-10 text-white" />
              </div>
            </motion.div>

            <CardTitle className="text-2xl md:text-3xl font-bold mb-2 text-primary">
              Talvez você seja de DevOps se...
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-8 relative z-10">
            {/* Meme Text */}
            <div className="min-h-[120px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentMeme}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                >
                  <div className="text-center">
                    <p className="text-xl md:text-2xl font-medium text-foreground leading-relaxed max-w-3xl">
                      {currentMeme}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Quick Reactions */}
            <div className="flex flex-wrap justify-center gap-3">
              {REACTIONS.map((reaction) => (
                <motion.div
                  key={reaction.emoji}
                  whileHover={{
                    scale: 1.15,
                    y: -2,
                    transition: { duration: 0.2, ease: 'easeOut' },
                  }}
                  whileTap={{
                    scale: 0.9,
                    y: 1,
                    transition: { duration: 0.1, ease: 'easeIn' },
                  }}
                >
                  <button
                    onClick={() => handleReaction(reaction.emoji)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-full border-2 transition-all duration-200 text-sm shadow-sm hover:shadow-md',
                      currentReaction === reaction.emoji
                        ? 'border-primary bg-primary/10 text-primary scale-110 shadow-lg shadow-primary/20'
                        : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5 hover:shadow-primary/10'
                    )}
                    title={`Aperte ${reaction.shortcut} ou clique`}
                    type="button"
                  >
                    <motion.span
                      animate={
                        currentReaction === reaction.emoji ? { rotate: [0, 10, -10, 0] } : {}
                      }
                      transition={{ duration: 0.5 }}
                      style={{ fontSize: '1rem' }}
                    >
                      {reaction.emoji}
                    </motion.span>
                    <span className="font-medium">{reaction.label}</span>
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-4">
              <motion.div
                whileHover={{
                  scale: 1.08,
                  y: -3,
                  transition: { duration: 0.2, ease: 'easeOut' },
                }}
                whileTap={{
                  scale: 0.95,
                  y: 1,
                  transition: { duration: 0.1, ease: 'easeIn' },
                }}
              >
                <Button
                  onClick={generateNewMeme}
                  disabled={isAnimating}
                  size="lg"
                  className="bg-linear-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl px-8 transition-all duration-200"
                >
                  {isAnimating ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <RefreshCcw className="h-5 w-5 mr-2" />
                    </motion.div>
                  ) : (
                    <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }}>
                      <RefreshCcw className="h-5 w-5 mr-2" />
                    </motion.div>
                  )}
                  Novo meme
                  <span className="ml-2 text-xs opacity-75">(Espaço)</span>
                </Button>
              </motion.div>

              <motion.div
                whileHover={{
                  scale: 1.08,
                  y: -3,
                  transition: { duration: 0.2, ease: 'easeOut' },
                }}
                whileTap={{
                  scale: 0.95,
                  y: 1,
                  transition: { duration: 0.1, ease: 'easeIn' },
                }}
              >
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  size="lg"
                  className={cn(
                    'border-primary/20 transition-all duration-200 shadow-sm hover:shadow-md',
                    copySuccess
                      ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-800 shadow-green-200/50'
                      : 'hover:bg-primary/5 hover:border-primary/40'
                  )}
                >
                  <motion.div
                    animate={copySuccess ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    <Copy className="h-5 w-5 mr-2" />
                  </motion.div>
                  {copySuccess ? 'Copiado!' : 'Copiar texto'}
                </Button>
              </motion.div>

              <motion.div
                whileHover={{
                  scale: 1.08,
                  y: -3,
                  transition: { duration: 0.2, ease: 'easeOut' },
                }}
                whileTap={{
                  scale: 0.95,
                  y: 1,
                  transition: { duration: 0.1, ease: 'easeIn' },
                }}
              >
                <Button
                  onClick={downloadMeme}
                  variant="outline"
                  size="lg"
                  className="border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-950/20 shadow-sm hover:shadow-md hover:border-purple-300 transition-all duration-200"
                >
                  <motion.div whileHover={{ y: -1 }} transition={{ duration: 0.2 }}>
                    <Download className="h-5 w-5 mr-2" />
                  </motion.div>
                  Baixar
                </Button>
              </motion.div>
            </div>

            {/* Share Buttons */}
            <div className="border-t border-muted-foreground/10 pt-6">
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground">Compartilhe este meme:</p>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  onClick={() => shareOnSocial('twitter')}
                  variant="outline"
                  size="sm"
                  className="bg-blue-50 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/20 dark:border-blue-800"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Twitter
                </Button>

                <Button
                  onClick={() => shareOnSocial('linkedin')}
                  variant="outline"
                  size="sm"
                  className="bg-blue-50 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/20 dark:border-blue-800"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  LinkedIn
                </Button>

                <Button
                  onClick={() => shareOnSocial('reddit')}
                  variant="outline"
                  size="sm"
                  className="bg-orange-50 border-orange-200 hover:bg-orange-100 dark:bg-orange-950/20 dark:border-orange-800"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Reddit
                </Button>
              </div>
            </div>

            {/* Recent Memes History */}
            {memeHistory.length > 0 && (
              <div className="border-t border-muted-foreground/10 pt-6">
                <div className="text-center mb-4">
                  <p className="text-sm text-muted-foreground">Gerados recentemente:</p>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {memeHistory.map((meme, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <button
                        onClick={() => setCurrentMeme(meme)}
                        className="w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors p-2 rounded hover:bg-muted/50 flex items-center gap-2"
                      >
                        <ChevronRight className="w-3 h-3 shrink-0" />
                        <span className="truncate">{meme}</span>
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Keyboard Shortcuts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <Card className="bg-linear-to-br from-muted/30 to-muted/10 border border-muted-foreground/10">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-orange-500" />
                Dicas rápidas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div className="space-y-2">
                  <p>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">Espaço</kbd> ou{' '}
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">Enter</kbd> - Gerar novo
                    meme
                  </p>
                  <p>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">1-6</kbd> - Reações rápidas
                  </p>
                </div>
                <div className="space-y-2">
                  <p>🎯 Mais de 120 memes de DevOps</p>
                  <p>📱 Perfeito para compartilhar nas redes sociais</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* About Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <Card className="bg-linear-to-br from-muted/30 to-muted/10 border border-muted-foreground/10">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center bg-linear-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Sobre este gerador de memes
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-orange-500" />
                  Por que isso existe
                </h3>
                <p className="text-muted-foreground">
                  Todo mundo que trabalha com DevOps tem aquele momento de “isso é verdade demais” ao
                  ler sobre os perrengues da profissão. Este gerador celebra as experiências em comum,
                  as piadas internas e a rotina que unem a nossa comunidade.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Coffee className="h-5 w-5 text-orange-500" />
                  Perfeito para
                </h3>
                <ul className="text-muted-foreground space-y-2">
                  <li>• Quebrar o gelo nas reuniões do time</li>
                  <li>• Conteúdo de redes sociais para profissionais de DevOps</li>
                  <li>• Apresentações e palestras</li>
                  <li>• Compartilhar a dor (e a alegria) da vida em DevOps</li>
                </ul>
              </div>
            </div>

            <div className="text-center p-6 bg-linear-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-lg border border-orange-200/50 dark:border-orange-700/50">
              <p className="text-sm text-muted-foreground">
                <strong>💡 Dica:</strong> use os atalhos de teclado para gerar memes num piscar de olhos! Aperte
                Espaço para um novo meme ou os números de 1 a 6 para reações rápidas.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
