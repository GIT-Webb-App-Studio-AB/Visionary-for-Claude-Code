# Placeholder — images needed

This category is registered in `manifest.json` but the actual anti-anchor images have not been curated yet.

To complete:

1. Generate 3 examples of "default AI SaaS landing page" via:
   - `https://bolt.new` with prompt: "build a SaaS landing page for a project management tool"
   - `https://v0.dev` with same prompt
   - A Vercel starter template screenshot

2. Screenshot at 1200×800, crop to the hero + first feature section.

3. Save as `example-1.png`, `example-2.png`, `example-3.png` in this directory.

4. Update `manifest.json` to replace the `PLACEHOLDER` source-field with the actual origin.

5. Delete this file.

The loader (`hooks/scripts/lib/anti-anchors.mjs`) will skip categories whose images don't exist on disk, so the anti-anchor pipeline stays functional even while categories are incomplete.
