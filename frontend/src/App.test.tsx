// @vitest-environment jsdom
import React from 'react';
import {afterEach,expect,test,vi} from 'vitest';
import {cleanup,render,screen,fireEvent,waitFor} from '@testing-library/react';
import {App} from './main';
afterEach(()=>{cleanup();vi.restoreAllMocks()});
test('nine editable seats and unit toggle preserve stack input',()=>{
 render(<App/>);
 expect(screen.getAllByRole('button',{name:/Edit seat/})).toHaveLength(9);
 expect((screen.getByLabelText('Remaining stack USD') as HTMLInputElement).value).toBe('500');
 fireEvent.click(screen.getByRole('button',{name:'Big blinds'}));
 expect((screen.getByLabelText('Remaining stack BB') as HTMLInputElement).value).toBe('100');
 fireEvent.click(screen.getByRole('button',{name:'USD $'}));
 expect((screen.getByLabelText('Remaining stack USD') as HTMLInputElement).value).toBe('500');
});
test('duplicate cards disabled and future streets cleared',()=>{
 render(<App/>);
 const hero2=screen.getByLabelText('Hero 2') as HTMLSelectElement;
 expect(Array.from(hero2.options).find(o=>o.value==='As')?.disabled).toBe(true);
 fireEvent.change(screen.getByLabelText('Street'),{target:{value:'Flop'}});
 expect(screen.queryByLabelText('River')).toBeNull();
 expect(screen.getByLabelText('Flop 3')).toBeTruthy();
});
test('hero can change seat and snapshot sends exact cents',async()=>{
 const fetchMock=vi.spyOn(globalThis,'fetch').mockResolvedValue({ok:true,json:async()=>({call:5000,pot_before_call:15000,final_pot:20000,required_equity:.25,pot_odds_ratio:3,actions:['Fold','Call'],short_call:false,assumptions:[]})} as Response);
 render(<App/>);
 fireEvent.change(screen.getByLabelText('Hero seat'),{target:{value:'3'}});
 fireEvent.click(screen.getByRole('button',{name:'Big blinds'}));
 fireEvent.click(screen.getByRole('button',{name:/Calculate pot odds/}));
 await waitFor(()=>expect(screen.getByText('25.00%')).toBeTruthy());
 const body=JSON.parse(fetchMock.mock.calls[0][1]!.body as string);
 expect(body.hero).toBe(3);expect(body.pot).toBe(15000);expect(body.facing).toBe(5000);
});


test('existing Hero contribution reduces call and recording a bet transfers chips',async()=>{
 vi.spyOn(globalThis,'fetch').mockImplementation(async(_url,options)=>{
  const data=JSON.parse(options!.body as string);
  return {ok:true,json:async()=>({cents:Number(data.text)*100})} as Response;
 });
 render(<App/>);
 const committed=screen.getByLabelText('Hero already committed this street USD');
 fireEvent.change(committed,{target:{value:'20'}});fireEvent.blur(committed);
 await waitFor(()=>expect(screen.getByText('$30.00')).toBeTruthy());
 const match=screen.getByLabelText('Total bet to match this street USD');
 fireEvent.change(match,{target:{value:'60'}});fireEvent.blur(match);
 await waitFor(()=>expect(screen.getByText('$40.00')).toBeTruthy());
 fireEvent.change(screen.getByLabelText('Street'),{target:{value:'Turn'}});
 fireEvent.click(screen.getByRole('button',{name:'Record Hero bet'}));
 expect((screen.getByLabelText('Remaining stack USD') as HTMLInputElement).value).toBe('475');
 expect((screen.getByLabelText('Pot before call USD') as HTMLInputElement).value).toBe('175');
 expect((screen.getByLabelText('Hero already committed this street USD') as HTMLInputElement).value).toBe('25');
 expect((screen.getByRole('button',{name:'Record Hero bet'}) as HTMLButtonElement).disabled).toBe(true);
});
