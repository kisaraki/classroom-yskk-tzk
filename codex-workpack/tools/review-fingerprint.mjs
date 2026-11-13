#!/usr/bin/env node
// Read-only helper: never writes review flags, names, dates, or approval status.
import { readFileSync } from 'node:fs';
import { contentHash } from './lib/review-content.mjs';

try {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== '--data' || args[1].startsWith('--')) {
    throw new Error('用法：node codex-workpack/tools/review-fingerprint.mjs --data <題庫JSON>');
  }
  const data = JSON.parse(readFileSync(args[1], 'utf8'));
  if (!data || !Array.isArray(data.items) || data.items.some(item => !item || typeof item !== 'object' || Array.isArray(item))) {
    throw new Error('items 必須是題目物件陣列；請先執行 validate-idioms.mjs --allow-pending。');
  }
  const csv = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
  console.error('NOTE 雜湊不是簽核。人工核對此內容版本後，才可將 content_sha256 填入審核表。');
  console.log('id,idiom,content_sha256');
  for (const item of data.items) console.log([item.id, item.idiom, contentHash(data, item)].map(csv).join(','));
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
}
