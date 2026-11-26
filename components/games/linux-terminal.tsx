'use client';

import React, { useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Terminal,
  BookOpen,
  CheckCircle,
  ArrowRight,
  RotateCcw,
  Lightbulb,
  Trophy,
  FolderOpen,
  FileText,
  HardDrive,
  User,
  Lock,
  Network,
  Cpu,
  ChevronRight,
} from 'lucide-react';
import {
  useTerminalSimulator,
  type ExecuteResult,
  type TerminalLine,
} from '@/hooks/use-terminal-simulator';

// Types
interface FileSystemNode {
  type: 'file' | 'directory';
  name: string;
  content?: string;
  children?: Record<string, FileSystemNode>;
  permissions?: string;
  owner?: string;
  size?: number;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  commands: LessonCommand[];
}

interface LessonCommand {
  instruction: string;
  hint: string;
  expectedCommand: string | string[];
  explanation: string;
  setup?: () => void;
}

// Initial file system
const createInitialFileSystem = (): FileSystemNode => ({
  type: 'directory',
  name: '/',
  permissions: 'drwxr-xr-x',
  owner: 'root',
  children: {
    home: {
      type: 'directory',
      name: 'home',
      permissions: 'drwxr-xr-x',
      owner: 'root',
      children: {
        user: {
          type: 'directory',
          name: 'user',
          permissions: 'drwxr-xr-x',
          owner: 'user',
          children: {
            documents: {
              type: 'directory',
              name: 'documents',
              permissions: 'drwxr-xr-x',
              owner: 'user',
              children: {
                'readme.txt': {
                  type: 'file',
                  name: 'readme.txt',
                  content: 'Welcome to the Linux Terminal Tutorial!\nThis is a sample text file.',
                  permissions: '-rw-r--r--',
                  owner: 'user',
                  size: 72,
                },
                'notes.md': {
                  type: 'file',
                  name: 'notes.md',
                  content: '# My Notes\n\n- Learn Linux basics\n- Practice commands\n- Have fun!',
                  permissions: '-rw-r--r--',
                  owner: 'user',
                  size: 65,
                },
              },
            },
            projects: {
              type: 'directory',
              name: 'projects',
              permissions: 'drwxr-xr-x',
              owner: 'user',
              children: {
                'app.py': {
                  type: 'file',
                  name: 'app.py',
                  content: '#!/usr/bin/env python3\n\nprint("Hello, Linux!")\n',
                  permissions: '-rwxr-xr-x',
                  owner: 'user',
                  size: 52,
                },
                'config.json': {
                  type: 'file',
                  name: 'config.json',
                  content: '{\n  "name": "myapp",\n  "version": "1.0.0"\n}',
                  permissions: '-rw-r--r--',
                  owner: 'user',
                  size: 48,
                },
              },
            },
            '.bashrc': {
              type: 'file',
              name: '.bashrc',
              content: '# Bash configuration\nexport PATH=$PATH:/usr/local/bin\nalias ll="ls -la"',
              permissions: '-rw-r--r--',
              owner: 'user',
              size: 78,
            },
            '.hidden_secret': {
              type: 'file',
              name: '.hidden_secret',
              content: 'Você achou o arquivo oculto! Mandou bem na exploração.',
              permissions: '-rw-------',
              owner: 'user',
              size: 47,
            },
          },
        },
      },
    },
    etc: {
      type: 'directory',
      name: 'etc',
      permissions: 'drwxr-xr-x',
      owner: 'root',
      children: {
        'hostname': {
          type: 'file',
          name: 'hostname',
          content: 'linux-tutorial',
          permissions: '-rw-r--r--',
          owner: 'root',
          size: 14,
        },
        'passwd': {
          type: 'file',
          name: 'passwd',
          content: 'root:x:0:0:root:/root:/bin/bash\nuser:x:1000:1000:User:/home/user:/bin/bash',
          permissions: '-rw-r--r--',
          owner: 'root',
          size: 76,
        },
      },
    },
    var: {
      type: 'directory',
      name: 'var',
      permissions: 'drwxr-xr-x',
      owner: 'root',
      children: {
        log: {
          type: 'directory',
          name: 'log',
          permissions: 'drwxr-xr-x',
          owner: 'root',
          children: {
            'syslog': {
              type: 'file',
              name: 'syslog',
              content: 'Jan 18 10:00:00 linux-tutorial kernel: System initialized\nJan 18 10:00:01 linux-tutorial systemd: Started Linux Tutorial',
              permissions: '-rw-r-----',
              owner: 'root',
              size: 120,
            },
          },
        },
      },
    },
    tmp: {
      type: 'directory',
      name: 'tmp',
      permissions: 'drwxrwxrwt',
      owner: 'root',
      children: {},
    },
    usr: {
      type: 'directory',
      name: 'usr',
      permissions: 'drwxr-xr-x',
      owner: 'root',
      children: {
        bin: {
          type: 'directory',
          name: 'bin',
          permissions: 'drwxr-xr-x',
          owner: 'root',
          children: {},
        },
        local: {
          type: 'directory',
          name: 'local',
          permissions: 'drwxr-xr-x',
          owner: 'root',
          children: {},
        },
      },
    },
  },
});

// Lessons data
const LESSONS: Lesson[] = [
  {
    id: 'navigation',
    title: 'Navegação básica',
    description: 'Aprenda a navegar pelo sistema de arquivos',
    icon: <FolderOpen className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Primeiro, vamos ver onde estamos. Mostre o diretório de trabalho atual.',
        hint: 'Use o comando "pwd" (print working directory)',
        expectedCommand: 'pwd',
        explanation: 'O pwd mostra onde você está no sistema de arquivos. Pense nele como "onde eu estou?"',
      },
      {
        instruction: 'Agora liste o conteúdo do diretório atual.',
        hint: 'Use o comando "ls" (list)',
        expectedCommand: 'ls',
        explanation: 'O ls lista arquivos e diretórios. É um dos comandos mais usados.',
      },
      {
        instruction: 'Vamos ver mais detalhes. Liste no formato longo para ver permissões e tamanhos.',
        hint: 'Adicione a flag -l ao ls',
        expectedCommand: ['ls -l', 'ls -la', 'ls -al'],
        explanation: 'A flag -l mostra informações detalhadas, como permissões, dono, tamanho e data de modificação.',
      },
      {
        instruction: 'Alguns arquivos são ocultos (começam com ponto). Mostre todos, incluindo os ocultos.',
        hint: 'Adicione a flag -a ao ls',
        expectedCommand: ['ls -a', 'ls -la', 'ls -al', 'ls -all'],
        explanation: 'No Linux, arquivos ocultos começam com ponto (.). A flag -a mostra todos eles. Exemplos comuns: .bashrc, .gitignore',
      },
      {
        instruction: 'Entre no diretório documents.',
        hint: 'Use "cd" seguido do nome do diretório',
        expectedCommand: ['cd documents', 'cd documents/', 'cd ./documents', 'cd ./documents/'],
        explanation: 'O cd muda o diretório atual. Você pode usar caminhos relativos (a partir de onde está) ou absolutos (a partir de /).',
      },
      {
        instruction: 'Volte para o diretório pai.',
        hint: 'Use "cd .." para subir um nível',
        expectedCommand: 'cd ..',
        explanation: '".." representa o diretório pai, e "." representa o diretório atual. Isso vale em todo o Linux.',
      },
    ],
  },
  {
    id: 'files',
    title: 'Operações com arquivos',
    description: 'Crie, leia e gerencie arquivos',
    icon: <FileText className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Leia o conteúdo do arquivo readme.txt na pasta documents.',
        hint: 'Use "cat documents/readme.txt" para mostrar o conteúdo do arquivo',
        expectedCommand: ['cat documents/readme.txt', 'cat ./documents/readme.txt'],
        explanation: 'O cat concatena e mostra o conteúdo de arquivos. Ótimo para ver arquivos pequenos.',
      },
      {
        instruction: 'Crie um arquivo vazio chamado "myfile.txt".',
        hint: 'Use "touch myfile.txt" para criar um arquivo vazio',
        expectedCommand: 'touch myfile.txt',
        explanation: 'O touch cria arquivos vazios ou atualiza o timestamp. Muito usado para criar arquivos de exemplo.',
      },
      {
        instruction: 'Crie um diretório chamado "backup".',
        hint: 'Use "mkdir backup" para criar um diretório',
        expectedCommand: 'mkdir backup',
        explanation: 'O mkdir cria diretórios. Adicione -p para criar também os diretórios pais que ainda não existem.',
      },
      {
        instruction: 'Copie o myfile.txt para o diretório backup.',
        hint: 'Use "cp myfile.txt backup/": o cp copia arquivos da origem para o destino',
        expectedCommand: ['cp myfile.txt backup/', 'cp myfile.txt backup', 'cp myfile.txt ./backup/', 'cp myfile.txt ./backup'],
        explanation: 'O cp copia arquivos. Use -r para copiar diretórios de forma recursiva.',
      },
      {
        instruction: 'Mova o myfile.txt original para a pasta documents.',
        hint: 'Use "mv myfile.txt documents/": o mv move (ou renomeia) arquivos',
        expectedCommand: ['mv myfile.txt documents/', 'mv myfile.txt documents', 'mv myfile.txt ./documents/', 'mv myfile.txt ./documents'],
        explanation: 'O mv move ou renomeia arquivos. mv file.txt newname.txt renomeia o arquivo.',
      },
      {
        instruction: 'Apague o diretório backup e o conteúdo dele.',
        hint: 'Use "rm -r backup": a flag -r apaga diretórios de forma recursiva',
        expectedCommand: ['rm -r backup', 'rm -rf backup', 'rm -r backup/', 'rm -rf backup/'],
        explanation: 'O rm apaga arquivos. Use -r para diretórios e -f para forçar sem confirmação. Cuidado: não existe lixeira!',
      },
    ],
  },
  {
    id: 'viewing',
    title: 'Visualização e busca',
    description: 'Veja o conteúdo de arquivos e busque textos',
    icon: <BookOpen className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Mostre as 5 primeiras linhas de /etc/passwd.',
        hint: 'Use "head -n 5 /etc/passwd" (o head mostra o começo dos arquivos)',
        expectedCommand: ['head -n 5 /etc/passwd', 'head -5 /etc/passwd', 'head -n5 /etc/passwd'],
        explanation: 'O head mostra o começo dos arquivos. O padrão são 10 linhas; o -n define quantas.',
      },
      {
        instruction: 'Mostre as 5 últimas linhas de /var/log/syslog.',
        hint: 'Use "tail -n 5 /var/log/syslog" (o tail mostra o fim dos arquivos)',
        expectedCommand: ['tail -n 5 /var/log/syslog', 'tail -5 /var/log/syslog', 'tail -n5 /var/log/syslog'],
        explanation: 'O tail mostra o fim dos arquivos. Use "tail -f" para acompanhar o arquivo enquanto ele cresce (ótimo para logs).',
      },
      {
        instruction: 'Procure a palavra "Linux" em documents/readme.txt.',
        hint: 'Use "grep Linux documents/readme.txt" (o grep busca textos em arquivos)',
        expectedCommand: ['grep Linux documents/readme.txt', 'grep "Linux" documents/readme.txt'],
        explanation: 'O grep busca padrões de texto em arquivos. Com expressões regulares, ele fica muito poderoso.',
      },
      {
        instruction: 'Conte o número de linhas de projects/app.py.',
        hint: 'Use "wc -l projects/app.py" (wc = word count, -l = linhas)',
        expectedCommand: ['wc -l projects/app.py', 'wc --lines projects/app.py'],
        explanation: 'O wc conta linhas (-l), palavras (-w) e caracteres (-c). Útil para estatísticas de arquivos.',
      },
      {
        instruction: 'Encontre todos os arquivos .txt no diretório atual e nos subdiretórios.',
        hint: 'Use "find . -name \"*.txt\"" (o find busca arquivos, . = diretório atual, -name = padrão do nome)',
        expectedCommand: ['find . -name "*.txt"', 'find . -name *.txt', 'find . -name "*.txt" -type f'],
        explanation: 'O find busca arquivos por nome, tipo, tamanho, data e mais. É extremamente versátil.',
      },
    ],
  },
  {
    id: 'permissions',
    title: 'Permissões e dono',
    description: 'Entenda e altere permissões de arquivos',
    icon: <Lock className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Veja as permissões do arquivo projects/app.py.',
        hint: 'Use "ls -l projects/app.py" para ver os detalhes do arquivo, incluindo as permissões',
        expectedCommand: ['ls -l projects/app.py', 'ls -la projects/app.py'],
        explanation: 'As permissões aparecem como rwxrwxrwx: r=leitura, w=escrita, x=execução, para dono/grupo/outros.',
      },
      {
        instruction: 'Deixe o arquivo projects/config.json com leitura e escrita para todo mundo.',
        hint: 'Use "chmod 666 projects/config.json" (6=rw para o dono, 6=rw para o grupo, 6=rw para os outros)',
        expectedCommand: ['chmod 666 projects/config.json', 'chmod a+rw projects/config.json', 'chmod ugo+rw projects/config.json'],
        explanation: 'O chmod muda permissões. 666 = rw-rw-rw-. Na forma numérica: 4=leitura, 2=escrita, 1=execução.',
      },
      {
        instruction: 'Tire a permissão de escrita dos outros em projects/config.json.',
        hint: 'Use "chmod o-w projects/config.json" (o=outros, -w=remove a escrita)',
        expectedCommand: ['chmod o-w projects/config.json', 'chmod 664 projects/config.json'],
        explanation: 'Use + para adicionar permissões e - para remover. u=dono, g=grupo, o=outros, a=todos.',
      },
      {
        instruction: 'Veja quem é o dono do arquivo /etc/hostname.',
        hint: 'Use "ls -l /etc/hostname": a 3ª coluna mostra o dono',
        expectedCommand: ['ls -l /etc/hostname', 'ls -la /etc/hostname'],
        explanation: 'A coluna de dono mostra o usuário dono do arquivo. O grupo aparece na coluna seguinte.',
      },
    ],
  },
  {
    id: 'system',
    title: 'Informações do sistema',
    description: 'Explore os recursos e processos do sistema',
    icon: <Cpu className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Mostre o nome do usuário atual.',
        hint: 'Digite "whoami" para ver com qual usuário você está logado',
        expectedCommand: 'whoami',
        explanation: 'O whoami mostra o usuário logado. Útil em scripts para conferir o contexto do usuário.',
      },
      {
        instruction: 'Mostre o hostname do sistema.',
        hint: 'Digite "hostname" para ver o nome do sistema',
        expectedCommand: 'hostname',
        explanation: 'O hostname mostra o nome do sistema na rede. Também dá para ler /etc/hostname.',
      },
      {
        instruction: 'Mostre o uso do disco em formato legível.',
        hint: 'Use "df -h" (df = disk free, -h = legível, como 1G, 500M)',
        expectedCommand: ['df -h', 'df -H', 'df --human-readable'],
        explanation: 'O df mostra o uso do espaço em disco. O -h deixa os tamanhos legíveis (KB, MB, GB).',
      },
      {
        instruction: 'Mostre as estatísticas de uso de memória.',
        hint: 'Use "free -h" (o free mostra o uso de RAM, -h = legível)',
        expectedCommand: ['free -h', 'free -m', 'free --human'],
        explanation: 'O free mostra o uso de memória, incluindo swap. Use -h para tamanhos legíveis.',
      },
      {
        instruction: 'Mostre todas as variáveis de ambiente.',
        hint: 'Digite "env" ou "printenv" para listar todas as variáveis de ambiente',
        expectedCommand: ['env', 'printenv'],
        explanation: 'Variáveis de ambiente configuram o comportamento do shell. As mais comuns: PATH, HOME, USER.',
      },
      {
        instruction: 'Mostre o valor da variável de ambiente PATH.',
        hint: 'Use "echo $PATH": o prefixo $ acessa o valor da variável',
        expectedCommand: ['echo $PATH', 'echo "$PATH"', 'printenv PATH'],
        explanation: 'O PATH diz ao shell onde procurar programas executáveis. Os diretórios são separados por dois-pontos.',
      },
    ],
  },
  {
    id: 'pipes',
    title: 'Pipes e redirecionamento',
    description: 'Conecte comandos e redirecione a saída',
    icon: <Network className="h-5 w-5" />,
    commands: [
      {
        instruction: 'Liste todos os arquivos e use um pipe para o grep achar só os .txt.',
        hint: 'Use "ls | grep .txt": o | (pipe) manda a saída do ls para o grep',
        expectedCommand: ['ls -la | grep .txt', 'ls -la | grep txt', 'ls -l | grep .txt', 'ls | grep .txt', 'ls | grep txt'],
        explanation: 'O pipe (|) manda a saída de um comando como entrada de outro. Muito útil para encadear comandos.',
      },
      {
        instruction: 'Conte quantos arquivos há no diretório atual usando ls e wc.',
        hint: 'Use "ls | wc -l": mande a saída do ls para o wc (word count) com -l (linhas)',
        expectedCommand: ['ls | wc -l', 'ls -1 | wc -l'],
        explanation: 'Combinar comandos com pipes cria one-liners poderosos para processar dados.',
      },
      {
        instruction: 'Escreva "Hello, Linux!" num arquivo novo chamado hello.txt usando echo.',
        hint: 'Use "echo \"Hello, Linux!\" > hello.txt": o > redireciona a saída para um arquivo',
        expectedCommand: ['echo "Hello, Linux!" > hello.txt', 'echo Hello, Linux! > hello.txt', "echo 'Hello, Linux!' > hello.txt"],
        explanation: 'O > redireciona a saída para um arquivo (sobrescreve). O >> adiciona ao fim em vez de sobrescrever.',
      },
      {
        instruction: 'Adicione "Welcome!" ao fim do arquivo hello.txt.',
        hint: 'Use "echo \"Welcome!\" >> hello.txt": o >> adiciona ao fim sem sobrescrever',
        expectedCommand: ['echo "Welcome!" >> hello.txt', 'echo Welcome! >> hello.txt', "echo 'Welcome!' >> hello.txt"],
        explanation: 'O >> adiciona ao arquivo sem apagar o que já existe. Essencial para logs.',
      },
      {
        instruction: 'Mostre o conteúdo de hello.txt e conte as palavras.',
        hint: 'Use "cat hello.txt | wc -w" ou simplesmente "wc -w hello.txt"',
        expectedCommand: ['cat hello.txt | wc -w', 'wc -w hello.txt', 'wc -w < hello.txt'],
        explanation: 'Você pode mandar a saída do cat por pipe ou usar < para redirecionar a entrada. Os dois dão resultado parecido.',
      },
    ],
  },
];

// Check if command matches expected
function commandMatches(cmd: string, expected: string | string[]): boolean {
  const trimmed = cmd.trim();

  if (Array.isArray(expected)) {
    return expected.some(e => trimmed === e || trimmed.replace(/\s+/g, ' ') === e.replace(/\s+/g, ' '));
  }

  return trimmed === expected || trimmed.replace(/\s+/g, ' ') === expected.replace(/\s+/g, ' ');
}

export default function LinuxTerminal() {
  const [currentPath, setCurrentPath] = useState('/home/user');
  const [fileSystem, setFileSystem] = useState<FileSystemNode>(createInitialFileSystem);

  // Get node at path
  const getNode = useCallback((path: string): FileSystemNode | null => {
    const parts = path.split('/').filter(Boolean);
    let current: FileSystemNode = fileSystem;

    for (const part of parts) {
      if (current.type !== 'directory' || !current.children) return null;
      if (part === '..') {
        // Handle parent directory - this is simplified
        continue;
      }
      if (!current.children[part]) return null;
      current = current.children[part];
    }

    return current;
  }, [fileSystem]);

  // Resolve path
  const resolvePath = useCallback((inputPath: string): string => {
    if (inputPath.startsWith('/')) return inputPath;
    if (inputPath.startsWith('~')) return `/home/user${inputPath.slice(1)}`;

    const parts = currentPath.split('/').filter(Boolean);
    const inputParts = inputPath.split('/').filter(Boolean);

    for (const part of inputParts) {
      if (part === '..') {
        parts.pop();
      } else if (part !== '.') {
        parts.push(part);
      }
    }

    return '/' + parts.join('/');
  }, [currentPath]);

  // Execute command
  const executeCommand = useCallback((cmd: string): string => {
    const trimmed = cmd.trim();
    const parts = trimmed.split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);

    switch (command) {
      case 'pwd':
        return currentPath;

      case 'ls': {
        const showAll = args.includes('-a') || args.includes('-la') || args.includes('-al');
        const showLong = args.includes('-l') || args.includes('-la') || args.includes('-al');
        const targetPath = args.find(a => !a.startsWith('-')) || currentPath;
        const resolved = resolvePath(targetPath);
        const node = getNode(resolved);

        if (!node) return `ls: cannot access '${targetPath}': No such file or directory`;
        if (node.type === 'file') {
          if (showLong) {
            return `${node.permissions} 1 ${node.owner} ${node.owner} ${node.size || 0} Jan 18 10:00 ${node.name}`;
          }
          return node.name;
        }

        const entries = Object.keys(node.children || {});
        const visible = showAll ? entries : entries.filter(e => !e.startsWith('.'));

        if (showLong) {
          const lines = visible.map(name => {
            const child = node.children![name];
            return `${child.permissions} 1 ${child.owner} ${child.owner} ${child.size || 4096} Jan 18 10:00 ${name}`;
          });
          return `total ${visible.length}\n` + lines.join('\n');
        }

        return visible.join('  ');
      }

      case 'cd': {
        const target = args[0] || '/home/user';
        const resolved = resolvePath(target);
        const node = getNode(resolved);

        if (!node) return `cd: ${target}: No such file or directory`;
        if (node.type !== 'directory') return `cd: ${target}: Not a directory`;

        setCurrentPath(resolved);
        return '';
      }

      case 'cat': {
        if (!args[0]) return 'cat: missing operand';
        const resolved = resolvePath(args[0]);
        const node = getNode(resolved);

        if (!node) return `cat: ${args[0]}: No such file or directory`;
        if (node.type === 'directory') return `cat: ${args[0]}: Is a directory`;

        return node.content || '';
      }

      case 'touch': {
        if (!args[0]) return 'touch: missing file operand';
        const fileName = args[0];
        const dirPath = currentPath;
        const dirNode = getNode(dirPath);

        if (dirNode && dirNode.type === 'directory' && dirNode.children) {
          setFileSystem(prev => {
            const newFs = JSON.parse(JSON.stringify(prev));
            const parts = dirPath.split('/').filter(Boolean);
            let current = newFs;
            for (const part of parts) {
              current = current.children[part];
            }
            current.children[fileName] = {
              type: 'file',
              name: fileName,
              content: '',
              permissions: '-rw-r--r--',
              owner: 'user',
              size: 0,
            };
            return newFs;
          });
          return '';
        }
        return `touch: cannot touch '${fileName}': No such file or directory`;
      }

      case 'mkdir': {
        if (!args[0]) return 'mkdir: missing operand';
        const dirName = args[0];
        const parentPath = currentPath;
        const parentNode = getNode(parentPath);

        if (parentNode && parentNode.type === 'directory' && parentNode.children) {
          if (parentNode.children[dirName]) {
            return `mkdir: cannot create directory '${dirName}': File exists`;
          }
          setFileSystem(prev => {
            const newFs = JSON.parse(JSON.stringify(prev));
            const parts = parentPath.split('/').filter(Boolean);
            let current = newFs;
            for (const part of parts) {
              current = current.children[part];
            }
            current.children[dirName] = {
              type: 'directory',
              name: dirName,
              permissions: 'drwxr-xr-x',
              owner: 'user',
              children: {},
            };
            return newFs;
          });
          return '';
        }
        return `mkdir: cannot create directory '${dirName}'`;
      }

      case 'cp': {
        if (args.length < 2) return 'cp: missing destination file operand';
        const source = resolvePath(args[0]);
        let dest = args[1].endsWith('/') ? args[1] : args[1];
        const sourceNode = getNode(source);

        if (!sourceNode) return `cp: cannot stat '${args[0]}': No such file or directory`;
        if (sourceNode.type === 'directory' && !args.includes('-r')) {
          return `cp: -r not specified; omitting directory '${args[0]}'`;
        }

        // Simplified copy
        const destPath = resolvePath(dest.replace(/\/$/, ''));
        const destNode = getNode(destPath);

        if (destNode && destNode.type === 'directory') {
          setFileSystem(prev => {
            const newFs = JSON.parse(JSON.stringify(prev));
            const parts = destPath.split('/').filter(Boolean);
            let current = newFs;
            for (const part of parts) {
              current = current.children[part];
            }
            current.children[sourceNode.name] = JSON.parse(JSON.stringify(sourceNode));
            return newFs;
          });
          return '';
        }
        return '';
      }

      case 'mv': {
        if (args.length < 2) return 'mv: missing destination file operand';
        const source = resolvePath(args[0]);
        const sourceNode = getNode(source);

        if (!sourceNode) return `mv: cannot stat '${args[0]}': No such file or directory`;

        const destPath = resolvePath(args[1].replace(/\/$/, ''));
        const destNode = getNode(destPath);

        // Get source parent
        const sourceParts = source.split('/').filter(Boolean);
        const sourceFileName = sourceParts.pop();
        const sourceParentPath = '/' + sourceParts.join('/');

        if (destNode && destNode.type === 'directory') {
          setFileSystem(prev => {
            const newFs = JSON.parse(JSON.stringify(prev));
            // Add to destination
            const destParts = destPath.split('/').filter(Boolean);
            let destCurrent = newFs;
            for (const part of destParts) {
              destCurrent = destCurrent.children[part];
            }
            destCurrent.children[sourceNode.name] = JSON.parse(JSON.stringify(sourceNode));

            // Remove from source parent
            let srcParent = newFs;
            for (const part of sourceParts) {
              srcParent = srcParent.children[part];
            }
            delete srcParent.children[sourceFileName!];

            return newFs;
          });
          return '';
        }
        return '';
      }

      case 'rm': {
        const recursive = args.includes('-r') || args.includes('-rf');
        const target = args.find(a => !a.startsWith('-'));

        if (!target) return 'rm: missing operand';

        const resolved = resolvePath(target.replace(/\/$/, ''));
        const node = getNode(resolved);

        if (!node) return `rm: cannot remove '${target}': No such file or directory`;
        if (node.type === 'directory' && !recursive) {
          return `rm: cannot remove '${target}': Is a directory`;
        }

        const parts = resolved.split('/').filter(Boolean);
        const fileName = parts.pop();
        const parentPath = '/' + parts.join('/');

        setFileSystem(prev => {
          const newFs = JSON.parse(JSON.stringify(prev));
          let parent = newFs;
          for (const part of parts) {
            parent = parent.children[part];
          }
          delete parent.children[fileName!];
          return newFs;
        });
        return '';
      }

      case 'head': {
        const nFlag = args.find(a => a.startsWith('-n') || a.startsWith('-'));
        const lines = nFlag ? parseInt(nFlag.replace('-n', '').replace('-', '')) || 10 : 10;
        const file = args.find(a => !a.startsWith('-'));

        if (!file) return 'head: missing file operand';
        const resolved = resolvePath(file);
        const node = getNode(resolved);

        if (!node) return `head: cannot open '${file}': No such file or directory`;
        if (node.type === 'directory') return `head: error reading '${file}': Is a directory`;

        const content = node.content || '';
        return content.split('\n').slice(0, lines).join('\n');
      }

      case 'tail': {
        const nFlag = args.find(a => a.startsWith('-n') || a.startsWith('-'));
        const lines = nFlag ? parseInt(nFlag.replace('-n', '').replace('-', '')) || 10 : 10;
        const file = args.find(a => !a.startsWith('-'));

        if (!file) return 'tail: missing file operand';
        const resolved = resolvePath(file);
        const node = getNode(resolved);

        if (!node) return `tail: cannot open '${file}': No such file or directory`;
        if (node.type === 'directory') return `tail: error reading '${file}': Is a directory`;

        const content = node.content || '';
        return content.split('\n').slice(-lines).join('\n');
      }

      case 'grep': {
        const pattern = args[0];
        const file = args[1];

        if (!pattern) return 'grep: missing pattern';
        if (!file) return 'grep: missing file operand';

        const resolved = resolvePath(file);
        const node = getNode(resolved);

        if (!node) return `grep: ${file}: No such file or directory`;
        if (node.type === 'directory') return `grep: ${file}: Is a directory`;

        const content = node.content || '';
        const matches = content.split('\n').filter(line =>
          line.toLowerCase().includes(pattern.replace(/"/g, '').toLowerCase())
        );
        return matches.join('\n') || '';
      }

      case 'wc': {
        const countLines = args.includes('-l') || args.includes('--lines');
        const countWords = args.includes('-w') || args.includes('--words');
        const file = args.find(a => !a.startsWith('-'));

        if (!file) return 'wc: missing file operand';
        const resolved = resolvePath(file);
        const node = getNode(resolved);

        if (!node) return `wc: ${file}: No such file or directory`;
        if (node.type === 'directory') return `wc: ${file}: Is a directory`;

        const content = node.content || '';
        const lines = content.split('\n').length;
        const words = content.split(/\s+/).filter(Boolean).length;
        const chars = content.length;

        if (countLines) return `${lines} ${file}`;
        if (countWords) return `${words} ${file}`;
        return `${lines} ${words} ${chars} ${file}`;
      }

      case 'find': {
        const nameFlag = args.indexOf('-name');
        const pattern = nameFlag !== -1 ? args[nameFlag + 1]?.replace(/"/g, '') : null;
        const startPath = args[0] === '.' ? currentPath : resolvePath(args[0] || '.');

        const results: string[] = [];

        const search = (node: FileSystemNode, path: string) => {
          if (pattern) {
            const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
            if (regex.test(node.name)) {
              results.push(path);
            }
          } else {
            results.push(path);
          }
          if (node.type === 'directory' && node.children) {
            Object.entries(node.children).forEach(([name, child]) => {
              search(child, `${path}/${name}`);
            });
          }
        };

        const startNode = getNode(startPath);
        if (startNode) {
          search(startNode, '.');
        }

        return results.join('\n');
      }

      case 'chmod': {
        const mode = args[0];
        const file = args[1];

        if (!mode || !file) return 'chmod: missing operand';
        const resolved = resolvePath(file);
        const node = getNode(resolved);

        if (!node) return `chmod: cannot access '${file}': No such file or directory`;

        // Update permissions (simplified)
        const parts = resolved.split('/').filter(Boolean);
        const fileName = parts.pop();

        setFileSystem(prev => {
          const newFs = JSON.parse(JSON.stringify(prev));
          let parent = newFs;
          for (const part of parts) {
            parent = parent.children[part];
          }

          // Simple permission update based on numeric mode
          if (/^\d{3}$/.test(mode)) {
            const perms = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'];
            const [u, g, o] = mode.split('').map(Number);
            const prefix = parent.children[fileName!].type === 'directory' ? 'd' : '-';
            parent.children[fileName!].permissions = prefix + perms[u] + perms[g] + perms[o];
          } else if (mode.includes('o-w')) {
            const current = parent.children[fileName!].permissions || '-rw-rw-rw-';
            parent.children[fileName!].permissions = current.slice(0, -2) + 'r-';
          } else if (mode.includes('a+rw') || mode.includes('ugo+rw')) {
            const prefix = parent.children[fileName!].type === 'directory' ? 'd' : '-';
            parent.children[fileName!].permissions = prefix + 'rw-rw-rw-';
          }

          return newFs;
        });
        return '';
      }

      case 'whoami':
        return 'user';

      case 'hostname':
        return 'linux-tutorial';

      case 'df': {
        if (args.includes('-h') || args.includes('-H') || args.includes('--human-readable')) {
          return `Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        50G   12G   35G  26% /
tmpfs           2.0G     0  2.0G   0% /dev/shm
/dev/sda2       100G   45G   50G  48% /home`;
        }
        return `Filesystem     1K-blocks     Used Available Use% Mounted on
/dev/sda1       52428800 12582912  36700160  26% /
tmpfs            2097152        0   2097152   0% /dev/shm
/dev/sda2      104857600 47185920  52428800  48% /home`;
      }

      case 'free': {
        if (args.includes('-h') || args.includes('-m') || args.includes('--human')) {
          return `              total        used        free      shared  buff/cache   available
Mem:          7.8Gi       2.1Gi       3.5Gi       256Mi       2.2Gi       5.2Gi
Swap:         2.0Gi          0B       2.0Gi`;
        }
        return `              total        used        free      shared  buff/cache   available
Mem:        8169472     2202624     3670016      262144     2296832     5439488
Swap:       2097152           0     2097152`;
      }

      case 'env':
      case 'printenv': {
        const varName = args[0];
        const envVars: Record<string, string> = {
          USER: 'user',
          HOME: '/home/user',
          PATH: '/usr/local/bin:/usr/bin:/bin',
          SHELL: '/bin/bash',
          TERM: 'xterm-256color',
          LANG: 'en_US.UTF-8',
          PWD: currentPath,
        };

        if (varName) {
          return envVars[varName] || '';
        }

        return Object.entries(envVars).map(([k, v]) => `${k}=${v}`).join('\n');
      }

      case 'echo': {
        const text = args.join(' ').replace(/"/g, '').replace(/'/g, '');

        // Handle variable expansion
        const expanded = text.replace(/\$([A-Z_]+)/g, (_, varName) => {
          const vars: Record<string, string> = {
            PATH: '/usr/local/bin:/usr/bin:/bin',
            HOME: '/home/user',
            USER: 'user',
            PWD: currentPath,
          };
          return vars[varName] || '';
        });

        // Handle redirection
        const redirectIndex = args.indexOf('>');
        const appendIndex = args.indexOf('>>');

        if (appendIndex !== -1) {
          const content = args.slice(0, appendIndex).join(' ').replace(/"/g, '').replace(/'/g, '');
          const fileName = args[appendIndex + 1];
          const resolved = resolvePath(fileName);
          const node = getNode(resolved);

          if (node && node.type === 'file') {
            const parts = resolved.split('/').filter(Boolean);
            const fName = parts.pop();

            setFileSystem(prev => {
              const newFs = JSON.parse(JSON.stringify(prev));
              let parent = newFs;
              for (const part of parts) {
                parent = parent.children[part];
              }
              parent.children[fName!].content = (parent.children[fName!].content || '') + '\n' + content;
              parent.children[fName!].size = parent.children[fName!].content.length;
              return newFs;
            });
          }
          return '';
        } else if (redirectIndex !== -1) {
          const content = args.slice(0, redirectIndex).join(' ').replace(/"/g, '').replace(/'/g, '');
          const fileName = args[redirectIndex + 1];

          const parts = currentPath.split('/').filter(Boolean);

          setFileSystem(prev => {
            const newFs = JSON.parse(JSON.stringify(prev));
            let parent = newFs;
            for (const part of parts) {
              parent = parent.children[part];
            }
            parent.children[fileName] = {
              type: 'file',
              name: fileName,
              content: content,
              permissions: '-rw-r--r--',
              owner: 'user',
              size: content.length,
            };
            return newFs;
          });
          return '';
        }

        return expanded;
      }

      case 'help':
        return `Comandos disponíveis:
  pwd     - Mostra o diretório atual
  ls      - Lista o conteúdo do diretório
  cd      - Muda de diretório
  cat     - Mostra o conteúdo de arquivos
  touch   - Cria um arquivo vazio
  mkdir   - Cria um diretório
  cp      - Copia arquivos
  mv      - Move/renomeia arquivos
  rm      - Apaga arquivos
  head    - Mostra as primeiras linhas
  tail    - Mostra as últimas linhas
  grep    - Busca padrões
  wc      - Conta palavras/linhas
  find    - Encontra arquivos
  chmod   - Muda permissões
  whoami  - Mostra o usuário atual
  hostname - Mostra o hostname
  df      - Espaço livre em disco
  free    - Uso de memória
  env     - Variáveis de ambiente
  echo    - Imprime texto
  clear   - Limpa o terminal`;

      default:
        return `${command}: command not found`;
    }
  }, [currentPath, fileSystem, getNode, resolvePath]);

  // Handle pipe commands
  const executePipedCommand = useCallback((cmd: string): string => {
    const pipes = cmd.split('|').map(c => c.trim());

    let output = '';
    for (let i = 0; i < pipes.length; i++) {
      const pipeCmd = pipes[i];

      if (i === 0) {
        output = executeCommand(pipeCmd);
      } else {
        // For piped commands, we simulate by parsing the output
        const parts = pipeCmd.split(/\s+/);
        const pipedCommand = parts[0];
        const pipedArgs = parts.slice(1);

        switch (pipedCommand) {
          case 'grep': {
            const pattern = pipedArgs[0]?.replace(/"/g, '').toLowerCase();
            if (pattern) {
              output = output.split('\n').filter(line =>
                line.toLowerCase().includes(pattern)
              ).join('\n');
            }
            break;
          }
          case 'wc': {
            if (pipedArgs.includes('-l')) {
              output = String(output.split('\n').filter(Boolean).length);
            } else if (pipedArgs.includes('-w')) {
              output = String(output.split(/\s+/).filter(Boolean).length);
            } else {
              const lines = output.split('\n').length;
              const words = output.split(/\s+/).filter(Boolean).length;
              const chars = output.length;
              output = `${lines} ${words} ${chars}`;
            }
            break;
          }
          case 'head': {
            const nFlag = pipedArgs.find(a => a.startsWith('-n') || a.startsWith('-'));
            const lines = nFlag ? parseInt(nFlag.replace('-n', '').replace('-', '')) || 10 : 10;
            output = output.split('\n').slice(0, lines).join('\n');
            break;
          }
          case 'tail': {
            const nFlag = pipedArgs.find(a => a.startsWith('-n') || a.startsWith('-'));
            const lines = nFlag ? parseInt(nFlag.replace('-n', '').replace('-', '')) || 10 : 10;
            output = output.split('\n').slice(-lines).join('\n');
            break;
          }
          default:
            break;
        }
      }
    }

    return output;
  }, [executeCommand]);

  // Run a command through the shared simulator hook; `clear` is signalled
  // via the clear flag, piped input goes through executePipedCommand.
  const execute = useCallback((cmd: string): ExecuteResult => {
    const trimmed = cmd.trim();
    const command = trimmed.split(/\s+/)[0];

    if (command === 'clear') {
      return { output: '', clear: true };
    }

    return {
      output: trimmed.includes('|') ? executePipedCommand(trimmed) : executeCommand(trimmed),
      type: 'output',
    };
  }, [executeCommand, executePipedCommand]);

  // Reset domain state (lesson progress is reset by the hook)
  const onReset = useCallback(() => {
    setCurrentPath('/home/user');
    setFileSystem(createInitialFileSystem());
  }, []);

  const {
    currentLessonIndex,
    currentCommandIndex,
    currentLesson,
    currentCommand,
    completedCommands,
    completedCount,
    totalCommands,
    progressPercentage,
    terminalHistory,
    setTerminalHistory,
    inputValue,
    setInputValue,
    showHint,
    setShowHint,
    inputRef,
    terminalRef,
    handleSubmit,
    handleKeyDown: baseHandleKeyDown,
    resetProgress,
    jumpToLesson,
  } = useTerminalSimulator({
    lessons: LESSONS,
    execute,
    matches: (cmd, command) => commandMatches(cmd, command.expectedCommand),
    successMessage: (command) => `✓ ${command.explanation}`,
    ctrlCInputPrefix: '$ ',
    onReset,
  });

  // Filesystem-aware Tab completion; every other key delegates to the hook
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Tab - autocomplete
    if (e.key === 'Tab') {
      e.preventDefault();
      
      const parts = inputValue.trimStart().split(/\s+/);
      const isTypingCommand = parts.length === 1;
      const partialInput = parts[parts.length - 1] || '';
      
      // Available commands
      const AVAILABLE_COMMANDS = [
        'pwd', 'ls', 'cd', 'cat', 'touch', 'mkdir', 'cp', 'mv', 'rm',
        'head', 'tail', 'grep', 'wc', 'find', 'chmod', 'whoami', 'hostname',
        'df', 'free', 'env', 'printenv', 'echo', 'clear', 'help'
      ];
      
      if (isTypingCommand) {
        // Autocomplete command
        const matches = AVAILABLE_COMMANDS.filter(cmd => 
          cmd.startsWith(partialInput.toLowerCase())
        );
        
        if (matches.length === 1) {
          setInputValue(matches[0] + ' ');
        } else if (matches.length > 1) {
          // Show available completions
          setTerminalHistory(prev => [
            ...prev,
            { type: 'input', content: `$ ${inputValue}`, timestamp: new Date() },
            { type: 'output', content: matches.join('  '), timestamp: new Date() }
          ]);
        }
      } else {
        // Autocomplete path/file
        const prefix = parts.slice(0, -1).join(' ');
        let dirPath = currentPath;
        let searchPrefix = partialInput;
        
        // Handle path with directory component
        if (partialInput.includes('/')) {
          const lastSlash = partialInput.lastIndexOf('/');
          const pathPart = partialInput.slice(0, lastSlash) || '/';
          searchPrefix = partialInput.slice(lastSlash + 1);
          
          // Resolve the directory path
          if (pathPart.startsWith('/')) {
            dirPath = pathPart;
          } else if (pathPart.startsWith('~')) {
            dirPath = `/home/user${pathPart.slice(1)}`;
          } else {
            const pathParts = currentPath.split('/').filter(Boolean);
            const inputParts = pathPart.split('/').filter(Boolean);
            for (const part of inputParts) {
              if (part === '..') {
                pathParts.pop();
              } else if (part !== '.') {
                pathParts.push(part);
              }
            }
            dirPath = '/' + pathParts.join('/');
          }
        }
        
        // Get directory contents
        const node = getNode(dirPath);
        if (node && node.type === 'directory' && node.children) {
          const matches = Object.keys(node.children).filter(name =>
            name.startsWith(searchPrefix)
          ).map(name => {
            const child = node.children![name];
            return child.type === 'directory' ? name + '/' : name;
          });
          
          if (matches.length === 1) {
            // Reconstruct the path
            let completedPath = matches[0];
            if (partialInput.includes('/')) {
              const lastSlash = partialInput.lastIndexOf('/');
              completedPath = partialInput.slice(0, lastSlash + 1) + matches[0];
            }
            setInputValue(prefix + ' ' + completedPath);
          } else if (matches.length > 1) {
            // Find common prefix for partial completion
            let commonPrefix = matches[0];
            for (const match of matches) {
              while (!match.startsWith(commonPrefix)) {
                commonPrefix = commonPrefix.slice(0, -1);
              }
            }
            
            if (commonPrefix.length > searchPrefix.length) {
              // Complete to common prefix
              let completedPath = commonPrefix;
              if (partialInput.includes('/')) {
                const lastSlash = partialInput.lastIndexOf('/');
                completedPath = partialInput.slice(0, lastSlash + 1) + commonPrefix;
              }
              setInputValue(prefix + ' ' + completedPath);
            } else {
              // Show available completions
              setTerminalHistory(prev => [
                ...prev,
                { type: 'input', content: `$ ${inputValue}`, timestamp: new Date() },
                { type: 'output', content: matches.join('  '), timestamp: new Date() }
              ]);
            }
          }
        }
      }
      return;
    }

    baseHandleKeyDown(e);
  }, [baseHandleKeyDown, currentPath, getNode, inputValue, setInputValue, setTerminalHistory]);

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Terminal className="h-10 w-10 text-green-500" />
          <h2 className="text-3xl md:text-4xl font-bold">Aprenda Linux</h2>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Domine os comandos essenciais do Linux com lições interativas.
          Digite os comandos no terminal e veja eles rodarem em tempo real.
        </p>
      </div>

      {/* Progress Bar */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="font-medium">Progresso</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {completedCount}/{totalCommands} comandos concluídos
            </span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
          {progressPercentage === 100 && (
            <p className="mt-2 text-center text-green-600 font-medium">
              🎉 Parabéns! Você concluiu todas as lições!
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lessons Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Lições
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {LESSONS.map((lesson, index) => {
              const lessonCompletedCount = lesson.commands.filter((_, cmdIndex) =>
                completedCommands.has(`${lesson.id}-${cmdIndex}`)
              ).length;
              const isComplete = lessonCompletedCount === lesson.commands.length;
              const isCurrent = index === currentLessonIndex;

              return (
                <button
                  key={lesson.id}
                  onClick={() => jumpToLesson(index)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    isCurrent
                      ? 'bg-primary/10 border-2 border-primary'
                      : 'hover:bg-muted border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isComplete ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        lesson.icon
                      )}
                      <span className="font-medium">{lesson.title}</span>
                    </div>
                    <Badge variant={isComplete ? 'default' : 'secondary'}>
                      {lessonCompletedCount}/{lesson.commands.length}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 pl-7">
                    {lesson.description}
                  </p>
                </button>
              );
            })}

            <Button
              variant="outline"
              onClick={resetProgress}
              className="w-full mt-4"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Zerar todo o progresso
            </Button>
          </CardContent>
        </Card>

        {/* Terminal and Current Task */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Task Card */}
          {currentCommand && (
            <Card className="border-primary/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ChevronRight className="h-5 w-5 text-primary" />
                    Tarefa atual
                  </CardTitle>
                  <Badge>
                    Passo {currentCommandIndex + 1}/{currentLesson.commands.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-lg mb-4">{currentCommand.instruction}</p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHint(!showHint)}
                    className="text-muted-foreground"
                  >
                    <Lightbulb className="h-4 w-4 mr-1" />
                    {showHint ? 'Esconder dica' : 'Mostrar dica'}
                  </Button>
                </div>
                {showHint && (
                  <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      💡 {currentCommand.hint}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Terminal */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="pb-2 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-sm text-gray-400 ml-2">
                  user@linux-tutorial: {currentPath}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div
                ref={terminalRef}
                onClick={() => inputRef.current?.focus()}
                className="h-80 overflow-y-auto p-4 font-mono text-sm cursor-text"
              >
                {/* Welcome message */}
                {terminalHistory.length === 0 && (
                  <div className="text-green-400 mb-4">
                    <p>Boas-vindas ao tutorial do terminal Linux!</p>
                    <p className="text-gray-500 mt-2">
                      Digite "help" para ver os comandos disponíveis. Siga as instruções à esquerda.
                    </p>
                  </div>
                )}

                {/* Terminal history */}
                {terminalHistory.map((line, index) => (
                  <div
                    key={index}
                    className={`mb-1 ${
                      line.type === 'input'
                        ? 'text-white'
                        : line.type === 'error'
                          ? 'text-red-400'
                          : line.type === 'success'
                            ? 'text-green-400 bg-green-900/30 p-2 rounded my-2'
                            : 'text-gray-300'
                    }`}
                  >
                    {line.type === 'input' && (
                      <span className="text-green-400">$ </span>
                    )}
                    <span className="whitespace-pre-wrap">{line.content}</span>
                  </div>
                ))}

                {/* Input line */}
                <form onSubmit={handleSubmit} className="flex items-center">
                  <span className="text-green-400">$ </span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent text-white outline-none ml-1 caret-green-400"
                    spellCheck={false}
                    autoComplete="off"
                    autoCapitalize="off"
                  />
                </form>
              </div>
            </CardContent>
          </Card>

          {/* Quick Reference */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Referência rápida</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div className="p-2 rounded bg-muted">
                  <code className="text-primary">pwd</code>
                  <p className="text-muted-foreground text-xs mt-1">Mostra o diretório</p>
                </div>
                <div className="p-2 rounded bg-muted">
                  <code className="text-primary">ls</code>
                  <p className="text-muted-foreground text-xs mt-1">Lista arquivos</p>
                </div>
                <div className="p-2 rounded bg-muted">
                  <code className="text-primary">cd [dir]</code>
                  <p className="text-muted-foreground text-xs mt-1">Muda de diretório</p>
                </div>
                <div className="p-2 rounded bg-muted">
                  <code className="text-primary">cat [file]</code>
                  <p className="text-muted-foreground text-xs mt-1">Mostra um arquivo</p>
                </div>
                <div className="p-2 rounded bg-muted">
                  <code className="text-primary">grep [text] [file]</code>
                  <p className="text-muted-foreground text-xs mt-1">Busca texto</p>
                </div>
                <div className="p-2 rounded bg-muted">
                  <code className="text-primary">help</code>
                  <p className="text-muted-foreground text-xs mt-1">Todos os comandos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
