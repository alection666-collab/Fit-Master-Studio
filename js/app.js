const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
let activeFilter = "all";
let currentPlan = JSON.parse(localStorage.getItem("fitMasterPlan") || "null");
let lastGenerated = null;
const titles = {catalog:"Каталог тренажёров",builder:"Подбор программы",plan:"Мой план"};
function showTab(tab){$$(".tab-panel").forEach(x=>x.classList.toggle("active",x.id===tab));$$(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.tab===tab));$("#pageTitle").textContent=titles[tab];if(tab==="plan")renderPlan();window.scrollTo({top:0,behavior:"smooth"});}
$$("[data-tab]").forEach(b=>b.addEventListener("click",()=>showTab(b.dataset.tab)));
$$("[data-goto]").forEach(b=>b.addEventListener("click",()=>showTab(b.dataset.goto)));
const imageCache = new Map();
async function findExerciseImage(e){
 if(imageCache.has(e.id))return imageCache.get(e.id);
 const fallback=e.image && !e.image.includes("unsplash.com") ? e.image : "";
 try{
  const url="https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch="+encodeURIComponent((e.imageQuery||e.name+" exercise demonstration")+" filetype:bitmap")+"&gsrlimit=1&prop=imageinfo&iiprop=url&iiurlwidth=900&format=json&origin=*";
  const r=await fetch(url); if(!r.ok)throw new Error("Commons unavailable");
  const j=await r.json(); const page=Object.values(j.query?.pages||{})[0];
  const found=page?.imageinfo?.[0]?.thumburl||page?.imageinfo?.[0]?.url||fallback;
  imageCache.set(e.id,found);return found;
 }catch(_){imageCache.set(e.id,fallback);return fallback;}
}
function hydrateExerciseImages(root=document){
 root.querySelectorAll("img[data-exercise-id]").forEach(async img=>{
  const e=EXERCISES.find(x=>x.id===img.dataset.exerciseId);if(!e)return;
  const src=await findExerciseImage(e);if(src&&img.isConnected){img.src=src;img.classList.remove("image-pending");}
  else if(img.isConnected){img.alt="Фото упражнения пока недоступно";img.classList.add("image-unavailable");}
 });
}
function renderCatalog(){
 const q=$("#searchInput").value.toLowerCase();
 const list=EXERCISES.filter(e=>(activeFilter==="all"||e.type===activeFilter)&&(`${e.name} ${e.machine} ${e.category} ${e.muscles.join(" ")}`).toLowerCase().includes(q));
 $("#catalogCount").textContent=list.length;
 $("#exerciseGrid").innerHTML=list.map(e=>`<article class="exercise-card" data-id="${e.id}"><div class="exercise-image"><img class="image-pending" loading="lazy" data-exercise-id="${e.id}" alt="Фото: ${e.name}"><span class="muscle-tag">${e.category.toUpperCase()}</span></div><div class="exercise-info"><h3>${e.name}</h3><p>${e.machine} · ${e.muscles.slice(0,2).join(", ")}</p><a class="card-video-link" href="${e.video}" target="_blank" rel="noopener" aria-label="Видео: ${e.name}" onclick="event.stopPropagation()">▶ Видео с техникой</a><div class="card-bottom"><span>${e.sets} подхода · ${e.reps}</span><b>Подробнее ↗</b></div></div></article>`).join("") || '<p class="text-sm text-gray-400">Ничего не найдено. Попробуй изменить запрос.</p>';
 $(".exercise-card").forEach(c=>c.addEventListener("click",()=>openExercise(c.dataset.id)));
 hydrateExerciseImages($("#exerciseGrid"));
}
$("#searchInput").addEventListener("input",renderCatalog);
$$("[data-filter]").forEach(b=>b.addEventListener("click",()=>{activeFilter=b.dataset.filter;$$("[data-filter]").forEach(x=>x.classList.toggle("active",x===b));renderCatalog();}));
function openExercise(id){
 const e=EXERCISES.find(x=>x.id===id);if(!e)return;
 $("#modalContent").innerHTML=`<div class="modal-video-top"><a class="video-link video-link-primary" target="_blank" rel="noopener" href="${e.video}">▶ СМОТРЕТЬ ВИДЕО ТЕХНИКИ НА YOUTUBE</a></div><img class="modal-image image-pending" data-exercise-id="${e.id}" alt="Фото: ${e.name}"><div class="eyebrow">${e.category.toUpperCase()} · ${e.machine}</div><h2>${e.name}</h2><div class="muscle-pills">${e.muscles.map(m=>`<span>${m}</span>`).join("")}</div>${e.machineDescription?`<div class="detail-panel"><h4>О ТРЕНАЖЁРЕ / УПРАЖНЕНИИ</h4><p>${e.machineDescription}</p><p><b>Назначение:</b> ${e.purpose||""}</p><p><b>Настройка:</b> ${e.setup||""}</p></div>`:""}<h4>ТЕХНИКА ВЫПОЛНЕНИЯ</h4><ol>${e.steps.map(s=>`<li>${s}</li>`).join("")}</ol>${e.mistakes?`<div class="detail-panel"><h4>ЧАСТЫЕ ОШИБКИ</h4><ul>${e.mistakes.map(m=>`<li>${m}</li>`).join("")}</ul></div>`:""}<p><b>Ориентир:</b> ${e.sets} подхода · ${e.reps} · отдых ${e.rest} сек.</p>${e.imagePage?`<p class="image-credit">Фото: <a href="${e.imagePage}" target="_blank" rel="noopener">${e.imageCredit||"Источник изображения"}</a> · ${e.imageLicense||""}</p>`:""}<div class="modal-actions"><button class="btn-secondary" id="addExercise">Добавить в мой план</button></div>`;
 hydrateExerciseImages($("#modalContent"));\n $("#exerciseModal").classList.remove("hidden");
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