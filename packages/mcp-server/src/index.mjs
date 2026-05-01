#!/usr/bin/env node
// Visionary MCP server entrypoint.
//
// Exposes deterministic Visionary capabilities (slop-gate, motion-score,
// evidence-validation), read-only resources (styles, taste-summary, traces),
// and parameterised prompts (aesthetic-brief, slop-explanation) over the
// Model Context Protocol via stdio.
//
// Strategic note: this server intentionally does NOT call any LLM. The host
// (Cursor / Windsurf / Claude Code / etc.) owns generation. We only ship
// deterministic data + deterministic logic.

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { tool as slopGate } from './tools/slop-gate.mjs';
import { tool as motionScore } from './tools/motion-score.mjs';
import { tool as validateEvidence } from './tools/validate-evidence.mjs';
import { resource as stylesResource } from './resources/styles.mjs';
import { resource as tasteResource } from './resources/taste-summary.mjs';
import { resource as tracesResource } from './resources/traces.mjs';
import { prompt as aestheticBrief } from './prompts/aesthetic-brief.mjs';
import { prompt as slopExplanation } from './prompts/slop-explanation.mjs';

const TOOLS = [slopGate, motionScore, validateEvidence];
const RESOURCES = [stylesResource, tasteResource, tracesResource];
const PROMPTS = [aestheticBrief, slopExplanation];

const server = new Server(
  { name: '@visionary/mcp-server', version: '1.0.0-alpha.1' },
  { capabilities: { tools: {}, resources: {}, prompts: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const tool = TOOLS.find((t) => t.name === req.params.name);
  if (!tool) throw new Error(`Unknown tool: ${req.params.name}`);
  return tool.handler(req.params.arguments || {});
});

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const out = [];
  for (const r of RESOURCES) {
    const items = await r.list();
    for (const item of items) out.push(item);
  }
  return { resources: out };
});

server.setRequestHandler(ReadResourceRequestSchema, async (req) => {
  for (const r of RESOURCES) {
    if (r.matches(req.params.uri)) return r.read(req.params.uri);
  }
  throw new Error(`Unknown resource: ${req.params.uri}`);
});

server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: PROMPTS.map((p) => ({
    name: p.name,
    description: p.description,
    arguments: p.arguments || [],
  })),
}));

server.setRequestHandler(GetPromptRequestSchema, async (req) => {
  const prompt = PROMPTS.find((p) => p.name === req.params.name);
  if (!prompt) throw new Error(`Unknown prompt: ${req.params.name}`);
  return prompt.render(req.params.arguments || {});
});

const transport = new StdioServerTransport();
await server.connect(transport);
process.stderr.write('[visionary-mcp] ready (stdio)\n');
