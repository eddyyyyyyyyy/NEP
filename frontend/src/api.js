import axios from 'axios';
const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use(config=>{const token=sessionStorage.getItem('nepToken');if(token)config.headers.Authorization=`Bearer ${token}`;return config;});
export const accountRegister=form=>data(api.post('/account/register',form));
export const login=form=>data(api.post('/account/login',form));
export const dashboard=()=>data(api.get('/account/dashboard'));
export const raffleAction=(code,action)=>data(api.post(`/account/raffles/${code}/${action}`));
export const claim=form=>data(api.post('/account/claim',form));
export const organizerEntries=code=>data(api.get(`/account/raffles/${code}/registrations`));
export const forgot=email=>data(api.post('/account/forgot',{email}));
export const reset=form=>data(api.post('/account/reset',form));
const data = (call) => call.then(r => r.data).catch(e => { throw new Error(e.response?.data?.message || 'No pudimos conectar con el servidor.'); });
export const listRaffles = (search = '') => data(api.get('/raffles', { params: { search } }));
export const getRaffle = (code) => data(api.get(`/raffles/${code}`));
export const createRaffle = (form) => data(api.post('/raffles', form));
export const register = (code, form) => data(api.post(`/raffles/${code}/register`, form));
export const pay = (id, form) => data(api.post(`/raffles/registrations/${id}/pay`, form));
export const getManage = (code, key) => data(api.get(`/raffles/${code}/manage/${key}`));
export const draw = (code, key) => data(api.post(`/raffles/${code}/manage/${key}/draw`));


export const testimonials=()=>data(api.get('/community/testimonials'));
export const postTestimonial=body=>data(api.post('/community/testimonials',{body}));
export const supportRequests=()=>data(api.get('/community/support'));
export const sendSupport=form=>data(api.post('/community/support',form));
export const chats=()=>data(api.get('/community/chats'));
export const openChat=code=>data(api.post('/community/chats/'+code));
export const chatMessages=id=>data(api.get('/community/chats/'+id+'/messages'));
export const sendChatMessage=(id,body)=>data(api.post('/community/chats/'+id+'/messages',{body}));
