import { createClient } from '@supabase/supabase-js';
const url=import.meta.env.VITE_SUPABASE_URL;
const key=import.meta.env.VITE_SUPABASE_ANON_KEY;
export const configured=Boolean(url&&key&&!url.includes('YOUR_PROJECT'));
export const db=configured?createClient(url,key):null;
export async function rides({all=false}={}){
 if(db){let q=db.from('rides').select('*').order('ride_date',{ascending:true});if(!all)q=q.eq('status','published');const {data,error}=await q;if(error)throw error;return data;}
 const r=await fetch('/rides.json');if(!r.ok)throw new Error('Impossible de charger les sorties');return r.json();
}
export function formatDate(date){return new Intl.DateTimeFormat('fr-CA',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${date}T12:00:00Z`));}
export function dateParts(date){const d=new Date(`${date}T12:00:00Z`);return {day:new Intl.DateTimeFormat('fr-CA',{day:'2-digit',timeZone:'UTC'}).format(d),month:new Intl.DateTimeFormat('fr-CA',{month:'short',timeZone:'UTC'}).format(d).replace('.','').toUpperCase(),weekday:new Intl.DateTimeFormat('fr-CA',{weekday:'short',timeZone:'UTC'}).format(d).toUpperCase()};}
export function routeId(value){if(!value)return null;const s=String(value).trim();if(/^\d+$/.test(s))return s;try{const u=new URL(s);if(u.hostname==='ridewithgps.com'||u.hostname==='www.ridewithgps.com'){return u.searchParams.get('id')||u.pathname.match(/\/routes?\/(\d+)/)?.[1]||null;}}catch{}return null;}
export function rideUrl(ride){return `/sorties/${encodeURIComponent(ride.slug)}`;}
export function routeLink(ride){return ride.rwgps_route_id?`https://ridewithgps.com/routes/${encodeURIComponent(ride.rwgps_route_id)}`:null;}
export function routeEmbed(ride){return ride.rwgps_route_id?`https://ridewithgps.com/embeds?type=route&id=${encodeURIComponent(ride.rwgps_route_id)}&metricUnits=true&sampleGraph=true`:null;}
export function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function paceLabel(r){if(r.pace&&r.pace_2)return `2 groupes : ${r.pace} et ${r.pace_2}`;return r.pace||r.pace_2||null;}
export const RIDE_TYPES={route:'Route',gravel:'Gravel',hiver:'Hiver',fatbike:'Fatbike'};
export function typeTag(r,cls='type-tag'){const l=RIDE_TYPES[r.ride_type];return l?`<span class="${cls}">${l}</span>`:'';}
