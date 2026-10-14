import {Router} from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {getPool,sql} from './db.js';
import {sendMail} from './email.js';
import {closeRaffle,refreshAutomaticRaffles} from './routes/raffles.js';
const router=Router();
const sessions=new Map();
const resets=new Map();
router.post('/forgot',async(req,res,next)=>{try{if(!process.env.SMTP_HOST)return res.status(503).json({message:'La recuperación requiere configurar el servicio de correo SMTP.'});const email=String(req.body.email||'').trim().toLowerCase(),pool=await getPool();const user=(await pool.request().input('email',sql.NVarChar(150),email).query('SELECT Id FROM Users WHERE Email=@email')).recordset[0];if(user){const code=crypto.randomBytes(24).toString('hex');resets.set(code,{id:user.Id,expires:Date.now()+900000});await sendMail(email,'NEP: recuperar contraseña',`Tu código de recuperación es ${code}. Expira en 15 minutos. Si no solicitaste el cambio, ignora este mensaje.`);}res.json({message:'Si el correo tiene una cuenta, recibirá un código de recuperación.'});}catch(e){next(e);}});
router.post('/reset',async(req,res,next)=>{try{const reset=resets.get(req.body.code);if(!reset||reset.expires<Date.now()||String(req.body.password||'').length<8)return res.status(400).json({message:'Código inválido o contraseña menor de 8 caracteres.'});const pool=await getPool();await pool.request().input('id',sql.Int,reset.id).input('hash',sql.NVarChar(255),await bcrypt.hash(req.body.password,12)).query('UPDATE Users SET PasswordHash=@hash WHERE Id=@id');resets.delete(req.body.code);for(const [token,session] of sessions)if(session.user.Id===reset.id)sessions.delete(token);res.json({message:'Contraseña actualizada. Inicia sesión de nuevo.'});}catch(e){next(e);}});
export function requireUser(req,res,next){const token=req.headers.authorization?.replace(/^Bearer /,'');const session=sessions.get(token);if(!session||session.expires<Date.now())return res.status(401).json({message:'Inicia sesión para continuar.'});req.user=session.user;next();}
router.post('/register',async(req,res,next)=>{try{const {name,email,password,adult}=req.body;if(typeof name!=='string'||!name.trim()||name.length>150||!/^\S+@\S+\.\S+$/.test(email||'')||email.length>150||typeof password!=='string'||password.length<8||password.length>128||adult!==true)return res.status(400).json({message:'Completa tus datos, confirma ser mayor de edad y usa una contraseña de entre 8 y 128 caracteres.'});const pool=await getPool();const hash=await bcrypt.hash(password,12);await pool.request().input('name',sql.NVarChar(150),name.trim()).input('email',sql.NVarChar(150),email.trim().toLowerCase()).input('hash',sql.NVarChar(255),hash).query('INSERT INTO Users(FullName,Email,PasswordHash) VALUES(@name,@email,@hash)');res.status(201).json({message:'Cuenta creada. Ya puedes iniciar sesión.'});}catch(e){if(e.number===2627||e.number===2601)return res.status(409).json({message:'Este correo ya tiene una cuenta.'});next(e);}});
router.post('/login',async(req,res,next)=>{try{const pool=await getPool();const user=(await pool.request().input('email',sql.NVarChar(150),String(req.body.email||'').trim().toLowerCase()).query('SELECT * FROM Users WHERE Email=@email')).recordset[0];if(!user||!await bcrypt.compare(String(req.body.password||''),user.PasswordHash))return res.status(401).json({message:'Correo o contraseña incorrectos.'});delete user.PasswordHash;const token=crypto.randomBytes(32).toString('hex');sessions.set(token,{user,expires:Date.now()+86400000});res.json({token,user});}catch(e){next(e);}});
router.get('/me',requireUser,(req,res)=>res.json(req.user));
router.get('/raffles/:code/registrations',requireUser,async(req,res,next)=>{try{const pool=await getPool();const raffle=(await pool.request().input('code',sql.VarChar(20),req.params.code).input('user',sql.Int,req.user.Id).query('SELECT Id FROM Raffles WHERE PublicCode=@code AND OwnerId=@user')).recordset[0];if(!raffle)return res.status(403).json({message:'Este sorteo no pertenece a tu cuenta.'});const entries=await pool.request().input('id',sql.Int,raffle.Id).query('SELECT ParticipantName,Email,TicketCount,TotalAmount,Status,PaymentState,PaidAt FROM Registrations WHERE RaffleId=@id ORDER BY CreatedAt DESC');res.json(entries.recordset);}catch(e){next(e);}});
router.post('/claim',requireUser,async(req,res,next)=>{try{const pool=await getPool();const result=await pool.request().input('user',sql.Int,req.user.Id).input('code',sql.VarChar(20),req.body.code).input('key',sql.VarChar(20),req.body.key).query('UPDATE Raffles SET OwnerId=@user OUTPUT inserted.PublicCode WHERE PublicCode=@code AND ManageCode=@key AND OwnerId IS NULL');if(!result.recordset[0])return res.status(409).json({message:'Código incorrecto o sorteo ya asociado a una cuenta.'});res.json({message:'Sorteo asociado. Ya puedes administrarlo con tu cuenta.'});}catch(e){next(e);}});
router.get('/dashboard',requireUser,async(req,res,next)=>{try{await refreshAutomaticRaffles();const pool=await getPool();const raffles=(await pool.request().input('user',sql.Int,req.user.Id).query('SELECT Id,PublicCode,Name,Status,EndingMode,DrawDate,MaxTickets,SuspensionUsed,SuspendedAt,DATEADD(DAY,7,SuspendedAt) ResumeDeadline FROM Raffles WHERE OwnerId=@user ORDER BY CreatedAt DESC')).recordset;const purchases=(await pool.request().input('user',sql.Int,req.user.Id).query(`SELECT x.Id,x.Status,x.TotalAmount,x.PaidAt,x.TicketCount,x.TransactionReference,x.PaymentState,r.Name,r.PublicCode,r.Status RaffleStatus,r.SuspendedAt,DATEADD(DAY,7,r.SuspendedAt) ResumeDeadline,(SELECT STRING_AGG(CAST(t.TicketNumber AS VARCHAR(MAX)),', ') FROM Tickets t WHERE t.RegistrationId=x.Id) Tickets FROM Registrations x JOIN Raffles r ON r.Id=x.RaffleId WHERE x.UserId=@user ORDER BY x.CreatedAt DESC`)).recordset;res.json({raffles,purchases});}catch(e){next(e);}});
router.post('/raffles/:code/:action',requireUser,async(req,res,next)=>{
 try {
  await refreshAutomaticRaffles();
  const pool=await getPool();
  const r=(await pool.request().input('code',sql.VarChar(20),req.params.code).input('user',sql.Int,req.user.Id).query('SELECT Id,Status,SuspensionUsed FROM Raffles WHERE PublicCode=@code AND OwnerId=@user')).recordset[0];
  if(!r)return res.status(403).json({message:'Este sorteo no pertenece a tu cuenta.'});
  const action=req.params.action;
  if(action==='finish'){
   if(r.Status!=='Abierto')return res.status(409).json({message:'Solo puedes finalizar un sorteo abierto. Reanúdalo primero si está suspendido.'});
   const result=await closeRaffle(r.Id,true);
   if(!result)return res.status(409).json({message:'El sorteo ya no está abierto.'});
   await refreshAutomaticRaffles();
   return res.json({message:'Sorteo finalizado. El servidor seleccionó al ganador entre los boletos pagados.'});
  }
  let query,message;
  if(action==='suspend'){
   query="UPDATE Raffles SET Status='Suspendido',SuspendedAt=SYSUTCDATETIME(),SuspensionUsed=1 OUTPUT inserted.Id WHERE Id=@id AND Status='Abierto' AND SuspensionUsed=0";
   message='Ventas suspendidas por un máximo de siete días. Si no se reanuda, se cancelará y se reembolsarán los pagos simulados. Esta suspensión no puede repetirse.';
  }else if(action==='resume'){
   query="UPDATE Raffles SET Status='Abierto' OUTPUT inserted.Id WHERE Id=@id AND Status='Suspendido' AND SuspendedAt>DATEADD(DAY,-7,SYSUTCDATETIME())";
   message='Sorteo reanudado. Ya utilizaste la única suspensión permitida.';
  }else return res.status(400).json({message:'Operación desconocida.'});
  const out=await pool.request().input('id',sql.Int,r.Id).query(query);
  if(!out.recordset[0])return res.status(409).json({message:action==='suspend'?'Solo se permite una suspensión por rifa y debe estar abierta.':'No se puede reanudar: el plazo venció o la rifa no está suspendida.'});
  await refreshAutomaticRaffles();
  res.json({message});
 }catch(e){next(e);}
});
export default router;
