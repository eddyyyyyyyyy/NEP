import {useEffect,useState} from 'react';
export default function SuspensionCountdown({deadline}){
 const [now,setNow]=useState(Date.now());
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
 const seconds=Math.max(0,Math.floor((new Date(deadline).getTime()-now)/1000));
 const days=Math.floor(seconds/86400),hours=Math.floor(seconds%86400/3600),minutes=Math.floor(seconds%3600/60);
 const pad=n=>String(n).padStart(2,'0');
 return <aside className="suspension-countdown"><b>Ventas suspendidas · suspensión única</b>
 {deadline?<><strong>{days}d {pad(hours)}h {pad(minutes)}m {pad(seconds%60)}s</strong><small>Fecha límite: {new Date(deadline).toLocaleString('es-DO')}</small></>:<p>Consultando el plazo de reanudación…</p>}
 <p>{seconds>0?'El organizador tiene este plazo para reanudar. Si no lo hace, la rifa se cancela y todos los pagos se reembolsan automáticamente (simulado).':'Plazo vencido: se está actualizando la cancelación y el reembolso simulado.'}</p>
 <small>Mientras tanto, el dinero simulado permanece retenido y no se permiten compras.</small></aside>;
}
