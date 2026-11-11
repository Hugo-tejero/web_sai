(function(){
'use strict';
var $=function(s,r){return (r||document).querySelector(s)};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var TAU=Math.PI*2;
var fmt=function(n,d){return n.toLocaleString('es-ES',{maximumFractionDigits:d==null?0:d})};
var RM=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function chips(host,items,cur,on){
  host.innerHTML=items.map(function(i){return '<button type="button" class="chip" data-k="'+i.k+'" aria-pressed="'+(i.k===cur)+'">'+i.t+'</button>'}).join('');
  host.onclick=function(e){var b=e.target.closest('[data-k]');if(b&&host.contains(b))on(b.getAttribute('data-k'))};
}
function bigchips(host,items,cur,on){
  host.innerHTML=items.map(function(i){return '<button type="button" class="bt" data-k="'+i.k+'" aria-pressed="'+(i.k===cur)+'"><b>'+i.t+'</b><span>'+i.s+'</span></button>'}).join('');
  host.onclick=function(e){var b=e.target.closest('[data-k]');if(b&&host.contains(b))on(b.getAttribute('data-k'))};
}
function setPressed(host,k){$$('[data-k]',host).forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-k')===k)})}
function src(p){return '<span class="src">p. '+p+'</span>'}

/* Onda del encabezado */
(function(){
  var d='';
  for(var x=0;x<=1000;x+=4){d+=(x?'L':'M')+x+' '+(42-28*Math.sin(TAU*4*x/1000)).toFixed(1)}
  $('#heroPath').setAttribute('d',d);
})();

/* 1. Problemas de la red */
var PROB=[
  {id:'brown',short:'Brown-out',name:'Tensión insuficiente (brown-out)',p:2,zone:[220,440],
   q:'La tensión baja unos instantes.',c:'El arranque de motores, compresores, ascensores y montacargas.',e:'El equipo se cae y se pierden o se dañan datos.',
   kf:['87 %','de los problemas de alimentación, según la guía'],
   que:'Una bajada de tensión de breve duración. Es el problema de alimentación más común: el 87 % según la guía.',
   causa:'Que se pongan en marcha motores, compresores, ascensores o montacargas.',
   efecto:'El ordenador no recibe la potencia que necesita: el teclado deja de responder o el sistema se cae, y se pierden o se dañan los datos que se estaban procesando.'},
  {id:'apagon',short:'Apagón',name:'Apagón eléctrico (blackout)',p:2,zone:[220,520],
   q:'No llega nada de corriente.',c:'Mucha demanda, temporales, hielo en las líneas, obras o accidentes.',e:'Se pierden datos y comunicaciones, se para la producción y puede haber peligro para las personas.',
   que:'La ausencia total de alimentación.',
   causa:'Demanda excesiva de energía, temporales, hielo en las líneas, accidentes de tráfico, excavaciones o terremotos.',
   efecto:'Pérdida de datos, comunicaciones cortadas, falta de iluminación, líneas de producción bloqueadas, actividad parada y peligro para las personas.'},
  {id:'spike',short:'Spike',name:'Spike (transitorio de tensión)',p:3,zone:[316,344],
   q:'La tensión da un pico repentino.',c:'Sobre todo los rayos. También al volver la red tras un apagón.',e:'Puede destruir componentes y hacer perder datos para siempre.',
   que:'Un aumento imprevisto de la tensión.',
   causa:'Sobre todo los rayos. También puede aparecer cuando vuelve la red después de un apagón.',
   efecto:'Puede entrar por la red, las líneas serie y las líneas telefónicas, y dañar o destruir componentes. Puede causar pérdida definitiva de datos.'},
  {id:'sobre',short:'Sobretensión',name:'Sobretensión',p:3,zone:[250,390],
   q:'La tensión sube unos instantes.',c:'Motores grandes, como los de acondicionamiento, al apagarse.',e:'Esfuerza los componentes y provoca averías prematuras.',
   kf:['1/120 s','es su duración típica'],
   que:'Un aumento de tensión de breve duración, normalmente de 1/120 de segundo.',
   causa:'Motores eléctricos de gran potencia, como los de acondicionamiento: al apagarse, la tensión extra se disipa en la línea.',
   efecto:'Cualquier valor por encima de lo que toleran los equipos somete a esfuerzo a los componentes delicados y provoca averías prematuras.'},
  {id:'ruido',short:'Ruido EMI / RFI',name:'Ruido EMI / RFI',p:3,zone:null,
   q:'Interferencias que deforman la onda.',c:'Rayos, generadores, emisoras de radio y aparatos industriales.',e:'Errores en datos y comunicaciones; fallos en aparatos.',
   que:'Ruido de interferencia electromagnética y de radiofrecuencia que altera la onda sinusoidal de la red. Puede ser intermitente o constante.',
   causa:'Rayos, conmutación de cargas, generadores, transmisores de radio y aparatos industriales.',
   efecto:'Introduce transitorios, errores y problemas en los datos informáticos o en las telecomunicaciones, y puede hacer fallar a varios aparatos eléctricos.'},
  {id:'armon',short:'Corrientes armónicas',name:'Corrientes parásitas y armónicas',p:3,zone:null,
   q:'Se añaden corrientes que deforman la onda.',c:'Variaciones de la carga, generadores, instalaciones industriales y fenómenos atmosféricos.',e:'Errores en programas y deterioro prematuro de ordenadores y datos.',
   que:'Perturbaciones que se añaden a la corriente de la red.',
   causa:'Perturbaciones o variaciones atmosféricas, variaciones de la carga, generadores de corriente, emisiones electromagnéticas e instalaciones industriales.',
   efecto:'Errores al ejecutar programas, deterioro prematuro de los ordenadores y de sus datos, y fallos en equipos eléctricos de distintos tipos.'},
  {id:'frec',short:'Variación de frecuencia',name:'Variaciones de frecuencia',p:3,zone:[300,640],
   q:'La frecuencia de la corriente cambia.',c:'Es típico de la energía de los grupos electrógenos.',e:'Errores de cálculo y problemas con discos, cintas y equipos electromecánicos.',
   que:'Cambios en la frecuencia de la corriente. Suelen darse en la energía que producen los grupos electrógenos.',
   causa:'Los grupos electrógenos.',
   efecto:'Errores en cálculos, dificultad para interpretar soportes magnéticos (discos, cintas) y problemas en aplicaciones electromecánicas.'}
];
var WW=640,MID=100,AMP=60,CYC=3;
function env(x,a,b,r){return x<a||x>b?0:x<a+r?(x-a)/r:x>b-r?(b-x)/r:1}
function sample(kind,x,ph){
  var th=TAU*CYC*x/WW+ph,a=1,add=0;
  if(kind==='brown')a=1-.5*env(x,220,440,18);
  else if(kind==='apagon')a=1-env(x,220,520,10);
  else if(kind==='sobre')a=1+.45*env(x,250,390,10);
  else if(kind==='frec'&&x>300)th=TAU*CYC*300/WW+ph+TAU*CYC*1.45*(x-300)/WW;
  var s=Math.sin(th),v=a*s;
  if(kind==='spike')add=1.5*Math.exp(-Math.pow((x-330)/5,2));
  if(kind==='ruido')v+=.1*Math.sin(TAU*47*x/WW+ph*4)+.07*Math.sin(TAU*83*x/WW+1.3);
  if(kind==='armon')v=.78*(s+.32*Math.sin(3*th)+.14*Math.sin(5*th+.5));
  return Math.max(6,Math.min(194,MID-AMP*(v+add)));
}
function pathFor(kind,ph){
  var d='';
  for(var x=0;x<=WW;x+=2){d+=(x?'L':'M')+x+' '+sample(kind,x,ph).toFixed(1)}
  return d;
}
var curP=PROB[0],waveVisible=true;
function drawWave(ph){
  $('#wNorm').setAttribute('d',pathFor('norm',ph));
  $('#wAct').setAttribute('d',pathFor(curP.id,ph));
}
function showProb(k){
  curP=PROB.filter(function(p){return p.id===k})[0]||PROB[0];
  setPressed($('#plist'),curP.id);
  $('#pName').innerHTML=curP.name+' '+src(curP.p);
  $('#pKey').innerHTML=curP.kf?'<p class="kf"><b>'+curP.kf[0]+'</b><span>'+curP.kf[1]+'</span></p>':'';
  $('#pQ').textContent=curP.q;
  $('#pC').textContent=curP.c;
  $('#pE').textContent=curP.e;
  $('#pQue').innerHTML=curP.que+' '+src(curP.p);
  $('#pCausa').innerHTML=curP.causa+' '+src(curP.p);
  $('#pEfecto').innerHTML=curP.efecto+' '+src(curP.p);
  var z=$('#zone');
  if(curP.zone){z.setAttribute('x',curP.zone[0]);z.setAttribute('width',curP.zone[1]-curP.zone[0]);z.style.display=''}
  else{z.style.display='none'}
  if(RM)drawWave(0);
}
chips($('#plist'),PROB.map(function(p){return {k:p.id,t:p.short}}),PROB[0].id,showProb);
showProb(PROB[0].id);
drawWave(0);
if(!RM){
  var frame=function(ts){if(waveVisible)drawWave(-(ts/1000)*1.6);requestAnimationFrame(frame)};
  requestAnimationFrame(frame);
}
if('IntersectionObserver' in window){
  new IntersectionObserver(function(es){waveVisible=es[0].isIntersecting}).observe($('#wavepanel'));
}

/* 2. Tipos de SAI */
var ESC=[{k:'mains',t:'Hay corriente'},{k:'batt',t:'Se va la luz'},{k:'fault',t:'Sobrecarga o avería del SAI'}];
var ALL=['mains','batt','fault'];
var TIPOS={
  off:{name:'Off-line',sub:'Actúa solo cuando se va la luz',lvl:0,code:'VFD',cs:'La salida depende de la tensión y la frecuencia de la red.',
    nodes:[['IN',['Entrada'],10,40,70,44,['mains']],['SW',['Conmutador'],270,40,100,44,['mains','batt']],['OUT',['Salida'],610,40,80,44,ALL],
           ['CH',['Cargador'],170,150,100,44,['mains']],['BA',['Baterías'],320,150,110,44,['mains','batt']],['INV',['Inversor'],490,150,110,44,['batt']]],
    edges:[['M80 62H270',['mains']],['M370 62H610',['mains','batt']],['M130 62V172H170',['mains']],['M270 172H320',['mains']],['M430 172H490',['batt']],['M545 150V118H320V84',['batt']]],
    salida:{mains:'La misma tensión que entra, tal cual. El SAI no interviene mientras haya red.',batt:'Un inversor alimentado por las baterías. El SAI solo actúa cuando falta la tensión de entrada.'},
    filtro:'No las corrige: con red, la salida es exactamente igual que la entrada.',ms:'3–5 ms',msP:6,
    clase:'VFD: la salida depende de la tensión y la frecuencia de la red.',clsP:'5 y 6',
    analog:'Es como un suplente en el banquillo: no juega hasta que el titular falla.'},
  li:{name:'Line-interactive',sub:'Filtra y estabiliza la tensión',lvl:1,code:'VI',cs:'La tensión se estabiliza con dispositivos de regulación.',
    nodes:[['IN',['Entrada'],10,40,70,44,['mains']],['AV',['AVR'],130,40,90,44,['mains']],['SW',['Conmutador'],290,40,100,44,['mains','batt']],['OUT',['Salida'],610,40,80,44,ALL],
           ['CH',['Cargador'],170,150,100,44,['mains']],['BA',['Baterías'],320,150,110,44,['mains','batt']],['INV',['Inversor'],490,150,110,44,['batt']]],
    edges:[['M80 62H130',['mains']],['M220 62H290',['mains']],['M390 62H610',['mains','batt']],['M105 62V172H170',['mains']],['M270 172H320',['mains']],['M430 172H490',['batt']],['M545 150V118H340V84',['batt']]],
    salida:{mains:'La tensión pasa por un circuito de filtrado y estabilización (AVR), pero parte de las interferencias puede llegar a la salida.',batt:'Igual que el off-line: la salida se conecta al inversor, alimentado por las baterías.'},
    filtro:'Las corrige en parte: el AVR filtra y estabiliza, pero algunas variaciones pueden aparecer en la salida.',ms:'3–5 ms',msP:6,
    clase:'VI: la tensión se estabiliza con dispositivos de regulación.',clsP:'5 y 6',
    analog:'Es un suplente en el banquillo con un ayudante que corrige pequeños fallos mientras tanto.'},
  on:{name:'On-line de doble conversión',sub:'Regenera la corriente siempre',lvl:2,code:'VFI',cs:'La salida es independiente de la tensión y la frecuencia de la red.',
    nodes:[['IN',['Entrada'],10,40,70,44,['mains','fault']],['PF',['Rectificador','PFC'],130,40,120,44,['mains']],['INV',['Inversor'],330,40,110,44,['mains','batt']],['OUT',['Salida'],610,40,80,44,ALL],
           ['BA',['Baterías'],225,150,130,44,['mains','batt']]],
    edges:[['M80 62H130',['mains']],['M250 62H330',['mains']],['M440 62H610',['mains','batt']],['M270 62V150',['mains']],['M315 150V118H385V84',['batt']],['M45 40V12H650V40',['fault']]],
    bypass:true,
    salida:{mains:'La entrada se rectifica y se vuelve a convertir en alterna con un inversor: la salida no depende de la entrada.',batt:'El inversor ya alimentaba la salida, así que el paso de red a baterías no se nota.',fault:'El bypass automático conecta la carga directamente a la entrada y así sigue recibiendo energía.'},
    filtro:'Las elimina todas: la forma de onda de salida es independiente de la entrada.',ms:'0 ms',msP:6,
    clase:'VFI: la salida es independiente de la tensión y de la frecuencia de la red.',clsP:'5 y 6',
    analog:'Es como un jugador que siempre está en el campo: no hay cambio que hacer cuando falla la red.'}
};
var tipo='off',escen='mains';
function drawTipo(){
  var T=TIPOS[tipo],s='<svg class="diagram" viewBox="0 0 700 215" role="img" aria-label="Esquema del SAI '+T.name+'">';
  T.edges.forEach(function(e){
    var on=e[1].indexOf(escen)>-1;
    s+='<path class="edge'+(on?' on':'')+'" d="'+e[0]+'" marker-end="url(#'+(on?'ahOn':'ahOff')+')"/>';
  });
  if(T.bypass)s+='<text class="lbl'+(escen==='fault'?' on':'')+'" x="350" y="31">Bypass automático</text>';
  T.nodes.forEach(function(n){
    var on=n[6].indexOf(escen)>-1,lab=n[1];
    if(n[0]==='IN'&&escen==='batt')lab=['SIN RED'];
    s+='<g class="node'+(on?' on':'')+'"><rect x="'+n[2]+'" y="'+n[3]+'" width="'+n[4]+'" height="'+n[5]+'" rx="2"/>';
    if(lab.length===1)s+='<text x="'+(n[2]+n[4]/2)+'" y="'+(n[3]+n[5]/2+4)+'">'+lab[0]+'</text>';
    else s+='<text x="'+(n[2]+n[4]/2)+'" y="'+(n[3]+n[5]/2-3)+'">'+lab[0]+'</text><text x="'+(n[2]+n[4]/2)+'" y="'+(n[3]+n[5]/2+11)+'">'+lab[1]+'</text>';
    s+='</g>';
  });
  $('#tipoDiagram').innerHTML=s+'</svg>';
  var who=escen==='mains'?'La red':escen==='batt'?'Las baterías (por el inversor)':'El bypass, directo desde la entrada';
  var seg=T.ms==='0 ms'?'<div class="ms-seg zero"></div>':'<div class="ms-seg" style="left:30%;width:20%"></div>';
  var SC=['No las corrige','Las corrige en parte','Las elimina todas'];
  $('#tipoStatus').innerHTML=
    '<div class="now"><span class="hint" style="margin:0">La salida recibe energía de</span><b>'+who+'</b></div>'+
    '<div class="ind3">'+
      '<div><h4>Tiempo de conmutación</h4><p class="bignum">'+T.ms+'</p><div class="ms-track" aria-hidden="true">'+seg+'</div><div class="ms-scale" aria-hidden="true"><span>0 ms</span><span>10 ms</span></div>'+
        '<p class="cap" style="margin:6px 0 0">Lo que tarda el SAI en pasar de la red a las baterías. La guía lo dibuja como un hueco de duración T en la onda de salida. '+src(T.msP)+'</p>'+
        (T.ms==='0 ms'?'<p class="cap" style="margin:6px 0 0">No hay hueco: la salida sale siempre del inversor. '+src(4)+'</p>':'<p class="cap" style="margin:6px 0 0">La guía imprime «3+5 ms» y no explica el «+». <span class="own">propio</span> Lo leemos como «de 3 a 5 ms»; si fuese una suma, serían 8 ms. En ambos casos, milésimas de segundo.</p>')+'</div>'+
      '<div><h4>Interferencias de la red</h4><div class="scale">'+SC.map(function(t,i){return '<span class="'+(i===T.lvl?'on':'')+'">'+t+'</span>'}).join('')+'</div><p class="cap" style="margin:6px 0 0">'+src(4)+'</p></div>'+
      '<div><h4>Clasificación EN 62040-3</h4><p class="bignum">'+T.code+'</p><p style="margin:0">'+T.cs+' '+src(T.clsP)+'</p></div>'+
    '</div>'+
    '<details class="more"><summary>Cómo funciona en este caso</summary><p>'+T.salida[escen==='fault'?'fault':escen]+' '+src(4)+'</p><p>Interferencias: '+T.filtro.charAt(0).toLowerCase()+T.filtro.slice(1)+' '+src(4)+'</p></details>';
  $('#tipoAnalog').innerHTML='<span class="own">propio</span> Para entenderlo: '+T.analog.charAt(0).toLowerCase()+T.analog.slice(1);
}
function showEsc(){
  var items=ESC.filter(function(e){return e.k!=='fault'||TIPOS[tipo].bypass});
  chips($('#escTabs'),items,escen,function(k){escen=k;setPressed($('#escTabs'),k);drawTipo()});
}
bigchips($('#tipoTabs'),['off','li','on'].map(function(k){return {k:k,t:TIPOS[k].name,s:TIPOS[k].sub}}),tipo,function(k){
  tipo=k;if(escen==='fault'&&!TIPOS[k].bypass)escen='mains';
  setPressed($('#tipoTabs'),k);showEsc();drawTipo();
});
showEsc();drawTipo();

/* 3. Aplicaciones */
var USOS={
  casa:{t:'En casa',tipo:'off',eq:['Ordenador doméstico (PC Home)','Puestos de trabajo de Internet','Automatización doméstica'],
    mas:'También aparece el line-interactive para automatización domótica.',
    why:'Son equipos pequeños: basta un SAI que actúe solo cuando falta la red.',whyP:'4 y 9'},
  tienda:{t:'En una tienda',tipo:'off',eq:['Cajas registradoras','Terminales POS','Centralitas telefónicas','Fax'],
    mas:'Si además hay sistemas de seguridad o una red de empresa, la guía recomienda el line-interactive para esos equipos.',
    why:'Las cajas y los terminales de venta están en la lista del off-line.',whyP:'9'},
  hospital:{t:'En un hospital',tipo:'on',eq:['Equipos de electromedicina','Instalaciones de emergencia','Red IT empresarial','Telecomunicaciones'],
    mas:'La guía también lo recomienda para aplicaciones críticas de los sectores industrial y público.',
    why:'La electromedicina está en la lista del on-line: reacciona en 0 ms y elimina las interferencias.',whyP:'4, 6 y 9'}
};
var TN={off:'Off-line',li:'Line-interactive',on:'On-line de doble conversión'};
var uso='casa';
function showUso(k){
  uso=k;setPressed($('#usoTabs'),k);
  var u=USOS[k];
  $('#usoOut').innerHTML=
    '<div class="rec"><span class="hint" style="margin:0">Te conviene un SAI</span><b>'+TN[u.tipo]+'</b></div>'+
    '<p style="margin:0">'+u.why+' '+src(u.whyP)+' <span class="own">relación propia</span></p>'+
    '<p class="hint" style="margin:16px 0 0">Equipos de la guía que protege '+src(9)+'</p>'+
    '<ul class="chipl">'+u.eq.map(function(e){return '<li>'+e+'</li>'}).join('')+'</ul>'+
    '<details class="more"><summary>Más detalle</summary><p>'+u.mas+' '+src(9)+'</p><p class="cap"><span class="own">propio</span> Hemos relacionado «'+u.t.toLowerCase()+'» con esos equipos: la guía no habla de estos escenarios, solo de los equipos.</p></details>'+
    '<p style="margin:16px 0 0"><button type="button" class="btn primary" id="verMod">Ver modelos de la guía</button></p>';
  $('#verMod').onclick=function(){
    $('#mT').value=u.tipo==='off'?'any':u.tipo;showModels();
    $('#elegir').scrollIntoView({behavior:RM?'auto':'smooth'});
  };
}
chips($('#usoTabs'),Object.keys(USOS).map(function(k){return {k:k,t:USOS[k].t}}),uso,showUso);
showUso(uso);

/* 4. Arquitecturas */
var ARQ={
  dist:{t:'Distribuida',sub:'Un SAI para cada equipo',p:15,
    ideal:'Aplicaciones poco críticas con dificultades logísticas, como varios locales o una instalación ya hecha.',
    pro:['<b>Usa las tomas de pared que ya hay.</b>','<b>Cada SAI se ajusta a su equipo</b> y está cerca de él.','<b>Se pueden mantener los SAI antiguos</b> junto a los nuevos.','Las ampliaciones y renovaciones se hacen en cada emplazamiento.'],
    con:['<b>Difícil de gestionar y vigilar:</b> hay varios SAI en sitios distintos.','<b>Mantenimiento largo y complejo:</b> las baterías se revisan y se cambian una a una.','<b>Redundancia difícil.</b>','Hay que gestionar el apagado de emergencia de cada máquina.','<b>Más coste</b> de gestión y mantenimiento, y más consumo eléctrico.']},
  cent:{t:'Centralizada',sub:'Un SAI para todo',p:16,
    ideal:'Proteger toda la estructura.',
    pro:['<b>Un solo sistema</b> que instalar, gestionar y mantener: más simple y económico que varios pequeños.','<b>Dura más:</b> mayor vida del SAI y de las baterías.','<b>Gasta menos:</b> mayor eficiencia energética.','Suele estar en un local técnico protegido, con buenas condiciones ambientales.'],
    con:['<b>Punto único de fallo:</b> si falla, caen todas las cargas. Se evita con redundancia, que cuesta más.','<b>Suele estar lejos de la carga.</b>','Ocupa más en total.','La instalación, el cableado y la ampliación de autonomía pueden salir caros.','Suele hacer falta personal técnico especializado.']},
  mod:{t:'Modular',sub:'Módulos que trabajan juntos',p:17,
    ideal:'Los centros neurálgicos de una empresa.',
    pro:['<b>Redundancia interna fácil:</b> basta añadir módulos.','<b>Instalar y ampliar es más rápido</b> que en la centralizada, y se cambian potencia y autonomía sin sustituir la máquina.','<b>Mantenimiento y distribución más fáciles y rápidos.</b>','Tiene todas las ventajas de la centralizada.','Ocupa menos que la centralizada, sobre todo con redundancia.'],
    con:['<b>Coste de compra inicial</b> posiblemente mayor.','Puede hacer falta personal técnico especializado.','Ocupa más que la distribuida.']},
  gran:{t:'Modular granular',sub:'Muchos módulos pequeños',p:18,
    ideal:'Que el fallo de un solo módulo apenas se note.',
    pro:['<b>Aguanta mejor las averías:</b> redundancia interna fácil y paradas mínimas.','<b>Dimensionado más preciso:</b> con módulos pequeños es fácil acercarse a la potencia real de la carga.','<b>Instalar, mantener y ampliar es aún más fácil</b> que en la modular.','Mayor eficiencia energética y menor consumo.'],
    con:['<b>Coste de compra inicial</b> posiblemente mayor.','Un módulo averiado resta una pequeña parte de la potencia nominal.']}
};
var arq='dist',broken=[];
function nBroken(){return broken.filter(Boolean).length}
function unitBtn(i,label){return '<button type="button" class="unit" data-u="'+i+'" aria-pressed="'+(!!broken[i])+'">'+label+'</button>'}
function powerBlock(total,need){
  var avail=(total-nBroken())/total*100,needP=need/total*100;
  return '<div><div class="pbar" role="img" aria-label="Potencia disponible '+fmt(avail,1)+' %, necesaria '+fmt(needP,1)+' %"><div class="pfill'+(avail<needP?' low':'')+'" style="width:'+avail+'%"></div><div class="pneed" style="left:'+needP+'%"></div></div>'+
    '<div class="pcap"><span>Disponible: '+fmt(avail,1)+' %</span><span>Necesaria en el ejemplo: '+fmt(needP,1)+' % (raya negra)</span></div></div>';
}
function loadsHtml(n,okArr){
  var s='';for(var i=0;i<n;i++)s+='<div class="load '+(okArr[i]?'ok':'off')+'">Carga '+(i+1)+'</div>';
  return '<div class="loads">'+s+'</div>';
}
function drawArq(){
  var A=ARQ[arq],h='',msg='',n=nBroken(),i;
  if(arq==='dist'){
    h='<div class="pairs">';
    for(i=0;i<3;i++)h+='<div class="pair">'+unitBtn(i,'SAI '+(i+1))+'<span class="wire">▼</span><div class="load '+(broken[i]?'off':'ok')+'">Carga '+(i+1)+'</div></div>';
    h+='</div>';
    msg=n?'Cada SAI protege solo su carga: la avería de uno deja sin protección únicamente a esa carga. La guía avisa de que la redundancia es difícil en esta arquitectura.':'Todo funciona. Hay un SAI dedicado a cada carga.';
  }else if(arq==='cent'){
    var ok=[];for(i=0;i<7;i++)ok.push(!broken[0]);
    h='<div class="arq">'+unitBtn(0,'SAI único')+'<div class="bus"></div>'+loadsHtml(7,ok)+'</div>';
    msg=n?'El único SAI ha fallado y todas las cargas se quedan sin protección. Es el punto único de fallo. Se evita con instalaciones redundantes, que cuestan más.':'Un solo SAI protege a las siete cargas.';
  }else if(arq==='mod'){
    var okm=(4-n)>=3,units='';for(i=0;i<4;i++)units+=unitBtn(i,'Módulo '+(i+1));
    h='<div class="arq"><div class="units">'+units+'</div><div class="bus"></div>'+loadsHtml(3,[okm,okm,okm])+powerBlock(4,3)+'</div>';
    msg=n===0?'Cuatro módulos trabajan juntos y la carga necesita tres. El cuarto es la reserva: eso es la redundancia interna.':okm?'Un módulo averiado: los otros tres cubren la carga. Eso es la redundancia interna.':'Con '+n+' módulos averiados la potencia ya no alcanza y la carga se queda sin protección.';
  }else{
    var okg=(8-n)>=6,u2='';for(i=0;i<8;i++)u2+=unitBtn(i,'M'+(i+1));
    h='<div class="arq"><div class="units">'+u2+'</div><div class="bus"></div>'+loadsHtml(3,[okg,okg,okg])+powerBlock(8,6)+'</div>';
    msg=n===0?'Ocho módulos pequeños trabajan juntos y la carga necesita seis.':okg?'Cada módulo averiado resta solo un 12,5 % de potencia, y todavía '+(8-n>6?'sobra potencia.':'llega justo: la reserva se ha agotado.'):'Con '+n+' módulos averiados la potencia ya no alcanza.';
  }
  $('#arqDraw').innerHTML=h;
  $('#arqMsg').innerHTML=msg+' '+src(A.p);
}
function listHtml(cls,arr){
  var li=function(x){return '<li>'+x+'</li>'},top=arr.slice(0,3),rest=arr.slice(3);
  var h='<ul class="'+cls+'">'+top.map(li).join('')+'</ul>';
  if(rest.length)h+='<details class="more"><summary>Ver '+rest.length+' más</summary><ul class="'+cls+'">'+rest.map(li).join('')+'</ul></details>';
  return h;
}
function showArq(k){
  arq=k;broken=[];setPressed($('#arqTabs'),k);
  var A=ARQ[k];
  $('#arqWhen').innerHTML='<span class="hint" style="margin:0 0 2px;display:block">Ideal para</span><b>'+A.ideal+'</b> '+src(A.p);
  $('#arqPro').innerHTML=listHtml('pro',A.pro)+' ';
  $('#arqCon').innerHTML=listHtml('con',A.con)+' ';
  drawArq();
}
bigchips($('#arqTabs'),Object.keys(ARQ).map(function(k){return {k:k,t:ARQ[k].t,s:ARQ[k].sub}}),arq,showArq);
$('#arqDraw').addEventListener('click',function(e){
  var b=e.target.closest('[data-u]');if(!b)return;
  var i=+b.getAttribute('data-u');broken[i]=!broken[i];drawArq();
});
$('#arqReset').onclick=function(){broken=[];drawArq()};
showArq(arq);

/* 5. Baterías */
function lifeFactor(t){return t<=25?1:Math.pow(.5,(t-25)/10)}
function rng(a,b,f){return fmt(a*f,1)+'–'+fmt(b*f,1)+' años'}
function updTemp(){
  var t=+$('#temp').value,f=lifeFactor(t);
  $('#tempOut').textContent=t+' °C';
  $('#verdict').className='verdict '+(f>=1?'ok':f>.5?'warn':'bad');
  $('#lifePct').textContent=fmt(f*100,0)+' %';
  $('#lifeTxt').textContent=f>=1?'de la vida esperada: vida normal':f>.5?'de la vida esperada: duran menos':'de la vida esperada: duran la mitad o menos';
  $('#lifeStd').textContent=rng(5,6,f);
  $('#lifeLong').textContent=rng(10,12,f);
}
$('#temp').addEventListener('input',updTemp);updTemp();

/* 6. Elegir */
function updConv(){
  var w=parseFloat($('#cW').value),pf=parseFloat($('#cPF').value),o=$('#cOut');
  if(!(w>0)){o.textContent='Escribe los vatios de tu equipo.';return}
  if(!(pf>=0.1&&pf<=1)){o.textContent='El factor de potencia va de 0,1 a 1.';return}
  o.textContent='Al menos '+fmt(Math.ceil(w/pf),0)+' VA';
}
$('#cW').addEventListener('input',updConv);$('#cPF').addEventListener('input',updConv);updConv();

var CAT=[];
function add(fam,t,p,list,note){list.forEach(function(x){CAT.push({fam:fam,tipo:t,p:p,va:x[0],w:x[1],note:note||''})})}
add('NIKY','li',32,[[600,300],[800,400],[1000,600],[1500,900]],'seudo-sinusoidal');
add('NIKY-S','li',32,[[1000,600],[1500,900],[2000,1200],[3000,1800]],'sinusoidal');
add('Megaline','on',33,[[1250,875],[2500,1750],[3750,2625],[5000,3500],[6250,4375],[7500,5250],[8750,6125],[10000,7000]]);
add('WHAD','on',36,[[800,560],[1000,700],[1500,1050],[2000,1400],[2500,1750],[3000,2100],[4000,2800],[5000,3500],[6000,4200]]);
add('Daker DK','on',37,[[1000,800],[2000,1600],[3000,2400],[10000,9000]]);
add('DHEA','on',37,[[1000,700],[1500,1050]]);
add('Archimod','on',34,[[20000,18000],[40000,36000],[60000,54000],[80000,72000],[100000,90000],[120000,108000]]);
add('Trimod','on',35,[[10000,9000],[15000,13500],[20000,18000],[30000,27000],[40000,36000],[60000,54000]]);
function findModels(w,va,t){
  return CAT.filter(function(m){return (t==='any'||m.tipo===t)&&m.w>=w&&(!va||m.va>=va)})
    .sort(function(a,b){return a.w-b.w||a.va-b.va}).slice(0,5);
}
function showModels(){
  var w=parseFloat($('#mW').value),va=parseFloat($('#mVA').value)||0,t=$('#mT').value,o=$('#mOut');
  if(!(w>0)){o.innerHTML='<p>Escribe cuántos vatios consume lo que quieres proteger.</p>';return}
  var L=findModels(w,va,t);
  var s='';
  if(!L.length){
    s='<p>Ningún modelo de la lista de la guía llega a esa potencia con ese tipo.</p>';
  }else{
    var f=L[0];
    s='<p class="pick">El más pequeño que llega: <b>'+f.fam+' '+fmt(f.va)+'</b> ('+fmt(f.va)+' VA · '+fmt(f.w)+' W) '+src(f.p)+'</p>'+
      '<div class="scroll"><table><thead><tr><th>Modelo</th><th>Tipo</th><th class="num">VA</th><th class="num">W</th><th class="num">FP</th><th class="num">Uso del SAI</th><th>Guía</th></tr></thead><tbody>'+
      L.map(function(m){
        return '<tr><td>'+m.fam+' '+fmt(m.va)+'</td><td>'+(m.tipo==='li'?'Line-interactive':'On-line')+'</td><td class="num">'+fmt(m.va)+'</td><td class="num">'+fmt(m.w)+'</td><td class="num">'+fmt(m.w/m.va,2)+'</td><td class="num">'+fmt(w/m.w*100,0)+' %</td><td>'+src(m.p)+'</td></tr>';
      }).join('')+'</tbody></table></div>';
  }
  if($('#mT').value==='any'&&uso&&USOS[uso].tipo==='off')s+='<p class="cap">La guía no incluye modelos off-line en sus tablas. Aquí ves los modelos que sí lista.</p>';
  s+='<p class="cap">«FP» es W ÷ VA del propio modelo. «Uso del SAI» es tu carga dividida entre los W del modelo: cuanto más cerca de 100 %, más ajustado. No te pases mucho de tamaño. <span class="src">p. 24</span> <span class="own">propio</span> Lista parcial: no incluye los Daker DK 3 100 53, 54, 56 y 57, porque en la p. 37 comparten celda de W entre dos modelos y, en el 54 y el 57, los VA impresos (10000 y 6000) no cuadran con los mismos 5400 W. <span class="src">p. 37</span> En Archimod y Trimod la guía rotula «W», pero los valores son kW (18 para 20 kVA); los pasamos a W con el factor 0,9 que indica la p. 34. Catálogo de 2013: consulta la ficha actual.</p>';
  o.innerHTML=s;
}
['#mW','#mVA','#mT'].forEach(function(id){$(id).addEventListener('input',showModels);$(id).addEventListener('change',showModels)});
showModels();

/* Navegación: sección actual */
if('IntersectionObserver' in window){
  var links=$$('.nav a');
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(e.isIntersecting){links.forEach(function(a){a.removeAttribute('aria-current')});
        var a=$('.nav a[href="#'+e.target.id+'"]');if(a)a.setAttribute('aria-current','true')}
    });
  },{rootMargin:'-35% 0px -60% 0px'});
  $$('main .sec').forEach(function(s){io.observe(s)});
}
})();
