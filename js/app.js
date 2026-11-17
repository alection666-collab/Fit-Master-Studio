const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
let activeFilter = "all";
let currentPlan = JSON.parse(localStorage.getItem("fitMasterPlan") || "null");
let lastGenerated = null;
const titles = {catalog:"Каталог тренажёров",builder:"Подбор программы",plan:"Мой план"};
function showTab(tab){$$(".tab-panel").forEach(x=>x.classList.toggle("active",x.id===tab));$$(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.tab===tab));$("#pageTitle").textContent=titles[tab];if(tab==="plan")renderPlan();window.scrollTo({top:0,behavior:"smooth"});}
$$("[data-tab]").forEach(b=>b.addEventListener("click",()=>showTab(b.dataset.tab)));
$$("[data-goto]").forEach(b=>b.addEventListener("click",()=>showTab(b.dataset.goto)));
// Анимированная схема упражнения: движение + подсветка работающих мышц.
function exerciseVisual(e, extraClass=""){
 const group = e.type==="pool" ? "pool" :
   ["chest"].includes(e.type) ? "chest" :
   ["back"].includes(e.type) ? "back" :
   ["legs","glutes"].includes(e.type) ? "legs" :
   ["shoulders"].includes(e.type) ? "shoulders" :
   ["arms"].includes(e.type) ? "arms" : "core";
 const muscleNames = (e.muscles||[]).slice(0,3).join(" · ");
 const safe = s=>String(s||"").replace(/[&<>"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch]));
 const muscles = {
  chest:'<ellipse class="hot chestL" cx="86" cy="82" rx="17" ry="12"/><ellipse class="hot chestR" cx="114" cy="82" rx="17" ry="12"/><path class="hot triceps" d="M68 88 Q54 103 55 126 L65 132 Q72 109 78 98 M132 88 Q146 103 145 126 L135 132 Q128 109 122 98"/>',
  back:'<path class="hot backL" d="M83 67 Q65 75 69 108 L86 119 L96 92Z"/><path class="hot backR" d="M117 67 Q135 75 131 108 L114 119 L104 92Z"/><ellipse class="hot biceps" cx="61" cy="108" rx="8" ry="16"/><ellipse class="hot biceps" cx="139" cy="108" rx="8" ry="16"/>',
  legs:'<path class="hot quads" d="M83 132 L99 136 L94 184 L79 183Z M101 136 L117 132 L121 183 L106 184Z"/><path class="hot glutes" d="M82 111 Q100 104 118 111 L116 133 L84 133Z"/><path class="hot hamstrings" d="M80 184 L94 184 L91 225 L78 225Z M106 184 L121 184 L123 225 L110 225Z"/>',
  shoulders:'<ellipse class="hot delts" cx="70" cy="70" rx="13" ry="12"/><ellipse class="hot delts" cx="130" cy="70" rx="13" ry="12"/><path class="hot triceps" d="M64 82 L55 126 L66 130 L77 91Z M136 82 L145 126 L134 130 L123 91Z"/>',
  arms:'<ellipse class="hot biceps" cx="62" cy="103" rx="9" ry="18"/><ellipse class="hot biceps" cx="138" cy="103" rx="9" ry="18"/><path class="hot triceps" d="M68 83 L57 119 L68 126 L78 91Z M132 83 L143 119 L132 126 L122 91Z"/>',
  core:'<path class="hot abs" d="M88 91 L112 91 L116 130 L84 130Z"/><path class="hot obliques" d="M78 91 L87 95 L84 128 L74 121Z M122 91 L113 95 L116 128 L126 121Z"/>',
  pool:'<path class="hot abs" d="M88 91 L112 91 L116 130 L84 130Z"/><path class="hot delts" d="M70 69 L82 72 L76 88Z M130 69 L118 72 L124 88Z"/><path class="hot quads" d="M83 132 L99 136 L94 184 L79 183Z M101 136 L117 132 L121 183 L106 184Z"/>'
 };
 const equipment = group==="chest" ? '<path class="prop" d="M32 150 H168 M43 150 V166 M157 150 V166 M47 45 H153 M55 40 V50 M145 40 V50"/>' :
  group==="back" ? '<path class="prop" d="M30 30 V145 M25 30 H35 M25 145 H35 M30 30 L65 48 M135 48 L170 30"/>' :
  group==="legs" ? '<path class="prop" d="M35 178 H165 M42 178 L35 195 M158 178 L165 195"/>' :
  group==="pool" ? '<path class="prop water" d="M15 202 Q35 192 55 202 T95 202 T135 202 T175 202 M15 216 Q35 206 55 216 T95 216 T135 216 T175 216"/>' :
  '<path class="prop" d="M38 150 H162 M45 150 V166 M155 150 V166"/>';
 return '<div class="exercise-visual '+extraClass+'"><div class="motion-stage motion-'+group+'"><svg class="anatomy" viewBox="0 0 200 230" role="img" aria-label="Анимация упражнения '+safe(e.name)+'. Подсвечены работающие мышцы: '+safe(muscleNames)+'"><defs><linearGradient id="skin-'+safe(e.id)+'" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d9e0d8"/><stop offset="1" stop-color="#87968c"/></linearGradient></defs>'+equipment+'<g class="body"><circle cx="100" cy="38" r="16" fill="url(#skin-'+safe(e.id)+')"/><path class="torso" d="M82 58 Q100 50 118 58 L123 111 Q100 124 77 111Z"/><path class="limbs" d="M82 65 L65 88 L54 124 M118 65 L135 88 L146 124 M87 111 L83 158 L78 218 M113 111 L117 158 L122 218" fill="none" stroke="url(#skin-'+safe(e.id)+')" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>'+muscles[group]+'</g><circle cx="100" cy="38" r="16" fill="none" stroke="#eef3ed" stroke-opacity=".5"/></svg></div><div class="muscle-caption"><span class="pulse-dot"></span><span>'+safe(muscleNames)+'</span></div></div>';
}
function renderCatalog(){
 const q=$("#searchInput").value.toLowerCase();
 const list=EXERCISES.filter(e=>(activeFilter==="all"||e.type===activeFilter)&&(`${e.name} ${e.machine} ${e.category} ${e.muscles.join(" ")}`).toLowerCase().includes(q));
 $("#catalogCount").textContent=list.length;
 $("#exerciseGrid").innerHTML=list.map(e=>`<article class="exercise-card" data-id="${e.id}"><div class="exercise-image">${exerciseVisual(e)}<span class="muscle-tag">${e.category.toUpperCase()}</span></div><div class="exercise-info"><h3>${e.name}</h3><p>${e.machine} · ${e.muscles.slice(0,2).join(", ")}</p><a class="card-video-link" href="${e.video}" target="_blank" rel="noopener" aria-label="Видео: ${e.name}" onclick="event.stopPropagation()">▶ Видео с техникой</a><div class="card-bottom"><span>${e.sets} подхода · ${e.reps}</span><b>Подробнее ↗</b></div></div></article>`).join("") || '<p class="text-sm text-gray-400">Ничего не найдено. Попробуй изменить запрос.</p>';
 $(".exercise-card").forEach(c=>c.addEventListener("click",()=>openExercise(c.dataset.id)));
 
}
$("#searchInput").addEventListener("input",renderCatalog);
$$("[data-filter]").forEach(b=>b.addEventListener("click",()=>{activeFilter=b.dataset.filter;$$("[data-filter]").forEach(x=>x.classList.toggle("active",x===b));renderCatalog();}));
function openExercise(id){
 const e=EXERCISES.find(x=>x.id===id);if(!e)return;
 $("#modalContent").innerHTML=`<div class="modal-video-top"><a class="video-link video-link-primary" target="_blank" rel="noopener" href="${e.video}">▶ СМОТРЕТЬ ВИДЕО ТЕХНИКИ НА YOUTUBE</a></div>${exerciseVisual(e,"modal-image")}<div class="eyebrow">${e.category.toUpperCase()} · ${e.machine}</div><h2>${e.name}</h2><div class="muscle-pills">${e.muscles.map(m=>`<span>${m}</span>`).join("")}</div>${e.machineDescription?`<div class="detail-panel"><h4>О ТРЕНАЖЁРЕ / УПРАЖНЕНИИ</h4><p>${e.machineDescription}</p><p><b>Назначение:</b> ${e.purpose||""}</p><p><b>Настройка:</b> ${e.setup||""}</p></div>`:""}<h4>ТЕХНИКА ВЫПОЛНЕНИЯ</h4><ol>${e.steps.map(s=>`<li>${s}</li>`).join("")}</ol>${e.mistakes?`<div class="detail-panel"><h4>ЧАСТЫЕ ОШИБКИ</h4><ul>${e.mistakes.map(m=>`<li>${m}</li>`).join("")}</ul></div>`:""}<p><b>Ориентир:</b> ${e.sets} подхода · ${e.reps} · отдых ${e.rest} сек.</p>${e.imagePage?`<p class="image-credit">Фото: <a href="${e.imagePage}" target="_blank" rel="noopener">${e.imageCredit||"Источник изображения"}</a> · ${e.imageLicense||""}</p>`:""}<div class="modal-actions"><button class="btn-secondary" id="addExercise">Добавить в мой план</button></div>`;

 $("#exerciseModal").classList.remove("hidden");
 $("#addExercise").addEventListener("click",()=>{if(!currentPlan)currentPlan={title:"Мой список упражнений",days:[{name:"Избранные упражнения",items:[]}]};if(!currentPlan.days[0].items.some(x=>x.id===e.id))currentPlan.days[0].items.push({...e,weight:"—"});savePlan();$("#exerciseModal").classList.add("hidden");});
}
$$("[data-close]").forEach(b=>b.addEventListener("click",()=>$("#exerciseModal").classList.add("hidden")));
$("#exerciseModal").addEventListener("click",e=>{if(e.target.classList.contains("modal-backdrop"))$("#exerciseModal").classList.add("hidden")});
function getSelectedEquipment(){return $$('input[name="equipment"]:checked').map(x=>x.value)}
function buildProgram(p){
 const available=EXERCISES.filter(e=>{
  if(e.type==="pool")return p.equipment.includes("pool");
  if(e.machine==="Гантели")return p.equipment.includes("dumbbells")||p.equipment.includes("gym");
  if(e.machine==="Собственный вес")return p.equipment.includes("body")||p.equipment.includes("gym");
  if(e.machine==="Бассейн")return p.equipment.includes("pool");
  return p.equipment.includes("gym")||p.equipment.includes("barbell");
 });
 let groups;
 if(p.level==="beginner")groups=[["Тренировка A — всё тело",["bench","latpull","squat","shoulder","plank"]],["Тренировка B — всё тело",["chestpress","row","legpress","lateral","curl"]]];
 else if(p.level==="intermediate")groups=[["День 1 — Верх тела",["bench","latpull","shoulder","row","curl"]],["День 2 — Низ тела и кор",["squat","legpress","plank"]],["День 3 — Верх тела",["chestpress","row","lateral","curl","plank"]]];
 else groups=[["День 1 — Грудь и плечи",["bench","chestpress","shoulder","lateral"]],["День 2 — Спина и руки",["latpull","row","curl"]],["День 3 — Ноги и кор",["squat","legpress","plank"]],["День 4 — Смешанная",["chestpress","latpull","lateral","plank"]]];
 if(p.equipment.includes("pool")&&!p.equipment.includes("gym")){const poolIds=["swim","kick","backstroke","breaststroke","kickboardback","dolphinkick","waterjog","aquajacks","noodlepress","sculling","sidekick"];groups=[["Бассейн — техника и положение тела",["swim","backstroke","kickboardback","sidekick"]],["Бассейн — координация и выносливость",["breaststroke","dolphinkick","waterjog","aquajacks","noodlepress","sculling"]]];}
 const levelFactor={beginner:.45,intermediate:.60,advanced:.70}[p.level];
 const goalSets={fat:3,mass:4,tone:3,maintain:2}[p.goal];
 const goalReps={fat:"12–15",mass:"6–12",tone:"10–15",maintain:"8–12"}[p.goal];
 const rest={fat:60,mass:120,tone:60,maintain:90}[p.goal];
 const days=groups.map(([name,ids])=>({name,items:ids.map(id=>available.find(e=>e.id===id)).filter(Boolean).map(e=>{
  const base=(p.weight*(e.type==="legs"?.35:e.type==="back"?.22:.16));
  const kg=Math.max(1,Math.round(base*levelFactor/2.5)*2.5);
  const sets=p.level==="beginner"?2:goalSets;
  return {...e,sets,reps:e.type==="pool"?e.reps:goalReps,rest:e.type==="pool"?e.rest:rest,weight:e.type==="pool"?"Без отягощения":`${kg} кг*`};
 })}));
 return {title:`Программа: ${({fat:"Похудение",mass:"Набор массы",tone:"Рельеф",maintain:"Поддержание формы"})[p.goal]}`,profile:p,days,created:new Date().toLocaleDateString("ru-RU"),note:"* Оценка стартового рабочего веса условная. Начни с лёгкого веса, оставляй 2–3 повтора в запасе и корректируй нагрузку по технике и самочувствию."};
}
$("#profileForm").addEventListener("submit",e=>{
 e.preventDefault();
 const p={sex:$("#sex").value,age:+$("#age").value,weight:+$("#weight").value,height:+$("#height").value,level:$("#level").value,goal:$("#goal").value,equipment:getSelectedEquipment()};
 if(!p.equipment.length){alert("Выбери хотя бы один вариант инвентаря.");return;}
 if(p.age<14||p.age>90||p.weight<35||p.weight>250||p.height<130||p.height>220){alert("Проверь введённые параметры.");return;}
 lastGenerated=buildProgram(p);renderGenerated(lastGenerated);
});
function renderGenerated(plan){
 $("#generatedResult").classList.remove("hidden");
 $("#generatedResult").innerHTML=`<div class="result-header"><div><div class="eyebrow">ТВОЙ РЕЗУЛЬТАТ</div><h3>${plan.title}</h3><p class="text-xs text-gray-400 mt-1">План на неделю · ${plan.days.length} тренировочных дней</p></div><button class="btn-primary save-plan" id="savePlan">Сохранить план ✓</button></div><div class="result-days">${plan.days.map(d=>`<div class="plan-day"><h4>${d.name}</h4><p>${d.items.length} упражнений · ориентир 45–65 минут</p>${d.items.map(i=>`<div class="plan-exercise"><div>${i.name}<small>${i.sets} подхода × ${i.reps} · отдых ${i.rest} сек.</small></div><strong>${i.weight}</strong></div>`).join("")||"<p>Для выбранного инвентаря нет упражнений в этом дне.</p>"}</div>`).join("")}</div><p class="disclaimer">${plan.note}</p>`;
 $("#savePlan").addEventListener("click",()=>{currentPlan=plan;savePlan();showTab("plan");});
}
function savePlan(){localStorage.setItem("fitMasterPlan",JSON.stringify(currentPlan));$("#planBadge").textContent=currentPlan?.days?.reduce((n,d)=>n+d.items.length,0)||0;renderPlan();}
function renderPlan(){
 const el=$("#myPlanContent");
 if(!currentPlan){el.innerHTML='<div class="empty-state"><b>Пока нет сохранённой программы</b><p>Собери план в конструкторе или добавь упражнения из каталога.</p><button class="btn-primary" data-goto="builder">Создать программу ↗</button></div>';el.querySelector("[data-goto]")?.addEventListener("click",()=>showTab("builder"));return;}
 el.innerHTML=`<div class="result-header"><div><div class="eyebrow">СОХРАНЕНО ${currentPlan.created||""}</div><h3>${currentPlan.title}</h3></div><button class="btn-secondary" id="clearPlan">Очистить план</button></div><div class="result-days">${currentPlan.days.map(d=>`<div class="plan-day"><h4>${d.name}</h4>${d.items.map(i=>`<div class="plan-exercise"><div>${i.name}<small>${i.sets} подхода × ${i.reps} · отдых ${i.rest} сек.</small></div><strong>${i.weight}</strong></div>`).join("")}</div>`).join("")}</div><p class="disclaimer">${currentPlan.note||"План сохранён в памяти этого браузера."}</p>`;
 $("#clearPlan").addEventListener("click",()=>{if(confirm("Удалить сохранённую программу?")){currentPlan=null;localStorage.removeItem("fitMasterPlan");savePlan();}});
}
renderCatalog();$("#planBadge").textContent=currentPlan?.days?.reduce((n,d)=>n+d.items.length,0)||0;