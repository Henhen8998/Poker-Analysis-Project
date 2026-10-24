import {positions} from './positions.js';
const ranks = ['A','K','Q','J','T','9','8','7','6','5','4','3','2'];
const suits = {s:'♠',h:'♥',d:'♦',c:'♣'};
const deck = ranks.flatMap(r=>Object.keys(suits).map(s=>r+s));
const occupied = Array(9).fill(true);
let hero = 0;
let dealer = 0;
const section = document.createElement('section');
section.className='panel table-builder';section.id='table-builder';
section.innerHTML=`<div class="panel-head"><h2>Build your table</h2><span>9 SEATS / HAND SETUP</span></div><p class="muted">Click a seat to add or remove a player. Choose your seat below.</p><div class="poker-stage"><div class="felt"><span class="felt-title">DECISION LAB</span><div id="board-preview" class="card-row"></div><span id="table-count"></span></div><div id="seats"></div></div><div class="table-tools"><label for="hero-seat">Your seat <select id="hero-seat"></select></label><label for="dealer-seat">Dealer button <select id="dealer-seat"></select></label><button type="button" id="reset-table">Reset table & cards</button></div><div class="card-inputs" id="card-inputs"></div><p id="cards-status" role="status"></p><p class="hint">Set the dealer to assign positions clockwise through occupied seats. Action reviews calculate equity against random hands; occupied seats do not imply every player is still in the hand.</p>`;
document.getElementById('calculator').before(section);
const groups=[['Your hand',2],['Flop',3],['Turn',1],['River',1]];
const inputs=[];
for(const [name,count] of groups){
  const group=document.createElement('fieldset');const legend=document.createElement('legend');legend.textContent=name;group.append(legend);
  for(let i=0;i<count;i++){
    const select=document.createElement('select');select.setAttribute('aria-label',`${name} card ${i+1}`);
    const empty=new Option('—', '');select.add(empty);
    for(const card of deck)select.add(new Option(card[0]+suits[card[1]],card));
    select.addEventListener('change',renderCards);group.append(select);inputs.push(select);
  }
  document.getElementById('card-inputs').append(group);
}
function renderSeats(){
  if(!occupied[dealer])dealer=occupied.findIndex(Boolean);
  const labels=positions(occupied,dealer);
  const container=document.getElementById('seats');container.replaceChildren();
  occupied.forEach((present,i)=>{
    const button=document.createElement('button');button.type='button';button.className=`table-seat ${present?'occupied':''} ${i===hero?'hero-seat':''}`;
    const angle=(i*360/9+90)*Math.PI/180;
    button.style.left=(50+43*Math.cos(angle))+'%';button.style.top=(50+40*Math.sin(angle))+'%';
    button.textContent=`${i===hero?'★ You':`Seat ${i+1}`}\n${present?'Occupied':'＋ Empty'}`;
    button.setAttribute('aria-label',`Seat ${i+1}${i===hero?', your seat':''}, ${present?'occupied':'empty'}. Click to ${present?'remove':'add'} player.`);
    button.setAttribute('aria-pressed',String(present));
    button.addEventListener('click',()=>{occupied[i]=!occupied[i];if(i===hero&&!occupied[i])hero=-1;renderSeats()});container.append(button);
  });
  const heroSelect=document.getElementById('hero-seat');heroSelect.replaceChildren(new Option('Choose your seat','-1'));
  occupied.forEach((present,i)=>{if(present)heroSelect.add(new Option(`Seat ${i+1}`,String(i)))});heroSelect.value=String(hero);
  const dealerSelect=document.getElementById('dealer-seat');dealerSelect.replaceChildren();occupied.forEach((present,i)=>{if(present)dealerSelect.add(new Option(`Seat ${i+1}`,String(i)))});dealerSelect.value=String(dealer);
  document.getElementById('table-count').textContent=`${occupied.filter(Boolean).length} / 9 seats occupied`;
}
function renderCards(){
  const chosen=inputs.map(x=>x.value).filter(Boolean);
  for(const select of inputs){
    for(const option of select.options)option.disabled=Boolean(option.value&&option.value!==select.value&&chosen.includes(option.value));
    select.classList.toggle('red-card', /[hd]$/.test(select.value));
  }
  const board=document.getElementById('board-preview');board.replaceChildren();
  for(const select of inputs.slice(2)){
    const card=document.createElement('span');card.className='playing-card'+(/[hd]$/.test(select.value)?' red-card':'');card.textContent=select.value?select.value[0]+suits[select.value[1]]:'?';board.append(card);
  }
  const flop=inputs.slice(2,5).filter(x=>x.value).length, turn=inputs[5].value,river=inputs[6].value;
  let message='Select your two hole cards and any known community cards.';
  if(new Set(chosen).size!==chosen.length)message='Each card can appear only once.';
  else if((flop>0&&flop<3)||((turn||river)&&flop!==3))message='Complete all three flop cards before adding the turn or river.';
  else if(river&&!turn)message='Add the turn card before the river.';
  else if(inputs.slice(0,2).every(x=>x.value))message=`Hand entered · ${river?'River':turn?'Turn':flop===3?'Flop':'Preflop'} · ${chosen.length} known cards. No duplicate cards.`;
  document.getElementById('cards-status').textContent=message;
}
document.getElementById('hero-seat').addEventListener('change',event=>{hero=Number(event.target.value);renderSeats()});
document.getElementById('reset-table').addEventListener('click',()=>{occupied.fill(true);hero=0;inputs.forEach(x=>x.value='');renderSeats();renderCards()});
renderSeats();renderCards();

document.getElementById('dealer-seat').addEventListener('change',event=>{dealer=Number(event.target.value);renderSeats()});
