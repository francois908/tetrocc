import {defineConfig} from 'vite';
import {resolve} from 'node:path';
// Reproduit en local les réécritures de vercel.json (/admin et /sorties/:slug)
const rewrites=()=>{const mw=(req,_res,next)=>{const [path,qs]=req.url.split('?');if(path==='/admin')req.url='/admin.html'+(qs?'?'+qs:'');else{const m=path.match(/^\/sorties\/([a-z0-9-]+)\/?$/);if(m)req.url='/sortie.html?slug='+m[1];}next();};return {name:'tetro-rewrites',configureServer(s){s.middlewares.use(mw);},configurePreviewServer(s){s.middlewares.use(mw);}};};
export default defineConfig({plugins:[rewrites()],build:{rollupOptions:{input:{main:resolve(import.meta.dirname,'index.html'),admin:resolve(import.meta.dirname,'admin.html'),sortie:resolve(import.meta.dirname,'sortie.html')}}}});
