import assert from 'node:assert/strict';
import {score,simulate} from './dist/equity.js';
import {positions} from './dist/positions.js';
const hand=s=>s.split(' ');
const categories=['As Jd 9c 7h 3s','As Ad 9c 7h 3s','As Ad 9c 9h 3s','As Ad Ac 7h 3s','As 2d 3c 4h 5s','As Js 9s 7s 3s','As Ad Ac 7h 7s','As Ad Ac Ah 3s','As Ks Qs Js Ts'];
for(let i=1;i<categories.length;i++)assert.ok(score(hand(categories[i]))>score(hand(categories[i-1])));
assert.ok(score(hand('2s 3d 4c 5h 6s'))>score(hand('As 2d 3c 4h 5s')));
assert.equal(score(hand('As Ad Ac Ks Kd Kc 2s')),score(hand('As Ad Ac Ks Kd')));
assert.ok(score(hand('As Ad 7c 7d Kh'))>score(hand('As Ad 7c 7d Qh')));
const royal=simulate({hole:['2c','3d'],board:['As','Ks','Qs','Js','Ts'],opponents:2,trials:100});
assert.ok(Math.abs(royal.equity-100/3)<1e-10);assert.equal(royal.tie,100);
const nuts=simulate({hole:['As','Ks'],board:['Qs','Js','Ts','2d','3c'],trials:100});assert.equal(nuts.equity,100);
assert.deepEqual(simulate({hole:['As','Ad'],board:[],trials:100}),simulate({hole:['As','Ad'],board:[],trials:100}));
assert.throws(()=>simulate({hole:['As','As'],board:[]}));assert.throws(()=>simulate({hole:['As','Ad'],board:['Ac']}));
const all=positions(Array(9).fill(true),0);assert.equal(all[0],'BTN');assert.equal(all[1],'SB');assert.equal(all[2],'BB');assert.equal(all[8],'CO');
assert.deepEqual(positions([true,false,true],0),{0:'BTN / SB',2:'BB'});
assert.deepEqual(positions([true,true,true],2),{2:'BTN',0:'SB',1:'BB'});
console.log('Equity ranking, split-pot, reproducibility, validation, and position checks passed.');
// Compare the direct seven-card evaluator with all 21 five-card subsets.
import {deck} from './dist/equity.js';
let seed=123;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
for(let trial=0;trial<500;trial++){
 const pool=deck.slice(),cards=[];while(cards.length<7)cards.push(pool.splice(Math.floor(rand()*pool.length),1)[0]);
 let best=0;for(let a=0;a<7;a++)for(let b=a+1;b<7;b++)best=Math.max(best,score(cards.filter((_,i)=>i!==a&&i!==b)));
 assert.equal(score(cards),best);
}
console.log('500 seven-card evaluations matched exhaustive five-card subset enumeration.');
