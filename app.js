const storeKey = 'campus-calendar-events-v1';
const $ = (s) => document.querySelector(s);
const dialog = $('#eventDialog');
let cursor = startOfWeek(new Date());
let events = load();

function load(){ try{return JSON.parse(localStorage.getItem(storeKey)) || demoEvents()}catch{return demoEvents()} }
function save(){ localStorage.setItem(storeKey, JSON.stringify(events)); }
function demoEvents(){ return []; }
function dateKey(d){ return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10); }
function startOfWeek(d){ const x=new Date(d); const day=x.getDay()||7; x.setHours(0,0,0,0); x.setDate(x.getDate()-day+1); return x; }
function addDays(d,n){ const x=new Date(d);x.setDate(x.getDate()+n);return x; }
function fmtDate(d, opts){ return new Intl.DateTimeFormat('zh-CN',opts).format(d); }
function esc(t){ return String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
function render(){
  const today=new Date(); today.setHours(0,0,0,0);
  $('#todayLabel').textContent=fmtDate(today,{month:'long',day:'numeric',weekday:'short'});
  const weekEnd=addDays(cursor,6);
  $('#weekTitle').textContent=`${fmtDate(cursor,{month:'long',day:'numeric'})} — ${fmtDate(weekEnd,{month:'long',day:'numeric'})}`;
  const current=events.filter(e=>e.date===dateKey(today)).sort(sortEvents);
  $('#summary').textContent=current.length?`今天有 ${current.length} 项安排，把最重要的一件先完成。`:'今天暂时没有安排，给自己留一点从容的时间。';
  $('#todayList').innerHTML=current.length?current.map(e=>`<div class="agenda-item"><span class="agenda-time">${e.time}${e.endTime?'–'+e.endTime:''}</span><span class="agenda-title">${esc(e.title)}</span><button class="delete" aria-label="删除 ${esc(e.title)}" data-delete="${e.id}">×</button></div>`).join(''):'<p class="empty">还没有安排。点击“添加安排”开始吧。</p>';
  const weekEvents=events.filter(e=>{const d=new Date(e.date+'T00:00');return d>=cursor&&d<=weekEnd}).sort((a,b)=>a.date.localeCompare(b.date)||sortEvents(a,b));
  $('#weekCount').textContent=`${weekEvents.length} 项`;
  $('#priorityList').innerHTML=weekEvents.length?weekEvents.filter(e=>e.type==='deadline'||e.type==='study').slice(0,5).map(e=>`<div class="priority">${esc(e.title)}<small>${e.date.slice(5).replace('-','/')} ${e.time}</small></div>`).join('')||'<p class="empty">本周暂时没有学习或截止事项。</p>':'<p class="empty">添加课程、学习和截止日期后，它们会显示在这里。</p>';
  $('#calendar').innerHTML=Array.from({length:7},(_,i)=>dayHtml(addDays(cursor,i),today)).join('');
}
function sortEvents(a,b){return a.time.localeCompare(b.time)}
function dayHtml(day,today){const key=dateKey(day), list=events.filter(e=>e.date===key).sort(sortEvents);const label=fmtDate(day,{weekday:'short'});return `<article class="day ${key===dateKey(today)?'is-today':''}"><div class="day-head"><span class="day-name">${label}</span><span class="day-number">${day.getDate()}</span></div><div class="events">${list.length?list.map(e=>`<button class="event ${e.type}" title="${esc(e.note||'点击查看/删除')}" data-event="${e.id}"><span class="event-time">${e.time}${e.endTime?' – '+e.endTime:''}</span><span class="event-title">${esc(e.title)}</span></button>`).join(''):'<p class="empty">无安排</p>'}</div></article>`}
function addEvent(data){events.push({id:crypto.randomUUID(),...data});save();render();}
function remove(id){events=events.filter(e=>e.id!==id);save();render();}

$('#openAdd').onclick=()=>{ $('#eventForm').reset(); $('#eventForm').date.value=dateKey(new Date()); $('#eventForm').time.value='09:00'; $('#eventForm').endTime.value='10:00'; dialog.showModal(); };
$('#closeDialog').onclick=$('#cancelDialog').onclick=()=>dialog.close();
$('#eventForm').onsubmit=(e)=>{e.preventDefault();const f=new FormData(e.currentTarget);addEvent(Object.fromEntries(f));dialog.close();};
$('#prevWeek').onclick=()=>{cursor=addDays(cursor,-7);render()}; $('#nextWeek').onclick=()=>{cursor=addDays(cursor,7);render()}; $('#goToday').onclick=()=>{cursor=startOfWeek(new Date());render()};
document.addEventListener('click',(e)=>{const del=e.target.closest('[data-delete]'); if(del)remove(del.dataset.delete);const event=e.target.closest('[data-event]');if(event){const found=events.find(x=>x.id===event.dataset.event);if(found&&confirm(`删除“${found.title}”？`))remove(found.id)}});
render();

