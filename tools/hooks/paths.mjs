// The engine's three roots, found in one place (plan: docs/plans/2026-11-07-engine-outside-the-project.md).
//   ENGINE   where the engine's code is: the folder that holds tools/hooks/
//   PROJECT  the project root: the folder above .anzuelo/ when the engine sits in .anzuelo/engine, else the engine's own
//   LOCAL    where engine files made for this project live: .anzuelo/local in a project, the root itself in the starter
// ANZUELO_ROOT (tests, and a session started in another folder) names the project root outright.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function roots(hooksDir, env = process.env) {
  const ENGINE = path.resolve(hooksDir, '..', '..');
  const split = path.basename(ENGINE) === 'engine' && path.basename(path.dirname(ENGINE)) === '.anzuelo';
  const PROJECT = env.ANZUELO_ROOT ? path.resolve(env.ANZUELO_ROOT) : split ? path.dirname(path.dirname(ENGINE)) : ENGINE;
  const LOCAL = split ? path.join(PROJECT, '.anzuelo', 'local') : PROJECT;
  return { ENGINE, PROJECT, LOCAL, split };
}

export const { ENGINE, PROJECT, LOCAL, split } = roots(path.dirname(fileURLToPath(import.meta.url)));
