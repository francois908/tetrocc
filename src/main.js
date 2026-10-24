import './site.css';
import {rides,paceLabel,db,dateParts,escapeHtml,rideUrl} from './data.js';
document.querySelector('#year').textContent=new Date().getFullYear();
const toggle=document.querySelector('.menu-toggle'),nav=document.querySelector('.nav');toggle.onclick=()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));};nav.querySelectorAll('a').forEach(a=>a.onclick=()=>nav.classList.remove('open'));
// Parallaxe du hero : l'image descend plus lentement que la page
const heroImg=document.querySelector('.hero-image'),hero=document.querySelector('.hero');
if(heroImg&&matchMedia('(min-width: 768px) and (hover: hover) and (prefers-reduced-motion: no-preference)').matches){let ticking=false;const move=()=>{const h=hero.offsetHeight,y=Math.min(window.scrollY,h);heroImg.style.transform=`translate3d(0,${Math.min(y*0.35,h*0.28)}px,0)`;ticking=false;};addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(move);}},{passive:true});move();}
const today=new Date().toLocaleDateString('en-CA',{timeZone:'America/Toronto'});
try{
 const all=await rides();const future=all.filter(r=>r.ride_date>=today&&r.status==='published').slice(0,3);
 const shown=future.length?future:all.filter(r=>r.status==='published').slice(-3).reverse();
 if(!future.length)document.querySelector('#ride-message').textContent='Aucune sortie à venir annoncée pour le moment. Voici les dernières sorties publiées.';
 document.querySelector('#ride-grid').innerHTML=shown.length?shown.map(r=>{const d=dateParts(r.ride_date);return `<article class="ride-card"><a href="${rideUrl(r)}"><div class="ride-img"><img src="${escapeHtml(r.image_url||'/assets/club-groupe.jpg')}" alt="Sortie ${escapeHtml(r.title)}" loading="lazy"><div class="date"><small>${d.weekday}</small><strong>${d.day}</strong><em>${d.month}</em></div></div><h3>${escapeHtml(r.title)}</h3></a><p>${escapeHtml([r.start_time?`${r.start_time.slice(0,5).replace(':',' h ')}`:null,r.distance_km?`${r.distance_km} km`:null,paceLabel(r)].filter(Boolean).join(' · ')||'Détails à confirmer')}</p><a class="card-link" href="${rideUrl(r)}">Voir le parcours →</a></article>`;}).join(''):'<p>Les prochaines sorties seront annoncées ici.</p>';
}catch(e){document.querySelector('#ride-grid').innerHTML='<p>Les sorties ne sont pas disponibles pour le moment.</p>';console.error(e);}

const staticGallery=[['/assets/club-groupe.jpg','Le groupe devant le M café'],['/assets/pause-route.jpg','Pause sur la route'],['/assets/peloton.jpg','En peloton dans le quartier'],['/assets/quartier.jpg','Dans le quartier']];
document.querySelector('#public-gallery').innerHTML=staticGallery.map(([u,c])=>`<figure><img loading="lazy" src="${u}" alt="${c}"></figure>`).join('');
if(db){try{const {data:photos}=await db.from('photos').select('image_url,caption').order('created_at',{ascending:false}).limit(9);if(photos?.length)document.querySelector('#public-gallery').innerHTML=photos.map(p=>`<figure><img loading="lazy" src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.caption||'Photo du club')}"><figcaption>${escapeHtml(p.caption||'')}</figcaption></figure>`).join('');const {data:settings}=await db.from('site_settings').select('contact_email,about_text').eq('id',1).maybeSingle();if(settings?.about_text)document.querySelector('.intro-copy p').textContent=settings.about_text;if(settings?.contact_email){const email=settings.contact_email;document.querySelectorAll('a[href^="mailto:"]').forEach(a=>{const subject=a.href.split('?')[1]||'';a.href=`mailto:${encodeURIComponent(email)}${subject?'?'+subject:''}`;});}}catch(e){console.warn('Photos ou réglages indisponibles',e);}}

const qf=document.querySelector('#question-form');
if(qf){const fb=document.querySelector('#question-feedback');qf.onsubmit=async e=>{e.preventDefault();const f=new FormData(qf);
 if(f.get('website'))return;
 const row={name:String(f.get('name')||'').trim(),email:String(f.get('email')||'').trim(),message:String(f.get('message')||'').trim()};
 if(!row.name||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(row.email)||row.message.length<5){fb.textContent='Il manque une info : ton prénom, un courriel valide et ta question.';return;}
 if(!db){fb.textContent='Le formulaire n’est pas disponible pour le moment.';return;}
 const btn=qf.querySelector('button');btn.disabled=true;fb.textContent='Envoi…';
 const {error}=await db.from('questions').insert(row);btn.disabled=false;
 if(error){fb.textContent='Oups, l’envoi n’a pas fonctionné. Réessaie dans un instant.';console.error(error);return;}
 qf.reset();fb.textContent='Merci ! Ta question est envoyée. On te répond par courriel.';};}

// Titre qui « s'écrit » au défilement
const sw=document.querySelector('.scroll-write');
if(sw&&!matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('js-write');const ws=[...sw.querySelectorAll('.w')];let t=false;
 const upd=()=>{const r=sw.getBoundingClientRect(),vh=innerHeight,start=vh*.9,end=vh*.45;const p=Math.min(1,Math.max(0,(start-r.top)/(start-end)));
  ws.forEach((w,i)=>{const a=Math.min(1,Math.max(0,p*ws.length-i));w.style.setProperty('--o',(.12+.88*a).toFixed(3));});t=false;};
 addEventListener('scroll',()=>{if(!t){t=true;requestAnimationFrame(upd);}},{passive:true});addEventListener('resize',upd);upd();}

// Galerie plein écran (collage + « En images »)
const lb=document.createElement('div');lb.className='lb';lb.hidden=true;lb.setAttribute('role','dialog');lb.setAttribute('aria-modal','true');lb.setAttribute('aria-label','Galerie photo');
lb.innerHTML='<button class="lb-btn lb-close" aria-label="Fermer">✕</button><button class="lb-btn lb-prev" aria-label="Photo précédente">←</button><figure class="lb-fig"><img alt=""><figcaption><span class="lb-cap"></span><span class="lb-count"></span></figcaption></figure><button class="lb-btn lb-next" aria-label="Photo suivante">→</button>';
document.body.append(lb);
const lbImg=lb.querySelector('img'),lbCap=lb.querySelector('.lb-cap'),lbCount=lb.querySelector('.lb-count');let lbList=[],lbI=0,lbBack=null;
const pics=()=>[...document.querySelectorAll('.collage img, #public-gallery img')];
const lbShow=i=>{lbI=(i+lbList.length)%lbList.length;const im=lbList[lbI];lbImg.src=im.currentSrc||im.src;lbImg.alt=im.alt||'';lbCap.textContent=im.closest('figure')?.querySelector('figcaption')?.textContent?.trim()||im.alt||'';lbCount.textContent=`${lbI+1} / ${lbList.length}`;};
const lbOpen=img=>{lbList=pics();lbBack=document.activeElement;lbShow(lbList.indexOf(img));lb.hidden=false;document.documentElement.classList.add('lb-open');lb.querySelector('.lb-close').focus();};
const lbClose=()=>{lb.hidden=true;document.documentElement.classList.remove('lb-open');lbBack?.focus?.();};
lb.querySelector('.lb-close').onclick=lbClose;lb.querySelector('.lb-prev').onclick=()=>lbShow(lbI-1);lb.querySelector('.lb-next').onclick=()=>lbShow(lbI+1);
lb.addEventListener('click',e=>{if(e.target===lb||e.target.classList.contains('lb-fig'))lbClose();});
addEventListener('keydown',e=>{if(lb.hidden)return;if(e.key==='Escape')lbClose();else if(e.key==='ArrowLeft')lbShow(lbI-1);else if(e.key==='ArrowRight')lbShow(lbI+1);else if(e.key==='Tab'){const f=[...lb.querySelectorAll('button')];const k=f.indexOf(document.activeElement);e.preventDefault();f[(k+(e.shiftKey?-1:1)+f.length)%f.length].focus();}});
let tx=null;lb.addEventListener('touchstart',e=>{tx=e.touches[0].clientX;},{passive:true});lb.addEventListener('touchend',e=>{if(tx===null)return;const dx=e.changedTouches[0].clientX-tx;if(Math.abs(dx)>45)lbShow(lbI+(dx<0?1:-1));tx=null;});
const armPics=()=>pics().forEach(im=>{if(im.dataset.lb)return;im.dataset.lb='1';im.tabIndex=0;im.setAttribute('role','button');im.setAttribute('aria-label',`Agrandir : ${im.alt||'photo'}`);});
document.addEventListener('click',e=>{const im=e.target.closest('.collage img, #public-gallery img');if(im)lbOpen(im);});
document.addEventListener('keydown',e=>{const im=e.target.closest?.('.collage img, #public-gallery img');if(im&&(e.key==='Enter'||e.key===' ')){e.preventDefault();lbOpen(im);}});
armPics();new MutationObserver(armPics).observe(document.querySelector('#public-gallery'),{childList:true,subtree:true});
