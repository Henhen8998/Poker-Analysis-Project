import {simulate} from './equity.js';
self.onmessage=event=>{try{self.postMessage({result:simulate(event.data)});}catch(error){self.postMessage({error:error.message});}};
