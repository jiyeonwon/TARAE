import type { Phase } from './deck';
export interface Point{x:number;y:number;z:number}
export interface Hand{points:Point[];score:number;side:string}
export interface ShuffleMotion{x:number;y:number;energy:number;breadth:number}
export interface Gesture {kind:'none'|'shuffle'|'spread'|'point'|'draw';x?:number;y?:number;progress?:number;id?:string;motion?:ShuffleMotion;armed?:boolean}
const dist=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
export class GestureEngine {
 private previous=new Map<string,Point[]>(); private last=0; private phase:Phase='IDLE'; private motionSince=0;private lastShuffle=0;private spreadStart:number|null=null;private baseProgress=0;private target:string|null=null;private targetSince=0;private anchor:Point|null=null;private cooldown=0;
 resetTracking(){this.previous.clear();this.last=0;this.motionSince=0;this.spreadStart=null;this.target=null;this.anchor=null;this.targetSince=0;}
 process(hands:Hand[],phase:Phase,progress:number,time:number,hit:(x:number,y:number)=>string|null):Gesture {
  if(this.phase!==phase){this.resetTracking();this.phase=phase;}
  const valid=hands.filter(h=>h.score>=.65&&h.points.length===21&&h.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
  if(!valid.length){this.resetTracking();return {kind:'none'};}
  const dt=this.last?Math.max(16,time-this.last):0;this.last=time;
  if(dt>220){this.resetTracking();return {kind:'none'};}
  const next=new Map<string,Point[]>();const velocities:Point[]=[];const centers:Point[]=[];
  const center=(p:Point[])=>{const ids=[0,5,9,13,17];return {x:ids.reduce((n,i)=>n+p[i].x,0)/ids.length,y:ids.reduce((n,i)=>n+p[i].y,0)/ids.length,z:0};};
  const smooth=valid.map(h=>{const old=this.previous.get(h.side);const points=h.points.map((p,i)=>({x:old?old[i].x*.6+(1-p.x)*.4:1-p.x,y:old?old[i].y*.6+p.y*.4:p.y,z:p.z}));const c=center(points);const before=old?center(old):c;
   velocities.push(old&&dt?{x:(c.x-before.x)/dt*1000,y:(c.y-before.y)/dt*1000,z:0}:{x:0,y:0,z:0});centers.push(c);next.set(h.side,points);return points;});this.previous=next;
  if(phase==='IDLE'||phase==='SHUFFLING'){
   const speeds=velocities.map(v=>Math.hypot(v.x,v.y));const speed=Math.min(...speeds);
   if(valid.length===2&&speed>.12){if(!this.motionSince)this.motionSince=time;if(time-this.motionSince>=160){const trigger=time-this.lastShuffle>220;if(trigger)this.lastShuffle=time;const avgX=(velocities[0].x+velocities[1].x)/2;const avgY=(velocities[0].y+velocities[1].y)/2;const differential=(velocities[0].x-velocities[1].x)/2;return {kind:trigger?'shuffle':'none',motion:{x:Math.max(-1,Math.min(1,(Math.abs(differential)>.08?differential:avgX)*2.2)),y:Math.max(-1,Math.min(1,avgY*2)),energy:Math.min(1,(speeds[0]+speeds[1])*.9),breadth:Math.min(1,dist(centers[0],centers[1])/.7)}};}}
   else this.motionSince=0;return {kind:'none',motion:{x:0,y:0,energy:0,breadth:valid.length===2?Math.min(1,dist(centers[0],centers[1])/.7):0}};
  }
  if(phase==='SPREADING'&&smooth.length===1){const p=smooth[0][9];if(this.spreadStart===null){this.spreadStart=p.x;this.baseProgress=progress;}
   return {kind:'spread',progress:Math.min(1,Math.max(progress,this.baseProgress+(this.spreadStart-p.x)/.45))};}
  if(phase==='SELECTING'&&smooth.length===1&&time>this.cooldown){const p=smooth[0];const index=dist(p[8],p[0])>dist(p[6],p[0])*1.22;const folded=[12,16,20].filter(i=>dist(p[i],p[0])<dist(p[i-2],p[0])*1.15).length>=2;
   if(!index||!folded){this.target=null;this.anchor=null;return {kind:'none'};}
   const tip=p[8];const id=hit(tip.x,tip.y);
   if(this.target&&this.anchor&&time-this.targetSince>=450){const towards=dist(this.anchor,{x:.5,y:.72,z:0})-dist(tip,{x:.5,y:.72,z:0});
    if(towards>.075&&dist(this.anchor,tip)>.09){const selected=this.target;this.cooldown=time+1400;this.target=null;this.anchor=null;return {kind:'draw',id:selected,x:tip.x,y:tip.y};}
    if(time-this.targetSince>2300){this.target=null;this.anchor=null;}
    else return {kind:'point',id:this.target??undefined,x:tip.x,y:tip.y,armed:true};
   }
   if(id!==this.target){this.target=id;this.targetSince=time;this.anchor=null;}
   if(id&&time-this.targetSince>=400)this.anchor={...tip};
   return {kind:'point',id:id??undefined,x:tip.x,y:tip.y,armed:!!this.anchor};
  }
  this.target=null;this.anchor=null;return {kind:'none'};
 }
}
