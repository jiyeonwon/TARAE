import {useEffect,useRef,useState,type KeyboardEvent} from 'react';
import {back,type Card as CardData} from '../data/readings';

export function CardImage({src,alt,className=''}:{src:string;alt:string;className?:string}){
 const [failed,setFailed]=useState(false);
 return failed?<div className={`asset-error ${className}`} role="alert">{alt}<br/>이미지를 불러오지 못했어요.<button onClick={()=>setFailed(false)}>다시 불러오기</button></div>:<img draggable={false} src={src} alt={alt} className={className} onError={()=>setFailed(true)}/>;
}

export function CardTitle({card,as='h2'}:{card:CardData;as?:'h2'|'h3'}){
 const Tag=as;
 return <Tag className="card-name"><span>{card.name}</span><small>{card.koreanName}</small></Tag>;
}

export function FlipCard({card,reveal=false,interactive=true}:{card:CardData;reveal?:boolean;interactive?:boolean}){
 const [turned,setTurned]=useState(reveal);const [locked,setLocked]=useState(false);const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>{setTurned(reveal);setLocked(false);if(timer.current)clearTimeout(timer.current);},[reveal,card.id]);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
 const flip=()=>{if(!interactive||locked)return;setLocked(true);setTurned(v=>!v);timer.current=setTimeout(()=>setLocked(false),650);};
 const key=(e:KeyboardEvent<HTMLDivElement>)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();flip();}};
 return <div className={`flip-card ${turned?'revealed':''} ${locked?'flipping':''}`} role={interactive?'button':undefined} tabIndex={interactive?0:undefined} aria-pressed={interactive?turned:undefined} aria-label={interactive?(turned?`${card.name} · ${card.koreanName}, 앞면 표시. 눌러서 뒤집기`:'선택한 카드 뒷면. 눌러서 뒤집기'):undefined} onClick={flip} onKeyDown={key}>
  <div className="flip-inner">
   <CardImage className="face back" src={back} alt={turned?'':'카드 뒷면'}/>
   <CardImage className="face front" src={card.imagePath} alt={turned?`${card.name} · ${card.koreanName}`:''}/>
  </div>
 </div>;
}
