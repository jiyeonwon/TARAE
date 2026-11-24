import {StrictMode,Component,type ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './styles.css';
class Boundary extends Component<{children:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true};}render(){return this.state.failed?<main className="fatal"><h1>화면을 불러오지 못했어요.</h1><p>저장된 리딩 기록은 유지돼요. 진행 중인 리딩만 초기화하고 다시 시작할 수 있어요.</p><button className="button" onClick={()=>{localStorage.removeItem('tarae.session.v1');location.reload();}}>다시 시작하기</button></main>:this.props.children;}}
createRoot(document.getElementById('root')!).render(<StrictMode><Boundary><App/></Boundary></StrictMode>);
