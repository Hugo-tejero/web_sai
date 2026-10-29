/* Descubre tu SAI · comportamiento */
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
   plain:'La luz «baja» unos instantes.',
   que:'Una bajada de tensión de breve duración. Es el problema de alimentación más común: el 87 % según la guía.',
   causa:'Que se pongan en marcha motores, compresores, ascensores o montacargas.',
   efecto:'El ordenador no recibe la potencia que necesita: el teclado deja de responder o el sistema se cae, y se pierden o se dañan los datos que se estaban procesando.'},
  {id:'apagon',short:'Apagón',name:'Apagón eléctrico (blackout)',p:2,zone:[220,520],
   plain:'Se va la luz del todo.',
   que:'La ausencia total de alimentación.',
   causa:'Demanda excesiva de energía, temporales, hielo en las líneas, accidentes de tráfico, excavaciones o terremotos.',
   efecto:'Pérdida de datos, comunicaciones cortadas, falta de iluminación, líneas de producción bloqueadas, actividad parada y peligro para las personas.'},
  {id:'spike',short:'Spike',name:'Spike (transitorio de tensión)',p:3,zone:[316,344],
   plain:'Un latigazo de tensión.',
   que:'Un aumento imprevisto de la tensión.',
   causa:'Sobre todo los rayos. También puede aparecer cuando vuelve la red después de un apagón.',
   efecto:'Puede entrar por la red, las líneas serie y las líneas telefónicas, y dañar o destruir componentes. Puede causar pérdida definitiva de datos.'},
  {id:'sobre',short:'Sobretensión',name:'Sobretensión',p:3,zone:[250,390],
   plain:'La tensión sube unos instantes.',
   que:'Un aumento de tensión de breve duración, normalmente de 1/120 de segundo.',
   causa:'Motores eléctricos de gran potencia, como los de acondicionamiento: al apagarse, la tensión extra se disipa en la línea.',
   efecto:'Cualquier valor por encima de lo que toleran los equipos somete a esfuerzo a los componentes delicados y provoca averías prematuras.'},
  {id:'ruido',short:'Ruido EMI / RFI',name:'Ruido EMI / RFI',p:3,zone:null,
   plain:'Interferencias que «ensucian» la señal.',
   que:'Ruido de interferencia electromagnética y de radiofrecuencia que altera la onda sinusoidal de la red. Puede ser intermitente o constante.',
   causa:'Rayos, conmutación de cargas, generadores, transmisores de radio y aparatos industriales.',
   efecto:'Introduce transitorios, errores y problemas en los datos informáticos o en las telecomunicaciones, y puede hacer fallar a varios aparatos eléctricos.'},
  {id:'armon',short:'Corrientes armónicas',name:'Corrientes parásitas y armónicas',p:3,zone:null,
   plain:'La onda se deforma.',
   que:'Perturbaciones que se añaden a la corriente de la red.',
   causa:'Perturbaciones o variaciones atmosféricas, variaciones de la carga, generadores de corriente, emisiones electromagnéticas e instalaciones industriales.',
   efecto:'Errores al ejecutar programas, deterioro prematuro de los ordenadores y de sus datos, y fallos en equipos eléctricos de distintos tipos.'},
  {id:'frec',short:'Variación de frecuencia',name:'Variaciones de frecuencia',p:3,zone:[300,640],
   plain:'El ritmo de la corriente no se mantiene.',
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
  $('#pName').textContent=curP.name;
  $('#pPlain').innerHTML='<span class="own">propio</span> '+curP.plain;
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
  off:{name:'Off-line',
    nodes:[['IN',['ENTRADA'],10,40,70,44,['mains']],['SW',['CONMUTADOR'],270,40,100,44,['mains','batt']],['OUT',['SALIDA'],610,40,80,44,ALL],
           ['CH',['CARGADOR'],170,150,100,44,['mains']],['BA',['BATERÍAS'],320,150,110,44,['mains','batt']],['INV',['INVERSOR'],490,150,110,44,['batt']]],
    edges:[['M80 62H270',['mains']],['M370 62H610',['mains','batt']],['M130 62V172H170',['mains']],['M270 172H320',['mains']],['M430 172H490',['batt']],['M545 150V118H320V84',['batt']]],
    salida:{mains:'La misma tensión que entra, tal cual. El SAI no interviene mientras haya red.',batt:'Un inversor alimentado por las baterías. El SAI solo actúa cuando falta la tensión de entrada.'},
    filtro:'No las corrige: con red, la salida es exactamente igual que la entrada.',ms:'3–5 ms',msP:6,
    clase:'VFD: la salida depende de la tensión y la frecuencia de la red.',clsP:'5 y 6',
    analog:'Es como un suplente en el banquillo: no juega hasta que el titular falla.'},
  li:{name:'Line-interactive',
    nodes:[['IN',['ENTRADA'],10,40,70,44,['mains']],['AV',['AVR'],130,40,90,44,['mains']],['SW',['CONMUTADOR'],290,40,100,44,['mains','batt']],['OUT',['SALIDA'],610,40,80,44,ALL],
           ['CH',['CARGADOR'],170,150,100,44,['mains']],['BA',['BATERÍAS'],320,150,110,44,['mains','batt']],['INV',['INVERSOR'],490,150,110,44,['batt']]],
    edges:[['M80 62H130',['mains']],['M220 62H290',['mains']],['M390 62H610',['mains','batt']],['M105 62V172H170',['mains']],['M270 172H320',['mains']],['M430 172H490',['batt']],['M545 150V118H340V84',['batt']]],
    salida:{mains:'La tensión pasa por un circuito de filtrado y estabilización (AVR), pero parte de las interferencias puede llegar a la salida.',batt:'Igual que el off-line: la salida se conecta al inversor, alimentado por las baterías.'},
    filtro:'Las corrige en parte: el AVR filtra y estabiliza, pero algunas variaciones pueden aparecer en la salida.',ms:'3–5 ms',msP:6,
    clase:'VI: la tensión se estabiliza con dispositivos de regulación.',clsP:'5 y 6',
    analog:'Es un suplente en el banquillo con un ayudante que corrige pequeños fallos mientras tanto.'},
  on:{name:'On-line de doble conversión',
    nodes:[['IN',['ENTRADA'],10,40,70,44,['mains','fault']],['PF',['RECTIFICADOR','PFC'],130,40,120,44,['mains']],['INV',['INVERSOR'],330,40,110,44,['mains','batt']],['OUT',['SALIDA'],610,40,80,44,ALL],
           ['BA',['BATERÍAS'],225,150,130,44,['mains','batt']]],
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
  if(T.bypass)s+='<text class="lbl'+(escen==='fault'?' on':'')+'" x="350" y="31">BYPASS AUTOMÁTICO</text>';
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
  var seg=T.ms==='0 ms'?'<div class="ms-seg zero"></div>':'<div class="ms-seg" style="left:60%;width:40%"></div>';
  $('#tipoStatus').innerHTML=
    '<div><h4>La salida recibe</h4><p><b>'+who+'.</b> '+T.salida[escen==='fault'?'fault':escen]+' '+src(4)+'</p></div>'+
    '<div><h4>Tiempo de cambio a baterías</h4><p><b>'+T.ms+'</b> '+src(T.msP)+'</p>'+(T.ms==='0 ms'?'':'<p class="cap" style="margin:4px 0 0">La guía imprime «3+5 ms». <span class="own">propio</span> Lo leemos como un intervalo de 3 a 5 ms.</p>')+'<div class="ms-track" aria-hidden="true">'+seg+'</div><div class="ms-scale" aria-hidden="true"><span>0 ms</span><span>5 ms</span></div></div>'+
    '<div><h4>Interferencias de la red</h4><p>'+T.filtro+' '+src(4)+'</p></div>'+
    '<div><h4>Clasificación EN 62040-3</h4><p>'+T.clase+' '+src(T.clsP)+'</p></div>';
  $('#tipoAnalog').innerHTML='<span class="own">propio</span> '+T.analog;
}
function showEsc(){
  var items=ESC.filter(function(e){return e.k!=='fault'||TIPOS[tipo].bypass});
  chips($('#escTabs'),items,escen,function(k){escen=k;setPressed($('#escTabs'),k);drawTipo()});
}
chips($('#tipoTabs'),[{k:'off',t:'Off-line'},{k:'li',t:'Line-interactive'},{k:'on',t:'On-line de doble conversión'}],tipo,function(k){
  tipo=k;if(escen==='fault'&&!TIPOS[k].bypass)escen='mains';
  setPressed($('#tipoTabs'),k);showEsc();drawTipo();
});
showEsc();drawTipo();

/* 3. Aplicaciones */
var USOS={
  casa:{t:'En casa',tipo:'off',eq:['Ordenador doméstico (PC Home)','Puestos de trabajo de Internet','Automatización doméstica'],
    mas:'También aparece el line-interactive para automatización domótica.',
    why:'Son equipos pequeños y domésticos, y la guía los asigna al off-line, que solo entra en acción cuando falta la red.',whyP:'4 y 9'},
  tienda:{t:'En una tienda',tipo:'off',eq:['Cajas registradoras','Terminales POS','Centralitas telefónicas','Fax'],
    mas:'Si además hay sistemas de seguridad o una red de empresa, la guía recomienda el line-interactive para esos equipos.',
    why:'Los equipos de venta y comunicación de un comercio pequeño están en la lista del off-line.',whyP:'9'},
  hospital:{t:'En un hospital',tipo:'on',eq:['Equipos de electromedicina','Instalaciones de emergencia','Red IT empresarial','Telecomunicaciones'],
    mas:'La guía también lo recomienda para aplicaciones críticas de los sectores industrial y público.',
    why:'La guía asigna la electromedicina al on-line de doble conversión. Es el único con tiempo de cambio de 0 ms y que elimina todas las interferencias de la red.',whyP:'4, 6 y 9'}
};
var TN={off:'Off-line',li:'Line-interactive',on:'On-line de doble conversión'};
var uso='casa';
function showUso(k){
  uso=k;setPressed($('#usoTabs'),k);
  var u=USOS[k];
  $('#usoOut').innerHTML=
    '<p class="mono" style="margin:0;color:var(--muted);font-size:.8rem">TIPO RECOMENDADO</p>'+
    '<p class="result" style="margin:2px 0 12px">'+TN[u.tipo]+'</p>'+
    '<p style="margin-bottom:6px"><b>Equipos de la lista de la guía</b> '+src(9)+'</p>'+
    '<ul>'+u.eq.map(function(e){return '<li>'+e+'</li>'}).join('')+'</ul>'+
    '<p>'+u.mas+' '+src(9)+'</p>'+
    '<p class="note"><span class="own">razonamiento propio</span> Hemos relacionado «'+u.t.toLowerCase()+'» con esos equipos. '+u.why+' '+src(u.whyP)+'</p>'+
    '<p style="margin:14px 0 0"><button type="button" class="btn primary" id="verMod">Ver modelos de la guía</button></p>';
  $('#verMod').onclick=function(){
    $('#mT').value=u.tipo==='off'?'any':u.tipo;showModels();
    $('#elegir').scrollIntoView({behavior:RM?'auto':'smooth'});
  };
}
chips($('#usoTabs'),Object.keys(USOS).map(function(k){return {k:k,t:USOS[k].t}}),uso,showUso);
showUso(uso);

/* 4. Arquitecturas */
var ARQ={
  dist:{t:'Distribuida',p:15,
    cuando:'Se usa cuando lo que hay que proteger no es especialmente crítico y hay dificultades logísticas, como varios locales o una instalación que ya existe.',
    pro:['Se pueden usar las tomas de pared que ya hay.','Cada SAI se dimensiona para la carga que protege.','SAI pequeños e independientes, cerca de cada carga.','Las ampliaciones y renovaciones se hacen en cada emplazamiento.','Los SAI que ya tenías se pueden mantener junto a los nuevos.'],
    con:['Gestión y monitorización complejas: varios SAI en distintos puntos.','Mantenimiento largo o complejo: revisar y cambiar baterías en varios sistemas y en momentos distintos.','Hay que gestionar el apagado de emergencia de cada máquina.','Es difícil conseguir redundancia.','Mayores costes de gestión y mantenimiento, y mayor consumo eléctrico.']},
  cent:{t:'Centralizada',p:16,
    cuando:'Es la preferible para proteger toda la estructura con un solo SAI.',
    pro:['Un solo sistema que instalar y gestionar: más simple y económico que varios pequeños.','Un solo sistema que mantener.','Mayor vida del SAI y de las baterías.','Mayor eficiencia energética.','Suele estar en un local técnico protegido, con condiciones ambientales óptimas.'],
    con:['Un solo sistema puede ser un punto único de fallo. Se evita con instalaciones redundantes, que cuestan más.','El SAI suele quedar lejos de la carga.','Ocupa más en total.','La instalación, el cableado y la ampliación de autonomía pueden salir caros.','Suele hacer falta personal técnico especializado.']},
  mod:{t:'Modular',p:17,
    cuando:'Es una solución interesante para proteger los centros neurálgicos de una empresa. Los módulos son SAI que alimentan la carga todos juntos.',
    pro:['Tiene todas las ventajas de la centralizada.','Es fácil conseguir redundancia interna añadiendo módulos.','Instalación y ampliación más fáciles y rápidas que en la centralizada.','Mantenimiento y distribución más fáciles y rápidos.','Ocupa menos que la centralizada, sobre todo con redundancia.','Se pueden cambiar las configuraciones para aumentar autonomía y potencia sin sustituir la máquina.'],
    con:['El coste de compra inicial puede ser mayor.','Puede hacer falta personal técnico especializado para instalar y mantener.','Ocupa más que la arquitectura distribuida.']},
  gran:{t:'Modular granular',p:18,
    cuando:'Usa módulos compactos y de poca potencia, para que el sistema no se resienta cuando falla uno solo.',
    pro:['Instalación, mantenimiento y ampliación aún más fáciles y rápidos que en la modular.','Redundancia interna fácil e inmunidad frente a averías.','Si hay una avería sin redundancia, el tiempo de parada es mínimo.','Mayor eficiencia energética y menor consumo.','Dimensionamiento preciso: con módulos pequeños es más fácil acercarse a la potencia real de la carga.'],
    con:['El coste de compra inicial puede ser mayor.','Un módulo averiado supone una pequeña pérdida de potencia respecto a la nominal.']}
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
    msg=n?'Cada SAI protege solo su carga: la avería de uno deja sin protección únicamente a esa carga. No hay reserva, y la guía avisa de que la redundancia es difícil en esta arquitectura.':'Todo funciona. Hay un SAI dedicado a cada carga.';
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
function showArq(k){
  arq=k;broken=[];setPressed($('#arqTabs'),k);
  var A=ARQ[k];
  $('#arqWhen').innerHTML=A.cuando+' '+src(A.p);
  $('#arqPro').innerHTML=A.pro.map(function(x){return '<li>'+x+'</li>'}).join('')+'';
  $('#arqCon').innerHTML=A.con.map(function(x){return '<li>'+x+'</li>'}).join('');
  drawArq();
}
chips($('#arqTabs'),Object.keys(ARQ).map(function(k){return {k:k,t:ARQ[k].t}}),arq,showArq);
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
  $('#lifeFill').style.width=(f*100)+'%';
  $('#lifePct').textContent=fmt(f*100,0)+' %';
  $('#lifeStd').textContent=rng(5,6,f);
  $('#lifeLong').textContent=rng(10,12,f);
}
$('#temp').addEventListener('input',updTemp);updTemp();

/* 6. Elegir */
function updConv(){
  var w=parseFloat($('#cW').value),pf=parseFloat($('#cPF').value),o=$('#cOut');
  if(!(w>0)){o.textContent='Escribe los vatios de tu equipo.';return}
  if(!(pf>0&&pf<=1)){o.textContent='El factor de potencia va de 0,1 a 1.';return}
  o.textContent=fmt(w/pf,0)+' VA';
}
$('#cW').addEventListener('input',updConv);$('#cPF').addEventListener('input',updConv);updConv();

var CAT=[];
function add(fam,t,p,list,note){list.forEach(function(x){CAT.push({fam:fam,tipo:t,p:p,va:x[0],w:x[1],note:note||''})})}
add('NIKY','li',32,[[600,300],[800,400],[1000,600],[1500,900]],'seudo-sinusoidal');
add('NIKY-S','li',32,[[1000,600],[1500,900],[2000,1200],[3000,1800]],'sinusoidal');
add('Megaline','on',33,[[1250,875],[2500,1750],[3750,2625],[5000,3500],[6250,4375],[7500,5250],[8750,6125],[10000,7000]]);
add('WHAD','on',36,[[800,560],[1000,700],[1500,1050],[2000,1400],[2500,1750],[3000,2100],[4000,2800],[5000,3500],[6000,4200]]);
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
    s='<div class="scroll"><table><thead><tr><th>Modelo</th><th>Tipo</th><th class="num">VA</th><th class="num">W</th><th class="num">FP</th><th class="num">Usarías</th><th>Guía</th></tr></thead><tbody>'+
      L.map(function(m){
        return '<tr><td>'+m.fam+' '+fmt(m.va)+'</td><td>'+(m.tipo==='li'?'Line-interactive':'On-line')+'</td><td class="num">'+fmt(m.va)+'</td><td class="num">'+fmt(m.w)+'</td><td class="num">'+fmt(m.w/m.va,2)+'</td><td class="num">'+fmt(w/m.w*100,0)+' %</td><td>'+src(m.p)+'</td></tr>';
      }).join('')+'</tbody></table></div>';
  }
  if($('#mT').value==='any'&&uso&&USOS[uso].tipo==='off')s+='<p class="cap">La guía no incluye modelos off-line en sus tablas. Aquí ves los modelos que sí lista.</p>';
  s+='<p class="cap">«FP» es W ÷ VA del propio modelo. «Usarías» es tu carga dividida entre la potencia activa del modelo; no te pases mucho de tamaño. <span class="src">p. 24</span> <span class="own">propio</span> Lista parcial: faltan los modelos Daker DK y DHEA.</p>';
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
