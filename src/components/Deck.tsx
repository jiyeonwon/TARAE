import {useRef,type Dispatch,type PointerEvent} from 'react';
import {back,cards} from '../data/readings';
import type {DeckAction,DeckState} from '../lib/deck';
import type {ShuffleMotion} from '../lib/gestures';
import {CardImage,FlipCard} from './Card';

const positions=[['CARD 01','과거 · 배경'],['CARD 02','현재 · 핵심 상황'],['CARD 03','미래 · 가능성']];
const still:ShuffleMotion={x:0,y:0,energy:0,breadth:0};

export function Deck({state,dispatch,hover,setHover,motion=still,onMotion,mouse}:{state:DeckState;dispatch:Dispatch<DeckAction>;hover:string|null;setHover:(s:string|null)=>void;motion:ShuffleMotion;onMotion:(n:ShuffleMotion)=>void;mouse:boolean}){
 const drag=useRef<{x:number;y:number;last:number;time:number;progress:number;card:string|null}|null>(null);
 const move=(e:PointerEvent)=>{if(!mouse||!drag.current)return;const d=drag.current;const dx=e.clientX-d.last;const dy=e.clientY-d.y;
  if(['IDLE','SHUFFLING'].includes(state.phase)){const travel=e.clientX-d.x;onMotion({x:Math.max(-1,Math.min(1,travel/140)),y:Math.max(-1,Math.min(1,dy/120)),energy:Math.min(1,Math.abs(dx)/35+Math.abs(dy)/80),breadth:Math.min(1,Math.abs(travel)/260)});if(Math.abs(dx)>12&&performance.now()-d.time>120){dispatch({type:'SHUFFLE'});d.last=e.clientX;d.time=performance.now();}}
  if(state.phase==='SPREADING'){const width=e.currentTarget.getBoundingClientRect().width;dispatch({type:'SPREAD',progress:d.progress+(d.x-e.clientX)/(width*.55)});}
 };
 const end=(e:PointerEvent)=>{const d=drag.current;if(d&&state.phase==='SELECTING'&&d.card&&(Math.hypot(e.clientX-d.x,e.clientY-d.y)>45||Math.hypot(e.clientX-d.x,e.clientY-d.y)<10))dispatch({type:'DRAW',id:d.card});drag.current=null;onMotion(still);};
 const total=Math.max(1,state.deck.length-1);
 return <div className={`deck-area ${state.phase.toLowerCase()} selected-${state.selected.length}`} data-testid="deck" data-phase={state.phase} onPointerDown={e=>{if(!mouse||state.phase==='DRAWN'||(e.target as HTMLElement).closest('.selected-slot'))return;const el=(e.target as HTMLElement).closest<HTMLElement>('[data-card-id]');drag.current={x:e.clientX,y:e.clientY,last:e.clientX,time:0,progress:state.progress,card:el?.dataset.cardId??null};e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={move} onPointerUp={end} onPointerCancel={()=>{drag.current=null;onMotion(still);}}>
  <div className="selection-tray" aria-label={`선택한 카드 ${state.selected.length}장`}>
   {positions.map(([label,meaning],i)=>{const id=state.selected[i];const card=id?cards.find(c=>c.id===id):null;return <div className={`selected-slot ${card?'filled':''}`} key={label}>
    <div className="slot-card">{card?<FlipCard card={card}/>:<span aria-hidden="true"/>}</div><strong>{label}</strong><small>{meaning}</small>
   </div>;})}
  </div>
  <div className="fan-deck" aria-label="남은 카드">
  {state.deck.map((id,i)=>{const t=(i-total/2)/(total/2||1);const spread=state.progress;const variance=((i*37)%17)/17;const lane=i%2?1:-1;const shuffleX=lane*motion.x*(85+motion.breadth*145)*(0.72+variance*.48)+Math.sin(i*1.73)*motion.energy*34;const shuffleY=motion.y*(42+variance*34)+motion.energy*(i%3-1)*24;const x=t*345*spread+shuffleX+(1-spread)*(i%5-2)*3;const y=t*t*24*spread+shuffleY;const angle=t*18*spread+motion.x*lane*(12+variance*18)+motion.y*(variance-.5)*18;const dim=state.phase==='DRAWN';const center=state.phase==='SELECTING'||state.phase==='DRAWN'?69:55;return <button type="button" key={id} data-card-id={id} data-testid="deck-card" aria-label={`뒷면 카드 ${i+1} 선택`} disabled={state.phase!=='SELECTING'} className={`deck-card ${hover===id?'pointed':''}`} style={{left:`calc(50% + ${x/9}%)`,top:`calc(${center}% + ${y}px)`,transform:`translate(-50%,-50%) rotate(${angle}deg) translateY(${hover===id?-22:0}px)`,zIndex:hover===id?80:motion.x*lane>0?50-i:i+1,opacity:dim?.18:1}} onPointerEnter={()=>{if(mouse&&state.phase==='SELECTING')setHover(id);}} onPointerLeave={()=>{if(mouse)setHover(null);}} onFocus={()=>setHover(id)} onBlur={()=>setHover(null)} onClick={()=>{if(mouse)dispatch({type:'DRAW',id});}}><CardImage src={back} alt=""/></button>;})}
  </div>
 </div>;
}
