import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLcov, compare } from '../bin/coverage-gap-delta.js';
test('detects regressions and newly uncovered lines',()=>{
 const before=parseLcov('SF:a.js\nDA:1,2\nDA:2,0\nend_of_record\n');
 const after=parseLcov('SF:a.js\nDA:1,0\nDA:2,0\nDA:3,0\nend_of_record\n');
 const result=compare(before,after); assert.equal(result.regressions.length,1); assert.equal(result.regressions[0].line,1); assert.deepEqual(result.newlyUncovered,[{file:'a.js',line:3}]);
});
test('rejects DA without source file',()=>assert.throws(()=>parseLcov('DA:1,0')));
