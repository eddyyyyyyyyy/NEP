import {useEffect,useState} from 'react';
export default function Winner({raffle}){
 const [step,setStep]=useState(0);
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const complete=reduced||step>=42||!raffle.winner;
 useEffect(()=>{
  setStep(0);if(!raffle.winner||reduced)return;
  let timer,cancelled=false,n=0;
  const tick=()=>{if(cancelled)return;setStep(++n);if(n<42)timer=setTimeout(tick,n<28?75:100+(n-28)*22);};
  timer=setTimeout(tick,75);return()=>{cancelled=true;clearTimeout(timer);};
 },[raffle.PublicCode,raffle.winner?.TicketNumber,reduced]);
 const entries=raffle.entries||[];
 const name=complete?raffle.winner?.ParticipantAlias:entries[step%Math.max(1,entries.length)]?.ParticipantAlias;
 return <div className={`winner ${complete?'revealed':'spinning'}`}>
 <p>{complete?'RESULTADO DEL SORTEO':'REVELANDO AL GANADOR'}</p>
 <div className="roulette-window" aria-hidden={!complete}>
 {!complete&&<span className="roulette-neighbor">{entries[(step+entries.length-1)%Math.max(1,entries.length)]?.ParticipantAlias}</span>}
 <strong key={complete?'result':step}>{name||(raffle.Status==='Cancelado'?'Sorteo cancelado':'Sin participantes')}</strong>
 {!complete&&<span className="roulette-neighbor">{entries[(step+1)%Math.max(1,entries.length)]?.ParticipantAlias}</span>}
 </div>
 {complete&&raffle.winner&&<h3>Boleto ganador #{raffle.winner.TicketNumber}</h3>}
 <p className="muted">{raffle.Status==='Cancelado'?'Los pagos simulados se reembolsan automáticamente.':'El servidor seleccionó y registró el resultado. La animación solo lo revela, no cambia al ganador.'}</p>
 <span role="status" className="sr-only">{complete&&raffle.winner?`Ganó ${name}, boleto ${raffle.winner.TicketNumber}`:''}</span>
 </div>;
}
