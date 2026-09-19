import test from 'node:test'; import assert from 'node:assert/strict'; import {compile,normalize} from './compiler.js'; import type {CommentSample} from './types.js';
const s=(id:number,body:string,accepted=true):CommentSample=>({id,body,accepted,author:`u${id}`,url:'https://example.test',path:'src/a.ts',createdAt:'2026-01-01',pr:id,acceptanceReason:'test'});
test('normalizes review prose',()=>assert.deepEqual(normalize('Please use `const x` here!'),['code']));
test('clusters similar recurring comments',()=>{const r=compile([s(1,'Please add error handling for this request'),s(2,'Add error handling for the request path')]); assert.equal(r.length,1); assert.equal(r[0].occurrences,2);});
