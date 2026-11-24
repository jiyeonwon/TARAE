import {useCallback,useEffect,useRef,useState} from 'react';
import type {HandLandmarker,HandLandmarkerResult} from '@mediapipe/tasks-vision';
export function useCamera(onFrame:(result:HandLandmarkerResult,time:number)=>void){
 const video=useRef<HTMLVideoElement>(null);const canvas=useRef<HTMLCanvasElement>(null);const stream=useRef<MediaStream|null>(null);const model=useRef<HandLandmarker|null>(null);const generation=useRef(0);const raf=useRef(0);const callback=useRef(onFrame);callback.current=onFrame;
 const [status,setStatus]=useState('카메라가 꺼져 있어요');const [active,setActive]=useState(false);const [loading,setLoading]=useState(false);const [error,setError]=useState('');
 const stop=useCallback(()=>{generation.current++;cancelAnimationFrame(raf.current);stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;model.current?.close();model.current=null;if(video.current)video.current.srcObject=null;setActive(false);setLoading(false);setError('');setStatus('카메라가 꺼져 있어요');},[]);
 const start=useCallback(async()=>{
  stop();const gen=generation.current;setError('');setLoading(true);setStatus('카메라 권한을 기다리고 있어요');
  let acquired:MediaStream|null=null;let detector:HandLandmarker|null=null;
  try{
   if(!navigator.mediaDevices?.getUserMedia)throw new Error('이 환경에서는 카메라를 사용할 수 없어요. localhost 또는 HTTPS에서 열어주세요.');
   acquired=await navigator.mediaDevices.getUserMedia({video:{width:640,height:480,facingMode:'user'},audio:false});
   if(gen!==generation.current){acquired.getTracks().forEach(t=>t.stop());return;}
   stream.current=acquired;setStatus('손 인식 모델을 불러오고 있어요');
   const {FilesetResolver,HandLandmarker}=await import('@mediapipe/tasks-vision');
   const files=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm');
   detector=await HandLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',delegate:'CPU'},runningMode:'VIDEO',numHands:2,minHandDetectionConfidence:.65,minHandPresenceConfidence:.65,minTrackingConfidence:.65});
   if(gen!==generation.current){detector.close();acquired.getTracks().forEach(t=>t.stop());return;}
   model.current=detector;const el=video.current;if(!el)throw new Error('카메라 미리보기를 연결하지 못했어요. 다시 시도해주세요.');el.srcObject=acquired;await el.play();
   if(gen!==generation.current)return;
   acquired.getVideoTracks()[0].addEventListener('ended',()=>{if(gen===generation.current){stop();setError('카메라 연결이 끊겼어요. 연결 후 다시 시도해주세요.');}});
   setLoading(false);setActive(true);let lastTime=-1;let lastInference=0;
   const loop=(now:number)=>{if(gen!==generation.current)return;const el=video.current;if(!el){raf.current=requestAnimationFrame(loop);return;}try{if(el.readyState>=2&&el.currentTime!==lastTime&&now-lastInference>=50){lastTime=el.currentTime;lastInference=now;const result=detector!.detectForVideo(el,now);callback.current(result,now);setStatus(result.landmarks.length?`손 ${result.landmarks.length}개 인식 중`:'손을 카메라에 비춰주세요');const ctx=canvas.current?.getContext('2d');if(ctx&&canvas.current){ctx.clearRect(0,0,640,480);for(const hand of result.landmarks)for(const p of hand){ctx.fillStyle='#C7A66B';ctx.beginPath();ctx.arc((1-p.x)*640,p.y*480,4,0,Math.PI*2);ctx.fill();}}}raf.current=requestAnimationFrame(loop);}catch{stop();setError('손 인식을 계속할 수 없어요. 카메라를 다시 연결하거나 마우스로 진행해주세요.');}};
   raf.current=requestAnimationFrame(loop);
  }catch(e){acquired?.getTracks().forEach(t=>t.stop());detector?.close();if(gen!==generation.current)return;model.current=null;stream.current=null;setLoading(false);setActive(false);const name=(e as Error).name;setError(name==='NotAllowedError'?'카메라 권한이 거부되었어요. 주소창의 권한 설정을 변경한 뒤 다시 시도해주세요.':name==='NotFoundError'?'연결된 카메라가 없어요. 마우스 모드로도 끝까지 진행할 수 있어요.':name==='NotReadableError'?'다른 앱에서 카메라를 사용 중일 수 있어요. 해당 앱을 닫고 다시 시도해주세요.':`모델 또는 카메라를 불러오지 못했어요. ${(e as Error).message}`);setStatus('카메라 연결 실패');}
 },[stop]);
 useEffect(()=>{const el=video.current;if(el&&stream.current&&el.srcObject!==stream.current){el.srcObject=stream.current;void el.play().catch(()=>{});}});
 useEffect(()=>()=>{generation.current++;cancelAnimationFrame(raf.current);stream.current?.getTracks().forEach(t=>t.stop());model.current?.close();},[]);
 return {video,canvas,status,active,loading,error,start,stop};
}
