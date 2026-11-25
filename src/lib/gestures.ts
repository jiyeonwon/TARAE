import type {Phase} from './deck';

export interface Point{x:number;y:number;z:number}
export interface Hand{points:Point[];score:number;side:string}
export interface ShuffleMotion{x:number;y:number;energy:number;breadth:number}
export interface Gesture{kind:'none'|'shuffle'|'spread'|'point';x?:number;y?:number;progress?:number;motion?:ShuffleMotion}

const dist=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
const clamp=(n:number,min=0,max=1)=>Math.max(min,Math.min(max,n));
const center=(points:Point[])=>{const ids=[0,5,9,13,17];return {x:ids.reduce((n,i)=>n+points[i].x,0)/ids.length,y:ids.reduce((n,i)=>n+points[i].y,0)/ids.length,z:0};};

export class GestureEngine{
 private previous=new Map<string,Point[]>();
 private last=0;
 private phase:Phase='IDLE';
 private motionSince=0;
 private lastShuffle=0;
 private spreadStart:number|null=null;
 private spreadTriggered=false;

 resetTracking(){this.previous.clear();this.last=0;this.motionSince=0;this.spreadStart=null;this.spreadTriggered=false;}

 process(hands:Hand[],phase:Phase,progress:number,time:number):Gesture{
  if(this.phase!==phase){this.resetTracking();this.phase=phase;}
  const valid=hands.filter(hand=>hand.score>=.65&&hand.points.length===21&&hand.points.every(point=>Number.isFinite(point.x)&&Number.isFinite(point.y)));
  if(!valid.length){this.previous.clear();this.last=time;this.motionSince=0;return {kind:'none'};}

  const dt=this.last?Math.max(8,time-this.last):16;this.last=time;
  if(dt>220)this.previous.clear();
  const next=new Map<string,Point[]>();const velocities:Point[]=[];const centers:Point[]=[];
  const smooth=valid.map(hand=>{
   const old=this.previous.get(hand.side);
   const points=hand.points.map((point,index)=>{
    const raw={x:1-point.x,y:point.y,z:point.z};
    if(!old)return raw;
    const speed=dist(raw,old[index])*1000/dt;
    const alpha=clamp(.28+speed*.52,.28,.86);
    return {x:old[index].x+(raw.x-old[index].x)*alpha,y:old[index].y+(raw.y-old[index].y)*alpha,z:raw.z};
   });
   const current=center(points);const before=old?center(old):current;
   velocities.push({x:(current.x-before.x)/dt*1000,y:(current.y-before.y)/dt*1000,z:0});
   centers.push(current);next.set(hand.side,points);return points;
  });
  this.previous=next;

  if(phase==='IDLE'||phase==='SHUFFLING'){
   if(valid.length!==2){this.motionSince=0;return {kind:'none',motion:{x:0,y:0,energy:0,breadth:0}};}
   const speeds=velocities.map(v=>Math.hypot(v.x,v.y));
   const differential=(velocities[0].x-velocities[1].x)/2;
   const averageX=(velocities[0].x+velocities[1].x)/2;
   const averageY=(velocities[0].y+velocities[1].y)/2;
   const energy=clamp((speeds[0]+speeds[1])*.72);
   const handDistance=dist(centers[0],centers[1]);
   const motion={x:clamp((Math.abs(differential)>.065?differential:averageX)*2.35,-1,1),y:clamp(averageY*1.9,-1,1),energy,breadth:clamp((handDistance-.1)/.58)};
   const moving=Math.min(...speeds)>.09&&energy>.14;
   if(moving){
    if(!this.motionSince)this.motionSince=time;
    if(time-this.motionSince>=120&&time-this.lastShuffle>=280){this.lastShuffle=time;return {kind:'shuffle',motion};}
   }else this.motionSince=0;
   return {kind:'none',motion};
  }

  if(phase==='SPREADING'&&smooth.length===1){
   const palm=smooth[0][9];
   if(this.spreadStart===null)this.spreadStart=palm.x;
   if(Math.abs(palm.x-this.spreadStart)>=.055)this.spreadTriggered=true;
   return this.spreadTriggered?{kind:'spread',progress:1}:{kind:'none'};
  }

  if(phase==='SELECTING'&&smooth.length===1){
   const points=smooth[0];
   const indexExtended=dist(points[8],points[0])>dist(points[6],points[0])*1.2;
   const folded=[12,16,20].filter(i=>dist(points[i],points[0])<dist(points[i-2],points[0])*1.16).length>=2;
   if(indexExtended&&folded)return {kind:'point',x:points[8].x,y:points[8].y};
  }
  return {kind:'none'};
 }
}
