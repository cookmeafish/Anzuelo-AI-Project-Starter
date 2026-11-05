// The safety guard during the work (docs/plans/2026-11-05-engine-v2.md, design B): v2's tool hooks refuse only what
// IN_WORK_GUARDS lists. Until v1 retires, this re-exports v1's functions instead of copying them, so security code has
// one copy; at the switch the functions move here with their tests. selftest.mjs proves each refusal and the silence.
export { pretoolDecision as guard, IN_WORK_GUARDS } from '../hooks.mjs';
