export type DrawInput='mouse'|'hand'|'keyboard';
export type DrawPhase='IDLE'|'HOVER'|'DRAGGING_UP'|'HOLDING'|'SELECTED';

export interface DrawPoint{x:number;y:number}
export interface DrawThresholds{start:number;hold:number;horizontal:number;holdRadius:number;duration:number;maxLift:number}
export interface DrawSnapshot{
 phase:DrawPhase;
 cardId:string|null;
 source:DrawInput|null;
 lift:number;
 progress:number;
 selected:boolean;
}

const idle=():DrawSnapshot=>({phase:'IDLE',cardId:null,source:null,lift:0,progress:0,selected:false});
const distance=(a:DrawPoint,b:DrawPoint)=>Math.hypot(a.x-b.x,a.y-b.y);

export class CardDrawMachine{
 private snapshot:DrawSnapshot=idle();
 private origin:DrawPoint|null=null;
 private holdPoint:DrawPoint|null=null;
 private holdStarted=0;
 private thresholds:DrawThresholds={start:18,hold:96,horizontal:130,holdRadius:42,duration:2000,maxLift:170};
 private selectedEmitted=false;

 get state(){return this.snapshot;}

 begin(cardId:string,point:DrawPoint,time:number,source:DrawInput,thresholds?:Partial<DrawThresholds>){
  if(this.snapshot.phase==='SELECTED')return this.snapshot;
  this.thresholds={...this.thresholds,...thresholds};
  this.origin={...point};this.holdPoint=null;this.holdStarted=0;this.selectedEmitted=false;
  this.snapshot={phase:'HOVER',cardId,source,lift:0,progress:0,selected:false};
  return this.snapshot;
 }

 move(point:DrawPoint,time:number){
  if(!this.origin||!this.snapshot.cardId||this.snapshot.phase==='IDLE'||this.snapshot.phase==='SELECTED')return this.snapshot;
  const upward=this.origin.y-point.y;
  const horizontal=Math.abs(point.x-this.origin.x);
  const lift=Math.max(0,Math.min(this.thresholds.maxLift,upward));

  if(horizontal>this.thresholds.horizontal||upward<-18)return this.cancel();

  if(this.snapshot.phase==='HOVER'){
   if(upward>=this.thresholds.start&&upward>horizontal*.72)this.snapshot={...this.snapshot,phase:'DRAGGING_UP',lift};
   return this.snapshot;
  }

  if(this.snapshot.phase==='DRAGGING_UP'){
   if(upward<this.thresholds.start*.45)return this.cancel();
   if(upward>=this.thresholds.hold){
    this.holdPoint={...point};this.holdStarted=time;
    this.snapshot={...this.snapshot,phase:'HOLDING',lift,progress:0};
   }else this.snapshot={...this.snapshot,lift,progress:0};
   return this.snapshot;
  }

  if(this.snapshot.phase==='HOLDING'){
   if(upward<this.thresholds.hold-22)return this.cancel();
   if(this.holdPoint&&distance(point,this.holdPoint)>this.thresholds.holdRadius){
    this.holdPoint={...point};this.holdStarted=time;
   }
   this.snapshot={...this.snapshot,lift,progress:Math.min(1,(time-this.holdStarted)/this.thresholds.duration)};
  }
  return this.snapshot;
 }

 tick(time:number){
  if(this.snapshot.phase!=='HOLDING'||!this.holdStarted)return this.snapshot;
  const progress=Math.min(1,(time-this.holdStarted)/this.thresholds.duration);
  if(progress>=1){
   this.snapshot={...this.snapshot,phase:'SELECTED',progress:1,selected:!this.selectedEmitted};
   this.selectedEmitted=true;
  }else this.snapshot={...this.snapshot,progress};
  return this.snapshot;
 }

 consumeSelection(){
  if(this.snapshot.phase!=='SELECTED'||!this.snapshot.cardId||!this.snapshot.selected)return null;
  const id=this.snapshot.cardId;
  this.snapshot={...this.snapshot,selected:false};
  return id;
 }

 cancel(){this.origin=null;this.holdPoint=null;this.holdStarted=0;this.selectedEmitted=false;this.snapshot=idle();return this.snapshot;}
 complete(){return this.cancel();}
}
