// MCP prompt: visionary.slop_explanation
//
// Parameterised prompt that asks the host LLM to explain why a particular
// slop pattern (1..26) is generic AI-default, and propose 3 distinctive
// alternatives. The pattern catalogue mirrors the strings emitted by the
// detector in tools/slop-gate.mjs.

const SLOP_CATALOGUE = [
  { id: 1,  name: 'Purple/violet gradient background' },
  { id: 2,  name: 'Cyan-on-dark color scheme' },
  { id: 3,  name: 'Left-border accent card pattern' },
  { id: 4,  name: 'Dark background with colored glow shadow' },
  { id: 5,  name: 'Gradient text on heading or metric' },
  { id: 6,  name: 'Hero Metric Layout (large number + small label + gradient)' },
  { id: 7,  name: 'Repeated 3-across card grid' },
  { id: 8,  name: 'Inter as sole typeface' },
  { id: 9,  name: 'Generic system/web font as sole typeface' },
  { id: 10, name: 'Default Tailwind blue #3B82F6 as primary color' },
  { id: 11, name: 'Default Tailwind purple #6366F1 as primary color' },
  { id: 12, name: 'Default Tailwind green #10B981 as accent' },
  { id: 13, name: 'Uniform border-radius on all elements' },
  { id: 14, name: 'shadow-md applied uniformly to multiple cards' },
  { id: 15, name: 'Centered hero with gradient backdrop and floating cards' },
  { id: 16, name: 'Three-column icon+heading+paragraph feature section' },
  { id: 17, name: 'Poppins + blue gradient combination' },
  { id: 18, name: 'White card on light gray background (low contrast)' },
  { id: 19, name: 'Symmetric padding everywhere (no horizontal/vertical rhythm)' },
  { id: 20, name: 'Placeholder name despite content kit present' },
  { id: 21, name: 'Placeholder email domain despite content kit present' },
  { id: 22, name: 'Glassmorphism backdrop-blur on every card' },
  { id: 23, name: 'Neon-on-black brutalist clone' },
  { id: 24, name: 'Default 60-30-10 color split with no commitment' },
  { id: 25, name: 'Hero with three-icon trust-row' },
  { id: 26, name: 'Generic "Get Started" CTA copy' },
];

export const prompt = {
  name: 'visionary.slop_explanation',
  description:
    'Build a prompt that asks for an explanation of why a specific Visionary slop pattern (1..26) reads as generic AI-default, plus 3 distinctive alternatives. Useful when a designer wants to teach a junior or document a "do not ship" entry.',
  arguments: [
    {
      name: 'pattern_id',
      required: true,
      description: 'Slop pattern id, integer 1..26. See SLOP_CATALOGUE for names.',
    },
  ],

  render(args) {
    const raw = args.pattern_id;
    const id = Number.parseInt(typeof raw === 'string' ? raw : String(raw), 10);
    const entry = Number.isFinite(id) ? SLOP_CATALOGUE.find((p) => p.id === id) : null;
    const patternName = entry ? entry.name : `<unknown pattern_id ${raw}>`;
    const patternRef  = entry ? `Pattern #${entry.id}: "${entry.name}"` : `Pattern #${raw} (unknown — explain anyway based on the id description if possible)`;

    const text = [
      `You are explaining a specific design-slop pattern that the Visionary critique loop blocks.`,
      ``,
      `${patternRef}`,
      ``,
      `Write a response with three sections:`,
      ``,
      `1. WHY THIS IS SLOP (3-5 sentences):`,
      `   - What problem the pattern was originally a reasonable solution for.`,
      `   - Why the AI-default volume of usage has hollowed it out.`,
      `   - The specific aesthetic or UX failure mode it tends to produce now.`,
      ``,
      `2. THREE DISTINCTIVE ALTERNATIVES:`,
      `   For each, give a one-line name + 2-3 sentences:`,
      `   - What it does differently.`,
      `   - When it's a good fit (audience / product type).`,
      `   - One concrete implementation hint (a property, a numeric range, or a reference to a real-world artefact, not a Tailwind class).`,
      ``,
      `3. WHEN THE ORIGINAL PATTERN IS STILL OK (1-2 sentences):`,
      `   - The narrow case where the pattern remains the right call (e.g. ironic use, pastiche, deliberate trend reference). This guards against blanket bans.`,
      ``,
      `Be concrete. Reference at least one real-world design artefact (a brand, a product, a printed work, an architectural movement) per alternative. No emoji. No marketing prose.`,
    ].join('\n');

    return {
      messages: [{
        role: 'user',
        content: { type: 'text', text },
      }],
    };
  },
};
