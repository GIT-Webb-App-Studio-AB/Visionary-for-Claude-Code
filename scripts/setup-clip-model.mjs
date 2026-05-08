#!/usr/bin/env node
// setup-clip-model.mjs — Sprint 18
// Pre-fetches the CLIP ViT-B/32 model for offline use. Run once after install.
// Usage: node scripts/setup-clip-model.mjs

(async () => {
  console.log('Setting up CLIP ViT-B/32 model...');
  console.log('Disk usage: ~150MB');
  console.log('Cache location: ~/.cache/huggingface/');

  try {
    const transformers = await import('@xenova/transformers');
    const { CLIPModel, AutoProcessor, AutoTokenizer } = transformers;

    process.stdout.write('Downloading processor... ');
    await AutoProcessor.from_pretrained('Xenova/clip-vit-base-patch32');
    console.log('done.');

    process.stdout.write('Downloading tokenizer... ');
    await AutoTokenizer.from_pretrained('Xenova/clip-vit-base-patch32');
    console.log('done.');

    process.stdout.write('Downloading model... ');
    await CLIPModel.from_pretrained('Xenova/clip-vit-base-patch32');
    console.log('done.');

    console.log('\nCLIP model ready. /visionary-from-photo will now use ML-mood-classification.');
    console.log('To force heuristic-only mode: export VISIONARY_DISABLE_CLIP=1');
  } catch (err) {
    console.error('Setup failed:', err.message);
    console.error('\nCheck that @xenova/transformers is installed:');
    console.error('  npm install @xenova/transformers');
    process.exit(1);
  }
})();
