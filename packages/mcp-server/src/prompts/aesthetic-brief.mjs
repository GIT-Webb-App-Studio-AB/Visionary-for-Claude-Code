// MCP prompt: visionary.aesthetic_brief
//
// Parameterised prompt that asks the host LLM to compose a detailed
// aesthetic brief given product type, audience, and brand archetype.
// The host assembles the response from its own model — this server only
// supplies the prompt structure.

export const prompt = {
  name: 'visionary.aesthetic_brief',
  description:
    'Build a prompt that asks for a detailed aesthetic brief given product type, audience, and brand archetype. The output of running this prompt should be a brief detailed enough to drive a Visionary style selection (specifies tone, palette direction, motion tier hint, typography stance, density, locale fit).',
  arguments: [
    { name: 'product_type',  required: true, description: 'e.g. "fintech onboarding", "creative-tools dashboard", "b2b analytics suite".' },
    { name: 'audience',      required: true, description: 'e.g. "professional traders, age 30-50", "indie designers", "ops engineers".' },
    { name: 'archetype',     required: true, description: 'Brand archetype, e.g. "Sage", "Outlaw", "Lover", "Magician", or descriptive prose.' },
  ],

  render(args) {
    const productType = String(args.product_type ?? '').trim() || '<unspecified product type>';
    const audience    = String(args.audience ?? '').trim()     || '<unspecified audience>';
    const archetype   = String(args.archetype ?? '').trim()    || '<unspecified archetype>';

    const text = [
      `Compose a detailed aesthetic brief for a UI design project.`,
      ``,
      `Project parameters:`,
      `- Product type: ${productType}`,
      `- Audience: ${audience}`,
      `- Brand archetype: ${archetype}`,
      ``,
      `Your brief MUST cover:`,
      `1. Tone & emotional register (3-5 adjectives, then 1 sentence on why those over their opposites).`,
      `2. Palette direction — dominant family (warm/cool/neutral/saturated), 1-2 accents, contrast posture (high/medium/quiet). NOT specific hex codes.`,
      `3. Typography stance — serif vs sans vs display contrast; one named pairing if obvious; what to avoid (e.g. "no Inter+Poppins default").`,
      `4. Density — sparse / balanced / dense — and one sentence motivating it from the audience and task profile.`,
      `5. Motion tier hint — Subtle / Expressive / Kinetic / Cinematic — with one sentence on the narrative arc the motion should support (entrance, focus pull, state change, etc).`,
      `6. Distinctiveness anchors — name 2-3 historical or cultural references the design should rhyme with. Avoid the AI-default vocabulary (purple gradients, glassmorphism, hero-with-floating-cards).`,
      `7. One explicit "this is NOT what we want" paragraph — name a competitor or a famous-but-wrong reference and why it would miss.`,
      ``,
      `Output as plain prose, ~200-300 words. Do not list the headings above as section markers in the final brief; integrate them into flowing paragraphs.`,
    ].join('\n');

    return {
      messages: [{
        role: 'user',
        content: { type: 'text', text },
      }],
    };
  },
};
