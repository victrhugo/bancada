// Data for the /roadmap/junior page: milestone and skill definitions.
// Rendering lives in app/roadmap/junior/page.tsx.

import {
  CheckCircle2,
  Cloud,
  Code,
  Container,
  FileText,
  GitBranch,
  Globe,
  Server,
  Terminal,
  Workflow,
  type LucideIcon,
} from 'lucide-react';

export interface JuniorSkill {
  name: string;
  description: string;
  link?: string;
  simulators?: { name: string; link: string }[];
  external?: boolean;
  icon: LucideIcon;
  priority: 'essential' | 'important' | 'nice-to-have';
  estimatedHours: number;
}

export interface JuniorMilestone {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  timeframe: string;
  skills: JuniorSkill[];
  project: {
    name: string;
    description: string;
    difficulty: 'easy' | 'medium';
  };
  outcomes: string[];
  tips: string[];
}

export const milestones: JuniorMilestone[] = [
  {
    id: 'foundation',
    title: 'Fundamentos',
    subtitle: 'Mês 1-2',
    description: 'Construa suas habilidades essenciais com Linux e a linha de comando',
    icon: Terminal,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/20',
    timeframe: '4-8 semanas',
    skills: [
      {
        name: 'Linux Basics',
        description: 'Aprenda comandos essenciais do Linux, navegação no sistema de arquivos e permissões',
        link: '/guides/introduction-to-linux',
        simulators: [{ name: 'Terminal Linux', link: '/games/linux-terminal' }],
        icon: Terminal,
        priority: 'essential',
        estimatedHours: 20,
      },
      {
        name: 'Bash Scripting',
        description: 'Automatize tarefas repetitivas com scripts shell simples',
        link: '/guides/introduction-to-bash',
        icon: Code,
        priority: 'essential',
        estimatedHours: 15,
      },
      {
        name: 'Git Basics',
        description: 'Aprenda os fundamentos de controle de versão - commit, push, pull e branches',
        link: '/guides/introduction-to-git',
        simulators: [{ name: 'Conceitos de Git', link: '/games/git-concepts-simulator' }],
        icon: GitBranch,
        priority: 'essential',
        estimatedHours: 10,
      },
      {
        name: 'Networking Fundamentals',
        description: 'Entenda endereços IP, DNS, HTTP e conceitos básicos de redes',
        link: '/guides/networking-fundamentals',
        simulators: [{ name: 'Resolução de DNS', link: '/games/dns-simulator' }],
        icon: Globe,
        priority: 'important',
        estimatedHours: 12,
      },
    ],
    project: {
      name: 'Ambiente de Desenvolvimento Pessoal',
      description: 'Configure uma VM Linux, configure o Git e escreva scripts para automatizar sua configuração',
      difficulty: 'easy',
    },
    outcomes: [
      'Navegar com confiança no terminal',
      'Escrever scripts básicos de automação',
      'Usar Git para controle de versão',
    ],
    tips: [
      'Pratique comandos diariamente - a memória muscular é essencial',
      'Use uma VM Linux ou WSL para aprender na prática',
      'Divida tarefas complexas em scripts menores',
    ],
  },
  {
    id: 'version-control',
    title: 'Controle de Versão & Colaboração',
    subtitle: 'Mês 2-3',
    description: 'Domine workflows de Git e comece a colaborar com equipes',
    icon: GitBranch,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-500/10 border-orange-500/20',
    timeframe: '3-4 semanas',
    skills: [
      {
        name: 'Git Branching Strategies',
        description: 'Aprenda GitFlow, trunk-based development e quando usar cada um',
        link: '/guides/git-branching-strategies',
        icon: GitBranch,
        priority: 'essential',
        estimatedHours: 8,
      },
      {
        name: 'Pull Requests & Code Review',
        description: 'Crie PRs, revise código e colabore de forma eficaz',
        link: '/guides/code-review-best-practices',
        icon: FileText,
        priority: 'essential',
        estimatedHours: 6,
      },
      {
        name: 'GitHub Actions Basics',
        description: 'Automatize workflows simples como linting e testes',
        link: '/guides/introduction-to-github-actions',
        icon: Workflow,
        priority: 'important',
        estimatedHours: 10,
      },
    ],
    project: {
      name: 'Pipeline de Testes Automatizados',
      description: 'Crie um repositório no GitHub com testes automatizados rodando a cada push',
      difficulty: 'easy',
    },
    outcomes: [
      'Colaborar em código com confiança',
      'Configurar pipelines de CI básicos',
      'Resolver conflitos de merge com facilidade',
    ],
    tips: [
      'Contribua com projetos open source para praticar PRs',
      'Comece com workflows simples do GitHub Actions',
      'Sempre escreva mensagens de commit significativas',
    ],
  },
  {
    id: 'containers',
    title: 'Containers',
    subtitle: 'Mês 3-4',
    description: 'Aprenda Docker e entenda os conceitos de containerização',
    icon: Container,
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-500/10 border-cyan-500/20',
    timeframe: '4-6 semanas',
    skills: [
      {
        name: 'Docker Fundamentals',
        description: 'Construa, execute e gerencie containers com Docker',
        link: '/guides/introduction-to-docker',
        simulators: [{ name: 'Terminal Docker', link: '/games/docker-terminal-simulator' }],
        icon: Container,
        priority: 'essential',
        estimatedHours: 20,
      },
      {
        name: 'Dockerfile Best Practices',
        description: 'Escreva Dockerfiles eficientes, seguros e fáceis de manter',
        link: '/guides/dockerfile-best-practices',
        icon: FileText,
        priority: 'essential',
        estimatedHours: 8,
      },
      {
        name: 'Docker Compose',
        description: 'Defina e execute aplicações com múltiplos containers',
        link: '/guides/docker-compose-guide',
        icon: Server,
        priority: 'important',
        estimatedHours: 10,
      },
    ],
    project: {
      name: 'Aplicação Web Containerizada',
      description: 'Containerize uma aplicação web com um banco de dados usando Docker Compose',
      difficulty: 'medium',
    },
    outcomes: [
      'Containerizar qualquer aplicação',
      'Rodar configurações com múltiplos containers',
      'Depurar problemas em containers',
    ],
    tips: [
      'Sempre use imagens base oficiais',
      'Mantenha as imagens pequenas e seguras',
      'Pratique com aplicações reais que você usa',
    ],
  },
  {
    id: 'ci-cd',
    title: 'Pipelines de CI/CD',
    subtitle: 'Mês 4-5',
    description: 'Construa pipelines automatizados para testes e deploy',
    icon: Workflow,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-500/10 border-green-500/20',
    timeframe: '4-6 semanas',
    skills: [
      {
        name: 'CI/CD Concepts',
        description: 'Entenda os princípios de integração e entrega contínuas',
        link: '/guides/ci-cd-fundamentals',
        icon: Workflow,
        priority: 'essential',
        estimatedHours: 6,
      },
      {
        name: 'GitHub Actions Advanced',
        description: 'Construa pipelines completos de CI/CD com GitHub Actions',
        link: '/guides/github-actions-advanced',
        icon: Workflow,
        priority: 'essential',
        estimatedHours: 15,
      },
      {
        name: 'Testing in Pipelines',
        description: 'Integre testes unitários, linting e verificações de segurança',
        link: '/guides/testing-in-ci-cd',
        icon: CheckCircle2,
        priority: 'important',
        estimatedHours: 10,
      },
    ],
    project: {
      name: 'Pipeline de CI/CD Completo',
      description: 'Construa um pipeline que testa, cria imagens Docker e faz deploy em staging',
      difficulty: 'medium',
    },
    outcomes: [
      'Construir pipelines de CI/CD de ponta a ponta',
      'Automatizar testes e deploys',
      'Reduzir erros de deploy manual',
    ],
    tips: [
      'Comece simples e depois adicione complexidade',
      'Sempre tenha um ambiente de staging',
      'Deixe os pipelines rápidos - busque menos de 10 minutos',
    ],
  },
  {
    id: 'cloud',
    title: 'Fundamentos de Cloud',
    subtitle: 'Mês 5-6',
    description: 'Comece a usar plataformas de nuvem e serviços essenciais',
    icon: Cloud,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-500/10 border-purple-500/20',
    timeframe: '6-8 semanas',
    skills: [
      {
        name: 'Cloud Fundamentals',
        description: 'Entenda conceitos de computação em nuvem, precificação e modelos de serviço',
        link: '/guides/cloud-computing-fundamentals',
        icon: Cloud,
        priority: 'essential',
        estimatedHours: 10,
      },
      {
        name: 'AWS/Azure/GCP Core Services',
        description: 'Aprenda o básico de computação, armazenamento e redes na plataforma escolhida',
        link: '/guides/aws-for-beginners',
        simulators: [{ name: 'AWS VPC', link: '/games/aws-vpc-simulator' }],
        icon: Server,
        priority: 'essential',
        estimatedHours: 25,
      },
      {
        name: 'Infrastructure as Code Basics',
        description: 'Introdução ao Terraform para gerenciar recursos na nuvem',
        link: '/guides/introduction-to-terraform',
        icon: Code,
        priority: 'important',
        estimatedHours: 15,
      },
    ],
    project: {
      name: 'Deploy na Nuvem',
      description: 'Faça o deploy da sua aplicação containerizada em uma plataforma de nuvem usando IaC',
      difficulty: 'medium',
    },
    outcomes: [
      'Navegar com confiança nos consoles de nuvem',
      'Fazer deploy de aplicações na nuvem',
      'Gerenciar recursos de nuvem com código',
    ],
    tips: [
      'Use os recursos do free tier para aprender',
      'Escolha UM provedor de nuvem para começar',
      'Sempre configure alertas de cobrança',
    ],
  },
];
