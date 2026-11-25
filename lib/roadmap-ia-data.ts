// Data for the /roadmap/ia page: milestone and skill definitions.
// Rendering lives in app/roadmap/ia/page.tsx.

import {
  BarChart3,
  Bot,
  Brain,
  Braces,
  CheckCircle2,
  Cpu,
  DollarSign,
  FileSearch,
  FileText,
  Gauge,
  GitBranch,
  Layers,
  Lock,
  MessageSquare,
  Network,
  Plug,
  Repeat,
  Scale,
  Scissors,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  Target,
  Thermometer,
  Workflow,
  type LucideIcon,
} from 'lucide-react';

export interface AiSkill {
  name: string;
  description: string;
  link?: string;
  simulators?: { name: string; link: string }[];
  external?: boolean;
  icon: LucideIcon;
  priority: 'essential' | 'important' | 'nice-to-have';
  estimatedHours: number;
}

export interface AiMilestone {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  timeframe: string;
  skills: AiSkill[];
  project: {
    name: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
  };
  outcomes: string[];
  tips: string[];
}

export const AI_MODULE_LINKS = {
  quiz: '/quizzes/ia-llm-rag-quiz',
  flashcards: '/flashcards/ia-llm-rag-fundamentos',
  checklist: '/checklists/ia-rag-em-producao',
  exercise: '/exercises/rag-do-zero-pgvector',
  ragSimulator: '/games/rag-pipeline-simulator',
  agentSimulator: '/games/agentic-loop-simulator',
  interview: {
    tokens: '/interview-questions/junior/ia-llm-tokens-contexto',
    rag: '/interview-questions/junior/ia-o-que-e-rag',
    retrieval: '/interview-questions/mid/ia-rag-qualidade-retrieval',
    evals: '/interview-questions/mid/ia-avaliacao-llm-producao',
    agents: '/interview-questions/senior/ia-agentes-em-producao',
    security: '/interview-questions/senior/ia-seguranca-prompt-injection',
  },
} as const;

const L = AI_MODULE_LINKS;

export const milestones: AiMilestone[] = [
  {
    id: 'ai-fundamentals',
    title: 'Fundamentos de IA e LLMs',
    subtitle: 'Mês 1',
    description:
      'Entenda o que um modelo de linguagem realmente faz antes de construir qualquer coisa com ele',
    icon: Brain,
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-500/10 border-violet-500/20',
    timeframe: '3-4 semanas',
    skills: [
      {
        name: 'IA, Machine Learning e IA Generativa',
        description:
          'Diferencie IA, machine learning, deep learning e IA generativa, e entenda o que é treino, inferência e um modelo pré-treinado',
        icon: Sparkles,
        priority: 'essential',
        estimatedHours: 8,
        link: L.flashcards,
      },
      {
        name: 'Como um LLM Gera Texto',
        description:
          'Previsão do próximo token, a intuição da arquitetura Transformer e do mecanismo de atenção, sem precisar da matemática completa',
        icon: Cpu,
        priority: 'essential',
        estimatedHours: 10,
        link: L.interview.tokens,
      },
      {
        name: 'Tokens e Janela de Contexto',
        description:
          'Como o texto vira tokens, por que português gasta mais tokens, e como entrada e saída dividem o mesmo limite',
        icon: Layers,
        priority: 'essential',
        estimatedHours: 5,
        link: L.interview.tokens,
      },
      {
        name: 'Temperature e Sampling',
        description:
          'Como temperature, top-p e max_tokens mudam o comportamento, e qual configuração usar para extração, código ou criatividade',
        icon: Thermometer,
        priority: 'important',
        estimatedHours: 4,
        link: L.quiz,
      },
      {
        name: 'Limitações e Alucinação',
        description:
          'Por que o modelo gera respostas plausíveis e falsas, data de corte do conhecimento e onde LLMs não são a ferramenta certa',
        icon: ShieldAlert,
        priority: 'essential',
        estimatedHours: 5,
        link: L.quiz,
      },
    ],
    project: {
      name: 'Diário de Experimentos com LLM',
      description:
        'Teste o mesmo conjunto de 10 perguntas com temperatures e prompts diferentes e registre quando o modelo acerta, erra ou inventa',
      difficulty: 'easy',
    },
    outcomes: [
      'Explicar para qualquer pessoa o que um LLM faz e o que ele não faz',
      'Estimar tokens e custo de uma chamada',
      'Escolher parâmetros de geração adequados para cada tarefa',
      'Reconhecer situações com alto risco de alucinação',
    ],
    tips: [
      'Use os modelos todos os dias, mas com olhar de engenharia: anote onde eles falham',
      'Não comece pela matemática; comece pela intuição e pelos limites práticos',
      'Teste sempre em português: comportamento e custo mudam em relação ao inglês',
    ],
  },
  {
    id: 'prompt-engineering',
    title: 'Prompt Engineering e APIs de LLM',
    subtitle: 'Mês 1-2',
    description: 'Transforme prompts em especificações versionadas e integre modelos ao seu código',
    icon: MessageSquare,
    color: 'text-fuchsia-600 dark:text-fuchsia-400',
    bgColor: 'bg-fuchsia-500/10 border-fuchsia-500/20',
    timeframe: '3-4 semanas',
    skills: [
      {
        name: 'Prompt de Sistema',
        description:
          'Defina papel, regras, tom, formato de saída e o que fazer quando não souber; trate o prompt como especificação do produto',
        icon: FileText,
        priority: 'essential',
        estimatedHours: 6,
        link: L.flashcards,
      },
      {
        name: 'Few-shot e Decomposição de Tarefas',
        description:
          'Use exemplos no prompt e quebre tarefas complexas em etapas menores e verificáveis em vez de um prompt gigante',
        icon: GitBranch,
        priority: 'essential',
        estimatedHours: 6,
      },
      {
        name: 'Saída Estruturada',
        description:
          'Peça JSON com schema, valide no código e trate falhas com retry ou fallback para integrar com sistemas reais',
        icon: Braces,
        priority: 'essential',
        estimatedHours: 6,
        link: L.quiz,
      },
      {
        name: 'Integração com APIs e Streaming',
        description:
          'Chamadas via SDK ou HTTP, streaming de tokens, timeouts, retries com backoff e tratamento de rate limit',
        icon: Plug,
        priority: 'important',
        estimatedHours: 8,
        link: '/quizzes/rate-limiting-apis-quiz',
      },
      {
        name: 'Versionamento de Prompts',
        description:
          'Guarde prompts no repositório, revise em pull requests e associe cada versão a resultados de avaliação',
        icon: GitBranch,
        priority: 'nice-to-have',
        estimatedHours: 3,
        link: '/exercises/git-workflow-collaboration',
      },
    ],
    project: {
      name: 'Extrator de Dados de Tickets',
      description:
        'Construa um script que lê mensagens de clientes e devolve JSON validado com categoria, urgência e número do pedido',
      difficulty: 'easy',
    },
    outcomes: [
      'Escrever prompts claros, testáveis e versionados',
      'Integrar um LLM a uma aplicação com tratamento de erros',
      'Obter saídas estruturadas confiáveis',
      'Reduzir variação de respostas com técnicas de prompt',
    ],
    tips: [
      'Um prompt bom é específico: diga o que fazer, o que não fazer e o formato exato',
      'Se a tarefa tem muitas regras, divida em etapas em vez de criar um prompt de duas páginas',
      'Nunca confie no JSON sem validar: modelos erram formato de vez em quando',
    ],
  },
  {
    id: 'embeddings-search',
    title: 'Embeddings e Busca Semântica',
    subtitle: 'Mês 2',
    description:
      'Represente significado como vetores e encontre informação por sentido, não por palavra exata',
    icon: Search,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-500/10 border-indigo-500/20',
    timeframe: '3-4 semanas',
    skills: [
      {
        name: 'Embeddings',
        description:
          'O que é um vetor de embedding, como modelos multilíngues representam português e por que textos parecidos ficam próximos',
        icon: Network,
        priority: 'essential',
        estimatedHours: 6,
        link: L.flashcards,
        simulators: [{ name: 'Simulador de Pipeline RAG', link: L.ragSimulator }],
      },
      {
        name: 'Similaridade de Cosseno',
        description:
          'A métrica mais usada para comparar embeddings, com intuição geométrica e exemplos numéricos',
        icon: Target,
        priority: 'essential',
        estimatedHours: 3,
        simulators: [{ name: 'Simulador de Pipeline RAG', link: L.ragSimulator }],
      },
      {
        name: 'Bancos Vetoriais e pgvector',
        description:
          'Armazene vetores com metadados, use índices ANN como HNSW e aproveite o PostgreSQL que você já conhece',
        icon: FileSearch,
        priority: 'essential',
        estimatedHours: 8,
        link: L.exercise,
        simulators: [{ name: 'Terminal PostgreSQL', link: '/games/postgres-terminal-simulator' }],
      },
      {
        name: 'Busca Híbrida (Vetorial + BM25)',
        description:
          'Combine busca semântica com busca por palavra-chave para não perder códigos, siglas e nomes de produtos',
        icon: Scale,
        priority: 'important',
        estimatedHours: 6,
        link: L.interview.retrieval,
      },
    ],
    project: {
      name: 'Busca Semântica de FAQ',
      description:
        'Indexe as perguntas frequentes de um produto fictício no pgvector e compare busca vetorial, full-text e híbrida',
      difficulty: 'medium',
    },
    outcomes: [
      'Gerar e armazenar embeddings em um banco de dados',
      'Implementar busca semântica com filtros por metadados',
      'Explicar quando a busca vetorial falha e como corrigir',
      'Escolher entre banco vetorial dedicado e pgvector',
    ],
    tips: [
      'Use o mesmo modelo de embeddings na indexação e na consulta, sempre',
      'Olhe os scores dos resultados: eles contam mais sobre o problema do que a resposta final',
      'Para começar, pgvector resolve a maioria dos casos sem uma nova peça de infraestrutura',
    ],
  },
  {
    id: 'rag',
    title: 'RAG: Retrieval-Augmented Generation',
    subtitle: 'Mês 3',
    description:
      'Conecte o modelo aos seus documentos para respostas atualizadas, citáveis e com menos alucinação',
    icon: FileSearch,
    color: 'text-sky-600 dark:text-sky-400',
    bgColor: 'bg-sky-500/10 border-sky-500/20',
    timeframe: '4-5 semanas',
    skills: [
      {
        name: 'Arquitetura de um Pipeline RAG',
        description:
          'Ingestão, chunking, embeddings, retrieval, montagem do prompt e geração, e o papel de cada etapa',
        icon: Workflow,
        priority: 'essential',
        estimatedHours: 6,
        link: L.interview.rag,
        simulators: [{ name: 'Simulador de Pipeline RAG', link: L.ragSimulator }],
      },
      {
        name: 'Estratégias de Chunking',
        description:
          'Corte por estrutura, tamanho de chunk, overlap e como cada escolha afeta a qualidade da resposta',
        icon: Scissors,
        priority: 'essential',
        estimatedHours: 6,
        simulators: [{ name: 'Simulador de Pipeline RAG', link: L.ragSimulator }],
      },
      {
        name: 'Reranking',
        description:
          'Reordene candidatos com um modelo mais preciso e envie poucos trechos bons em vez de muitos medianos',
        icon: BarChart3,
        priority: 'important',
        estimatedHours: 4,
        link: L.checklist,
      },
      {
        name: 'Grounding e Citação de Fontes',
        description:
          'Prompts que obrigam a responder só com base no contexto, citar a origem e dizer "não encontrei"',
        icon: CheckCircle2,
        priority: 'essential',
        estimatedHours: 4,
        link: L.checklist,
      },
      {
        name: 'Permissões no Retrieval',
        description:
          'Aplique controle de acesso antes de o trecho chegar ao modelo, nunca só por instrução no prompt',
        icon: Lock,
        priority: 'essential',
        estimatedHours: 4,
        link: L.checklist,
      },
    ],
    project: {
      name: 'RAG do Zero com pgvector',
      description:
        'Monte um assistente local que responde sobre seus documentos com citação, busca híbrida e recusa para perguntas fora do escopo',
      difficulty: 'medium',
    },
    outcomes: [
      'Construir um pipeline RAG completo de ponta a ponta',
      'Ajustar chunking e retrieval com base em evidências',
      'Garantir respostas com fonte e recusa honesta',
      'Respeitar permissões de acesso aos documentos',
    ],
    tips: [
      'A qualidade do RAG é decidida antes do LLM: documentos limpos e retrieval bom resolvem a maior parte',
      'Documento desatualizado no índice gera resposta errada com citação, o que é pior que nenhuma resposta',
      'Comece simples e adicione reranking e busca híbrida só quando a avaliação mostrar a necessidade',
    ],
  },
  {
    id: 'evaluation',
    title: 'Avaliação e Qualidade',
    subtitle: 'Mês 3-4',
    description:
      'Troque o "parece bom" por métricas, golden sets e testes automatizados de qualidade',
    icon: Gauge,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-500/10 border-emerald-500/20',
    timeframe: '3-4 semanas',
    skills: [
      {
        name: 'Golden Set',
        description:
          'Monte um conjunto fixo de perguntas reais, casos difíceis e casos de recusa, com respostas e fontes esperadas',
        icon: Target,
        priority: 'essential',
        estimatedHours: 6,
        link: L.interview.evals,
      },
      {
        name: 'Métricas de Retrieval',
        description: 'Recall@k e MRR para saber se a busca trouxe o trecho certo e em que posição',
        icon: BarChart3,
        priority: 'essential',
        estimatedHours: 4,
        link: L.interview.retrieval,
      },
      {
        name: 'Métricas de Geração',
        description:
          'Fidelidade (faithfulness), relevância, taxa de recusa correta e formato válido',
        icon: CheckCircle2,
        priority: 'essential',
        estimatedHours: 5,
        link: L.flashcards,
      },
      {
        name: 'LLM-as-a-Judge',
        description:
          'Avalie respostas abertas em escala com rubricas, conhecendo os vieses e calibrando com avaliação humana',
        icon: Scale,
        priority: 'important',
        estimatedHours: 5,
      },
      {
        name: 'Evals no CI/CD',
        description:
          'Rode avaliação a cada pull request que muda prompt, modelo ou retrieval e bloqueie regressões',
        icon: Repeat,
        priority: 'important',
        estimatedHours: 5,
        link: '/exercises/ci-cd-github-actions',
      },
    ],
    project: {
      name: 'Painel de Qualidade do Assistente',
      description:
        'Crie um script de avaliação com golden set, gere um relatório comparando duas configurações e rode no CI',
      difficulty: 'medium',
    },
    outcomes: [
      'Medir a qualidade de um sistema com LLM de forma objetiva',
      'Separar problemas de retrieval de problemas de geração',
      'Impedir regressões de qualidade antes do deploy',
      'Comunicar qualidade em números para o time e para o negócio',
    ],
    tips: [
      'Avaliação é o que separa uma demo de um produto',
      'Cada reclamação de usuário vira um novo caso no golden set',
      'Inclua perguntas que o sistema deve recusar; elas revelam alucinação',
    ],
  },
  {
    id: 'agents',
    title: 'Agentes e Ferramentas',
    subtitle: 'Mês 4-5',
    description:
      'Dê ao modelo a capacidade de agir com segurança, limites claros e observabilidade',
    icon: Bot,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-500/10 border-amber-500/20',
    timeframe: '4-5 semanas',
    skills: [
      {
        name: 'Tool Use (Function Calling)',
        description:
          'Descreva ferramentas com schema, deixe o modelo pedir a chamada e execute com validação no seu código',
        icon: Plug,
        priority: 'essential',
        estimatedHours: 6,
        link: L.flashcards,
      },
      {
        name: 'O Loop Agêntico',
        description:
          'Planejar, agir, observar e repetir até cumprir o objetivo, com limite de passos e condição de parada',
        icon: Repeat,
        priority: 'essential',
        estimatedHours: 6,
        link: L.interview.agents,
        simulators: [{ name: 'Simulador de Loop Agêntico', link: L.agentSimulator }],
      },
      {
        name: 'Workflows vs Agentes Autônomos',
        description:
          'Quando um fluxo fixo com LLM em etapas é mais confiável e barato do que um agente que decide tudo',
        icon: Workflow,
        priority: 'important',
        estimatedHours: 4,
        link: L.interview.agents,
      },
      {
        name: 'Model Context Protocol (MCP)',
        description:
          'O protocolo aberto para conectar modelos a ferramentas e fontes de dados de forma padronizada',
        icon: Network,
        priority: 'important',
        estimatedHours: 5,
        link: L.flashcards,
      },
      {
        name: 'Observabilidade de Agentes',
        description:
          'Trace de cada decisão, chamada de ferramenta, tokens e custo por tarefa para depurar e auditar',
        icon: BarChart3,
        priority: 'important',
        estimatedHours: 5,
        link: '/checklists/distributed-tracing-opentelemetry',
      },
    ],
    project: {
      name: 'Agente de Suporte com Ferramentas',
      description:
        'Construa um agente que consulta pedidos e abre tickets, com limite de passos, confirmação humana e trace completo',
      difficulty: 'hard',
    },
    outcomes: [
      'Implementar tool use com validação e permissões',
      'Projetar loops com limites e condição de parada',
      'Decidir entre workflow fixo e agente',
      'Depurar um agente a partir dos seus traces',
    ],
    tips: [
      'O modelo nunca executa nada: sua aplicação executa, e é ela quem aplica as permissões',
      'Comece com o menor número de ferramentas possível e só leitura',
      'Um agente sem limite de passos é um incidente de custo esperando para acontecer',
    ],
  },
  {
    id: 'production',
    title: 'Produção, Segurança e IA Responsável',
    subtitle: 'Mês 5-6',
    description:
      'Leve IA para usuários reais com segurança, privacidade, custo sob controle e responsabilidade',
    icon: Shield,
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-500/10 border-rose-500/20',
    timeframe: '4-6 semanas',
    skills: [
      {
        name: 'Prompt Injection',
        description:
          'Injeção direta e indireta, por que não existe filtro perfeito e como defender em camadas',
        icon: ShieldAlert,
        priority: 'essential',
        estimatedHours: 6,
        link: L.interview.security,
      },
      {
        name: 'Dados Pessoais e LGPD',
        description:
          'Minimização, mascaramento de PII, retenção do provedor, finalidade e trilha de auditoria',
        icon: Lock,
        priority: 'essential',
        estimatedHours: 5,
        link: L.checklist,
      },
      {
        name: 'Custo e Latência',
        description:
          'Roteamento entre modelos, prompt caching, limites de tokens, processamento em lote e streaming',
        icon: DollarSign,
        priority: 'essential',
        estimatedHours: 5,
        link: L.quiz,
      },
      {
        name: 'Guardrails e Fallbacks',
        description:
          'Validação de saída, timeouts, modelo alternativo e encaminhamento para uma pessoa quando algo falhar',
        icon: Shield,
        priority: 'important',
        estimatedHours: 5,
        link: L.checklist,
      },
      {
        name: 'Fine-tuning vs RAG',
        description:
          'RAG para o que o modelo deve saber, fine-tuning para como ele deve se comportar, e quando cada um compensa',
        icon: Scale,
        priority: 'nice-to-have',
        estimatedHours: 4,
        link: L.quiz,
      },
    ],
    project: {
      name: 'Lançamento Responsável',
      description:
        'Prepare o assistente para produção seguindo o checklist de RAG: permissões, PII, evals no CI, observabilidade e rollout gradual',
      difficulty: 'hard',
    },
    outcomes: [
      'Identificar e mitigar riscos de segurança específicos de LLMs',
      'Tratar dados pessoais de acordo com a LGPD',
      'Reduzir custo e latência sem perder qualidade',
      'Planejar um lançamento gradual com métricas de sucesso',
    ],
    tips: [
      'Trate o LLM como um componente não confiável: os controles ficam no código, não no prompt',
      'Envolva jurídico, segurança e as pessoas usuárias cedo; IA responsável é trabalho de time',
      'Toda otimização de custo passa pelo golden set antes de ir para produção',
    ],
  },
];
