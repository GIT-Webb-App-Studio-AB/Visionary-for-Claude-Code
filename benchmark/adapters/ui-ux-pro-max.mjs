// Adapter for the community `ui-ux-pro-max` skill
// (nextlevelbuilder/ui-ux-pro-max-skill).
//
// Prerequisites:
//   claude plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
//   claude plugin install ui-ux-pro-max
//
// Usage:
//   node benchmark/runner.mjs \
//     --skill ui-ux-pro-max \
//     --adapter benchmark/adapters/ui-ux-pro-max.mjs \
//     --out results/ui-ux-pro-max.json

process.env.CLAUDE_SKILL_HINT ??= 'Use the ui-ux-pro-max skill. ';
process.env.CLAUDE_OUT_DIR ??= 'benchmark/.staged-ui-ux-pro-max';

export { run } from './claude-headless.mjs';
