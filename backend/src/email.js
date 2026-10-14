import nodemailer from 'nodemailer';
export async function sendMail(to,subject,text){
 if(!process.env.SMTP_HOST||!process.env.SMTP_FROM)return false;
 const transport=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||587),secure:process.env.SMTP_SECURE==='true',auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASSWORD}});
 await transport.sendMail({from:process.env.SMTP_FROM,to,subject,text});return true;
}
