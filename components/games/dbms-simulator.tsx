'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Database,
  FileText,
  Key,
  Table2,
  GitBranch,
  Clock,
  Zap,
  Shield,
  TrendingUp,
  Network,
  CheckCircle2,
  XCircle,
  Home,
  Play,
  RotateCcw,
  Info,
  ArrowRight,
  Layers,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// DBMS Type
type DbmsType = 'relational' | 'document' | 'key-value' | 'column-family' | 'graph' | 'time-series';

// Phase Type
type Phase = 'intro' | 'explorer' | 'playground' | 'quiz' | 'complete';

// DBMS Configuration
interface DbmsConfig {
  id: DbmsType;
  name: string;
  category: string;
  examples: string[];
  iconName: string;
  color: string;
  characteristics: string[];
  useCases: string[];
  capTradeoffs: { consistency: number; availability: number; partition: number };
  queryExample: string;
  dataModelExample: string;
  pros: string[];
  cons: string[];
}

// DBMS Configurations
const dbmsTypes: Record<DbmsType, DbmsConfig> = {
  relational: {
    id: 'relational',
    name: 'Relacional (SQL)',
    category: 'Tradicional',
    examples: ['PostgreSQL', 'MySQL', 'SQL Server', 'Oracle'],
    iconName: 'Table2',
    color: 'from-blue-500 to-cyan-600',
    characteristics: [
      'Dados estruturados com schema',
      'Tabelas com linhas e colunas',
      'Transações ACID',
      'Linguagem de consulta SQL',
      'Relacionamentos via foreign keys',
      'Consistência forte',
    ],
    useCases: [
      'Sistemas financeiros',
      'Transações de e-commerce',
      'Gestão de usuários',
      'Sistemas de estoque',
      'Dados estruturados com relacionamentos',
    ],
    capTradeoffs: { consistency: 10, availability: 7, partition: 5 },
    queryExample: `SELECT u.name, o.amount\nFROM users u\nJOIN orders o ON u.id = o.user_id\nWHERE o.amount > 50;`,
    dataModelExample: `Tabela users\n+----+----------+-------+\n| id | name     | email |\n+----+----------+-------+\n| 1  | John Doe | john@ |\n+----+----------+-------+\n\nTabela orders\n+----+---------+--------+\n| id | user_id | amount |\n+----+---------+--------+\n| 1  | 1       | 99.99  |\n+----+---------+--------+`,
    pros: ['Garantias ACID', 'Consultas complexas com JOINs', 'Integridade dos dados', 'Ferramentas maduras'],
    cons: ['Schema rígido', 'Limites de escala vertical', 'Migrations complexas', 'Performance em grande escala'],
  },
  document: {
    id: 'document',
    name: 'Banco de documentos',
    category: 'NoSQL',
    examples: ['MongoDB', 'CouchDB', 'Firestore'],
    iconName: 'FileText',
    color: 'from-green-500 to-emerald-600',
    characteristics: [
      'Schema-less (schema flexível)',
      'Guarda documentos parecidos com JSON',
      'Estruturas de dados aninhadas',
      'Sem joins (desnormalizado)',
      'Escala horizontal',
      'Consistência eventual',
    ],
    useCases: [
      'Sistemas de gestão de conteúdo',
      'Perfis de usuário',
      'Catálogos de produtos',
      'Blogs e artigos',
      'Backends de apps mobile',
    ],
    capTradeoffs: { consistency: 7, availability: 9, partition: 9 },
    queryExample: `db.users.find({\n  "orders.amount": { "$gt": 50 }\n}).project({\n  name: 1,\n  "orders.amount": 1\n})`,
    dataModelExample: `{\n  "_id": "123",\n  "name": "John Doe",\n  "email": "john@example.com",\n  "orders": [\n    { "id": 1, "amount": 99.99 },\n    { "id": 2, "amount": 49.99 }\n  ]\n}`,
    pros: ['Schema flexível', 'Escala horizontal fácil', 'Leituras rápidas', 'Suporte a dados aninhados'],
    cons: ['Sem ACID entre documentos', 'Duplicação de dados', 'Joins complexos são difíceis', 'Consistência eventual'],
  },
  'key-value': {
    id: 'key-value',
    name: 'Banco chave-valor',
    category: 'NoSQL',
    examples: ['Redis', 'Memcached', 'DynamoDB'],
    iconName: 'Key',
    color: 'from-red-500 to-orange-600',
    characteristics: [
      'O modelo NoSQL mais simples',
      'Cada chave aponta para um valor',
      'Buscas muito rápidas, O(1)',
      'Sem consultas complexas',
      'Normalmente em memória',
      'Suporte a TTL',
    ],
    useCases: [
      'Cache',
      'Armazenamento de sessões',
      'Rate limiting',
      'Analytics em tempo real',
      'Leaderboards',
    ],
    capTradeoffs: { consistency: 8, availability: 10, partition: 8 },
    queryExample: `GET user:123\nSET session:abc '{"user_id":123}' EX 3600\nINCR page:views\nZADD leaderboard 1000 "player1"`,
    dataModelExample: `Key: "user:123"\nValue: {"name": "John", "email": "john@example.com"}\n\nKey: "session:abc"\nValue: {"user_id": 123, "expires": 1234567890}\n\nKey: "counter:page:views"\nValue: 42`,
    pros: ['Extremamente rápido', 'Simples de usar', 'Alto throughput', 'Fácil de escalar'],
    cons: ['Sem consultas complexas', 'Sem relacionamentos', 'Tipos de dados limitados', 'Não serve para dados complexos'],
  },
  'column-family': {
    id: 'column-family',
    name: 'Banco column-family',
    category: 'NoSQL',
    examples: ['Cassandra', 'HBase', 'ScyllaDB'],
    iconName: 'Layers',
    color: 'from-purple-500 to-pink-600',
    characteristics: [
      'Dados guardados em famílias de colunas',
      'Linhas largas com muitas colunas',
      'Otimizado para escrita',
      'Arquitetura distribuída',
      'Consistência ajustável',
      'Sem joins',
    ],
    useCases: [
      'Dados de séries temporais',
      'Registro de eventos',
      'Dados de sensores IoT',
      'Alto volume de escrita',
      'Armazenamento de dados históricos',
    ],
    capTradeoffs: { consistency: 7, availability: 10, partition: 10 },
    queryExample: `SELECT * FROM sensor_data\nWHERE device_id = 'dev123'\n  AND timestamp > '2024-01-01'\nORDER BY timestamp DESC;`,
    dataModelExample: `Row Key: device_123\nColumn Family: measurements\n  timestamp:2024-01-01T10:00:00 -> {temp: 22.5}\n  timestamp:2024-01-01T10:01:00 -> {temp: 22.7}\n  timestamp:2024-01-01T10:02:00 -> {temp: 22.6}`,
    pros: ['Alto throughput de escrita', 'Escala linear', 'Tolerante a falhas', 'Consistência ajustável'],
    cons: ['Modelagem de dados complexa', 'Sem joins', 'Pouca flexibilidade nas consultas', 'Curva de aprendizado íngreme'],
  },
  graph: {
    id: 'graph',
    name: 'Banco de grafos',
    category: 'NoSQL',
    examples: ['Neo4j', 'Amazon Neptune', 'ArangoDB'],
    iconName: 'GitBranch',
    color: 'from-indigo-500 to-violet-600',
    characteristics: [
      'Nós e relacionamentos',
      'Otimizado para conexões',
      'Consultas de travessia de grafo',
      'Suporte a ACID',
      'Grafos de propriedades',
      'Consultas de relacionamentos profundos',
    ],
    useCases: [
      'Redes sociais',
      'Motores de recomendação',
      'Detecção de fraude',
      'Grafos de conhecimento',
      'Topologia de rede',
    ],
    capTradeoffs: { consistency: 9, availability: 7, partition: 6 },
    queryExample: `MATCH (user:User {name: "John"})\n      -[:FRIEND]->(friend)\n      -[:BOUGHT]->(product)\nWHERE product.price > 50\nRETURN friend.name, product.name`,
    dataModelExample: `(User:John)\n  -[:FRIEND]->(User:Alice)\n  -[:BOUGHT]->(Product:Laptop)\n  \n(User:Alice)\n  -[:BOUGHT]->(Product:Laptop)\n  -[:BOUGHT]->(Product:Mouse)`,
    pros: ['Consultas de relacionamento rápidas', 'Modelo de dados intuitivo', 'Travessias complexas', 'Busca por padrões'],
    cons: ['Não serve para buscas simples', 'Desafios para escalar', 'Caso de uso especializado', 'Consultas complexas'],
  },
  'time-series': {
    id: 'time-series',
    name: 'Banco de séries temporais',
    category: 'Specialized',
    examples: ['InfluxDB', 'TimescaleDB', 'Prometheus'],
    iconName: 'Clock',
    color: 'from-yellow-500 to-amber-600',
    characteristics: [
      'Otimizado para dados com timestamp',
      'Fluxo contínuo de dados',
      'Políticas de retenção de dados',
      'Suporte a downsampling',
      'Alto throughput de escrita',
      'Agregações nativas',
    ],
    useCases: [
      'Monitoramento e métricas',
      'Dados de sensores IoT',
      'Dados de cotações financeiras',
      'Performance de aplicações',
      'Monitoramento de infraestrutura',
    ],
    capTradeoffs: { consistency: 8, availability: 9, partition: 8 },
    queryExample: `SELECT mean("temperature")\nFROM "sensor_data"\nWHERE time > now() - 1h\nGROUP BY time(5m), "device_id"`,
    dataModelExample: `Measurement: cpu_usage\nTags: {host: "server-1", region: "us-east"}\nFields: {value: 75.5}\nTimestamp: 2024-01-01T10:00:00Z\n\nMeasurement: cpu_usage\nTags: {host: "server-1", region: "us-east"}\nFields: {value: 78.2}\nTimestamp: 2024-01-01T10:01:00Z`,
    pros: ['Otimizado para dados temporais', 'Armazenamento eficiente', 'Agregações nativas', 'Retenção de dados'],
    cons: ['Caso de uso especializado', 'Não serve para dados em geral', 'Limitações para atualizar', 'Restrições para apagar'],
  },
};

// Quiz Questions
const quizQuestions = [
  {
    question: 'Você precisa de transações ACID para um sistema financeiro. Qual DBMS escolher?',
    options: ['MongoDB', 'PostgreSQL', 'Redis', 'Cassandra'],
    correctAnswer: 1,
    explanation: 'O PostgreSQL (relacional) oferece garantias ACID completas, essenciais em transações financeiras, onde consistência e integridade são prioridade.',
  },
  {
    question: 'Qual banco é melhor para guardar sessões com buscas rápidas e suporte a TTL?',
    options: ['MySQL', 'Neo4j', 'Redis', 'HBase'],
    correctAnswer: 2,
    explanation: 'O Redis (chave-valor) é perfeito para sessões: velocidade de memória, modelo chave-valor simples e suporte nativo a TTL (Time To Live).',
  },
  {
    question: 'Para uma rede social com recomendação de amigos, qual banco funciona melhor?',
    options: ['PostgreSQL', 'Cassandra', 'Neo4j', 'DynamoDB'],
    correctAnswer: 2,
    explanation: 'O Neo4j (banco de grafos) é otimizado para consultas de relacionamento como "amigos de amigos", essenciais em redes sociais e recomendações.',
  },
  {
    question: 'Você tem sensores IoT gerando milhões de leituras com timestamp. Melhor escolha?',
    options: ['InfluxDB', 'MongoDB', 'Redis', 'MySQL'],
    correctAnswer: 0,
    explanation: 'O InfluxDB (séries temporais) foi feito para grandes volumes de dados com timestamp, com armazenamento eficiente, políticas de retenção e agregações.',
  },
];

export default function DbmsSimulator() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [selectedDbms, setSelectedDbms] = useState<DbmsType>('relational');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);

  const handleDbmsSelect = useCallback((type: DbmsType) => {
    setSelectedDbms(type);
  }, []);

  const resetGame = useCallback(() => {
    setPhase('intro');
    setSelectedDbms('relational');
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
  }, []);

  const handleAnswerSelect = useCallback(
    (answerIndex: number) => {
      setSelectedAnswer(answerIndex);
      setShowExplanation(true);

      if (answerIndex === quizQuestions[currentQuestion].correctAnswer) {
        setScore((prev) => prev + 1);
      }
    },
    [currentQuestion]
  );

  const handleNextQuestion = useCallback(() => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setPhase('complete');
    }
  }, [currentQuestion]);

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      Table2: <Table2 className="h-8 w-8" />,
      FileText: <FileText className="h-8 w-8" />,
      Key: <Key className="h-8 w-8" />,
      Layers: <Layers className="h-8 w-8" />,
      GitBranch: <GitBranch className="h-8 w-8" />,
      Clock: <Clock className="h-8 w-8" />,
    };
    return icons[iconName] || <Database className="h-8 w-8" />;
  };

  // Intro Phase
  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Aprendizado interativo</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
              Sistemas de gerenciamento de banco de dados
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Conheça os diferentes tipos de banco de dados, seus casos de uso e trade-offs explorando de forma interativa
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="mb-6 border-2 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  O que você vai aprender
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Tipos de DBMS</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Relacional, documentos, chave-valor, column-family, grafos, séries temporais
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Casos de uso</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Quando usar cada tipo em aplicações reais
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Teorema CAP</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Entenda os trade-offs entre consistência, disponibilidade e tolerância a partição
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Padrões de consulta</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Veja como as consultas mudam entre os tipos de banco
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex gap-4 justify-center"
          >
            <Button size="lg" onClick={() => setPhase('explorer')} className="gap-2">
              <Play className="h-5 w-5" />
             Começar a explorar
           </Button>
         </motion.div>
       </div>
      </div>
    );
  }

  // Explorer Phase
  if (phase === 'explorer') {
    const currentDbms = dbmsTypes[selectedDbms];

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center justify-between mb-6 gap-4"
          >
            <div>
              <h2 className="text-2xl font-bold">Explorador de bancos de dados</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Escolha um tipo de banco para saber mais</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPhase('playground')} className="gap-2">
                <ArrowRight className="h-4 w-4" />
               Abrir playground
             </Button>
           </div>
         </motion.div>

          {/* DBMS Type Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8"
          >
            {(Object.keys(dbmsTypes) as DbmsType[]).map((type) => {
              const dbms = dbmsTypes[type];
              const isSelected = selectedDbms === type;
              return (
                <motion.button
                  key={type}
                  onClick={() => handleDbmsSelect(type)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all',
                    isSelected
                      ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 bg-white dark:bg-slate-800'
                  )}
                >
                  <div className="text-center">
                    <div className={cn(
                      'mx-auto mb-2 w-12 h-12 rounded-lg flex items-center justify-center',
                      `bg-gradient-to-br ${dbms.color}`
                    )}>
                      <div className="text-white">{getIconComponent(dbms.iconName)}</div>
                    </div>
                    <p className="text-sm font-medium">{dbms.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{dbms.category}</p>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>

          {/* Current DBMS Details */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedDbms}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid lg:grid-cols-2 gap-6"
            >
              {/* Left Column */}
              <div className="space-y-6">
                {/* Overview Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-12 h-12 rounded-lg flex items-center justify-center',
                        `bg-gradient-to-br ${currentDbms.color}`
                      )}>
                        <div className="text-white">{getIconComponent(currentDbms.iconName)}</div>
                      </div>
                      <div>
                        <CardTitle>{currentDbms.name}</CardTitle>
                        <CardDescription>{currentDbms.category}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium mb-2">Exemplos populares:</p>
                        <div className="flex flex-wrap gap-2">
                          {currentDbms.examples.map((example) => (
                            <Badge key={example} variant="secondary">
                              {example}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Characteristics Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Características principais</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {currentDbms.characteristics.map((char, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{char}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Use Cases Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Melhores casos de uso</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {currentDbms.useCases.map((useCase, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Zap className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{useCase}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Data Model Example */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Modelo de dados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-slate-100 dark:bg-slate-900 p-4 rounded-lg overflow-x-auto">
                      <code>{currentDbms.dataModelExample}</code>
                    </pre>
                  </CardContent>
                </Card>

                {/* Query Example */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Exemplo de consulta</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-slate-100 dark:bg-slate-900 p-4 rounded-lg overflow-x-auto">
                      <code>{currentDbms.queryExample}</code>
                    </pre>
                  </CardContent>
                </Card>

                {/* CAP Theorem */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Trade-offs do teorema CAP</CardTitle>
                    <CardDescription>Nota de 1 a 10 para cada propriedade</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Consistência</span>
                          <span className="font-medium">{currentDbms.capTradeoffs.consistency}/10</span>
                        </div>
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500"
                            style={{ width: `${currentDbms.capTradeoffs.consistency * 10}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Disponibilidade</span>
                          <span className="font-medium">{currentDbms.capTradeoffs.availability}/10</span>
                        </div>
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{ width: `${currentDbms.capTradeoffs.availability * 10}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Tolerância a partição</span>
                          <span className="font-medium">{currentDbms.capTradeoffs.partition}/10</span>
                        </div>
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500"
                            style={{ width: `${currentDbms.capTradeoffs.partition * 10}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pros and Cons */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Prós e contras</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium mb-2 text-green-600 dark:text-green-400">Vantagens</p>
                        <ul className="space-y-1">
                          {currentDbms.pros.map((pro, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                              <span className="text-sm">{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2 text-red-600 dark:text-red-400">Limitações</p>
                        <ul className="space-y-1">
                          {currentDbms.cons.map((con, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                              <span className="text-sm">{con}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Playground Phase
  if (phase === 'playground') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl font-bold mb-4">Playground de decisão</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Use esta árvore de decisão para escolher o banco certo para o seu caso de uso
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Qual DBMS devo usar?</CardTitle>
                <CardDescription>Responda estas perguntas para achar a melhor opção</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Decision Tree Visualization */}
                  <div className="bg-slate-100 dark:bg-slate-900 p-6 rounded-lg">
                    <div className="space-y-4 text-sm">
                      <div className="font-medium">Precisa de transações ACID?</div>
                      <div className="ml-4 space-y-2">
                        <div>✅ Sim → <Badge className="bg-blue-500">Banco relacional</Badge></div>
                        <div>
                          ❌ No
                          <div className="ml-4 mt-2 space-y-2">
                            <div className="font-medium">Precisa de relacionamentos complexos?</div>
                            <div className="ml-4 space-y-2">
                              <div>✅ Sim → <Badge className="bg-indigo-500">Banco de grafos</Badge></div>
                              <div>
                                ❌ No
                                <div className="ml-4 mt-2 space-y-2">
                                  <div className="font-medium">Precisa de buscas simples e rápidas?</div>
                                  <div className="ml-4 space-y-2">
                                    <div>✅ Sim → <Badge className="bg-red-500">Banco chave-valor</Badge></div>
                                    <div>
                                      ❌ No
                                      <div className="ml-4 mt-2 space-y-2">
                                        <div className="font-medium">Precisa de schema flexível?</div>
                                        <div className="ml-4 space-y-2">
                                          <div>✅ Sim → <Badge className="bg-green-500">Banco de documentos</Badge></div>
                                          <div>❌ Não → <Badge className="bg-purple-500">Banco column-family</Badge></div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Common Use Cases */}
                  <div>
                    <h3 className="font-medium mb-3">Cenários comuns</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Alert>
                        <Shield className="h-4 w-4" />
                        <AlertDescription>
                          <p className="font-medium mb-1">E-commerce</p>
                          <p className="text-xs">Relacional para pedidos, documentos para o catálogo, Redis para sessões</p>
                        </AlertDescription>
                      </Alert>
                      <Alert>
                        <Users className="h-4 w-4" />
                        <AlertDescription>
                          <p className="font-medium mb-1">Rede social</p>
                          <p className="text-xs">Grafo para conexões, documentos para perfis, Redis para cache</p>
                        </AlertDescription>
                      </Alert>
                      <Alert>
                        <Network className="h-4 w-4" />
                        <AlertDescription>
                          <p className="font-medium mb-1">Plataforma IoT</p>
                          <p className="text-xs">Séries temporais para sensores, column-family para logs, Redis para estado</p>
                        </AlertDescription>
                      </Alert>
                      <Alert>
                        <TrendingUp className="h-4 w-4" />
                        <AlertDescription>
                          <p className="font-medium mb-1">Plataforma de analytics</p>
                          <p className="text-xs">Column-family para eventos, séries temporais para métricas, relacional para metadados</p>
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex gap-4 justify-center"
          >
            <Button onClick={() => setPhase('quiz')} className="gap-2">
              <ArrowRight className="h-4 w-4" />
              Fazer o quiz
            </Button>
            <Button variant="outline" onClick={() => setPhase('explorer')} className="gap-2">
              Voltar ao explorador
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Quiz Phase
  if (phase === 'quiz') {
    const question = quizQuestions[currentQuestion];

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Teste de conhecimento</h2>
              <Badge variant="secondary">
                Pergunta {currentQuestion + 1} de {quizQuestions.length}
              </Badge>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%` }}
              />
            </div>
          </motion.div>

          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{question.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {question.options.map((option, idx) => {
                    const isSelected = selectedAnswer === idx;
                    const isCorrect = idx === question.correctAnswer;
                    const showResult = showExplanation;

                    return (
                      <Button
                        key={idx}
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left h-auto py-3 px-4',
                          isSelected && !showResult && 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
                          showResult && isCorrect && 'border-green-500 bg-green-50 dark:bg-green-900/20',
                          showResult && isSelected && !isCorrect && 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        )}
                        onClick={() => !showExplanation && handleAnswerSelect(idx)}
                        disabled={showExplanation}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className={cn(
                            'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                            showResult && isCorrect && 'border-green-500 bg-green-500',
                            showResult && isSelected && !isCorrect && 'border-red-500 bg-red-500'
                          )}>
                            {showResult && isCorrect && <CheckCircle2 className="h-4 w-4 text-white" />}
                            {showResult && isSelected && !isCorrect && <XCircle className="h-4 w-4 text-white" />}
                          </div>
                          <span>{option}</span>
                        </div>
                      </Button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {showExplanation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4"
                    >
                      <Alert className={cn(
                        selectedAnswer === question.correctAnswer
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      )}>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          <p className="font-medium mb-1">
                            {selectedAnswer === question.correctAnswer ? 'Correto!' : 'Quase!'}
                          </p>
                          <p className="text-sm">{question.explanation}</p>
                        </AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          <div className="flex gap-4 justify-center">
            {showExplanation && (
              <Button onClick={handleNextQuestion} className="gap-2">
                {currentQuestion < quizQuestions.length - 1 ? (
                  <>
                    Próxima pergunta
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  'Ver resultado'
                )}
              </Button>
            )}
            <Button variant="outline" onClick={resetGame} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Começar de novo
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Complete Phase
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 mb-6">
            <CheckCircle2 className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Quiz concluído!</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Você acertou <span className="font-bold text-blue-600 dark:text-blue-400">{score}</span> de{' '}
            <span className="font-bold">{quizQuestions.length}</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Principais aprendizados</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Combine o DBMS com o caso de uso</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Cada banco brilha em tarefas diferentes: escolha com base nos seus requisitos
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Entenda os trade-offs do CAP</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Não dá para ter consistência, disponibilidade e tolerância a partição perfeitas ao mesmo tempo
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Persistência poliglota é comum</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Aplicações modernas costumam usar vários bancos para componentes diferentes
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Considere a complexidade operacional</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Cada tipo de banco tem requisitos operacionais e trade-offs diferentes
                    </p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-4 justify-center"
        >
          <Button onClick={resetGame} className="gap-2">
            <RotateCcw className="h-4 w-4" />
           Jogar de novo
         </Button>
       </motion.div>
     </div>
   </div>
  );
}
