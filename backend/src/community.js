import {Router} from 'express';
import {getPool,sql} from './db.js';
import {requireUser} from './accounts.js';
const router=Router();
const validText=(v,max)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
const chatSelect=`SELECT c.Id,r.PublicCode,r.Name,r.OwnerId,x.UserId WinnerId,x.ParticipantName WinnerName,x.Email WinnerEmail,u.FullName OwnerName
 FROM PrizeChats c JOIN Raffles r ON r.Id=c.RaffleId
 JOIN Tickets t ON t.RaffleId=r.Id AND t.TicketNumber=r.WinnerTicketNumber
 JOIN Registrations x ON x.Id=t.RegistrationId JOIN Users u ON u.Id=r.OwnerId
 WHERE r.Status='Finalizado'`;
router.get('/testimonials',async(req,res,next)=>{try{
 const pool=await getPool();const rows=(await pool.request().query('SELECT TOP 50 t.Id,t.Body,t.CreatedAt,u.FullName FROM Testimonials t JOIN Users u ON u.Id=t.UserId ORDER BY t.CreatedAt DESC')).recordset;
 res.json(rows.map(({FullName,...r})=>({...r,Author:FullName.trim().split(/\s+/)[0]})));
}catch(e){next(e);}});
router.post('/testimonials',requireUser,async(req,res,next)=>{try{
 if(!validText(req.body.body,1000))return res.status(400).json({message:'Escribe un testimonio de 1 a 1000 caracteres.'});
 const pool=await getPool();const result=await pool.request().input('user',sql.Int,req.user.Id).input('body',sql.NVarChar(1000),req.body.body.trim()).query('SET XACT_ABORT ON; BEGIN TRANSACTION; IF NOT EXISTS(SELECT 1 FROM Testimonials WITH(UPDLOCK,HOLDLOCK) WHERE UserId=@user) INSERT INTO Testimonials(UserId,Body) OUTPUT inserted.Id VALUES(@user,@body); COMMIT TRANSACTION;');
 if(!result.recordset?.length)return res.status(409).json({message:'Ya publicaste un testimonio.'});
 res.status(201).json({message:'Testimonio publicado con tu primer nombre. Gracias por compartir tu experiencia.'});
}catch(e){if(e.number===2627||e.number===2601)return res.status(409).json({message:'Ya publicaste un testimonio.'});next(e);}});
router.get('/support',requireUser,async(req,res,next)=>{try{
 const pool=await getPool();res.json((await pool.request().input('user',sql.Int,req.user.Id).query('SELECT Id,Subject,Body,Status,CreatedAt FROM SupportRequests WHERE UserId=@user ORDER BY CreatedAt DESC')).recordset);
}catch(e){next(e);}});
router.post('/support',requireUser,async(req,res,next)=>{try{
 const {subject,body}=req.body;if(!validText(subject,150)||!validText(body,2000))return res.status(400).json({message:'Completa asunto (máximo 150) y mensaje (máximo 2000 caracteres).'});
 const pool=await getPool();const r=(await pool.request().input('user',sql.Int,req.user.Id).input('subject',sql.NVarChar(150),subject.trim()).input('body',sql.NVarChar(2000),body.trim()).query('INSERT INTO SupportRequests(UserId,Subject,Body) OUTPUT inserted.Id VALUES(@user,@subject,@body)')).recordset[0];
 res.status(201).json({message:'Solicitud registrada para soporte de NEP.',id:r.Id});
}catch(e){next(e);}});
router.get('/chats',requireUser,async(req,res,next)=>{try{
 const pool=await getPool();const rows=(await pool.request().input('user',sql.Int,req.user.Id).query(chatSelect+' AND (r.OwnerId=@user OR x.UserId=@user) ORDER BY c.CreatedAt DESC')).recordset;
 res.json(rows.map(({WinnerEmail,...r})=>({...r,IsHost:r.OwnerId===req.user.Id,...(r.OwnerId===req.user.Id?{WinnerEmail}:{})})));
}catch(e){next(e);}});
router.post('/chats/:code',requireUser,async(req,res,next)=>{try{
 const pool=await getPool();const r=(await pool.request().input('code',sql.VarChar(20),req.params.code).input('user',sql.Int,req.user.Id).query(`SELECT r.Id,x.UserId WinnerId FROM Raffles r
 JOIN Tickets t ON t.RaffleId=r.Id AND t.TicketNumber=r.WinnerTicketNumber JOIN Registrations x ON x.Id=t.RegistrationId
 WHERE r.PublicCode=@code AND r.OwnerId=@user AND r.Status='Finalizado'`)).recordset[0];
 if(!r)return res.status(403).json({message:'Solo el organizador puede abrir el chat de una rifa finalizada con ganador.'});
 if(!r.WinnerId)return res.status(409).json({message:'Este ganador antiguo no tiene cuenta asociada. Consulta su correo en los participantes de tu rifa.'});
 await pool.request().input('id',sql.Int,r.Id).query('SET XACT_ABORT ON; BEGIN TRANSACTION; IF NOT EXISTS(SELECT 1 FROM PrizeChats WITH(UPDLOCK,HOLDLOCK) WHERE RaffleId=@id) INSERT INTO PrizeChats(RaffleId) VALUES(@id); COMMIT TRANSACTION;');
 res.json({message:'Chat habilitado para ti y el ganador. Pueden coordinar la entrega del premio.'});
}catch(e){if(e.number===2627||e.number===2601)return res.json({message:'El chat ya está habilitado.'});next(e);}});
async function authorizedChat(req){
 const pool=await getPool();
 return (await pool.request().input('id',sql.Int,Number(req.params.id)).input('user',sql.Int,req.user.Id).query(chatSelect+' AND c.Id=@id AND (r.OwnerId=@user OR x.UserId=@user)')).recordset[0];
}
router.get('/chats/:id/messages',requireUser,async(req,res,next)=>{try{
 if(!Number.isInteger(Number(req.params.id))||!await authorizedChat(req))return res.status(403).json({message:'No tienes acceso a este chat.'});
 const pool=await getPool();res.json((await pool.request().input('id',sql.Int,Number(req.params.id)).query('SELECT TOP 200 m.Id,m.SenderId,m.Body,m.CreatedAt,u.FullName SenderName FROM PrizeMessages m JOIN Users u ON u.Id=m.SenderId WHERE m.ChatId=@id ORDER BY m.Id DESC')).recordset.reverse());
}catch(e){next(e);}});
router.post('/chats/:id/messages',requireUser,async(req,res,next)=>{try{
 if(!Number.isInteger(Number(req.params.id))||!await authorizedChat(req))return res.status(403).json({message:'No tienes acceso a este chat.'});
 if(!validText(req.body.body,2000))return res.status(400).json({message:'Escribe un mensaje de 1 a 2000 caracteres.'});
 const pool=await getPool();await pool.request().input('chat',sql.Int,Number(req.params.id)).input('user',sql.Int,req.user.Id).input('body',sql.NVarChar(2000),req.body.body.trim()).query('INSERT INTO PrizeMessages(ChatId,SenderId,Body) VALUES(@chat,@user,@body)');
 res.status(201).json({message:'Mensaje enviado.'});
}catch(e){next(e);}});
export default router;
