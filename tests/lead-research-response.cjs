// Run with Node.js 24+: node tests/lead-research-response.cjs
// Stub the API: no credentials, network calls, or customer data are needed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { stripTypeScriptTypes } = require('node:module');

const source = fs.readFileSync(path.join(__dirname, '../supabase/functions/enrich-lead/index.ts'), 'utf8')
  .replace(/^import .* from "npm:[^\n]+\n/m, '');
let payload;
let requestBody;
let httpStatus = 200;
const context = vm.createContext({
  URL, Response, console,
  Deno: { env: { get: name => ({ OPENAI_API_KEY: 'stub-only', OPENAI_MODEL: 'gpt-5.5' })[name] }, serve() {} },
  fetch: async (_url, options) => {
    requestBody = JSON.parse(options.body);
    return new Response(JSON.stringify(payload), { status: httpStatus });
  },
});
vm.runInContext(stripTypeScriptTypes(source), context);
const lead = { id: 1, name: 'Synthetic test', organization: 'Example', email: null };

(async () => {
  payload = { status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' }, output_text: '{"company_summary":"truncated' };
  await assert.rejects(context.researchLead(lead), /OpenAI response incomplete: max_output_tokens/);
  assert.equal(requestBody.max_output_tokens, 8000);
  assert.equal(requestBody.reasoning.effort, 'low');

  const research = { confidence: 90, needs_review: false, sources: [
    { title: 'Official', url: 'https://example.com/', supports: 'Company identity' },
    { title: 'Unverified', url: 'https://invented.example/', supports: 'Must not survive' },
  ] };
  payload = { status: 'completed', id: 'test-response', output: [
    { type: 'web_search_call', action: { sources: [{ title: 'Official', url: 'https://example.com/' }] } },
    { type: 'message', content: [{ type: 'output_text', text: JSON.stringify(research) }] },
  ] };
  const completed = await context.researchLead(lead);
  assert.equal(completed.research.sources.length, 1);
  assert.equal(completed.research.sources[0].url, 'https://example.com/');
  assert.equal(completed.research.needs_review, false);

  payload = { status: 'completed', output_text: JSON.stringify(research) };
  const unverified = await context.researchLead(lead);
  assert.equal(unverified.research.needs_review, true);
  assert.equal(unverified.research.confidence, 45);
  assert.equal(unverified.research.sources.length, 0);

  httpStatus = 429;
  payload = { error: { message: 'Rate limited' } };
  await assert.rejects(context.researchLead(lead), /OpenAI 429: Rate limited/);
  console.log('PASS: incomplete output, request budget, verified citations, review fallback, and API errors');
})().catch(error => { console.error(error); process.exitCode = 1; });
