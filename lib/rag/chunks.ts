/**
 * Turns the site's structured content into small, self-contained chunks for RAG.
 *
 * Each chunk carries the page title, the section inside it and the URL, so an answer
 * can cite exactly where the information lives. Chunks stay short (a question with its
 * explanation, a flashcard, one exercise step) because small chunks retrieve more
 * precisely than whole pages. Runs at build time only (reads from disk).
 */
import fs from 'node:fs';
import path from 'node:path';
import type { RagChunk } from './retrieve';

const CONTENT = path.join(process.cwd(), 'content');
const MAX_CHARS = 1200;

type Json = Record<string, unknown>;

function readJsonDir(dir: string): Json[] {
  const full = path.join(CONTENT, dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => JSON.parse(fs.readFileSync(path.join(full, f), 'utf-8')) as Json);
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function list(v: unknown): Json[] {
  return Array.isArray(v) ? (v as Json[]) : [];
}

/** Collapse whitespace, drop markdown noise and cap the length at a sentence boundary. */
export function clean(text: string, max = MAX_CHARS): string {
  const t = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[*_#>`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '), cut.lastIndexOf('! '));
  return (end > max * 0.6 ? cut.slice(0, end + 1) : cut) + ' …';
}

function push(out: RagChunk[], c: Omit<RagChunk, 'text'> & { text: string }) {
  const text = clean(c.text);
  if (text.length < 40) return;
  out.push({ ...c, text });
}

function quizzes(out: RagChunk[]) {
  for (const quiz of readJsonDir('quizzes')) {
    const url = `/quizzes/${str(quiz.id)}`;
    for (const q of list(quiz.questions)) {
      const options = list(q.options as unknown).map(String);
      const correct = options[Number(q.correctAnswer)] ?? '';
      push(out, {
        id: `quiz:${str(quiz.id)}:${str(q.id)}`,
        type: 'quiz',
        title: str(quiz.title),
        section: str(q.title),
        url,
        text: `${str(q.title)}. ${str(q.description)} ${str(q.situation)} Resposta correta: ${correct}. ${str(q.explanation)}`,
      });
    }
  }
}

function flashcards(out: RagChunk[]) {
  for (const set of readJsonDir('flashcards')) {
    const url = `/flashcards/${str(set.id)}`;
    for (const card of list(set.cards)) {
      push(out, {
        id: `flashcard:${str(set.id)}:${str(card.id)}`,
        type: 'flashcard',
        title: str(set.title),
        section: clean(str(card.front), 120),
        url,
        text: `${str(card.front)} ${str(card.back)}`,
      });
    }
  }
}

function checklists(out: RagChunk[]) {
  for (const c of readJsonDir('checklists')) {
    const url = `/checklists/${str(c.slug)}`;
    for (const item of list(c.items)) {
      push(out, {
        id: `checklist:${str(c.slug)}:${str(item.id)}`,
        type: 'checklist',
        title: str(c.title),
        section: str(item.title),
        url,
        text: `${str(item.title)}. ${str(item.description)}`,
      });
    }
  }
}

function exercises(out: RagChunk[]) {
  for (const ex of readJsonDir('exercises')) {
    const url = `/exercises/${str(ex.id)}`;
    const objectives = (Array.isArray(ex.learningObjectives) ? ex.learningObjectives : []).join(
      '; '
    );
    push(out, {
      id: `exercise:${str(ex.id)}`,
      type: 'exercise',
      title: str(ex.title),
      section: 'Visão geral',
      url,
      text: `${str(ex.description)} Objetivos: ${objectives}`,
    });
    for (const step of list(ex.steps)) {
      push(out, {
        id: `exercise:${str(ex.id)}:${str(step.id)}`,
        type: 'exercise',
        title: str(ex.title),
        section: str(step.title),
        url,
        text: `${str(step.title)}. ${str(step.description)}`,
      });
    }
  }
}

function interviewQuestions(out: RagChunk[]) {
  for (const q of readJsonDir('interview-questions')) {
    push(out, {
      id: `interview:${str(q.slug)}`,
      type: 'interview-question',
      title: str(q.title),
      section: str(q.question),
      url: `/interview-questions/${str(q.tier)}/${str(q.slug)}`,
      text: `${str(q.question)} ${str(q.answer)} ${str(q.explanation)}`,
    });
  }
}

/**
 * Chunks from TypeScript data (games catalog, AI roadmap). Passed in by the caller so
 * this module does not import React/lucide code paths at runtime.
 */
export interface ExtraSources {
  games: { id: string; title: string; description: string; href: string }[];
  aiMilestones: {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    skills: { name: string; description: string }[];
    outcomes: string[];
    tips: string[];
  }[];
}

function extras(out: RagChunk[], { games, aiMilestones }: ExtraSources) {
  for (const g of games) {
    push(out, {
      id: `game:${g.id}`,
      type: 'game',
      title: g.title,
      section: 'Simulador interativo',
      url: g.href,
      text: `${g.title}. ${g.description}`,
    });
  }
  for (const m of aiMilestones) {
    push(out, {
      id: `roadmap-ia:${m.id}`,
      type: 'roadmap',
      title: 'Trilha de Engenharia de IA',
      section: `${m.title}: ${m.subtitle}`,
      url: '/roadmap/ia',
      text: `${m.title}. ${m.description} Você vai conseguir: ${m.outcomes.join('; ')}. Dicas: ${m.tips.join(' ')}`,
    });
    for (const s of m.skills) {
      push(out, {
        id: `roadmap-ia:${m.id}:${s.name}`,
        type: 'roadmap',
        title: 'Trilha de Engenharia de IA',
        section: s.name,
        url: '/roadmap/ia',
        text: `${s.name}. ${s.description}`,
      });
    }
  }
}

export function collectChunks(sources: ExtraSources): RagChunk[] {
  const out: RagChunk[] = [];
  extras(out, sources);
  exercises(out);
  interviewQuestions(out);
  checklists(out);
  quizzes(out);
  flashcards(out);
  const seen = new Set<string>();
  return out.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)));
}
