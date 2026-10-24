const ranks='23456789TJQKA',suits='shdc';
export const deck=Array.from(ranks,r=>Array.from(suits,s=>r+s)).flat();
function straight(values){const unique=new Set(values);if(unique.has(14))unique.add(1);for(let top=14;top>=5;top--)if([0,1,2,3,4].every(d=>unique.has(top-d)))return top;return 0;}
export function score(cards){
 const values=cards.map(c=>ranks.indexOf(c[0])+2),counts=new Map();values.forEach(v=>counts.set(v,(counts.get(v)||0)+1));
 const sorted=[...counts.keys()].sort((a,b)=>b-a),byCount=n=>sorted.filter(v=>counts.get(v)===n);
 const flushSuit=[...suits].find(s=>cards.filter(c=>c[1]===s).length>=5);
 const flush=flushSuit?cards.filter(c=>c[1]===flushSuit).map(c=>ranks.indexOf(c[0])+2).sort((a,b)=>b-a):[];
 const sf=straight(flush),quads=byCount(4),trips=byCount(3),pairs=byCount(2),st=straight(values);let result;
 if(sf)result=[8,sf];
 else if(quads.length)result=[7,quads[0],sorted.find(v=>v!==quads[0])];
 else if(trips.length&&(pairs.length||trips.length>1))result=[6,trips[0],Math.max(pairs[0]||0,trips[1]||0)];
 else if(flush.length)result=[5,...flush.slice(0,5)];
 else if(st)result=[4,st];
 else if(trips.length)result=[3,trips[0],...sorted.filter(v=>v!==trips[0]).slice(0,2)];
 else if(pairs.length>=2)result=[2,...pairs.slice(0,2),sorted.find(v=>!pairs.slice(0,2).includes(v))];
 else if(pairs.length)result=[1,pairs[0],...sorted.filter(v=>v!==pairs[0]).slice(0,3)];
 else result=[0,...sorted.slice(0,5)];
 return Array.from({length:6},(_,i)=>result[i]||0).reduce((n,v)=>n*15+v,0);
}
export function simulate({hole,board,opponents=1,trials=2000,seed=42}){
 const known=[...hole,...board];
 if(hole.length!==2||![0,3,4,5].includes(board.length)||known.some(c=>!deck.includes(c))||new Set(known).size!==known.length)throw new Error('Enter two distinct hole cards and a complete board through the selected street.');
 if(!Number.isInteger(opponents)||opponents<1||opponents>8||!Number.isInteger(trials)||trials<1)throw new Error('Choose 1–8 opponents and a positive trial count.');
 let state=seed>>>0;const random=()=>{state=(1664525*state+1013904223)>>>0;return state/4294967296;};
 const remaining=deck.filter(c=>!known.includes(c));let sum=0,sum2=0,wins=0,ties=0;
 for(let i=0;i<trials;i++){
  const pool=remaining.slice(),take=()=>pool.splice(Math.floor(random()*pool.length),1)[0];
  const full=[...board];while(full.length<5)full.push(take());
  const hero=score([...hole,...full]);let best=hero,winners=1;
  for(let j=0;j<opponents;j++){const other=score([take(),take(),...full]);if(other>best){best=other;winners=1;}else if(other===best)winners++;}
  const share=hero===best?1/winners:0;sum+=share;sum2+=share*share;if(share===1)wins++;else if(share>0)ties++;
 }
 return {equity:sum/trials*100,win:wins/trials*100,tie:ties/trials*100,loss:(trials-wins-ties)/trials*100,margin:1.96*Math.sqrt(Math.max(0,(sum2-sum*sum/trials)/(trials-1||1))/trials)*100,trials};
}
