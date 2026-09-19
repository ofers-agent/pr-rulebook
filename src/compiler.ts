import { createHash } from 'node:crypto';
import type { CommentSample, Rule } from './types.js';

const STOP = new Set('the a an and or but to of in on for with this that it is are be we you i should could would can please here there from as at by if when use using'.split(' '));
export function normalize(body: string): string[] {
  return body.toLowerCase().replace(/`[^`]+`/g,' code ').replace(/https?:\/\/\S+/g,' ')
    .replace(/[^a-z0-9_ -]/g,' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));
}
function similarity(a: Set<string>, b: Set<string>): number {
  const intersection = [...a].filter(x => b.has(x)).length;
  const union = new Set([...a,...b]).size;
  return union ? intersection / union : 0;
}
function imperative(samples: CommentSample[]): string {
  const shortest = [...samples].sort((a,b)=>a.body.length-b.body.length)[0].body.replace(/\s+/g,' ');
  return shortest.length > 180 ? shortest.slice(0,177)+'...' : shortest;
}
export function compile(samples: CommentSample[], minOccurrences=2): Rule[] {
  const clusters: CommentSample[][] = [];
  for (const sample of samples) {
    const words = new Set(normalize(sample.body));
    let best=-1, score=0;
    clusters.forEach((cluster,i)=>{ const s=similarity(words,new Set(cluster.flatMap(x=>normalize(x.body)))); if(s>score){score=s;best=i;} });
    if (score >= 0.28) clusters[best].push(sample); else clusters.push([sample]);
  }
  return clusters.filter(c=>c.length>=minOccurrences).map(c=>{
    const accepted=c.filter(x=>x.accepted).length;
    const acceptanceRate=accepted/c.length;
    const authors=new Set(c.map(x=>x.author)).size;
    const confidence=Math.min(.99, .35 + Math.min(c.length,6)*.07 + acceptanceRate*.28 + Math.min(authors,3)*.05);
    const instruction=imperative(c);
    return { id:createHash('sha1').update(instruction).digest('hex').slice(0,8), title:instruction.replace(/[.!?].*$/,'').slice(0,80),
      instruction, confidence:Number(confidence.toFixed(2)), occurrences:c.length, accepted, files:[...new Set(c.map(x=>x.path))].slice(0,8), examples:c.slice(0,3)};
  }).sort((a,b)=>b.confidence-a.confidence || b.occurrences-a.occurrences);
}
