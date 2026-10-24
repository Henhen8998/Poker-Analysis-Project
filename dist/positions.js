export function positions(occupied,dealer){
 const seats=occupied.map((v,i)=>v?i:-1).filter(i=>i>=0);const result={};
 if(!seats.includes(dealer))return result;
 const ordered=[...seats.filter(i=>i>=dealer),...seats.filter(i=>i<dealer)],n=seats.length;
 const names={2:['BTN / SB','BB'],3:['BTN','SB','BB'],4:['BTN','SB','BB','UTG'],5:['BTN','SB','BB','UTG','CO'],6:['BTN','SB','BB','UTG','HJ','CO'],7:['BTN','SB','BB','UTG','LJ','HJ','CO'],8:['BTN','SB','BB','UTG','UTG+1','LJ','HJ','CO'],9:['BTN','SB','BB','UTG','UTG+1','UTG+2','LJ','HJ','CO']}[n]||['BTN'];
 ordered.forEach((seat,i)=>result[seat]=names[i]);return result;
}
