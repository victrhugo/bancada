// Data for the /roadmap page: the skill resources database and the
// stage-by-stage roadmap. Rendering lives in app/roadmap/page.tsx; edits to
// skills, resources, or stages happen here without touching component code.

import {
  Activity,
  Archive,
  Award,
  BookMarked,
  CheckCircle2,
  Cloud,
  Code,
  Container,
  Database,
  FileText,
  GitBranch,
  Globe,
  Heart,
  InfinityIcon,
  Lock,
  Monitor,
  Server,
  Settings,
  Shield,
  Sparkles,
  Terminal,
  TrendingUp,
  Users,
  Workflow,
  type LucideIcon,
} from 'lucide-react';

export interface RoadmapSkill {
  name: string;
  link?: string;
  description?: string;
  level?: 'basic' | 'intermediate' | 'advanced';
  type?: 'tool' | 'concept' | 'practice' | 'certification';
  icon?: LucideIcon;
  external?: boolean;
}

export interface SkillResource {
  title: string;
  url: string;
  type: 'tutorial' | 'documentation' | 'course' | 'video' | 'book' | 'tool' | 'practice';
  external?: boolean;
  description?: string;
}

export interface SkillWithResources extends RoadmapSkill {
  resources?: SkillResource[];
}

// Comprehensive skill resources database
export const skillResourcesDatabase: Record<string, SkillResource[]> = {
  'Linux/Unix Basics': [
    {
      title: 'Guia de Fundamentos de Linux',
      url: '/guides/introduction-to-linux',
      type: 'tutorial',
      description: 'Guia completo dos fundamentos do Linux e comandos essenciais',
    },
    {
      title: 'Aprenda Linux - Tutorial Interativo',
      url: '/games/linux-terminal',
      type: 'practice',
      description: 'Pratique comandos Linux em um terminal simulado',
    },
    {
      title: 'Introdução ao Linux',
      url: 'https://leanpub.com/introduction-to-linux',
      type: 'book',
      external: true,
      description: 'Ebook completo sobre os fundamentos do Linux na Leanpub',
    },
  ],
  'Shell Scripting (Bash)': [
    {
      title: 'Guia de Scripts Bash',
      url: 'guides/introduction-to-bash',
      type: 'tutorial',
      description: 'Aprenda scripts bash do básico ao avançado',
    },
    {
      title: 'Introdução a Scripts Bash',
      url: 'https://github.com/bobbyiliev/introduction-to-bash-scripting',
      type: 'tutorial',
      external: true,
      description: 'Ebook open-source sobre scripts bash no GitHub',
    },
    {
      title: 'Ferramenta ShellCheck',
      url: 'https://www.shellcheck.net/',
      type: 'tool',
      external: true,
      description: 'Valide e melhore seus scripts shell',
    },
  ],
  'Basic Programming (Python/Go)': [
    {
      title: 'Python para DevOps',
      url: 'https://docs.python.org/3/tutorial/',
      type: 'documentation',
      external: true,
      description: 'Tutorial oficial do Python',
    },
    {
      title: 'Go by Example',
      url: 'https://gobyexample.com/',
      type: 'tutorial',
      external: true,
      description: 'Aprenda Go com exemplos práticos',
    },
  ],
  'Git Version Control': [
    {
      title: 'Ebook de Fundamentos de Git',
      url: 'https://github.com/bobbyiliev/introduction-to-git-and-github-ebook',
      type: 'book',
      external: true,
      description: 'Aprenda controle de versão com Git',
    },
    {
      title: 'Tutorial Interativo de Git',
      url: 'https://learngitbranching.js.org/',
      type: 'practice',
      external: true,
      description: 'Ferramenta visual para aprender Git',
    },
    {
      title: 'Quiz de Comandos Git',
      url: '/quizzes/git-quiz',
      type: 'practice',
      description: 'Teste seus conhecimentos de Git com cenários interativos',
    },
    {
      title: 'Simulador de Conceitos Git',
      url: '/games/git-concepts-simulator',
      type: 'practice',
      description: 'Visualize commits, branches e merges em um simulador interativo',
    },
  ],
  'Docker Fundamentals': [
    {
      title: 'Primeiros Passos com Docker',
      url: 'https://docs.docker.com/get-started/',
      type: 'documentation',
      external: true,
      description: 'Tutorial oficial do Docker',
    },
    {
      title: 'Curso Aprofundado de Docker',
      url: '/guides/introduction-to-docker',
      type: 'course',
      description: 'Guia completo de containerização com Docker',
    },
    {
      title: 'Ebook de Docker',
      url: 'https://github.com/bobbyiliev/introduction-to-docker-ebook',
      type: 'book',
      external: true,
      description: 'Aprenda Docker do básico ao avançado',
    },
    {
      title: 'Quiz de Docker',
      url: '/quizzes/docker-quiz',
      type: 'practice',
      description: 'Teste seus conhecimentos de Docker com cenários interativos',
    },
    {
      title: 'Play with Docker',
      url: 'https://labs.play-with-docker.com/',
      type: 'practice',
      external: true,
      description: 'Ambiente gratuito para praticar Docker',
    },
    {
      title: 'Simulador de Terminal Docker',
      url: '/games/docker-terminal-simulator',
      type: 'practice',
      description: 'Pratique comandos Docker em um terminal simulado',
    },
  ],
  'Kubernetes Basics': [
    {
      title: 'Fundamentos de Kubernetes',
      url: '/guides/introduction-to-kubernetes',
      type: 'course',
      description: 'Aprenda Kubernetes do zero',
    },
    {
      title: 'Documentação do Kubernetes',
      url: 'https://kubernetes.io/docs/',
      type: 'documentation',
      external: true,
      description: 'Documentação oficial do Kubernetes',
    },
    {
      title: 'Ambiente de Testes Kubernetes',
      url: 'https://labs.play-with-k8s.com/',
      type: 'practice',
      external: true,
      description: 'Cluster Kubernetes gratuito para aprendizado',
    },
    {
      title: 'Simulador de Terminal Kubernetes',
      url: '/games/kubernetes-terminal-simulator',
      type: 'practice',
      description: 'Pratique comandos kubectl em um cluster simulado',
    },
  ],
  Terraform: [
    {
      title: 'Tutoriais de Terraform',
      url: '/categories/terraform',
      type: 'tutorial',
      description: 'Infraestrutura como Código com Terraform',
    },
    {
      title: 'Ebook de Terraform',
      url: 'https://leanpub.com/introduction-to-terraform',
      type: 'book',
      external: true,
      description: 'Aprenda Terraform do básico ao avançado',
    },
    {
      title: 'Documentação do Terraform',
      url: 'https://developer.hashicorp.com/terraform/docs',
      type: 'documentation',
      external: true,
      description: 'Documentação oficial do Terraform',
    },
    {
      title: 'Ambiente de Testes Terraform',
      url: 'https://developer.hashicorp.com/terraform/tutorials',
      type: 'practice',
      external: true,
      description: 'Tutoriais práticos de Terraform',
    },
    {
      title: 'Quiz de Terraform',
      url: '/quizzes/terraform-quiz',
      type: 'practice',
      description: 'Teste seus conhecimentos de Terraform com cenários interativos',
    },
  ],
  'GitHub Actions': [
    {
      title: 'Introdução a CI/CD',
      url: '/guides/introduction-to-cicd',
      type: 'tutorial',
      description: 'Aprenda os fundamentos de pipelines de CI/CD',
    },
    {
      title: 'Guia do GitHub Actions',
      url: 'https://docs.github.com/en/actions',
      type: 'documentation',
      external: true,
      description: 'Documentação do GitHub Actions',
    },
    {
      title: 'Gerador de Stack de CI/CD',
      url: '/games/cicd-stack-generator',
      type: 'tool',
      description: 'Gere a stack de CI/CD perfeita para você',
    },
  ],
  'AWS Fundamentals': [
    {
      title: 'Primeiros Passos com AWS',
      url: '/guides/introduction-to-aws',
      type: 'course',
      description: 'Aprenda AWS para DevOps',
    },
    {
      title: 'Documentação da AWS',
      url: 'https://docs.aws.amazon.com/',
      type: 'documentation',
      external: true,
      description: 'Documentação oficial da AWS',
    },
    {
      title: 'AWS Free Tier',
      url: 'https://aws.amazon.com/free/',
      type: 'practice',
      external: true,
      description: 'Pratique com a camada gratuita da AWS',
    },
    {
      title: 'Simulador de VPC da AWS',
      url: '/games/aws-vpc-simulator',
      type: 'practice',
      description: 'Construa e explore um layout de rede VPC de forma interativa',
    },
  ],
  'Prometheus & Grafana': [
    {
      title: 'Tutorial de Prometheus',
      url: 'https://prometheus.io/docs/prometheus/latest/getting_started/',
      type: 'tutorial',
      external: true,
      description: 'Primeiros passos com Prometheus',
    },
    {
      title: 'Documentação do Grafana',
      url: 'https://grafana.com/docs/',
      type: 'documentation',
      external: true,
      description: 'Documentação da plataforma de visualização Grafana',
    },
  ],
  'Networking Fundamentals': [
    {
      title: 'Simulador de Resolução DNS',
      url: '/games/dns-simulator',
      type: 'practice',
      description: 'Acompanhe passo a passo como uma consulta DNS é resolvida',
    },
  ],
  'Container Networking': [
    {
      title: 'Simulador de Políticas de Rede do Kubernetes',
      url: '/games/kubernetes-networking-cni-simulator',
      type: 'practice',
      description: 'Veja como as políticas de rede CNI permitem e bloqueiam o tráfego entre pods',
    },
    {
      title: 'Simulador de Load Balancer',
      url: '/games/load-balancer-simulator',
      type: 'practice',
      description: 'Explore algoritmos de balanceamento de carga e distribuição de tráfego',
    },
  ],
};

export interface RoadmapProject {
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  technologies: string[];
  githubUrl?: string;
  liveDemo?: string;
}

export interface CareerProgression {
  jobTitles: string[];
  salaryRange: string;
  demandLevel: 'low' | 'medium' | 'high' | 'very-high';
  nextSteps: string[];
  industryAdoption: string;
}

export interface RoadmapStage {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  skills: RoadmapSkill[];
  timeEstimate: string;
  color?: string;
  prerequisites?: string[];
  outcomes?: string[];
  badge?: string;
  projects?: RoadmapProject[];
  careerProgression?: CareerProgression;
  marketContext?: string;
  industryStats?: string;
}

export const roadmapStages: RoadmapStage[] = [
  {
    id: 'fundamentals',
    title: 'Fundamentos',
    description:
      'Construa uma base sólida com habilidades essenciais de programação e administração de sistemas',
    icon: Terminal,
    timeEstimate: '2-3 semanas',
    color: 'from-amber-500 via-orange-500 to-red-500',
    badge: 'Base',
    prerequisites: ['Conhecimento básico de informática', 'Vontade de aprender'],
    outcomes: [
      'Proficiência em linha de comando',
      'Habilidades básicas de programação',
      'Entendimento de sistemas',
    ],
    marketContext:
      'Habilidades de base essenciais exigidas em 95% das vagas de DevOps. As empresas valorizam cada vez mais engenheiros que entendem tanto de desenvolvimento quanto de operações.',
    industryStats: '🔥 Habilidades em Linux mencionadas em 89% das vagas de DevOps',
    careerProgression: {
      jobTitles: [
        'Engenheiro(a) DevOps Júnior',
        'Administrador(a) de Sistemas',
        'Estagiário(a) de Platform Engineering',
      ],
      salaryRange: 'US$ 45.000 - US$ 70.000',
      demandLevel: 'very-high',
      nextSteps: [
        'Especializar-se em plataformas de nuvem',
        'Aprender containerização',
        'Focar em ferramentas de automação',
      ],
      industryAdoption: 'Universal - Exigido por todas as grandes empresas de tecnologia',
    },
    projects: [
      {
        name: 'Ambiente de Desenvolvimento Pessoal',
        description:
          'Configure um ambiente de desenvolvimento completo com Linux, Git e scripts de automação básicos',
        difficulty: 'beginner',
        estimatedTime: '1-2 dias',
        technologies: ['Linux', 'Git', 'Bash', 'VS Code'],
      },
      {
        name: 'Painel de Monitoramento de Sistema',
        description:
          'Crie scripts Bash para monitorar recursos do sistema e gerar relatórios',
        difficulty: 'intermediate',
        estimatedTime: '3-5 dias',
        technologies: ['Bash', 'Cron', 'Python', 'HTML/CSS'],
      },
      {
        name: 'Solução de Backup Automatizado',
        description: 'Construa um sistema de backup automatizado usando shell scripts e cron jobs',
        difficulty: 'intermediate',
        estimatedTime: '2-3 dias',
        technologies: ['Bash', 'Cron', 'Rsync', 'Git'],
      },
    ],
    skills: [
      {
        name: 'Linux/Unix Basics',
        description: 'Aprenda comandos essenciais do Linux e navegação no sistema de arquivos',
        level: 'basic',
        type: 'concept',
        icon: Terminal,
        link: '/guides/introduction-to-linux',
      },
      {
        name: 'Shell Scripting (Bash)',
        description: 'Automatize tarefas com scripts shell poderosos',
        level: 'basic',
        type: 'tool',
        icon: Code,
        link: '/guides/introduction-to-bash',
      },
      {
        name: 'Basic Programming (Python/Go)',
        description: 'Aprenda os fundamentos de programação com Python ou Go',
        level: 'basic',
        type: 'concept',
        icon: FileText,
        link: '/guides/introduction-to-python',
      },
      {
        name: 'Networking Fundamentals',
        description: 'Entenda TCP/IP, DNS, HTTP e protocolos de rede',
        level: 'basic',
        type: 'concept',
        icon: Globe,
        link: '/guides/networking-fundamentals',
      },
      {
        name: 'Git Version Control',
        description: 'Aprenda controle de versão com Git e GitHub',
        level: 'basic',
        type: 'tool',
        icon: GitBranch,
        link: '/guides/introduction-to-git',
      },
    ],
  },
  {
    id: 'infrastructure',
    title: 'Infraestrutura como Código',
    description: 'Aprenda a provisionar e gerenciar infraestrutura por meio de código',
    icon: Server,
    timeEstimate: '2-3 semanas',
    color: 'from-emerald-400 via-teal-500 to-cyan-600',
    badge: 'Especialista em IaC',
    prerequisites: ['Fundamentos de Linux', 'Programação básica'],
    outcomes: [
      'Automação de infraestrutura',
      'Gerenciamento de configuração',
      'Implantações reproduzíveis',
    ],
    marketContext:
      'Infraestrutura como Código é um mercado de US$ 8,4 bilhões crescendo 25% ao ano. As empresas economizam de 40% a 60% em custos de infraestrutura através da automação.',
    industryStats: '📈 Habilidades em IaC aumentam o potencial salarial em 25-40%',
    careerProgression: {
      jobTitles: [
        'Engenheiro(a) de Infraestrutura',
        'Platform Engineer',
        'Engenheiro(a) de Nuvem',
        'Engenheiro(a) DevOps',
      ],
      salaryRange: 'US$ 75.000 - US$ 120.000',
      demandLevel: 'very-high',
      nextSteps: [
        'Especializar-se em plataformas de nuvem',
        'Aprender automação avançada',
        'Focar em segurança',
      ],
      industryAdoption: 'Adotado por 78% das empresas para infraestrutura em nuvem',
    },
    projects: [
      {
        name: 'Infraestrutura Multi-Ambiente',
        description:
          'Crie ambientes de desenvolvimento, homologação e produção usando Terraform',
        difficulty: 'intermediate',
        estimatedTime: '1-2 semanas',
        technologies: ['Terraform', 'AWS/Azure', 'Ansible', 'Git'],
      },
      {
        name: 'Stack de Aplicação Web Automatizada',
        description:
          'Implante uma stack de aplicação web completa com load balancers, bancos de dados e monitoramento',
        difficulty: 'advanced',
        estimatedTime: '2-3 semanas',
        technologies: ['Terraform', 'Ansible', 'Nginx', 'PostgreSQL', 'Prometheus'],
      },
      {
        name: 'Pipeline de Testes de Infraestrutura',
        description:
          'Construa um pipeline de CI/CD que testa mudanças de infraestrutura antes da implantação',
        difficulty: 'advanced',
        estimatedTime: '1-2 semanas',
        technologies: ['Terraform', 'Terratest', 'GitHub Actions', 'Checkov'],
      },
    ],
    skills: [
      {
        name: 'Terraform',
        description: 'Provisione infraestrutura em nuvem com o Terraform da HashiCorp',
        level: 'intermediate',
        type: 'tool',
        icon: Settings,
        link: '/categories/terraform',
      },
      {
        name: 'Ansible',
        description: 'Automatize o gerenciamento de configuração e a implantação de aplicações',
        level: 'intermediate',
        type: 'tool',
        icon: Settings,
        link: '/guides/introduction-to-ansible',
      },
      {
        name: 'CloudFormation',
        description: 'Serviço nativo da AWS para infraestrutura como código',
        level: 'intermediate',
        type: 'tool',
        icon: Cloud,
        link: 'https://docs.aws.amazon.com/cloudformation/',
        external: true,
      },
      {
        name: 'Configuration Management',
        description: 'Entenda os princípios e ferramentas de gerenciamento de configuração',
        level: 'basic',
        type: 'concept',
        icon: Settings,
      },
      {
        name: 'Infrastructure Testing',
        description: 'Teste e valide código de infraestrutura',
        level: 'advanced',
        type: 'practice',
        icon: CheckCircle2,
      },
    ],
  },
  {
    id: 'containers',
    title: 'Containerização e Orquestração',
    description: 'Aprenda tecnologias de containers e plataformas de orquestração',
    icon: Container,
    timeEstimate: '3-4 semanas',
    color: 'from-indigo-500 via-purple-600 to-pink-600',
    badge: 'Especialista em Containers',
    prerequisites: ['Fundamentos de Linux', 'Rede básica'],
    outcomes: [
      'Especialização em containers',
      'Proficiência em Kubernetes',
      'Entendimento de microsserviços',
    ],
    marketContext:
      'A adoção de containers cresceu 300% nos últimos 3 anos. O Kubernetes é usado por 83% dos usuários de containers, tornando-se essencial no DevOps moderno.',
    industryStats: '🚀 Especialização em Kubernetes gera um prêmio salarial de 30%',
    careerProgression: {
      jobTitles: [
        'Engenheiro(a) de Plataforma de Containers',
        'Administrador(a) de Kubernetes',
        'Site Reliability Engineer',
        'Arquiteto(a) de Plataforma',
      ],
      salaryRange: 'US$ 85.000 - US$ 140.000',
      demandLevel: 'very-high',
      nextSteps: [
        'Aprender tecnologias de service mesh',
        'Aprender padrões avançados de Kubernetes',
        'Focar em segurança de containers',
      ],
      industryAdoption: 'Usado por 96% das organizações, seja em produção ou em piloto',
    },
    projects: [
      {
        name: 'Plataforma de E-commerce com Microsserviços',
        description:
          'Construa e implante uma aplicação completa de microsserviços usando Docker e Kubernetes',
        difficulty: 'advanced',
        estimatedTime: '2-3 semanas',
        technologies: ['Docker', 'Kubernetes', 'Helm', 'Istio', 'PostgreSQL', 'Redis'],
      },
      {
        name: 'Pipeline de CI/CD para Containers',
        description:
          'Crie um pipeline que constrói, testa e implanta aplicações containerizadas',
        difficulty: 'intermediate',
        estimatedTime: '1-2 semanas',
        technologies: ['Docker', 'GitHub Actions', 'Kubernetes', 'Harbor Registry'],
      },
      {
        name: 'Configuração de Cluster Kubernetes',
        description: 'Configure um cluster Kubernetes pronto para produção com monitoramento e logging',
        difficulty: 'advanced',
        estimatedTime: '1-2 semanas',
        technologies: ['Kubernetes', 'Prometheus', 'Grafana', 'ELK Stack', 'Ingress'],
      },
    ],
    skills: [
      {
        name: 'Docker Fundamentals',
        description: 'Aprenda containerização com Docker',
        level: 'basic',
        type: 'tool',
        icon: Container,
        link: '/guides/introduction-to-docker',
      },
      {
        name: 'Container Networking',
        description: 'Entenda como os containers se comunicam',
        level: 'intermediate',
        type: 'concept',
        icon: Globe,
        link: 'https://devdojo.com/post/bobbyiliev/docker-networking-a-quick-guide-to-get-you-started',
        external: true,
      },
      {
        name: 'Kubernetes Basics',
        description: 'Implante e gerencie aplicações no Kubernetes',
        level: 'intermediate',
        type: 'tool',
        icon: Settings,
        link: '/guides/introduction-to-kubernetes',
      },
      {
        name: 'Helm Charts',
        description: 'Empacote e implante aplicações Kubernetes',
        level: 'intermediate',
        type: 'tool',
        icon: BookMarked,
        link: 'https://helm.sh/docs/',
        external: true,
      },
      {
        name: 'Container Security',
        description: 'Proteja aplicações containerizadas e o ambiente de execução',
        level: 'advanced',
        type: 'practice',
        icon: Shield,
        link: 'https://devdojo.com/post/bobbyiliev/5-docker-best-practices-i-wish-i-knew-when-i-started',
        external: true,
      },
    ],
  },
  {
    id: 'cicd',
    title: 'Pipelines de CI/CD',
    description: 'Construa pipelines de implantação automatizados para entrega contínua',
    icon: Workflow,
    timeEstimate: '2-3 semanas',
    color: 'from-lime-400 via-green-500 to-emerald-600',
    badge: 'Especialista em Pipelines',
    prerequisites: ['Controle de versão com Git', 'Containerização básica'],
    outcomes: ['Implantações automatizadas', 'Integração de testes', 'Gestão de releases'],
    marketContext:
      'Organizações com práticas maduras de CI/CD implantam 46x mais frequentemente, com tempos de recuperação 96% mais rápidos. A adoção de GitOps cresceu 75% ano a ano.',
    industryStats: '⚡ Times com CI/CD implantam 2.555x mais frequentemente',
    careerProgression: {
      jobTitles: [
        'Engenheiro(a) de Release',
        'Engenheiro(a) DevOps',
        'Platform Engineer',
        'Especialista em CI/CD',
      ],
      salaryRange: 'US$ 80.000 - US$ 130.000',
      demandLevel: 'very-high',
      nextSteps: [
        'Aprender padrões de GitOps',
        'Aprender estratégias avançadas de testes',
        'Focar em integração de segurança',
      ],
      industryAdoption: 'Usado por 87% das organizações de software para entregas mais rápidas',
    },
    projects: [
      {
        name: 'Pipeline de CI/CD em Múltiplos Estágios',
        description: 'Construa um pipeline completo com testes, verificação de segurança e implantação',
        difficulty: 'intermediate',
        estimatedTime: '1-2 semanas',
        technologies: ['GitHub Actions', 'Docker', 'SonarQube', 'Kubernetes', 'ArgoCD'],
      },
      {
        name: 'Sistema de Implantação GitOps',
        description: 'Implemente um fluxo de trabalho GitOps para implantações automatizadas com ArgoCD',
        difficulty: 'advanced',
        estimatedTime: '2-3 semanas',
        technologies: ['ArgoCD', 'Helm', 'Kubernetes', 'Git', 'Prometheus'],
      },
      {
        name: 'Pipeline de Implantação Blue-Green',
        description: 'Crie uma estratégia de implantação sem downtime com rollback automatizado',
        difficulty: 'advanced',
        estimatedTime: '1-2 semanas',
        technologies: ['Jenkins', 'Kubernetes', 'Helm', 'Monitoring', 'Load Balancer'],
      },
    ],
    skills: [
      {
        name: 'GitHub Actions',
        description: 'Automatize fluxos de trabalho com o GitHub Actions',
        level: 'basic',
        type: 'tool',
        icon: GitBranch,
        link: '/guides/introduction-to-cicd',
      },
      {
        name: 'Jenkins',
        description: 'Construa pipelines de CI/CD com o Jenkins',
        level: 'intermediate',
        type: 'tool',
        icon: Workflow,
        link: 'https://www.jenkins.io/doc/pipeline/tour/getting-started/',
        external: true,
      },
      {
        name: 'GitLab CI',
        description: 'Integração contínua com o GitLab',
        level: 'intermediate',
        type: 'tool',
        icon: GitBranch,
        link: 'https://docs.gitlab.com/ee/ci/',
        external: true,
      },
      {
        name: 'ArgoCD',
        description: 'Entrega contínua com GitOps para Kubernetes',
        level: 'advanced',
        type: 'tool',
        icon: Workflow,
        link: 'https://argo-cd.readthedocs.io/en/stable/',
        external: true,
      },
      {
        name: 'Testing Automation',
        description: 'Integre testes automatizados nos pipelines',
        level: 'intermediate',
        type: 'practice',
        icon: CheckCircle2,
      },
    ],
  },
  {
    id: 'cloud',
    title: 'Plataformas de Nuvem',
    description: 'Conheça os principais provedores de serviços em nuvem e seus serviços',
    icon: Cloud,
    timeEstimate: '4-6 semanas',
    color: 'from-sky-400 via-blue-500 to-indigo-600',
    badge: 'Arquiteto(a) de Nuvem',
    prerequisites: ['Infraestrutura como Código', 'Fundamentos de rede'],
    outcomes: ['Especialização multi-cloud', 'Otimização de custos', 'Design de arquitetura'],
    marketContext:
      'O mercado de nuvem atingiu US$ 545 bilhões em 2024. 92% das empresas têm estratégia multi-cloud. A AWS detém 33% do market share, seguida pela Azure (22%) e pelo GCP (11%).',
    industryStats: '☁️ Profissionais certificados em nuvem ganham, em média, 25% a mais',
    careerProgression: {
      jobTitles: [
        'Engenheiro(a) de Nuvem',
        'Arquiteto(a) de Soluções',
        'Engenheiro(a) de Segurança em Nuvem',
        'Principal Engineer',
      ],
      salaryRange: 'US$ 95.000 - US$ 180.000',
      demandLevel: 'very-high',
      nextSteps: [
        'Buscar certificações em nuvem',
        'Especializar-se em segurança na nuvem',
        'Aprender gerenciamento multi-cloud',
      ],
      industryAdoption: 'Adotado por 94% das empresas globalmente',
    },
    projects: [
      {
        name: 'Arquitetura Multi-Cloud',
        description: 'Projete e implemente uma aplicação que roda em AWS, Azure e GCP',
        difficulty: 'advanced',
        estimatedTime: '3-4 semanas',
        technologies: ['AWS', 'Azure', 'GCP', 'Terraform', 'Kubernetes', 'Load Balancers'],
      },
      {
        name: 'Suíte de Aplicações Serverless',
        description:
          'Construa uma aplicação serverless completa com API Gateway, Lambda e DynamoDB',
        difficulty: 'intermediate',
        estimatedTime: '2-3 semanas',
        technologies: ['AWS Lambda', 'API Gateway', 'DynamoDB', 'CloudFormation', 'S3'],
      },
      {
        name: 'Painel de Otimização de Custos',
        description: 'Crie monitoramento automatizado de custos e recomendações de otimização',
        difficulty: 'advanced',
        estimatedTime: '1-2 semanas',
        technologies: ['CloudWatch', 'AWS Cost Explorer', 'Python', 'Grafana', 'Lambda'],
      },
    ],
    skills: [
      {
        name: 'DigitalOcean',
        description: 'Infraestrutura e serviços em nuvem para desenvolvedores',
        level: 'basic',
        type: 'tool',
        icon: Cloud,
        link: 'https://www.digitalocean.com/docs/',
      },
      {
        name: 'AWS Fundamentals',
        description: 'Aprenda os principais serviços e conceitos da AWS',
        level: 'basic',
        type: 'tool',
        icon: Cloud,
        link: '/guides/introduction-to-aws',
      },
      {
        name: 'Azure Services',
        description: 'Essenciais da plataforma de nuvem Microsoft Azure',
        level: 'intermediate',
        type: 'tool',
        icon: Cloud,
        link: 'https://docs.microsoft.com/en-us/azure/',
        external: true,
      },
      {
        name: 'Google Cloud Platform',
        description: 'Serviços e arquitetura de nuvem do GCP',
        level: 'intermediate',
        type: 'tool',
        icon: Cloud,
        link: 'https://cloud.google.com/docs',
        external: true,
      },
      {
        name: 'Cost Optimization',
        description: 'Otimize custos de nuvem e o uso de recursos',
        level: 'intermediate',
        type: 'practice',
        icon: TrendingUp,
        link: '/guides/finops-for-devops-engineers',
      },
      {
        name: 'AWS Certified Solutions Architect',
        description: 'Certificação profissional para AWS',
        level: 'advanced',
        type: 'certification',
        icon: Award,
        link: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/',
        external: true,
      },
    ],
  },
  {
    id: 'monitoring',
    title: 'Monitoramento e Observabilidade',
    description: 'Implemente soluções abrangentes de monitoramento e observabilidade',
    icon: Activity,
    timeEstimate: '2-3 semanas',
    color: 'from-yellow-400 via-amber-500 to-orange-600',
    badge: 'Especialista em SRE',
    prerequisites: ['Fundamentos de containers', 'Fundamentos de nuvem'],
    outcomes: [
      'Visibilidade do sistema',
      'Resposta a incidentes',
      'Otimização de performance',
    ],
    marketContext:
      'O mercado de observabilidade cresce a uma CAGR de 8,2%, chegando a US$ 1,6 bilhão até 2025. Empresas com práticas maduras de observabilidade têm MTTR 69% mais rápido.',
    industryStats: '📊 Vagas de SRE cresceram 34% ano a ano',
    careerProgression: {
      jobTitles: [
        'Site Reliability Engineer',
        'Engenheiro(a) de Observabilidade',
        'Platform Reliability Engineer',
        'SRE Principal',
      ],
      salaryRange: 'US$ 105.000 - US$ 200.000',
      demandLevel: 'very-high',
      nextSteps: [
        'Gerenciar chaos engineering',
        'Aprender design avançado de SLO/SLI',
        'Especializar-se em sistemas distribuídos',
      ],
      industryAdoption: 'Crítico para 89% das organizações cloud-native',
    },
    projects: [
      {
        name: 'Stack Completa de Observabilidade',
        description: 'Construa monitoramento de ponta a ponta para uma aplicação de microsserviços',
        difficulty: 'advanced',
        estimatedTime: '2-3 semanas',
        technologies: ['Prometheus', 'Grafana', 'Jaeger', 'ELK Stack', 'AlertManager'],
      },
      {
        name: 'Painel de Monitoramento de SLO',
        description: 'Crie rastreamento de SLI/SLO com alertas automatizados e error budgets',
        difficulty: 'advanced',
        estimatedTime: '1-2 semanas',
        technologies: ['Prometheus', 'Grafana', 'SLO Library', 'PagerDuty', 'Kubernetes'],
      },
      {
        name: 'Ferramenta de Análise de Performance',
        description: 'Construa um sistema automatizado de detecção de regressão de performance',
        difficulty: 'intermediate',
        estimatedTime: '1-2 semanas',
        technologies: ['Prometheus', 'Python', 'Grafana', 'Statistical Analysis', 'Alerts'],
      },
    ],
    skills: [
      {
        name: 'Prometheus & Grafana',
        description: 'Coleta e visualização de métricas',
        level: 'intermediate',
        type: 'tool',
        icon: Activity,
        link: 'https://www.digitalocean.com/community/developer-center/setting-up-monitoring-for-digitalocean-managed-databases-with-prometheus-and-grafana',
        external: true,
      },
      {
        name: 'ELK Stack',
        description: 'Elasticsearch, Logstash e Kibana para logs',
        level: 'intermediate',
        type: 'tool',
        icon: FileText,
        link: 'https://www.digitalocean.com/community/tutorials/how-to-install-elasticsearch-logstash-and-kibana-elastic-stack-on-ubuntu-20-04',
        external: true,
      },
      {
        name: 'APM Tools',
        description: 'Monitoramento de Performance de Aplicações',
        level: 'intermediate',
        type: 'tool',
        icon: Monitor,
      },
      {
        name: 'Distributed Tracing',
        description: 'Rastreie requisições entre microsserviços',
        level: 'advanced',
        type: 'concept',
        icon: GitBranch,
      },
    ],
  },
  {
    id: 'security',
    title: 'Segurança e Compliance',
    description: 'Implemente práticas de DevSecOps e automação de segurança',
    icon: Shield,
    timeEstimate: '3-4 semanas',
    color: 'from-rose-500 via-red-600 to-pink-700',
    badge: 'Campeão(ã) de Segurança',
    prerequisites: ['Pipelines de CI/CD', 'Fundamentos de segurança de containers'],
    outcomes: ['Automação de segurança', 'Gestão de compliance', 'Mitigação de ameaças'],
    marketContext:
      'O mercado de DevSecOps deve atingir US$ 23,2 bilhões até 2027. 85% das organizações planejam aumentar o investimento em automação de segurança em 2024.',
    industryStats: '🔒 Vagas de DevSecOps aumentaram 164% nos últimos 2 anos',
    careerProgression: {
      jobTitles: [
        'Engenheiro(a) DevSecOps',
        'Engenheiro(a) de Segurança',
        'Engenheiro(a) de Compliance',
        'Arquiteto(a) de Segurança',
      ],
      salaryRange: 'US$ 110.000 - US$ 190.000',
      demandLevel: 'very-high',
      nextSteps: [
        'Buscar certificações de segurança',
        'Aprender modelagem de ameaças',
        'Aprender arquitetura zero-trust',
      ],
      industryAdoption: 'Prioridade crítica para 76% das organizações',
    },
    projects: [
      {
        name: 'Pipeline de CI/CD Seguro',
        description: 'Construa um pipeline com verificação de segurança e checagens de compliance integradas',
        difficulty: 'advanced',
        estimatedTime: '2-3 semanas',
        technologies: ['SAST/DAST', 'Container Scanning', 'Secret Detection', 'Policy as Code'],
      },
      {
        name: 'Rede Zero Trust',
        description: 'Implemente princípios de zero-trust com service mesh e mTLS',
        difficulty: 'advanced',
        estimatedTime: '2-3 semanas',
        technologies: ['Istio', 'Cert-Manager', 'OPA Gatekeeper', 'Falco', 'Network Policies'],
      },
      {
        name: 'Automação de Compliance',
        description: 'Automatize relatórios e correções de compliance para SOC2/GDPR',
        difficulty: 'intermediate',
        estimatedTime: '1-2 semanas',
        technologies: ['Open Policy Agent', 'Falco', 'Cloud Security Tools', 'Automation Scripts'],
      },
    ],
    skills: [
      {
        name: 'Security Scanning',
        description: 'Verificação automatizada de vulnerabilidades em pipelines',
        level: 'intermediate',
        type: 'tool',
        icon: Shield,
      },
      {
        name: 'Secrets Management',
        description: 'Gerenciamento seguro de segredos e credenciais',
        level: 'intermediate',
        type: 'practice',
        icon: Lock,
      },
      {
        name: 'RBAC & IAM',
        description: 'Controle de acesso baseado em papéis e gerenciamento de identidade',
        level: 'intermediate',
        type: 'concept',
        icon: Users,
      },
      {
        name: 'Compliance Automation',
        description: 'Automatize checagens e relatórios de compliance',
        level: 'advanced',
        type: 'practice',
        icon: CheckCircle2,
      },
      {
        name: 'Container Security',
        description: 'Segurança avançada de containers e do ambiente de execução',
        level: 'advanced',
        type: 'practice',
        icon: Container,
      },
    ],
  },
  {
    id: 'databases',
    title: 'Gerenciamento de Banco de Dados',
    description: 'Lide com persistência de dados, escalabilidade e operações de banco de dados',
    icon: Database,
    timeEstimate: '2-3 semanas',
    color: 'from-violet-400 via-fuchsia-500 to-purple-700',
    badge: 'Engenheiro(a) de Dados',
    prerequisites: ['Programação básica', 'Fundamentos de nuvem'],
    outcomes: [
      'Especialização em banco de dados',
      'Confiabilidade de dados',
      'Otimização de performance',
    ],
    marketContext:
      'O mercado de bancos de dados cresce a uma CAGR de 14%. 73% das organizações usam múltiplos tipos de banco de dados. Bancos de dados em nuvem representam 68% das novas implantações.',
    industryStats: '💾 Especialização em bancos de dados adiciona de US$ 15 a 20 mil ao salário-base',
    careerProgression: {
      jobTitles: [
        'Engenheiro(a) de Banco de Dados',
        'Engenheiro(a) de Plataforma de Dados',
        'Administrador(a) de Banco de Dados',
        'Arquiteto(a) de Dados',
      ],
      salaryRange: 'US$ 85.000 - US$ 150.000',
      demandLevel: 'high',
      nextSteps: [
        'Aprender plataformas de streaming de dados',
        'Aprender segurança de banco de dados',
        'Focar em governança de dados',
      ],
      industryAdoption: 'Essencial para 100% das organizações orientadas por dados',
    },
    projects: [
      {
        name: 'Pipeline de Migração de Banco de Dados',
        description: 'Automatize a migração de sistemas legados para bancos de dados em nuvem',
        difficulty: 'advanced',
        estimatedTime: '2-3 semanas',
        technologies: [
          'Database Migration Service',
          'ETL Tools',
          'Monitoring',
          'Rollback Strategies',
        ],
      },
      {
        name: 'Arquitetura Multi-Banco de Dados',
        description: 'Projete persistência poliglota com diferentes tipos de banco de dados',
        difficulty: 'advanced',
        estimatedTime: '2-3 semanas',
        technologies: ['PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch', 'Data Sync'],
      },
      {
        name: 'Sistema de Monitoramento de Banco de Dados',
        description: 'Construa um monitoramento abrangente de performance de banco de dados',
        difficulty: 'intermediate',
        estimatedTime: '1-2 semanas',
        technologies: ['Prometheus', 'Grafana', 'Database Exporters', 'Alert Rules'],
      },
    ],
    skills: [
      {
        name: 'SQL & NoSQL Databases',
        description: 'Trabalhe com bancos de dados relacionais e não relacionais',
        level: 'basic',
        type: 'concept',
        icon: Database,
        link: 'https://github.com/bobbyiliev/introduction-to-sql',
        external: true,
      },
      {
        name: 'Database Automation',
        description: 'Automatize implantações e migrações de banco de dados',
        level: 'intermediate',
        type: 'practice',
        icon: Settings,
      },
      {
        name: 'Backup Strategies',
        description: 'Implemente procedimentos robustos de backup e recuperação',
        level: 'intermediate',
        type: 'practice',
        icon: Archive,
      },
      {
        name: 'Performance Tuning',
        description: 'Otimize a performance e as queries do banco de dados',
        level: 'advanced',
        type: 'practice',
        icon: TrendingUp,
      },
      {
        name: 'Data Migration',
        description: 'Planeje e execute migrações de banco de dados',
        level: 'advanced',
        type: 'practice',
        icon: Workflow,
      },
    ],
  },
  {
    id: 'lifetime',
    title: 'Aprendizado Contínuo',
    description: 'Abrace o aprendizado contínuo e a contribuição com a comunidade',
    icon: InfinityIcon,
    timeEstimate: 'Para sempre',
    color:
      'from-pink-400 via-rose-500 via-orange-500 via-yellow-500 via-green-500 via-blue-500 via-indigo-500 to-purple-600',
    badge: 'Aprendiz Vitalício',
    prerequisites: ['Curiosidade', 'Mentalidade de crescimento'],
    outcomes: ['Crescimento contínuo', 'Impacto na comunidade', 'Compartilhamento de conhecimento'],
    marketContext:
      'A tecnologia muda rapidamente - 50% das habilidades ficam obsoletas a cada 2 a 5 anos. Quem aprende continuamente tem 40% mais chances de ser promovido.',
    industryStats: '🚀 Quem aprende continuamente ganha 47% a mais ao longo da carreira',
    careerProgression: {
      jobTitles: [
        'Engenheiro(a) Sênior',
        'Staff Engineer',
        'Principal Engineer',
        'Distinguished Engineer',
        'CTO',
      ],
      salaryRange: 'US$ 150.000 - US$ 500.000+',
      demandLevel: 'very-high',
      nextSteps: [
        'Tornar-se uma referência no assunto',
        'Ser mentor(a) de outras pessoas',
        'Contribuir com projetos open source',
        'Palestrar em conferências',
      ],
      industryAdoption: 'Essencial para o sucesso da carreira no longo prazo',
    },
    projects: [
      {
        name: 'Contribuição em Open Source',
        description: 'Contribua com as principais ferramentas de DevOps ou crie seu próprio projeto',
        difficulty: 'advanced',
        estimatedTime: 'Contínuo',
        technologies: ['GitHub', 'Community Building', 'Documentation', 'Code Review'],
      },
      {
        name: 'Série de Posts Técnicos',
        description: 'Compartilhe sua jornada e aprendizados em DevOps por meio de posts regulares',
        difficulty: 'intermediate',
        estimatedTime: 'Contínuo',
        technologies: ['Writing', 'SEO', 'Community Engagement', 'Personal Branding'],
      },
      {
        name: 'Programa de Mentoria',
        description: 'Oriente engenheiros júnior e contribua com o crescimento da comunidade',
        difficulty: 'intermediate',
        estimatedTime: 'Contínuo',
        technologies: ['Leadership', 'Communication', 'Knowledge Transfer', 'Career Coaching'],
      },
    ],
    skills: [
      {
        name: 'Stay Curious & Experiment',
        description: 'Explore sempre novas tecnologias e abordagens',
        level: 'basic',
        type: 'practice',
        icon: Sparkles,
      },
      {
        name: 'Open Source Contribution',
        description: 'Contribua com projetos open source',
        level: 'intermediate',
        type: 'practice',
        icon: GitBranch,
        link: 'https://github.com/',
        external: true,
      },
      {
        name: 'Technical Writing & Blogging',
        description: 'Compartilhe conhecimento por meio da escrita',
        level: 'intermediate',
        type: 'practice',
        icon: FileText,
        // link: '/posts/technical-writing-guide',
      },
      {
        name: 'Mentoring Others',
        description: 'Ajude outras pessoas em sua jornada DevOps',
        level: 'advanced',
        type: 'practice',
        icon: Users,
        // link: '/posts/mentoring-in-tech',
      },
      {
        name: 'Build Side Projects',
        description: 'Crie projetos para aprender e demonstrar habilidades',
        level: 'basic',
        type: 'practice',
        icon: Code,
        // link: '/posts/devops-project-ideas',
      },
      {
        name: 'Attend Conferences & Workshops',
        description: 'Aprenda com especialistas da área e faça networking',
        level: 'basic',
        type: 'practice',
        icon: Users,
        // link: '/posts/devops-conferences-2024',
      },
      {
        name: 'Join DevOps Communities',
        description: 'Conecte-se com outros profissionais de DevOps',
        level: 'basic',
        type: 'practice',
        icon: Heart,
        // link: '/posts/devops-communities-to-join',
      },
    ],
  },
];

