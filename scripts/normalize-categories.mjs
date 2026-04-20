#!/usr/bin/env node
// Flattens nested category strings ("extended/retrofuturism") to the top-level
// bucket ("extended"). The top-level bucket is the filesystem directory, so we
// derive it from the path and trust that as the canonical category.
//
// Updates BOTH places:
//   1. Frontmatter `category: ...`
//   2. Body `**Category:** ...`

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, basename, dirname, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = dirname(dirname(__filename));
const stylesDir = join(repoRoot, 'skills', 'visionary', 'styles');

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile() && extname(entry.name) === '.md' && entry.name !== '_index.md') out.push(full);
  }
  return out;
}

const files = walk(stylesDir);
let changed = 0;

for (const file of files) {
  // Category is the directory name directly under styles/.
  const rel = file.substring(stylesDir.length + 1).split(/[\\/]/);
  const category = rel[0]; // first segment after styles/
  if (!category) continue;

  let src = readFileSync(file, 'utf8');
  const before = src;

  // 1. Frontmatter category: use the filesystem directory as canonical.
  //    First occurrence only (the frontmatter one), to avoid mangling any
  //    later `category:` inside code blocks.
  let first = true;
  src = src.replace(
    /^(category:\s*)(.*)$/m,
    (_, head) => {
      if (!first) return `${head}${category}`;
      first = false;
      return `${head}${category}`;
    }
  );

  // 2. Body "**Category:** ..." — first occurrence only.
  src = src.replace(
    /^\*\*Category:\*\*\s*.+$/m,
    `**Category:** ${category}`
  );

  if (src !== before) {
    writeFileSync(file, src, 'utf8');
    changed++;
  }
}

console.log(`normalized: ${changed}`);
console.log(`total scanned: ${files.length}`);
