// Adapter for Anthropic's official `frontend-design` skill.
// Defers to the shared claude-headless adapter with a skill-specific hint.
//
// Prerequisites:
//   claude plugin install frontend-design@claude-plugins-official
//
// Usage:
//   node benchmark/runner.mjs \
//     --skill frontend-design \
//     --adapter benchmark/adapters/frontend-design.mjs \
//     --out results/frontend-design.json

process.env.CLAUDE_SKILL_HINT ??= 'Use the frontend-design skill. ';
process.env.CLAUDE_OUT_DIR ??= 'benchmark/.staged-frontend-design';

export { run } from './claude-headless.mjs';
