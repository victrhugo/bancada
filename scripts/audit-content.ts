#!/usr/bin/env node

/**
 * Audit content files for structural issues.
 *
 * Checks quizzes (totalPoints, difficulty counts, correctAnswer) and
 * exercises (required fields, categories).
 *
 * Usage:
 *   npx tsx scripts/audit-content.ts                # audit everything
 *   npx tsx scripts/audit-content.ts --type quizzes  # audit only quizzes
 *   npx tsx scripts/audit-content.ts --json          # JSON output for agents
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const CONTENT_DIR = join(process.cwd(), 'content');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

type Severity = 'critical' | 'warning' | 'info';

interface Issue {
  file: string;
  severity: Severity;
  message: string;
}

interface AuditReport {
  quizzesScanned: number;
  exercisesScanned: number;
  issues: Issue[];
}

// ── Quiz Auditing ──

function auditQuizzes(): { count: number; issues: Issue[] } {
  const dir = join(CONTENT_DIR, 'quizzes');
  const files = readdirSync(dir).filter(f => f.endsWith('.json'));
  const issues: Issue[] = [];

  for (const file of files) {
    const path = `content/quizzes/${file}`;
    let data: any;

    try {
      data = JSON.parse(readFileSync(join(dir, file), 'utf-8'));
    } catch {
      issues.push({ file: path, severity: 'critical', message: 'Invalid JSON' });
      continue;
    }

    const questions = data.questions || [];

    // totalPoints check
    const actualTotal = questions.reduce((sum: number, q: any) => sum + (q.points || 0), 0);
    if (data.totalPoints !== actualTotal) {
      issues.push({ file: path, severity: 'critical', message: `totalPoints mismatch: declared ${data.totalPoints}, actual ${actualTotal}` });
    }

    // correctAnswer check
    for (const q of questions) {
      const optionCount = (q.options || []).length;
      if (q.correctAnswer < 0 || q.correctAnswer >= optionCount) {
        issues.push({ file: path, severity: 'critical', message: `Question "${q.id}": correctAnswer ${q.correctAnswer} out of range (${optionCount} options)` });
      }
    }

    // Duplicate IDs
    const ids = questions.map((q: any) => q.id);
    const dupes = ids.filter((id: string, i: number) => ids.indexOf(id) !== i);
    if (dupes.length > 0) {
      issues.push({ file: path, severity: 'critical', message: `Duplicate question IDs: ${[...new Set(dupes)].join(', ')}` });
    }

    // Short explanations
    const shortExplanations = questions.filter((q: any) => !q.explanation || q.explanation.length < 50);
    if (shortExplanations.length > 0) {
      issues.push({ file: path, severity: 'warning', message: `${shortExplanations.length} questions with short explanations (<50 chars)` });
    }

    // Question count
    if (questions.length < 10) {
      issues.push({ file: path, severity: 'warning', message: `Only ${questions.length} questions (recommend 10+)` });
    }
  }

  return { count: files.length, issues };
}

// ── Exercise Auditing ──

function auditExercises(): { count: number; issues: Issue[] } {
  const dir = join(CONTENT_DIR, 'exercises');
  const files = readdirSync(dir).filter(f => f.endsWith('.json'));
  const issues: Issue[] = [];

  for (const file of files) {
    const path = `content/exercises/${file}`;
    let data: any;

    try {
      data = JSON.parse(readFileSync(join(dir, file), 'utf-8'));
    } catch {
      issues.push({ file: path, severity: 'critical', message: 'Invalid JSON' });
      continue;
    }

    // Steps required fields
    for (const step of (data.steps || [])) {
      if (!step.id || !step.title || !step.description) {
        issues.push({ file: path, severity: 'critical', message: `Step missing required field (id/title/description)` });
        break;
      }
    }

    // Troubleshooting count
    const tsCount = (data.troubleshooting || []).length;
    if (tsCount < 3) {
      issues.push({ file: path, severity: 'warning', message: `Only ${tsCount} troubleshooting items (recommend 3+)` });
    }

    // Completion criteria count
    const ccCount = (data.completionCriteria || []).length;
    if (ccCount < 3) {
      issues.push({ file: path, severity: 'warning', message: `Only ${ccCount} completion criteria (recommend 3+)` });
    }
  }

  return { count: files.length, issues };
}

// ── Main ──

function run() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const typeIdx = args.indexOf('--type');
  const typeFilter = typeIdx !== -1 ? args[typeIdx + 1] : undefined;

  const report: AuditReport = {
    quizzesScanned: 0,
    exercisesScanned: 0,
    issues: [],
  };

  if (!typeFilter || typeFilter === 'quizzes') {
    const r = auditQuizzes();
    report.quizzesScanned = r.count;
    report.issues.push(...r.issues);
  }
  if (!typeFilter || typeFilter === 'exercises') {
    const r = auditExercises();
    report.exercisesScanned = r.count;
    report.issues.push(...r.issues);
  }

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printHumanReport(report);
  }

  const criticalCount = report.issues.filter(i => i.severity === 'critical').length;
  process.exit(criticalCount > 0 ? 1 : 0);
}

function printHumanReport(report: AuditReport) {
  const critical = report.issues.filter(i => i.severity === 'critical');
  const warnings = report.issues.filter(i => i.severity === 'warning');

  console.log(`\n${BOLD}Content Audit Report${RESET}\n`);
  console.log(`  Quizzes:   ${report.quizzesScanned}`);
  console.log(`  Exercises: ${report.exercisesScanned}`);
  console.log(`  Issues:    ${critical.length} critical, ${warnings.length} warnings\n`);

  if (critical.length > 0) {
    console.log(`${RED}${BOLD}Critical Issues (${critical.length}):${RESET}`);
    for (const issue of critical) {
      console.log(`  ${RED}✗${RESET} ${issue.file}: ${issue.message}`);
    }
    console.log();
  }

  if (warnings.length > 0) {
    console.log(`${YELLOW}${BOLD}Warnings (${warnings.length}):${RESET}`);
    for (const issue of warnings) {
      console.log(`  ${YELLOW}○${RESET} ${issue.file}: ${issue.message}`);
    }
    console.log();
  }

  if (critical.length === 0 && warnings.length === 0) {
    console.log(`${GREEN}✓ No issues found.${RESET}\n`);
  }
}

run();
