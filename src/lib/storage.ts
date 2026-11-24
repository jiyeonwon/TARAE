import {cards} from '../data/readings';
import {DRAW_COUNT,freshDeck,type DeckState} from './deck';

export interface Session {screen:string;question:string;deck:DeckState;unlocked:number;guide:number;readerNote:string;questionerNote:string;id:string}
export interface SavedCard {cardId:string;order:number;position:'past'|'present'|'future'}
export interface SavedReading {id:string;date:string;question:string;cards:SavedCard[];readerNote:string;questionerNote:string;unlocked:number}

export const newSession=():Session=>({screen:'splash',question:'',deck:freshDeck(),unlocked:0,guide:0,readerNote:'',questionerNote:'',id:crypto.randomUUID()});
const validId=(id:unknown)=>cards.some(c=>c.id===id);
const screens=['splash','roles','question','camera','ritual','handoff','first','guide','reflect','complete'];
const positions=['past','present','future'] as const;

export function validSession(s:unknown):s is Session{
 if(!s||typeof s!=='object')return false;
 const v=s as Session;const selected=v.deck?.selected;
 const selectedValid=Array.isArray(selected)&&selected.length<=DRAW_COUNT&&new Set(selected).size===selected.length&&selected.every(validId);
 const expectedDeckLength=22-(selectedValid?selected.length:0);
 const phaseValid=selectedValid&&(v.deck.phase==='DRAWN'?selected.length===DRAW_COUNT:selected.length<DRAW_COUNT);
 return screens.includes(v.screen)&&typeof v.question==='string'&&v.question.length<=300&&typeof v.readerNote==='string'&&typeof v.questionerNote==='string'&&typeof v.id==='string'&&Number.isInteger(v.unlocked)&&v.unlocked>=0&&v.unlocked<=3&&Number.isInteger(v.guide)&&v.guide>=0&&v.guide<=v.unlocked&&!!v.deck&&['IDLE','SHUFFLING','SPREADING','SELECTING','DRAWN'].includes(v.deck.phase)&&Array.isArray(v.deck.deck)&&new Set(v.deck.deck).size===v.deck.deck.length&&v.deck.deck.every(validId)&&v.deck.deck.length===expectedDeckLength&&selectedValid&&phaseValid&&selected.every(id=>!v.deck.deck.includes(id))&&Number.isFinite(v.deck.progress)&&v.deck.progress>=0&&v.deck.progress<=1&&Number.isInteger(v.deck.shuffles)&&v.deck.shuffles>=0&&(!['handoff','first','guide','reflect','complete'].includes(v.screen)||selected.length===DRAW_COUNT)&&(!['camera','ritual','handoff','first','guide','reflect','complete'].includes(v.screen)||!!v.question.trim());
}

export function restoreSession():Session{try{const s=JSON.parse(localStorage.getItem('tarae.session.v1')||'null');return validSession(s)?s:newSession();}catch{return newSession();}}

function normalizeRecord(v:any):SavedReading|null{
 if(!v||typeof v.id!=='string'||typeof v.date!=='string'||Number.isNaN(Date.parse(v.date))||typeof v.question!=='string'||typeof v.readerNote!=='string'||typeof v.questionerNote!=='string')return null;
 const legacy=validId(v.cardId)?[{cardId:v.cardId,order:1,position:'present' as const}]:null;
 const saved=Array.isArray(v.cards)?v.cards:legacy;
 if(!saved||!saved.length||saved.length>DRAW_COUNT||saved.some((c:any,i:number)=>!c||!validId(c.cardId)||c.order!==i+1||!positions.includes(c.position)))return null;
 return {id:v.id,date:v.date,question:v.question,cards:saved,readerNote:v.readerNote,questionerNote:v.questionerNote,unlocked:Number.isInteger(v.unlocked)?v.unlocked:0};
}

export function readHistory():SavedReading[]{try{const a=JSON.parse(localStorage.getItem('tarae.history.v1')||'[]');return Array.isArray(a)?a.map(normalizeRecord).filter((v):v is SavedReading=>!!v):[];}catch{return [];}}

export function saveReading(s:Session){
 if(s.deck.selected.length!==DRAW_COUNT)throw new Error('세 장의 카드를 모두 선택해주세요.');
 const record:SavedReading={id:s.id,date:new Date().toISOString(),question:s.question,cards:s.deck.selected.map((cardId,i)=>({cardId,order:i+1,position:positions[i]})),readerNote:s.readerNote,questionerNote:s.questionerNote,unlocked:s.unlocked};
 const list=readHistory();localStorage.setItem('tarae.history.v1',JSON.stringify([record,...list.filter(r=>r.id!==s.id)].slice(0,100)));return record;
}
