import { cards } from '../data/readings';
export type Phase = 'IDLE'|'SHUFFLING'|'SPREADING'|'SELECTING'|'DRAWN';
export const DRAW_COUNT = 3;
export interface DeckState {phase:Phase; deck:string[]; selected:string[]; progress:number; shuffles:number}
export type DeckAction = {type:'SHUFFLE'}|{type:'SPREAD';progress:number}|{type:'START_SPREAD'}|{type:'DRAW';id:string}|{type:'RESET'};
export const freshDeck = ():DeckState => ({phase:'IDLE',deck:cards.map(c=>c.id),selected:[],progress:0,shuffles:0});
export function shuffle<T>(items:T[],random=()=>crypto.getRandomValues(new Uint32Array(1))[0]/4294967296){const result=[...items]; for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}
export function deckReducer(state:DeckState,action:DeckAction):DeckState{
 switch(action.type){
 case 'RESET':return freshDeck();
 case 'SHUFFLE':return ['IDLE','SHUFFLING'].includes(state.phase)?{...state,phase:'SHUFFLING',deck:shuffle(state.deck),shuffles:state.shuffles+1}:state;
 case 'START_SPREAD':return state.phase==='SHUFFLING'?{...state,phase:'SPREADING'}:state;
 case 'SPREAD':{if(state.phase!=='SPREADING')return state;const progress=Math.max(state.progress,Math.min(1,action.progress));return {...state,progress,phase:progress>=1?'SELECTING':'SPREADING'};}
 case 'DRAW':{
  if(state.phase!=='SELECTING'||state.selected.length>=DRAW_COUNT||!state.deck.includes(action.id))return state;
  const selected=[...state.selected,action.id];
  return {...state,phase:selected.length===DRAW_COUNT?'DRAWN':'SELECTING',selected,deck:state.deck.filter(id=>id!==action.id)};
 }
 }
}
