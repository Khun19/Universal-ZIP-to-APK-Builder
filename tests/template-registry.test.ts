import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listTemplates, getTemplate, validateTemplateId } from '../lib/template-registry.js';

test('template registry loads and has entries', ()=>{
  const templates = listTemplates();
  assert(Array.isArray(templates));
  assert(templates.length >= 8);
  const t = getTemplate('web-basic');
  assert(t && t.id === 'web-basic');
});

test('unknown template returns null', ()=>{
  const t = getTemplate('not-a-template');
  assert.strictEqual(t, null);
});

test('validateTemplateId rules', ()=>{
  assert.strictEqual(validateTemplateId('valid-id_123'), true);
  assert.strictEqual(validateTemplateId('Invalid'), false);
  assert.strictEqual(validateTemplateId(''), false);
});
