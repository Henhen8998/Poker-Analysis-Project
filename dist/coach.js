import {analyze} from './math.js';
export function reviewAction({action,pot,call,equity,terminal}){
  const m=analyze(pot,call,equity);
  const edge=equity-m.required;
  let verdict='Needs more context', explanation='';
  if(action==='Call'||action==='Fold'){
    if(!terminal) explanation='Future betting can change the value of continuing. The all-in benchmark below cannot grade this action on its own.';
    else if(call===0) explanation='There is no bet to call. Use check to record continuing without putting in chips.';
    else {
      const equal=Math.abs(m.ev)<1e-9;
      const supported=action==='Call'?m.ev>0:m.ev<0;
      verdict=equal?'Break-even under this model':supported?'Supported by chip EV':'Costs chip EV under this model';
      explanation=`${equity.toFixed(1)}% estimated equity versus ${m.required.toFixed(1)}% required gives a call EV of ${m.ev.toFixed(2)} chips. ${action==='Call'?'Calling':'Folding'} ${equal?'has the same EV as the alternative':supported?'is favored over the alternative':'gives up '+Math.abs(m.ev).toFixed(2)+' chips of expected value versus the alternative'}.`;
    }
  } else if(action==='Check') explanation=call>0?'A check is unavailable when facing a bet. Record a fold, call, or raise instead.':'Checking invests no additional chips. Comparing it with betting requires opponent ranges, responses, and future-street assumptions.';
  else explanation='A bet or raise needs opponent calling/folding ranges, effective stacks, sizing, and future action to evaluate. Pot odds alone cannot grade aggression.';
  return {...m,edge,verdict,explanation};
}
