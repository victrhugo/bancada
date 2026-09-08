// Data for the /roadmap/devsecops page: milestone and skill definitions.
// Rendering lives in app/roadmap/devsecops/page.tsx.

import {
  AlertTriangle,
  Bug,
  Cloud,
  Code,
  Container,
  Database,
  Eye,
  FileSearch,
  FileText,
  Fingerprint,
  GitBranch,
  Globe,
  Key,
  Lock,
  Network,
  Scan,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Target,
  Terminal,
  Workflow,
  type LucideIcon,
} from 'lucide-react';

export interface DevSecOpsSkill {
  name: string;
  description: string;
  link?: string;
  simulators?: { name: string; link: string }[];
  external?: boolean;
  icon: LucideIcon;
  priority: 'essential' | 'important' | 'nice-to-have';
  estimatedHours: number;
}

export interface DevSecOpsMilestone {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  timeframe: string;
  skills: DevSecOpsSkill[];
  project: {
    name: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
  };
  outcomes: string[];
  tips: string[];
}

export const milestones: DevSecOpsMilestone[] = [
  {
    id: 'security-fundamentals',
    title: 'Fundamentos de Segurança',
    subtitle: 'Mês 1-2',
    description: 'Construa sua base de segurança com conceitos essenciais e modelagem de ameaças',
    icon: Shield,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-500/10 border-red-500/20',
    timeframe: '6-8 semanas',
    skills: [
      {
        name: 'Security Principles',
        description: 'Aprenda a tríade CIA, defesa em profundidade, privilégio mínimo e conceitos de zero trust',
        icon: Shield,
        priority: 'essential',
        estimatedHours: 15,
        link: '/interview-questions/senior/security-architecture',
      },
      {
        name: 'OWASP Top 10',
        description: 'Entenda os riscos de segurança mais críticos em aplicações web',
        icon: AlertTriangle,
        priority: 'essential',
        estimatedHours: 20,
        link: '/checklists/cicd-pipeline-setup',
     },
     {
       name: 'Threat Modeling',
       description: 'Aprenda as metodologias STRIDE, DREAD e árvores de ataque',
       icon: Bug,
       priority: 'important',
       estimatedHours: 15,
        link: '/interview-questions/senior/security-architecture',
     },
     {
        name: 'Linux Security Basics',
        description: 'Permissões de arquivos, gerenciamento de usuários, hardening de SSH e conceitos básicos de firewall',
        link: '/checklists/ssh-hardening',
        simulators: [{ name: 'Terminal Linux', link: '/games/linux-terminal' }],
        icon: Terminal,
        priority: 'essential',
        estimatedHours: 20,
      },
      {
       name: 'Cryptography Essentials',
       description: 'Criptografia simétrica/assimétrica, hashing, TLS/SSL e conceitos básicos de PKI',
       icon: Key,
       priority: 'important',
       estimatedHours: 15,
       link: '/quizzes/network-security-quiz',
     },
    ],
    project: {
      name: 'Relatório de Avaliação de Segurança',
      description: 'Realize uma avaliação básica de segurança em uma aplicação de exemplo usando as diretrizes da OWASP',
      difficulty: 'easy',
    },
    outcomes: [
      'Identificar vulnerabilidades de segurança comuns',
      'Aplicar princípios de segurança no design de sistemas',
      'Conduzir sessões básicas de modelagem de ameaças',
      'Entender mecanismos de criptografia e autenticação',
    ],
    tips: [
      'Pratique em aplicações propositalmente vulneráveis como DVWA ou Juice Shop',
      'Participe de comunidades de segurança como capítulos locais da OWASP',
      'Leia post-mortems de incidentes de segurança para aprender com casos reais',
    ],
  },
  {
    id: 'secure-development',
    title: 'Desenvolvimento Seguro',
    subtitle: 'Mês 2-3',
    description: 'Aplique o shift left integrando segurança ao processo de desenvolvimento',
    icon: Code,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-500/10 border-orange-500/20',
    timeframe: '6-8 semanas',
    skills: [
      {
        name: 'Secure Coding Practices',
        description: 'Validação de entrada, codificação de saída, consultas parametrizadas e tratamento de erros',
        icon: Code,
        priority: 'essential',
        estimatedHours: 25,
        link: '/posts/secure-coding-practices-guide',
      },
     {
       name: 'SAST Tools',
       description: 'Testes de segurança estática (SAST) com SonarQube, Semgrep ou CodeQL',
       icon: FileSearch,
       priority: 'essential',
       estimatedHours: 20,
       link: '/guides/sast-tools',
     },
      {
        name: 'Dependency Scanning',
        description: 'Encontre dependências vulneráveis com Dependabot, Snyk ou OWASP Dependency-Check',
        icon: Scan,
        priority: 'essential',
        estimatedHours: 10,
       link: '/posts/dependency-scanning-guide',
      },
      {
        name: 'Pre-commit Hooks',
        description: 'Implemente verificações de segurança antes do commit usando git hooks',
        icon: GitBranch,
        priority: 'important',
        estimatedHours: 8,
        link: '/posts/pre-commit-hooks-security-guide',
      },
      {
        name: 'Code Review for Security',
        description: 'Aprenda a identificar problemas de segurança durante code reviews',
        icon: Eye,
        priority: 'important',
        estimatedHours: 15,
        link: '/posts/security-focused-code-reviews',
      },
    ],
    project: {
      name: 'Pipeline de Código Seguro',
      description: 'Configure um pipeline de CI com SAST, dependency scanning e pre-commit hooks de segurança',
      difficulty: 'medium',
    },
    outcomes: [
      'Escrever código seguro seguindo boas práticas',
      'Configurar e interpretar resultados de ferramentas SAST',
      'Gerenciar dependências vulneráveis de forma eficaz',
      'Conduzir code reviews focados em segurança',
    ],
    tips: [
      'Comece com uma ferramenta SAST e a domine antes de adicionar mais',
      'Foque em reduzir falsos positivos para manter a confiança dos desenvolvedores',
      'Crie campeões de segurança em cada equipe de desenvolvimento',
    ],
  },
  {
    id: 'pipeline-security',
    title: 'Segurança em CI/CD',
    subtitle: 'Mês 3-4',
    description: 'Proteja seus pipelines de build e deploy contra ameaças',
    icon: Workflow,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-500/10 border-yellow-500/20',
    timeframe: '6-8 semanas',
    skills: [
      {
       name: 'Pipeline Hardening',
       description: 'Configurações seguras de CI/CD, isolamento de runners e assinatura de artefatos',
        link: '/posts/cicd-pipeline-hardening-guide',
       icon: Workflow,
       priority: 'essential',
        estimatedHours: 20,
      },
      {
        name: 'Secrets Management',
        description: 'HashiCorp Vault, AWS Secrets Manager ou Azure Key Vault para gerenciamento seguro de segredos',
        icon: Key,
        priority: 'essential',
        estimatedHours: 25,
        link: '/posts/secrets-management-guide',
      },
      {
        name: 'DAST Integration',
        description: 'Testes dinâmicos de segurança de aplicações (DAST) com OWASP ZAP ou Burp Suite',
        icon: Bug,
        priority: 'important',
        estimatedHours: 20,
        link: '/posts/dast-integration-guide',
      },
      {
        name: 'Supply Chain Security',
        description: 'Geração de SBOM, verificação de artefatos e Sigstore/cosign',
        icon: Network,
       priority: 'important',
       estimatedHours: 15,
       link: '/posts/software-supply-chain-security',
     },
     {
        name: 'Security Gates',
        description: 'Implemente gates de qualidade que bloqueiam deploys em caso de falhas de segurança',
        icon: ShieldAlert,
        priority: 'essential',
        estimatedHours: 10,
        link: '/guides/security-gates',
      },
    ],
    project: {
      name: 'Pipeline de CI/CD Seguro',
      description: 'Construa um pipeline completo com gerenciamento de segredos, DAST e gates de segurança',
      difficulty: 'medium',
    },
    outcomes: [
      'Projetar e implementar pipelines de CI/CD seguros',
      'Gerenciar segredos sem fazer hardcoding',
      'Integrar testes de segurança dinâmicos nos deploys',
      'Gerar e verificar bills of materials de software',
    ],
    tips: [
      'Trate configurações de pipeline como código - versione e revise-as',
      'Nunca armazene segredos em variáveis de ambiente visíveis em logs',
      'Use ambientes de build efêmeros sempre que possível',
    ],
  },
  {
    id: 'container-security',
    title: 'Segurança de Containers',
    subtitle: 'Mês 4-5',
    description: 'Proteja aplicações containerizadas do build até o runtime',
    icon: Container,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/20',
    timeframe: '6-8 semanas',
    skills: [
      {
        name: 'Image Security',
        description: 'Construa imagens mínimas, faça scan com Trivy/Grype e use imagens base confiáveis',
        link: '/checklists/docker-security',
        icon: Container,
        priority: 'essential',
        estimatedHours: 20,
      },
      {
        name: 'Container Runtime Security',
        description: 'Seccomp, AppArmor, sistemas de arquivos somente leitura e usuários não-root',
        icon: Lock,
        priority: 'essential',
        estimatedHours: 20,
      },
      {
        name: 'Kubernetes Security',
        description: 'RBAC, Network Policies, Pod Security Standards e admission controllers',
        link: '/checklists/kubernetes-security',
        simulators: [
          { name: 'Terminal Kubernetes', link: '/games/kubernetes-terminal-simulator' },
          { name: 'Políticas de Rede do K8s', link: '/games/kubernetes-networking-cni-simulator' },
        ],
        icon: Server,
        priority: 'essential',
        estimatedHours: 30,
      },
      {
        name: 'Runtime Threat Detection',
        description: 'Falco, Sysdig ou Aqua para detectar comportamento anômalo em containers',
        icon: Eye,
        priority: 'important',
        estimatedHours: 15,
      },
      {
        name: 'Service Mesh Security',
        description: 'mTLS, políticas de autorização e criptografia de tráfego com Istio ou Linkerd',
        simulators: [{ name: 'Service Mesh', link: '/games/service-mesh-simulator' }],
        icon: Network,
        priority: 'nice-to-have',
        estimatedHours: 20,
      },
    ],
    project: {
      name: 'Deploy Seguro no Kubernetes',
      description: 'Faça o deploy de uma aplicação no Kubernetes implementando todas as boas práticas de segurança',
      difficulty: 'hard',
    },
    outcomes: [
      'Construir e fazer scan de imagens de containers seguras',
      'Implementar hardening de runtime de containers',
      'Configurar controles de segurança do Kubernetes',
      'Monitorar containers em busca de ameaças de segurança',
    ],
    tips: [
      'Comece com Pod Security Standards antes de implementar políticas customizadas',
      'Use imagens base distroless ou scratch em produção',
      'Implemente network policies mesmo em ambientes de desenvolvimento',
    ],
  },
  {
    id: 'cloud-security',
    title: 'Segurança em Cloud',
    subtitle: 'Mês 5-6',
    description: 'Proteja a infraestrutura de nuvem e implemente controles de segurança cloud-native',
    icon: Cloud,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-500/10 border-purple-500/20',
    timeframe: '6-8 semanas',
    skills: [
      {
        name: 'IAM Best Practices',
        description: 'Privilégio mínimo, acesso baseado em papéis e federação de identidade',
        link: '/checklists/aws-security',
        simulators: [{ name: 'Fluxo OAuth / OIDC', link: '/games/oauth-oidc-flow-simulator' }],
        icon: Fingerprint,
        priority: 'essential',
        estimatedHours: 25,
      },
      {
        name: 'Infrastructure as Code Security',
        description: 'Faça scan de Terraform/CloudFormation com Checkov, tfsec ou KICS',
        icon: FileText,
        priority: 'essential',
        estimatedHours: 15,
      },
      {
        name: 'Cloud Security Posture',
        description: 'Ferramentas CSPM como Prowler, ScoutSuite ou soluções cloud-native',
        icon: ShieldCheck,
        priority: 'important',
        estimatedHours: 20,
      },
      {
        name: 'Data Protection',
        description: 'Criptografia em repouso/em trânsito, gerenciamento de chaves e classificação de dados',
        icon: Database,
        priority: 'essential',
        estimatedHours: 15,
      },
      {
        name: 'Network Security',
        description: 'VPCs, security groups, WAF e proteção contra DDoS',
        simulators: [
          { name: 'Defesa contra DDoS', link: '/games/ddos-simulator' },
          { name: 'Limitação de Requisições', link: '/games/rate-limit-simulator' },
        ],
        icon: Globe,
        priority: 'important',
        estimatedHours: 20,
      },
    ],
    project: {
      name: 'Arquitetura de Nuvem Segura',
      description: 'Projete e implemente uma arquitetura de nuvem segura de múltiplas camadas seguindo o Well-Architected Framework',
      difficulty: 'hard',
    },
    outcomes: [
      'Projetar políticas de IAM seguindo o privilégio mínimo',
      'Fazer scan de código de infraestrutura em busca de problemas de segurança',
      'Implementar monitoramento e conformidade de segurança na nuvem',
      'Proteger dados em ambientes de nuvem',
    ],
    tips: [
      'Obtenha certificação no seu provedor de nuvem principal (AWS/Azure/GCP)',
      'Use infrastructure as code para todos os recursos de nuvem',
      'Ative o CloudTrail/Activity Logs desde o primeiro dia',
    ],
  },
  {
    id: 'security-operations',
    title: 'Operações de Segurança',
    subtitle: 'Mês 6-7',
    description: 'Monitore, detecte e responda a incidentes de segurança de forma eficaz',
    icon: Eye,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-500/10 border-green-500/20',
    timeframe: '6-8 semanas',
    skills: [
      {
        name: 'Security Monitoring',
        description: 'Conceitos de SIEM, agregação de logs e dashboards de segurança',
        link: '/checklists/monitoring-observability',
        icon: Eye,
        priority: 'essential',
        estimatedHours: 25,
      },
      {
        name: 'Incident Response',
        description: 'Playbooks de resposta a incidentes, estratégias de contenção e revisões pós-incidente',
        icon: AlertTriangle,
        priority: 'essential',
        estimatedHours: 20,
      },
      {
        name: 'Vulnerability Management',
        description: 'Scan de vulnerabilidades, priorização e fluxos de remediação',
        icon: Bug,
        priority: 'essential',
        estimatedHours: 15,
      },
      {
        name: 'Compliance Automation',
        description: 'Automatize verificações de conformidade para SOC2, PCI-DSS, HIPAA ou ISO 27001',
        icon: FileText,
        priority: 'important',
        estimatedHours: 20,
      },
      {
        name: 'Security Metrics',
        description: 'Acompanhe MTTD, MTTR, número de vulnerabilidades e dívida de segurança',
        icon: Target,
        priority: 'important',
        estimatedHours: 10,
      },
    ],
    project: {
      name: 'Central de Operações de Segurança',
      description: 'Configure monitoramento, alertas e procedimentos de resposta a incidentes para um ambiente de produção',
      difficulty: 'hard',
    },
    outcomes: [
      'Configurar monitoramento de segurança centralizado',
      'Criar e executar planos de resposta a incidentes',
      'Gerenciar vulnerabilidades em toda a organização',
      'Acompanhar e reportar métricas de segurança',
    ],
    tips: [
      'Comece pequeno - você não consegue monitorar tudo desde o primeiro dia',
      'Pratique resposta a incidentes com exercícios de simulação (tabletop)',
      'Construa relacionamentos com as equipes de desenvolvimento, não muros',
    ],
  },
];
