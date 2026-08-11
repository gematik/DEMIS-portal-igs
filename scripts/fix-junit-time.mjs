/*
 * Trims JUnit `time` attribute values to max 3 decimals so the output
 * satisfies Jenkins' Surefire XSD (SUREFIRE_TIME pattern).
 * Vitest's junit reporter emits values like 0.0051 which the schema rejects.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dir = './coverage';

if (!existsSync(dir)) {
  console.warn(`[fix-junit-time] Directory ${dir} does not exist, skipping.`);
  process.exit(0);
}

const files = readdirSync(dir).filter(
  (f) => f.startsWith('TEST-') && f.endsWith('.xml')
);

if (files.length === 0) {
  console.warn(`[fix-junit-time] No TEST-*.xml files found in ${dir}.`);
  process.exit(0);
}

const timeAttr = /time="(\d+)(?:\.(\d+))?"/g;

for (const file of files) {
  const path = join(dir, file);
  const original = readFileSync(path, 'utf8');
  const fixed = original.replace(timeAttr, (_, intPart, decPart) => {
    if (!decPart) return `time="${intPart}"`;
    return `time="${intPart}.${decPart.slice(0, 3)}"`;
  });
  if (fixed !== original) {
    writeFileSync(path, fixed);
    console.log(`[fix-junit-time] Normalized time values in ${path}`);
  }
}
