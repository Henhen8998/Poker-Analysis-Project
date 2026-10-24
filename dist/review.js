import {reviewAction} from './coach.js';
const section=document.createElement('section');section.className='panel action-review';section.id='action-review';
section.innerHTML=`<div class="panel-head"><h2>Action-by-action review</h2><span>LOCAL COACH / PROTOTYPE</span></div><p class="muted">Record a decision using the information available at that moment. This is a hand-review log; it does not enforce betting order or move chips automatically.</p><form id="action-form"><div class="review-fields"><label>Your seat<select id="acting-seat" disabled></select></label><label>Street<select id="action-street"><option>Preflop</option><option>Flop</option><option>Turn</option><option>River</option></select></label><label>Action<select id="action-kind"><option>Call</option><option>Fold</option><option>Check</option><option>Bet</option><option>Raise</option></select></label><label>Chips added by this action<input type="number" id="action-size" min="0" step="any" value="50" required></label><label>Pot before this action<input type="number" id="action-pot" min="0" step="any" value="150" required></label><label>Amount facing player to call<input type="number" id="action-call" min="0" step="any" value="50" required></label><label>Opponents still in this hand<input type="number" id="opponents" min="1" max="8" step="1" value="1" required></label></div><label class="terminal-check"><input type="checkbox" id="terminal-action"> No future betting; heads-up, no rake or side pots</label><p class="hint">Your equity is simulated from your cards against uniformly random opponent hands (2,000 trials, fixed seed). Set how many opponents remain; folded players are excluded. Percentages below describe equity, not a probability that the play is good. Tournament payout effects remain outside this model.</p><button class="primary" type="submit">Record action & review <span>＋</span></button><p id="review-error" role="alert"></p></form><div class="history-heading"><h3>Decision timeline</h3><button type="button" id="clear-actions">Clear history</button></div><div id="action-history"><p class="muted">Your recorded actions and explanations will appear here.</p></div>`;
document.getElementById('table-builder').after(section);
let history=[];
function syncSeats(){
 const select=document.getElementById('acting-seat'),prev=select.value;select.replaceChildren();
 document.querySelectorAll('.table-seat.occupied').forEach(button=>{
   const match=button.getAttribute('aria-label').match(/^Seat (\d+)/);if(match)select.add(new Option(button.classList.contains('hero-seat')?`Seat ${match[1]} (you)`:`Seat ${match[1]}`,match[1]));
 });
 const hero=document.querySelector('.table-seat.hero-seat');select.value=hero?hero.getAttribute('aria-label').match(/^Seat (\d+)/)[1]:'';
}
new MutationObserver(syncSeats).observe(document.getElementById('seats'),{childList:true});syncSeats();
const value=id=>document.getElementById(id).value;
document.getElementById('action-form').addEventListener('submit',async event=>{
 event.preventDefault();
 try{
  if(!value('acting-seat'))throw new Error('Occupy at least one seat first.');
  const action=value('action-kind'),size=Number(value('action-size')),pot=Number(value('action-pot')),call=Number(value('action-call')),street=value('action-street');
  if(!Number.isFinite(size)||size<0)throw new Error('Enter a nonnegative action amount.');
  if(['Check','Fold'].includes(action)&&size!==0)throw new Error('Check and fold add zero chips. Set chips added to 0.');
  if(action==='Check'&&call>0)throw new Error('A player facing a bet cannot check.');
  if(action==='Call'&&(call===0||Math.abs(size-call)>1e-8))throw new Error('A call must match the positive amount to call. Short all-in calls are not supported.');
  if(action==='Bet'&&(call>0||size<=0))throw new Error('Use bet only when facing no bet, and enter a positive size.');
  if(action==='Raise'&&(call<=0||size<=call))throw new Error('A raise must add more chips than the amount to call. Minimum raise legality requires betting history and is not checked.');
  const cards=[...document.querySelectorAll('#card-inputs select')].map(x=>x.value);
  const needed={Preflop:0,Flop:3,Turn:4,River:5}[street];
  if(cards.slice(2,2+needed).some(x=>!x))throw new Error(`Enter all community cards through the ${street.toLowerCase()} before recording this action.`);
  const visibleCards=[...cards.slice(0,2),...cards.slice(2,2+needed)];
  const occupied=document.querySelectorAll('.table-seat.occupied').length;
  const opponents=Number(value('opponents'));
  if(opponents>occupied-1)throw new Error('Opponent count exceeds other occupied seats.');
  const terminal=document.getElementById('terminal-action').checked;
  if(terminal&&opponents!==1)throw new Error('The graded terminal review currently supports one opponent. Uncheck the heads-up option for a multiway benchmark.');
  const seat=value('acting-seat');
  const position=document.querySelector('.table-seat.hero-seat')?.dataset.position||'';
  const button=document.querySelector('#action-form button[type=submit]');button.disabled=true;button.textContent='Simulating 2,000 hands?';
  let odds;
  try { odds=await new Promise((resolve,reject)=>{const worker=new Worker(new URL('./equity-worker.js',import.meta.url),{type:'module'});worker.onmessage=e=>{worker.terminate();e.data.error?reject(new Error(e.data.error)):resolve(e.data.result)};worker.onerror=()=>{worker.terminate();reject(new Error('Simulation could not run. Refresh and try again.'))};worker.postMessage({hole:cards.slice(0,2),board:cards.slice(2,2+needed),opponents,trials:2000,seed:42});}); }
  finally {button.disabled=false;button.textContent='Record action & review';}
  const equity=odds.equity;
  document.getElementById('pot').value=pot;document.getElementById('call').value=call;
  const slider=document.getElementById('equity');slider.value=equity;slider.dispatchEvent(new Event('input'));

  const result=reviewAction({action,pot,call,equity,terminal});
  history.push({seat,position,odds,opponents,action,size,pot,call,equity,street,cards:visibleCards,occupied,result,terminal});render();document.getElementById('review-error').textContent='';
 }catch(error){document.getElementById('review-error').textContent=error.message;}
});
function render(){
 const target=document.getElementById('action-history');target.replaceChildren();
 if(!history.length){const p=document.createElement('p');p.className='muted';p.textContent='Your recorded actions and explanations will appear here.';target.append(p);}
 history.slice().reverse().forEach((entry,index)=>{
   const article=document.createElement('article');article.className='review-entry';
   const heading=document.createElement('h3');heading.textContent=`${history.length-index}. ${entry.street} · Seat ${entry.seat} · ${entry.action} ${entry.size} chips`;
   const context=document.createElement('p');context.className='muted';context.textContent=`Snapshot: ${entry.cards.slice(0,2).map(x=>x||'?').join(' ')} | Board: ${entry.cards.slice(2).join(' ')||'none'} · ${entry.occupied} occupied seats. Only cards visible on this street are recorded.`;
   const verdict=document.createElement('strong');verdict.textContent=entry.result.verdict;
   const metrics=document.createElement('p');metrics.className='review-metrics';metrics.textContent=`Estimated equity: ${entry.equity.toFixed(1)}% · Break-even: ${entry.result.required.toFixed(1)}% · Edge: ${entry.result.edge.toFixed(1)} percentage points`;
   const text=document.createElement('p');text.textContent=entry.result.explanation;
   const source=document.createElement('small');source.textContent='Rule-based coaching · Percentages are based on your supplied equity. '+(entry.terminal?'Simplified terminal heads-up chip EV.':'All-in pot-odds benchmark only; future betting not modeled.');
   article.append(heading,context,verdict,metrics,text,source);target.append(article);
 });
}
document.getElementById('clear-actions').addEventListener('click',()=>{history=[];render()});
