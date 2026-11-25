'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Coins,
  FileText,
  Layers,
  MessageSquare,
  Scissors,
  Search,
  ShieldAlert,
  Sparkles,
  Target,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  SimulatorAdvisorCard,
  SimulatorControlSlider,
  SimulatorMetricCard,
  SimulatorModeButton,
} from '@/components/games/simulator-primitives';
import {
  PRESET_QUESTIONS,
  runRag,
  type Outcome,
  type RagResult,
  type RetrievalMode,
} from '@/lib/games/rag-pipeline-engine';
import { cn } from '@/lib/utils';

const MODE_LABELS: Record<RetrievalMode, string> = {
  semantic: 'Semântica (embeddings)',
  keyword: 'Palavra-chave (BM25)',
  hybrid: 'Híbrida (RRF)',
};

const DOC_COLORS: Record<string, string> = {
  trocas: 'bg-violet-500/15 border-violet-500/40',
  reembolso: 'bg-sky-500/15 border-sky-500/40',
  pagamentos: 'bg-amber-500/15 border-amber-500/40',
  entregas: 'bg-emerald-500/15 border-emerald-500/40',
  atendimento: 'bg-fuchsia-500/15 border-fuchsia-500/40',
  forum: 'bg-red-500/15 border-red-500/50',
};

const OUTCOME_INFO: Record<Outcome, { label: string; tone: 'good' | 'warn' | 'bad' | 'default' }> =
  {
    correct: { label: 'Correta e fundamentada', tone: 'good' },
    'correct-refusal': { label: 'Recusa correta', tone: 'good' },
    missed: { label: 'Não encontrou (recall falhou)', tone: 'warn' },
    hallucination: { label: 'Alucinação', tone: 'bad' },
    injection: { label: 'Prompt injection', tone: 'bad' },
    'custom-answer': { label: 'Resposta do contexto', tone: 'default' },
    'custom-refusal': { label: 'Recusa', tone: 'default' },
    'custom-ungrounded': { label: 'Sem fundamento', tone: 'warn' },
  };

// Illustrative price only, so learners can compare configurations.
const PRICE_PER_MILLION_INPUT_TOKENS_USD = 1;

function explain(
  result: RagResult,
  grounding: boolean,
  mode: RetrievalMode,
  factWasSplit: boolean
): string {
  switch (result.outcome) {
    case 'correct':
      return grounding
        ? 'O trecho com a resposta chegou ao contexto e o prompt obrigou o modelo a usá-lo e citar a fonte. É assim que um RAG deve funcionar.'
        : 'Acertou porque o trecho certo estava no contexto, mas sem citação ninguém consegue conferir de onde veio a resposta. Ligue o grounding.';
    case 'correct-refusal':
      return 'O contexto recuperado era parecido com a pergunta, mas não tinha a resposta. Com a regra de recusa, o modelo admite que não sabe em vez de inventar.';
    case 'missed':
      if (factWasSplit) {
        return 'Os chunks estão pequenos demais e a frase com a resposta foi cortada entre dois pedaços, então nenhum trecho a contém inteira. Aumente o tamanho do chunk ou o overlap.';
      }
      if (mode === 'semantic') {
        return 'A busca semântica trouxe trechos com significado parecido, mas não o trecho certo. Para termos exatos, como códigos, experimente a busca híbrida.';
      }
      if (mode === 'keyword') {
        return 'A busca por palavra-chave só encontra termos idênticos. A pergunta usa palavras diferentes das do documento; a busca semântica ou a híbrida resolvem.';
      }
      return 'O trecho certo ficou fora do top-k. Aumente o top-k ou ajuste o chunking. O modelo recusou corretamente, mas a resposta existia: é uma falha de retrieval.';
    case 'hallucination':
      return 'Sem a instrução de responder só com base no contexto, o modelo completou com algo plausível e falso. Ligue o grounding para ver a diferença.';
    case 'injection':
      return 'Um trecho não confiável trazia uma instrução escondida e, sem separar dados de instruções, o modelo obedeceu. Na vida real, a regra no prompt ajuda mas não basta: combine com privilégio mínimo e validação de saída.';
    case 'custom-answer':
      return 'Resposta extraída do trecho mais relevante. Confira a citação: o trecho realmente responde à sua pergunta?';
    case 'custom-refusal':
      return 'Nenhum trecho relevante foi encontrado para a sua pergunta, então o assistente recusou. Tente perguntar sobre trocas, reembolso, pagamentos, entregas ou privacidade.';
    case 'custom-ungrounded':
      return 'Sem contexto e sem grounding, um LLM real responderia mesmo assim, com alto risco de inventar.';
  }
}

export default function RagPipelineSimulator() {
  const [presetId, setPresetId] = useState<string>(PRESET_QUESTIONS[0].id);
  const [customQuestion, setCustomQuestion] = useState('');
  const [chunkSize, setChunkSize] = useState(30);
  const [overlapPercent, setOverlapPercent] = useState(15);
  const [topK, setTopK] = useState(3);
  const [mode, setMode] = useState<RetrievalMode>('hybrid');
  const [grounding, setGrounding] = useState(true);
  const [includeMaliciousDoc, setIncludeMaliciousDoc] = useState(false);

  const preset = customQuestion.trim()
    ? null
    : (PRESET_QUESTIONS.find((p) => p.id === presetId) ?? null);
  const question = customQuestion.trim() || preset?.question || '';

  const result = useMemo(
    () =>
      runRag(
        question,
        { chunkSize, overlapPercent, topK, mode, grounding, includeMaliciousDoc },
        preset
      ),
    [question, chunkSize, overlapPercent, topK, mode, grounding, includeMaliciousDoc, preset]
  );

  const factWasSplit = Boolean(
    preset?.expected && !result.chunks.some((c) => c.text.includes(preset.expected as string))
  );
  const retrievedIds = new Set(result.retrieved.map((r) => r.chunk.id));
  const outcome = OUTCOME_INFO[result.outcome];
  const costPerThousand =
    (result.promptTokens * 1000 * PRICE_PER_MILLION_INPUT_TOKENS_USD) / 1_000_000;

  return (
    <div className="space-y-6">
      {/* Question */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4 text-primary" />
            1. Escolha uma pergunta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {PRESET_QUESTIONS.map((p) => (
              <SimulatorModeButton
                key={p.id}
                value={p.id}
                current={customQuestion.trim() ? '' : presetId}
                onClick={(id) => {
                  setPresetId(id);
                  setCustomQuestion('');
                }}
              >
                {p.label}
              </SimulatorModeButton>
            ))}
          </div>
          <Input
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            placeholder="Ou escreva sua própria pergunta sobre trocas, reembolso, pagamentos, entregas..."
            aria-label="Pergunta personalizada"
          />
          <p className="rounded-md border bg-muted/40 px-3 py-2 font-mono text-sm">
            <span className="text-muted-foreground">pergunta&gt; </span>
            {question}
          </p>
          {preset && <p className="text-sm text-muted-foreground">{preset.lesson}</p>}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Controls */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              2. Configure o pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <SimulatorControlSlider
              label="Tamanho do chunk"
              value={chunkSize}
              min={6}
              max={120}
              step={2}
              suffix=" palavras"
              onChange={setChunkSize}
            />
            <SimulatorControlSlider
              label="Overlap"
              value={overlapPercent}
              min={0}
              max={50}
              step={5}
              suffix="%"
              onChange={setOverlapPercent}
            />
            <SimulatorControlSlider
              label="Top-k"
              value={topK}
              min={1}
              max={6}
              step={1}
              onChange={setTopK}
            />
            <div>
              <div className="mb-2 text-sm font-medium">Tipo de busca</div>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(MODE_LABELS) as RetrievalMode[]).map((m) => (
                  <SimulatorModeButton key={m} value={m} current={mode} onClick={setMode}>
                    {MODE_LABELS[m]}
                  </SimulatorModeButton>
                ))}
              </div>
            </div>
            <label className="flex items-start justify-between gap-3 text-sm">
              <span>
                <span className="font-medium">Prompt com grounding</span>
                <span className="block text-xs text-muted-foreground">
                  Responder só com o contexto, citar a fonte, recusar quando não souber
                </span>
              </span>
              <Switch
                checked={grounding}
                onCheckedChange={setGrounding}
                aria-label="Prompt com grounding"
              />
            </label>
            <label className="flex items-start justify-between gap-3 text-sm">
              <span>
                <span className="font-medium">Indexar documento malicioso</span>
                <span className="block text-xs text-muted-foreground">
                  Um post de fórum com instrução escondida (teste com &quot;Fato específico&quot;)
                </span>
              </span>
              <Switch
                checked={includeMaliciousDoc}
                onCheckedChange={setIncludeMaliciousDoc}
                aria-label="Indexar documento malicioso"
              />
            </label>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <SimulatorMetricCard
              label="Resultado"
              value={outcome.label}
              icon={
                result.outcome === 'injection'
                  ? ShieldAlert
                  : result.outcome === 'hallucination'
                    ? AlertTriangle
                    : CheckCircle2
              }
              tone={outcome.tone}
            />
            <SimulatorMetricCard
              label="Recall@k"
              value={
                result.recallHit === null ? 'n/a' : result.recallHit ? 'Encontrou' : 'Não encontrou'
              }
              icon={Target}
              tone={result.recallHit === null ? 'default' : result.recallHit ? 'good' : 'warn'}
              detail="O trecho com a resposta está no contexto?"
            />
            <SimulatorMetricCard
              label="Ruído no contexto"
              value={`${result.noisePercent}%`}
              icon={Layers}
              tone={result.noisePercent > 60 ? 'warn' : 'default'}
              detail="Trechos enviados que não ajudam"
            />
            <SimulatorMetricCard
              label="Tokens do prompt"
              value={`${result.promptTokens}`}
              icon={Coins}
              detail={`~US$ ${costPerThousand.toFixed(3)} por mil perguntas (preço ilustrativo)`}
            />
          </div>

          {/* Indexing */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Scissors className="h-4 w-4 text-primary" />
                3. Indexação: {result.chunks.length} chunks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {result.chunks.map((chunk) => (
                  <span
                    key={chunk.id}
                    title={chunk.text}
                    className={cn(
                      'rounded border px-1.5 py-0.5 font-mono text-[11px] transition-all',
                      DOC_COLORS[chunk.docId],
                      retrievedIds.has(chunk.id) ? 'ring-2 ring-primary' : 'opacity-60'
                    )}
                  >
                    {chunk.id}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Cada cor é um documento. Os chunks com contorno foram recuperados para esta
                pergunta. Passe o mouse para ver o texto.
              </p>
            </CardContent>
          </Card>

          {/* Retrieval */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Search className="h-4 w-4 text-primary" />
                4. Busca: top-{topK} por {MODE_LABELS[mode].toLowerCase()}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {result.retrieved.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhum trecho teve qualquer sinal para esta pergunta.
                </p>
              )}
              {result.retrieved.map((r, i) => {
                const hasFact = preset?.expected ? r.chunk.text.includes(preset.expected) : false;
                return (
                  <div
                    key={r.chunk.id}
                    className={cn('rounded-lg border p-3', DOC_COLORS[r.chunk.docId])}
                  >
                    <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono font-semibold">
                        #{i + 1} [{r.chunk.id}]
                      </span>
                      <span className="text-muted-foreground">{r.chunk.docTitle}</span>
                      {hasFact && (
                        <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                          contém a resposta
                        </Badge>
                      )}
                      {r.chunk.malicious && (
                        <Badge variant="destructive" className="gap-1">
                          <ShieldAlert className="h-3 w-3" />
                          não confiável
                        </Badge>
                      )}
                      <span className="ml-auto font-mono">score {r.score.toFixed(2)}</span>
                    </div>
                    <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-background/80">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.max(4, r.score * 100)}%` }}
                      />
                    </div>
                    <p className="text-sm leading-relaxed">{r.chunk.text}</p>
                    <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
                      cosseno {r.semantic.toFixed(2)} · bm25 {r.keyword.toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Prompt */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-primary" />
                5. Prompt enviado ao modelo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md border bg-muted/40 p-3 font-mono text-xs leading-relaxed">
                {result.prompt}
              </pre>
            </CardContent>
          </Card>

          {/* Answer */}
          <Card
            className={cn(
              outcome.tone === 'good' && 'border-emerald-500/40',
              outcome.tone === 'warn' && 'border-amber-500/40',
              outcome.tone === 'bad' && 'border-red-500/50'
            )}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Bot className="h-4 w-4 text-primary" />
                6. Resposta gerada
                <Badge variant="outline" className="ml-auto">
                  {outcome.label}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="rounded-md border bg-background p-3 text-sm leading-relaxed">
                {result.answer}
              </p>
              <SimulatorAdvisorCard
                title="Por que isso aconteceu?"
                icon={outcome.tone === 'bad' ? ShieldAlert : Sparkles}
                tone={outcome.tone === 'bad' ? 'bad' : outcome.tone === 'warn' ? 'warn' : 'primary'}
              >
                {explain(result, grounding, mode, factWasSplit)}
              </SimulatorAdvisorCard>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
