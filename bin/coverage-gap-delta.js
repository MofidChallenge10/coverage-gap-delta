#!/usr/bin/env node
import fs from 'node:fs';

export function parseLcov(text) {
  const files = new Map(); let current = null;
  for (const raw of text.split(/\r?\n/)) {
    if (raw.startsWith('SF:')) { current = raw.slice(3); if (!current) throw new Error('empty SF record'); if (!files.has(current)) files.set(current,new Map()); }
    else if (raw.startsWith('DA:')) {
      if (current === null) throw new Error('DA record before SF');
      const [line,count] = raw.slice(3).split(',').map(Number);
      if (!Number.isInteger(line) || line<1 || !Number.isInteger(count) || count<0) throw new Error(`invalid DA record: ${raw}`);
      files.get(current).set(line,count);
    } else if (raw==='end_of_record') current=null;
  }
  return files;
}
export function compare(baseline,current) {
  const regressions=[], newlyUncovered=[];
  for (const [file,lines] of current) for (const [line,count] of lines) {
    const previous=baseline.get(file)?.get(line);
    if (count===0 && previous>0) regressions.push({file,line,previous,current:count});
    else if (count===0 && previous===undefined) newlyUncovered.push({file,line});
  }
  return {regressions,newlyUncovered};
}
function main(argv) {
  const args=argv.filter(x=>x!=='--fail-on-regression'); const fail=argv.includes('--fail-on-regression');
  if (args.length!==2) { console.error('Usage: coverage-gap-delta BASELINE.info CURRENT.info [--fail-on-regression]'); return 2; }
  try {
    const result=compare(parseLcov(fs.readFileSync(args[0],'utf8')),parseLcov(fs.readFileSync(args[1],'utf8')));
    console.log(`Coverage regressions: ${result.regressions.length}`);
    for (const x of result.regressions) console.log(`${x.file}:${x.line}  covered → uncovered`);
    console.log(`Newly uncovered lines: ${result.newlyUncovered.length}`);
    for (const x of result.newlyUncovered) console.log(`${x.file}:${x.line}  new line with zero coverage`);
    return fail && result.regressions.length ? 1 : 0;
  } catch (e) { console.error(`error: ${e.message}`); return 2; }
}
if (import.meta.url===`file://${process.argv[1]}`) process.exitCode=main(process.argv.slice(2));
