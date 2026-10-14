import {useEffect,useState,useRef} from 'react';
import * as api from './api';
export default function PrizeChat({user,refreshKey}){
 const [chats,setChats]=useState([]),[selected,setSelected]=useState(null),[messages,setMessages]=useState([]),[body,setBody]=useState(''),[notice,setNotice]=useState(''),[sending,setSending]=useState(false);
 const end=useRef(null);
 useEffect(()=>{let active=true;const load=()=>api.chats().then(rows=>{if(active)setChats(rows);}).catch(e=>{if(active)setNotice(e.message);});load();const timer=setInterval(load,5000);return()=>{active=false;clearInterval(timer);};},[refreshKey]);
 useEffect(()=>{setMessages([]);setBody('');if(!selected)return;let active=true;const load=()=>api.chatMessages(selected.Id).then(rows=>{if(active)setMessages(rows);}).catch(e=>{if(active)setNotice(e.message);});load();const timer=setInterval(load,3000);return()=>{active=false;clearInterval(timer);};},[selected?.Id]);
 useEffect(()=>{end.current?.scrollIntoView({block:'nearest'});},[messages.length]);
 return <section className="prize-chat"><h3>Chat para entregar el premio</h3><p>Privado entre el organizador y el ganador. No compartas contraseñas ni datos bancarios.</p>{notice&&<p role="status" className="warning">{notice}</p>}
 {!chats.length&&<p className="muted">El organizador puede habilitar el chat desde una rifa finalizada con ganador. Si ganaste, aparecerá aquí cuando lo abra.</p>}
 <div className="chat-list">{chats.map(c=><button className={selected?.Id===c.Id?'primary':'back'} key={c.Id} onClick={()=>setSelected(c)}>{c.Name} · {c.IsHost?'Ganador: '+c.WinnerName:'Organizador: '+c.OwnerName}</button>)}</div>
 {selected&&<div className="chat-panel"><h4>{selected.Name} · {selected.PublicCode}</h4>{selected.IsHost&&<p>Correo del ganador: <a href={'mailto:'+selected.WinnerEmail}>{selected.WinnerEmail}</a></p>}
 <div className="chat-messages" aria-label="Mensajes">{messages.map(m=><article className={m.SenderId===user.Id?'chat-message mine':'chat-message'} key={m.Id}><b>{m.SenderName}</b><p>{m.Body}</p><small>{new Date(m.CreatedAt).toLocaleString('es-DO')}</small></article>)}{!messages.length&&<p>Inicia la conversación para coordinar la entrega.</p>}<div ref={end}/></div>
 <form className="form" onSubmit={async e=>{e.preventDefault();if(sending)return;setSending(true);try{await api.sendChatMessage(selected.Id,body);setBody('');setMessages(await api.chatMessages(selected.Id));setNotice('');}catch(err){setNotice(err.message);}finally{setSending(false);}}}>
 <label>Mensaje<textarea required maxLength={2000} value={body} onChange={e=>setBody(e.target.value)} placeholder="Hola, coordinemos la entrega del premio…"/></label><button disabled={sending} className="primary">{sending?'Enviando…':'Enviar mensaje'}</button></form></div>}
 </section>;
}
