import {forwardRef,useEffect,useImperativeHandle,useRef,type Dispatch,type KeyboardEvent,type PointerEvent} from 'react';
import {back,cards} from '../data/readings';
import {CardDrawMachine,type DrawSnapshot} from '../lib/cardDraw';
import type {DeckAction,DeckState} from '../lib/deck';
import type {ShuffleMotion} from '../lib/gestures';
import {CardImage,FlipCard} from './Card';

const positions=[['CARD 01','과거 · 배경'],['CARD 02','현재 · 핵심 상황'],['CARD 03','미래 · 가능성']];
const still:ShuffleMotion={x:0,y:0,energy:0,breadth:0};
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));
const mix=(from:number,to:number,amount:number)=>from+(to-from)*amount;
const seedFor=(id:string)=>{let hash=2166136261;for(const char of id){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619);}return (hash>>>0)/4294967295;};

export interface DeckHandle{
 updateShuffle:(motion:ShuffleMotion)=>void;
 updateHandPointer:(frame:{x:number;y:number;active:boolean;time:number})=>void;
 cancelInteractions:()=>void;
}

type Pose={x:number;y:number;angle:number};
type DragVisual={id:string|null;currentLift:number;targetLift:number;phase:string;progress:number};

export const Deck=forwardRef<DeckHandle,{state:DeckState;dispatch:Dispatch<DeckAction>;mouse:boolean}>(function Deck({state,dispatch,mouse},ref){
 const areaRef=useRef<HTMLDivElement>(null);const pointerRef=useRef<HTMLDivElement>(null);const liveRef=useRef<HTMLParagraphElement>(null);
 const cardRefs=useRef(new Map<string,HTMLButtonElement>());const slotRefs=useRef<Array<HTMLDivElement|null>>([]);
 const stateRef=useRef(state);stateRef.current=state;const dispatchRef=useRef(dispatch);dispatchRef.current=dispatch;
 const machine=useRef(new CardDrawMachine());const handLast=useRef(0);const lastPhase=useRef('');const flight=useRef(false);
 const activePointer=useRef<number|null>(null);const keyboardCard=useRef<string|null>(null);
 const surfaceDrag=useRef<{x:number;y:number;lastX:number;lastY:number;lastTime:number;lastShuffle:number;progress:number;spreadTriggered:boolean}|null>(null);
 const motionTarget=useRef({...still});const motionCurrent=useRef({...still});const lastMotion=useRef(0);
 const spreadTarget=useRef(state.progress);const spreadCurrent=useRef(state.progress);const poses=useRef(new Map<string,Pose>());
 const dragVisual=useRef<DragVisual>({id:null,currentLift:0,targetLift:0,phase:'IDLE',progress:0});

 const thresholds=(id:string)=>{const height=cardRefs.current.get(id)?.getBoundingClientRect().height??180;return {start:clamp(height*.08,15,20),hold:clamp(height*.44,72,112),horizontal:clamp(height*.62,88,144),holdRadius:clamp(height*.18,30,46),duration:2000,maxLift:clamp(height*.82,132,188)};};
 const clearCardState=(id:string|null)=>{if(!id)return;const element=cardRefs.current.get(id);if(!element)return;element.dataset.drawState='idle';element.style.setProperty('--hold-progress','0');};
 const syncSnapshot=(snapshot:DrawSnapshot)=>{
  const visual=dragVisual.current;
  if(snapshot.cardId&&snapshot.cardId!==visual.id){clearCardState(visual.id);visual.id=snapshot.cardId;visual.currentLift=0;}
  if(snapshot.cardId){visual.targetLift=snapshot.lift;visual.phase=snapshot.phase;visual.progress=snapshot.progress;const element=cardRefs.current.get(snapshot.cardId);if(element){element.dataset.drawState=snapshot.phase.toLowerCase();element.style.setProperty('--hold-progress',String(snapshot.progress));if(snapshot.phase==='HOLDING'){const cardRect=element.getBoundingClientRect();const feedback=element.querySelector<HTMLElement>('.draw-feedback');const feedbackWidth=feedback?.getBoundingClientRect().width??156;const center=cardRect.left+cardRect.width/2;const margin=10;const shiftClient=center-feedbackWidth/2<margin?margin-(center-feedbackWidth/2):center+feedbackWidth/2>innerWidth-margin?(innerWidth-margin)-(center+feedbackWidth/2):0;const area=areaRef.current;const areaRect=area?.getBoundingClientRect();const scale=area&&areaRect?.width?areaRect.width/area.offsetWidth:1;element.style.setProperty('--feedback-shift',`${shiftClient/scale}px`);}}}
  else{visual.targetLift=0;visual.phase='IDLE';visual.progress=0;if(visual.id){const element=cardRefs.current.get(visual.id);if(element){element.dataset.drawState='returning';element.style.setProperty('--hold-progress','0');}}}
  if(snapshot.phase!==lastPhase.current&&liveRef.current){lastPhase.current=snapshot.phase;liveRef.current.textContent=snapshot.phase==='HOVER'?'카드를 위로 끌어올리세요.':snapshot.phase==='DRAGGING_UP'?'카드를 조금 더 위로 끌어올리세요.':snapshot.phase==='HOLDING'?'그 위치에서 2초간 유지하세요.':snapshot.phase==='SELECTED'?'카드 선택이 완료됐어요.':'';}
 };

 const flyToSlot=async(id:string)=>{
  if(flight.current)return;const source=cardRefs.current.get(id);const slot=slotRefs.current[stateRef.current.selected.length];if(!source||!slot)return;
  flight.current=true;const start=source.getBoundingClientRect();const end=slot.getBoundingClientRect();
  const image=source.querySelector('img')?.cloneNode(true) as HTMLImageElement|undefined;
  const flyer=document.createElement('div');flyer.className='card-flight';flyer.style.left=`${start.left}px`;flyer.style.top=`${start.top}px`;flyer.style.width=`${start.width}px`;flyer.style.height=`${start.height}px`;if(image)flyer.append(image);document.body.append(flyer);source.style.visibility='hidden';
  const dx=end.left+end.width/2-(start.left+start.width/2);const dy=end.top+end.height/2-(start.top+start.height/2);const scaleX=end.width/start.width;const scaleY=end.height/start.height;const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animation=flyer.animate([{transform:'translate3d(0,0,0) scale(1)',opacity:1},{transform:`translate3d(${dx}px,${dy}px,0) scale(${scaleX},${scaleY})`,opacity:1}],{duration:reduce?1:420,easing:'cubic-bezier(.16,1,.3,1)',fill:'forwards'});
  try{await animation.finished;}catch{/* interrupted animations still commit the selected card */}
  dispatchRef.current({type:'DRAW',id});flyer.remove();source.style.visibility='';machine.current.complete();syncSnapshot(machine.current.state);clearCardState(id);dragVisual.current={id:null,currentLift:0,targetLift:0,phase:'IDLE',progress:0};flight.current=false;
 };

 const consumeSelection=(snapshot:DrawSnapshot)=>{const id=machine.current.consumeSelection();if(id)void flyToSlot(id);else syncSnapshot(snapshot);};
 const cancelDraw=()=>{if(flight.current)return;syncSnapshot(machine.current.cancel());keyboardCard.current=null;};

 const begin=(id:string,x:number,y:number,time:number,source:'mouse'|'hand'|'keyboard')=>{if(stateRef.current.phase!=='SELECTING'||flight.current)return;syncSnapshot(machine.current.begin(id,{x,y},time,source,thresholds(id)));};
 const moveDraw=(x:number,y:number,time:number)=>{const snapshot=machine.current.move({x,y},time);syncSnapshot(snapshot);consumeSelection(snapshot);};

 useImperativeHandle(ref,()=>({
  updateShuffle(next){motionTarget.current={...next};lastMotion.current=performance.now();},
  updateHandPointer(frame){
   const area=areaRef.current;const pointer=pointerRef.current;if(!area||stateRef.current.phase!=='SELECTING'){if(pointer)pointer.style.opacity='0';return;}
   if(!frame.active){if(pointer)pointer.style.opacity='0';return;}
   handLast.current=performance.now();const rect=area.getBoundingClientRect();const clientX=rect.left+frame.x*rect.width;const clientY=rect.top+frame.y*rect.height;
   if(pointer){pointer.style.opacity='1';pointer.style.transform=`translate3d(${frame.x*area.offsetWidth}px,${frame.y*area.offsetHeight}px,0) translate(-50%,-50%)`;}
   const target=document.elementsFromPoint(clientX,clientY).map(node=>node.closest<HTMLElement>('[data-card-id]')).find(Boolean);const id=target?.dataset.cardId??null;const snapshot=machine.current.state;
   if(snapshot.source&&snapshot.source!=='hand')return;
   if(snapshot.phase==='IDLE'&&id)begin(id,clientX,clientY,frame.time,'hand');
   else if(snapshot.phase==='HOVER'&&id&&id!==snapshot.cardId)begin(id,clientX,clientY,frame.time,'hand');
   else if(snapshot.phase==='HOVER'&&!id)cancelDraw();
   else if(snapshot.cardId)moveDraw(clientX,clientY,frame.time);
  },
  cancelInteractions(){motionTarget.current={...still};activePointer.current=null;surfaceDrag.current=null;if(pointerRef.current)pointerRef.current.style.opacity='0';cancelDraw();}
}),[]);

 useEffect(()=>{spreadTarget.current=state.progress;},[state.progress]);
 useEffect(()=>{if(state.phase!=='SELECTING')cancelDraw();if(state.phase!=='SHUFFLING'&&state.phase!=='IDLE')motionTarget.current={...still};},[state.phase]);

 useEffect(()=>{
  let frame=0;let previous=performance.now();
  const render=(now:number)=>{
   const dt=Math.min(40,Math.max(8,now-previous));previous=now;const step=dt/16.667;
   if(now-lastMotion.current>90){motionTarget.current.x*=Math.pow(.72,step);motionTarget.current.y*=Math.pow(.72,step);motionTarget.current.energy*=Math.pow(.78,step);}
   if(now-lastMotion.current>260)motionTarget.current.breadth*=Math.pow(.9,step);
   const motionRate=1-Math.pow(.48,step);for(const key of ['x','y','energy','breadth'] as const)motionCurrent.current[key]=mix(motionCurrent.current[key],motionTarget.current[key],motionRate);
   spreadCurrent.current=mix(spreadCurrent.current,spreadTarget.current,1-Math.pow(.76,step));
   if(machine.current.state.source==='hand'&&now-handLast.current>210)cancelDraw();
   const tick=machine.current.tick(now);syncSnapshot(tick);consumeSelection(tick);
   const visual=dragVisual.current;const liftRate=1-Math.pow(visual.phase==='IDLE' ? .78 : .38,step);visual.currentLift=mix(visual.currentLift,visual.targetLift,liftRate);
   if(visual.phase==='IDLE'&&visual.id&&visual.currentLift<.5){clearCardState(visual.id);visual.id=null;visual.currentLift=0;}
   const area=areaRef.current;const height=area?.offsetHeight??460;const width=area?.offsetWidth??1100;const rect=area?.getBoundingClientRect();const localScale=rect?.height?height/rect.height:1;
   const deck=stateRef.current.deck;const total=Math.max(1,deck.length-1);const spread=spreadCurrent.current;const shuffling=['IDLE','SHUFFLING'].includes(stateRef.current.phase);const selecting=['SELECTING','DRAWN'].includes(stateRef.current.phase);
   deck.forEach((id,index)=>{
    const element=cardRefs.current.get(id);if(!element)return;const t=(index-total/2)/(total/2||1);const seed=seedFor(id);const lane=seed>.5?1:-1;const maxX=Math.max(90,width/2-(element.offsetWidth*.58));
    const breadthX=shuffling?(seed*2-1)*motionCurrent.current.breadth*Math.min(width*.32,320):0;
    const shuffleX=shuffling?breadthX+lane*motionCurrent.current.x*(105+motionCurrent.current.breadth*145)*(.74+seed*.52)+Math.sin(seed*29)*motionCurrent.current.energy*54:0;
    const shuffleY=shuffling?motionCurrent.current.y*(46+seed*44)+motionCurrent.current.energy*((seed*7)%3-1)*31:0;
    const fanX=t*Math.min(390,width*.38)*spread;const fanCurve=t*t*34*spread;const centerY=(selecting ? .70 : .55)*height-height/2;
    let targetX=clamp(fanX+shuffleX,-maxX,maxX);let targetY=centerY+fanCurve+shuffleY;let targetAngle=t*18*spread+(shuffling?motionCurrent.current.x*lane*(13+seed*20)+motionCurrent.current.y*(seed-.5)*18:0);
    if(visual.id===id){targetY-=visual.currentLift*localScale;targetAngle*=Math.max(0,1-visual.currentLift/(thresholds(id).hold*1.45));}
    const current=poses.current.get(id)??{x:targetX,y:targetY,angle:targetAngle};const poseRate=1-Math.pow(shuffling ? .42 : .72,step);current.x=mix(current.x,targetX,poseRate);current.y=mix(current.y,targetY,visual.id===id?liftRate:poseRate);current.angle=mix(current.angle,targetAngle,poseRate);poses.current.set(id,current);
    element.style.transform=`translate3d(${current.x}px,${current.y}px,0) translate(-50%,-50%) rotate(${current.angle}deg)`;element.style.zIndex=visual.id===id?'90':String(shuffling?(motionCurrent.current.x*lane>0?50-index:index+1):index+1);element.style.opacity=stateRef.current.phase==='DRAWN'?'.14':'1';
   });
   frame=requestAnimationFrame(render);
  };
  frame=requestAnimationFrame(render);return()=>cancelAnimationFrame(frame);
 },[]);

 const pointerDown=(event:PointerEvent<HTMLDivElement>)=>{if(!mouse||flight.current||(event.target as HTMLElement).closest('.selected-slot'))return;const phase=stateRef.current.phase;const card=(event.target as HTMLElement).closest<HTMLElement>('[data-card-id]');
  if(phase==='SELECTING'&&!card?.dataset.cardId)return;if(!['IDLE','SHUFFLING','SPREADING','SELECTING'].includes(phase))return;activePointer.current=event.pointerId;event.currentTarget.setPointerCapture(event.pointerId);const now=performance.now();
  if(phase==='SELECTING')begin(card!.dataset.cardId!,event.clientX,event.clientY,now,'mouse');else surfaceDrag.current={x:event.clientX,y:event.clientY,lastX:event.clientX,lastY:event.clientY,lastTime:now,lastShuffle:0,progress:stateRef.current.progress,spreadTriggered:false};
 };
 const pointerMove=(event:PointerEvent<HTMLDivElement>)=>{if(activePointer.current!==event.pointerId)return;const now=performance.now();if(machine.current.state.source==='mouse'){moveDraw(event.clientX,event.clientY,now);return;}const drag=surfaceDrag.current;if(!drag)return;const phase=stateRef.current.phase;
  if(phase==='IDLE'||phase==='SHUFFLING'){const dx=event.clientX-drag.lastX;const dy=event.clientY-drag.lastY;const distance=Math.hypot(dx,dy);const width=areaRef.current?.getBoundingClientRect().width??900;motionTarget.current={x:clamp(dx/24,-1,1),y:clamp(dy/30,-1,1),energy:clamp(distance/28,0,1),breadth:clamp(Math.abs(event.clientX-drag.x)/(width*.34),0,1)};lastMotion.current=now;if(distance>9&&now-drag.lastShuffle>280){dispatchRef.current({type:'SHUFFLE'});drag.lastShuffle=now;}drag.lastX=event.clientX;drag.lastY=event.clientY;drag.lastTime=now;}
  else if(phase==='SPREADING'){const width=areaRef.current?.getBoundingClientRect().width??900;if(!drag.spreadTriggered&&Math.abs(event.clientX-drag.x)>=width*.055){drag.spreadTriggered=true;dispatchRef.current({type:'SPREAD',progress:1});}}
 };
 const pointerEnd=(event:PointerEvent<HTMLDivElement>)=>{if(activePointer.current!==event.pointerId)return;activePointer.current=null;surfaceDrag.current=null;motionTarget.current={...still};if(!flight.current)cancelDraw();};
 const keyboardDown=(event:KeyboardEvent<HTMLButtonElement>,id:string)=>{if((event.key!=='Enter'&&event.key!==' ')||event.repeat||stateRef.current.phase!=='SELECTING')return;event.preventDefault();const rect=event.currentTarget.getBoundingClientRect();const x=rect.left+rect.width/2;const y=rect.top+rect.height/2;const config=thresholds(id);keyboardCard.current=id;begin(id,x,y,performance.now(),'keyboard');moveDraw(x,y-config.start-2,performance.now());moveDraw(x,y-config.hold-2,performance.now());};
 const keyboardUp=(event:KeyboardEvent<HTMLButtonElement>,id:string)=>{if((event.key==='Enter'||event.key===' ')&&keyboardCard.current===id&&!flight.current){event.preventDefault();cancelDraw();}};

 return <div ref={areaRef} className={`deck-area ${state.phase.toLowerCase()} selected-${state.selected.length}`} data-testid="deck" data-phase={state.phase} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd}>
  <div className="selection-tray" aria-label={`선택한 카드 ${state.selected.length}장`}>
   {positions.map(([label,meaning],index)=>{const id=state.selected[index];const card=id?cards.find(item=>item.id===id):null;return <div className={`selected-slot ${card?'filled':''}`} key={label}>
    <div className="slot-card" ref={node=>{slotRefs.current[index]=node;}}>{card?<FlipCard card={card}/>:<span aria-hidden="true"/>}</div><strong>{label}</strong><small>{meaning}</small>
   </div>;})}
  </div>
  <div className="fan-deck" aria-label="남은 카드">
   {state.deck.map((id,index)=><button type="button" key={id} ref={node=>{if(node)cardRefs.current.set(id,node);else cardRefs.current.delete(id);}} data-card-id={id} data-testid="deck-card" data-draw-state="idle" aria-label={`뒷면 카드 ${index+1}. 위로 끌어올려 2초간 유지해 선택`} disabled={state.phase!=='SELECTING'} className="deck-card" onKeyDown={event=>keyboardDown(event,id)} onKeyUp={event=>keyboardUp(event,id)} onClick={event=>event.preventDefault()}><span className="deck-card-visual"><CardImage src={back} alt=""/></span><span className="draw-feedback" aria-hidden="true"><span>2초간 유지해 선택</span><i/></span></button>)}
  </div>
  <div ref={pointerRef} className="deck-hand-pointer" aria-hidden="true"/>
  <p ref={liveRef} className="sr-only" aria-live="polite"/>
 </div>;
});
