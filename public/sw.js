if(!self.define){let e,s={};const n=(n,i)=>(n=new URL(n+".js",i).href,s[n]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=n,e.onload=s,document.head.appendChild(e)}else e=n,importScripts(n),s()})).then((()=>{let e=s[n];if(!e)throw new Error(`Module ${n} didn’t register its module`);return e})));self.define=(i,a)=>{const r=e||("document"in self?document.currentScript.src:"")||location.href;if(s[r])return;let t={};const c=e=>n(e,r),o={module:{uri:r},exports:t,require:c};s[r]=Promise.all(i.map((e=>o[e]||c(e)))).then((e=>(a(...e),t)))}}define(["./workbox-1846d813"],(function(e){"use strict";importScripts("fallback-wN_RPMsQG0CtmjtXTdb1V.js"),self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"/_next/static/chunks/651.243d23442247d286.js",revision:"wN_RPMsQG0CtmjtXTdb1V"},{url:"/_next/static/chunks/framework-91d7f78b5b4003c8.js",revision:"wN_RPMsQG0CtmjtXTdb1V"},{url:"/_next/static/chunks/main-8b3a18d5f6d56ed4.js",revision:"wN_RPMsQG0CtmjtXTdb1V"},{url:"/_next/static/chunks/pages/_app-b80b11f06bd61920.js",revision:"wN_RPMsQG0CtmjtXTdb1V"},{url:"/_next/static/chunks/pages/_error-8022dacb1937fc7a.js",revision:"wN_RPMsQG0CtmjtXTdb1V"},{url:"/_next/static/chunks/pages/_offline-6474516c06a240fa.js",revision:"wN_RPMsQG0CtmjtXTdb1V"},{url:"/_next/static/chunks/pages/index-18d207e4dbdbe601.js",revision:"wN_RPMsQG0CtmjtXTdb1V"},{url:"/_next/static/chunks/polyfills-5cd94c89d3acac5f.js",revision:"wN_RPMsQG0CtmjtXTdb1V"},{url:"/_next/static/chunks/webpack-89bdf9296782bbd1.js",revision:"wN_RPMsQG0CtmjtXTdb1V"},{url:"/_next/static/css/7e061b1b001cf772.css",revision:"wN_RPMsQG0CtmjtXTdb1V"},{url:"/_next/static/wN_RPMsQG0CtmjtXTdb1V/_buildManifest.js",revision:"wN_RPMsQG0CtmjtXTdb1V"},{url:"/_next/static/wN_RPMsQG0CtmjtXTdb1V/_middlewareManifest.js",revision:"wN_RPMsQG0CtmjtXTdb1V"},{url:"/_next/static/wN_RPMsQG0CtmjtXTdb1V/_ssgManifest.js",revision:"wN_RPMsQG0CtmjtXTdb1V"},{url:"/_offline",revision:"wN_RPMsQG0CtmjtXTdb1V"},{url:"/favicon.ico",revision:"1d488127a515d20f656ba320fa75a097"},{url:"/icons/icon-insulina-ui-192.png",revision:"95360f02b0c2f6ab9f359dffb8745415"},{url:"/icons/icon-insulina-ui-256.png",revision:"10cbf614c2e5816ee4fa9b63fc60d050"},{url:"/icons/icon-insulina-ui-384.png",revision:"410ac07cae40ee9de1dfbc5a98218600"},{url:"/icons/icon-insulina-ui-512.png",revision:"2bd34ba160b625eb9561c28e9a9eee99"},{url:"/icons/icon-insulina-ui.png",revision:"9a1768ee479b7b22481792c77f4413b3"},{url:"/icons/icon-insulina-ui.svg",revision:"510120ecd3788f8070881630628030f5"},{url:"/logo/logo-insulina-ui.jpg",revision:"47a326d80617678185660b127abc34b6"},{url:"/logo/logo-insulina-ui.png",revision:"37baff8409e2c8cf56fc3325fca394e9"},{url:"/logo/logo-insulina-ui.svg",revision:"c5312dd013f785edd041ff38bf488f08"},{url:"/logo/square/square-logo-insulina-ui-192.png",revision:"aae647e88ba1f75f9e5f6c0dae8353c6"},{url:"/logo/square/square-logo-insulina-ui-512.png",revision:"8dfb1b29d9daa2c48552e8be560b275d"},{url:"/logo/square/square-logo-insulina-ui.png",revision:"5c4a37274a6930a26937439b934252ef"},{url:"/logo/square/square-logo-insulina-ui.svg",revision:"052634b43c7de3d79d0975bfc1044adc"},{url:"/manifest.json",revision:"2abf9206a76e3d5d4eb249c37c9a360a"},{url:"/manifest.webmanifest",revision:"2abf9206a76e3d5d4eb249c37c9a360a"},{url:"/screenshots/home.png",revision:"ee853f558e84525db90dc6eeeb97ff14"}],{ignoreURLParametersMatching:[]}),e.cleanupOutdatedCaches(),e.registerRoute("/",new e.NetworkFirst({cacheName:"start-url",plugins:[{cacheWillUpdate:async({request:e,response:s,event:n,state:i})=>s&&"opaqueredirect"===s.type?new Response(s.body,{status:200,statusText:"OK",headers:s.headers}):s},{handlerDidError:async({request:e})=>self.fallback(e)}]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,new e.CacheFirst({cacheName:"google-fonts-webfonts",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:31536e3}),{handlerDidError:async({request:e})=>self.fallback(e)}]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,new e.StaleWhileRevalidate({cacheName:"google-fonts-stylesheets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800}),{handlerDidError:async({request:e})=>self.fallback(e)}]}),"GET"),e.registerRoute(/\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,new e.StaleWhileRevalidate({cacheName:"static-font-assets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800}),{handlerDidError:async({request:e})=>self.fallback(e)}]}),"GET"),e.registerRoute(/\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,new e.StaleWhileRevalidate({cacheName:"static-image-assets",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400}),{handlerDidError:async({request:e})=>self.fallback(e)}]}),"GET"),e.registerRoute(/\/_next\/image\?url=.+$/i,new e.StaleWhileRevalidate({cacheName:"next-image",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400}),{handlerDidError:async({request:e})=>self.fallback(e)}]}),"GET"),e.registerRoute(/\.(?:mp3|wav|ogg)$/i,new e.CacheFirst({cacheName:"static-audio-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400}),{handlerDidError:async({request:e})=>self.fallback(e)}]}),"GET"),e.registerRoute(/\.(?:mp4)$/i,new e.CacheFirst({cacheName:"static-video-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400}),{handlerDidError:async({request:e})=>self.fallback(e)}]}),"GET"),e.registerRoute(/\.(?:js)$/i,new e.StaleWhileRevalidate({cacheName:"static-js-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400}),{handlerDidError:async({request:e})=>self.fallback(e)}]}),"GET"),e.registerRoute(/\.(?:css|less)$/i,new e.StaleWhileRevalidate({cacheName:"static-style-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400}),{handlerDidError:async({request:e})=>self.fallback(e)}]}),"GET"),e.registerRoute(/\/_next\/data\/.+\/.+\.json$/i,new e.StaleWhileRevalidate({cacheName:"next-data",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400}),{handlerDidError:async({request:e})=>self.fallback(e)}]}),"GET"),e.registerRoute(/\.(?:json|xml|csv)$/i,new e.NetworkFirst({cacheName:"static-data-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400}),{handlerDidError:async({request:e})=>self.fallback(e)}]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;const s=e.pathname;return!s.startsWith("/api/auth/")&&!!s.startsWith("/api/")}),new e.NetworkFirst({cacheName:"apis",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:16,maxAgeSeconds:86400}),{handlerDidError:async({request:e})=>self.fallback(e)}]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;return!e.pathname.startsWith("/api/")}),new e.NetworkFirst({cacheName:"others",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400}),{handlerDidError:async({request:e})=>self.fallback(e)}]}),"GET"),e.registerRoute((({url:e})=>!(self.origin===e.origin)),new e.NetworkFirst({cacheName:"cross-origin",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:3600}),{handlerDidError:async({request:e})=>self.fallback(e)}]}),"GET")}));
