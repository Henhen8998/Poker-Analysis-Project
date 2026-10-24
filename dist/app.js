import { analyze } from './math.js';
import './table.js';
import './review.js';
const $ = id => document.getElementById(id);
const fmt = x => x.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
function update(){
  try {
    if (!$('pot').value.trim() || !$('call').value.trim()) throw new Error('Enter both the pot and call amount.');
    const p=Number($('pot').value), c=Number($('call').value), e=Number($('equity').value), r=analyze(p,c,e);
    $('error').textContent=''; $('eq-label').textContent=e+'%';
    const neutral=Math.abs(r.ev)<1e-9, positive=r.ev>0;
    const color=neutral?'#e0c68e':positive?'#a7efcd':'#f5a79c';
    $('ev').style.color=color; $('ev').replaceChildren(document.createTextNode((r.ev>0?'+':'')+fmt(neutral?0:r.ev)+' '));
    const unit=document.createElement('small');unit.textContent='chips';$('ev').append(unit);
    $('verdict').textContent=neutral?'Break-even chip EV':positive?'Positive chip EV':'Negative chip EV';
    $('required').textContent=r.required.toFixed(1)+'%'; $('final').textContent=fmt(r.finalPot);
    $('edge').textContent=(e-r.required>0?'+':'')+(e-r.required).toFixed(1)+' pp';$('edge').style.color=color;
    $('fill').style.width=e+'%';$('fill').style.background=color;$('threshold').style.left=r.required+'%';
    $('threshold-label').textContent='Break-even: '+r.required.toFixed(1)+'%';
    $('reason-title').textContent=neutral?'Calling and folding have equal chip EV.':positive?'A profitable call under these assumptions.':'Folding preserves more chips on average.';
    $('reason').textContent=`With ${e}% equity, your expected share of the ${fmt(r.finalPot)}-chip final pot is ${fmt(e/100*r.finalPot)} chips. Subtract the ${fmt(c)}-chip call and your expected ${r.ev<0?'loss':'gain'} is ${fmt(Math.abs(r.ev))} chips. This is an average over repeated equivalent situations, not a guarantee for this hand.`;
  } catch(err){$('error').textContent=err.message; $('verdict').textContent='Enter valid inputs';$('ev').textContent='—';$('required').textContent='—';$('final').textContent='—';$('edge').textContent='—';$('reason-title').textContent='Calculation unavailable';$('reason').textContent='Correct the inputs to view your result.';$('fill').style.width='0%';}
}
$('form').addEventListener('submit',e=>{e.preventDefault();update()});
for(const id of ['pot','call','equity']) $(id).addEventListener('input',()=>{document.querySelectorAll('[data-e]').forEach(b=>b.classList.remove('selected'));update()});
document.querySelectorAll('[data-e]').forEach(b=>b.addEventListener('click',()=>{$('pot').value=150;$('call').value=50;$('equity').value=b.dataset.e;document.querySelectorAll('[data-e]').forEach(x=>x.classList.toggle('selected',x===b));update()}));update();
