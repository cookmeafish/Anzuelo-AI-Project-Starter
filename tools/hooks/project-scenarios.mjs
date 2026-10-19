// This project's own self-test scenarios, for the checks it added (tools/hooks/requirements.json). Upgrades never
// replace this file; tools/hooks/selfcheck.mjs (engine code) loads it. Each list holds scenarios in the same shape as
// selfcheck.mjs: a check skipped → blocked with its tag, followed → passes.
//   stop:    { name, prompt, tools: [pb('x'), sk('y'), bash('cmd')], files: { 'path': 'content' }, answer, expect: { block, tags } }
//   pretool: { name, tool, input, deny, tag }
//   prompt:  { name, prompt, says }
export default ({ pb, sk, bash, FIN }) => ({ stop: [], pretool: [], prompt: [] });
