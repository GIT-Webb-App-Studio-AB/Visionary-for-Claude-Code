// multi-screen-orchestrator.mjs — Sprint 22 Task 40.1
//
// Generates 5 coherent UI states (list, detail, empty, error, loading) from a
// single feature description. All 5 prompts share the SAME design-context
// (palette, typography, motion-tier, density). Only the content-shape varies.
//
// This module is intentionally pure and dependency-injected: callers pass a
// `generateFn` that knows how to render a single state. That keeps the
// orchestrator testable without coupling to Playwright, MCP, or any
// generation backend.
//
// Reference: docs/sprints/sprint-22-cross-screen-voice.md Task 40.1

import { join } from 'node:path';

// The five canonical states a feature must support to be considered coherent.
// Order matters: list is the anchor (skeleton/loading mirrors its layout,
// detail descends from one of its rows, empty/error are list-state variants).
export const STATES = ['list', 'detail', 'empty', 'error', 'loading'];

/**
 * Build state-specific prompts that share the same design-context.
 *
 * Each prompt embeds `sharedContext` verbatim so the generator can lock
 * palette + tokens across all five states. Only content-shape varies.
 *
 * @param {string} featureDescription — e.g. "todo-app for designers"
 * @param {object} sharedContext — palette, typography, motion-tier, density,
 *   illustration-vocabulary. Whatever the caller wants every state to share.
 * @returns {Record<typeof STATES[number], string>} — prompt per state
 */
export function buildStatePrompts(featureDescription, sharedContext) {
  const ctx = JSON.stringify(sharedContext);
  const prompts = {};

  prompts.list =
    `${featureDescription} — list view with multiple items rendered. ` +
    `Use shared style/tokens: ${ctx}. Show realistic varied content.`;

  prompts.detail =
    `${featureDescription} — detail view of a single item. ` +
    `Use shared style/tokens: ${ctx}. Show full content with hierarchy.`;

  prompts.empty =
    `${featureDescription} — empty state. ` +
    `Use shared style/tokens: ${ctx}. ` +
    `Convey "nothing here yet" with empathetic + actionable copy. ` +
    `Use the existing illustration/iconography vocabulary.`;

  prompts.error =
    `${featureDescription} — error state. ` +
    `Use shared style/tokens: ${ctx}. ` +
    `Convey error gracefully with retry-affordance. ` +
    `Tone matches design (e.g. brutalist → terse, soft → reassuring).`;

  prompts.loading =
    `${featureDescription} — loading skeleton. ` +
    `Use shared style/tokens: ${ctx}. ` +
    `Skeleton shapes mirror list-view layout. Subtle motion (pulse/shimmer).`;

  return prompts;
}

/**
 * Orchestrate generation of all 5 states. Calls `generateFn` once per state
 * with the prompt + state-id + target filepath. Failures are isolated per
 * state — a generation error on one state does NOT abort the others; the
 * error is captured in the result map so the caller can decide what to do.
 *
 * @param {object} args
 * @param {string} args.featureDescription
 * @param {object} args.sharedContext
 * @param {string} args.outputDir — directory where {state}.tsx will be written
 * @param {(args: {prompt: string, state: string, filepath: string}) =>
 *   Promise<any>} args.generateFn — caller-provided render function
 * @returns {Promise<Record<string, any>>} — result per state, either the
 *   resolved value of `generateFn` or `{ error: <message> }`.
 */
export async function orchestrate({
  featureDescription,
  sharedContext,
  outputDir,
  generateFn,
}) {
  const prompts = buildStatePrompts(featureDescription, sharedContext);
  const results = {};

  for (const [state, prompt] of Object.entries(prompts)) {
    const filename = `${state}.tsx`;
    const filepath = join(outputDir, filename);
    try {
      results[state] = await generateFn({ prompt, state, filepath });
    } catch (err) {
      // Per-state graceful degradation: capture the error, continue with the
      // next state. The caller (typically the /visionary-flow command driver)
      // can re-run only the failed states or surface them in flow.md.
      results[state] = { error: err && err.message ? err.message : String(err) };
    }
  }

  return results;
}
