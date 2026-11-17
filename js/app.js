const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
let activeFilter = "all";
let currentPlan = JSON.parse(localStorage.getItem("fitMasterPlan") || "null");
let lastGenerated = null;
const titles = {catalog:"Каталог тренажёров",builder:"Подбор программы",plan:"Мой план"};
function showTab(tab){$$(".tab-panel").forEach(x=>x.classList.toggle("active",x.id===tab));$$(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.tab===tab));$("#pageTitle").textContent=titles[tab];if(tab==="plan")renderPlan();window.scrollTo({top:0,behavior:"smooth"});}
$$("[data-tab]").forEach(b=>b.addEventListener("click",()=>showTab(b.dataset.tab)));
$$("[data-goto]").forEach(b=>b.addEventListener("click",()=>showTab(b.dataset.goto)));
// Боковая учебная схема — как пиктограммы техники на тренажёрах.
function exerciseVisual(e, extraClass=""){
 const group=e.type==="pool"?"pool":["chest"].includes(e.type)?"chest":["back"].includes(e.type)?"back":["legs","glutes"].includes(e.type)?"legs":["shoulders"].includes(e.type)?"shoulders":["arms"].includes(e.type)?"arms":"core";
 const safe=s=>String(s||"").replace(/[&<>"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch]));
 const muscleNames=(e.muscles||[]).slice(0,3).join(" · ");
 const hot={
 chest:'<path class="hot" d="M91 66 Q105 62 111 76 L107 91 Q95 91 89 82Z"/><path class="hot" d="M108 83 Q117 91 122 106 L114 111 Q107 99 103 91Z"/>',
 back:'<path class="hot" d="M91 65 Q82 77 88 99 L98 105 L103 80Z"/><path class="hot" d="M103 78 Q112 85 111 103 L104 108 L99 91Z"/>',
 legs:'<path class="hot" d="M91 119 Q105 121 109 138 L103 168 L91 165 L88 140Z"/><path class="hot" d="M90 165 L103 166 L98 194 L87 193Z"/><path class="hot" d="M90 111 Q104 106 111 119 L107 132 L91 129Z"/>',
 shoulders:'<ellipse class="hot" cx="96" cy="64" rx="12" ry="10"/><path class="hot" d="M99 70 Q111 76 116 95 L108 99 L98 82Z"/>',
 arms:'<path class="hot" d="M103 74 Q116 82 121 99 L113 106 Q105 92 99 84Z"/><ellipse class="hot" cx="117" cy="108" rx="7" ry="10"/>',
 core:'<path class="hot" d="M91 79 Q103 82 109 91 L107 119 L91 117Z"/><path class="hot" d="M91 82 L98 84 L94 116 L88 111Z"/>',
 pool:'<path class="hot" d="M91 79 Q103 82 109 91 L107 119 L91 117Z"/><path class="hot" d="M91 119 Q105 121 109 138 L103 168 L91 165 L88 140Z"/>'
 }[group];
 const equipment={
 bench:'<path class="prop" d="M25 151H172M48 151L40 190M145 151L155 190M55 133H137M61 133L54 145M130 133L138 145M28 48H172M38 39V58M162 39V58M28 48V151M172 48V151"/>',
 chestpress:'<path class="prop" d="M34 34V184M34 34H154L170 51V184M34 184H170M52 82H120M52 82V117M120 82V117M120 82L144 65M144 65V106M52 117H120M72 117V147M48 147H142"/>',
 latpull:'<path class="prop" d="M160 18V185M150 18H170M160 18L108 48V67M108 67H138M108 67V79M42 160H146M52 160V184M138 160V184M95 78V91M80 91H110"/>',
 row:'<path class="prop" d="M28 174H173M40 174V190M160 174V190M48 133H112M48 133V151M112 133V151M112 142H145M145 142V154M145 154H157M157 154V165M35 42H35V174"/>',
 squat:'<path class="prop" d="M45 24V184M155 24V184M45 24H155M45 184H155M45 53H155M45 53L63 69M155 53L137 69M55 130H145"/>',
 legpress:'<path class="prop" d="M24 184H178M37 184L54 105L105 77L159 77M54 105L80 160M80 160H150M105 77L132 25H174V77M132 25L174 77M137 84L164 84"/>',
 shoulder:'<path class="prop" d="M42 178H158M55 178V190M145 178V190M100 95V145M75 145H125M76 72V95M124 72V95M76 72L66 55M124 72L134 55"/>',
 lateral:'<path class="prop" d="M32 181H168M48 181V190M152 181V190M100 110V157M78 157H122M70 75L55 55M130 75L145 55"/>',
 curl:'<path class="prop" d="M30 181H170M45 181V190M155 181V190M75 120L95 120M105 120L125 120"/>',
 plank:'<path class="prop" d="M20 172H180M35 172V184M165 172V184"/>',
 swim:'<path class="prop water" d="M12 145Q30 137 48 145T84 145T120 145T156 145T192 145M12 165Q30 157 48 165T84 165T120 165T156 165T192 165"/>',
 kick:'<path class="prop water" d="M12 145Q30 137 48 145T84 145T120 145T156 145T192 145"/><path class="prop" d="M45 75L150 75L160 91H45Z"/>',
 legextension:'<path class="prop" d="M36 178H164M48 178V190M152 178V190M54 93H113V132H54ZM113 111L145 133V151M145 133H159M58 132V155"/>',
 legcurl:'<path class="prop" d="M28 178H174M40 178V190M162 178V190M43 100H119V132H43ZM119 115L145 137L154 124M43 132V150"/>',
 hipabduction:'<path class="prop" d="M35 180H165M48 180V190M152 180V190M57 85H143V140H57ZM57 112L39 102M143 112L161 102"/>',
 pecdeck:'<path class="prop" d="M100 40V180M38 180H162M55 90L36 56L24 62L43 112M145 90L164 56L176 62L157 112M55 90H80M145 90H120"/>',
 smithsquat:'<path class="prop" d="M40 20V188M160 20V188M40 20H160M40 188H160M52 75H148M52 75V86M148 75V86M52 86H148"/>',
 assistedpullup:'<path class="prop" d="M40 20V185M160 20V185M40 20H160M55 58H145M72 58V82M128 58V82M65 145H135M65 145V165M135 145V165"/>',
 tricepspushdown:'<path class="prop" d="M158 18V183M148 18H168M158 18L120 42V65M120 65V82M120 82H139M38 180H170M48 180V190M160 180V190"/>',
 calfraise:'<path class="prop" d="M30 178H170M45 178V190M155 178V190M52 118H148V145H52ZM65 90H135V118H65ZM60 145H140"/>',
 backstroke:'<path class="prop water" d="M12 145Q30 137 48 145T84 145T120 145T156 145T192 145M12 165Q30 157 48 165T84 165T120 165T156 165T192 165"/>',
 breaststroke:'<path class="prop water" d="M12 145Q30 137 48 145T84 145T120 145T156 145T192 145"/>',
 kickboardback:'<path class="prop water" d="M12 145Q30 137 48 145T84 145T120 145T156 145T192 145"/><path class="prop" d="M50 90H145L155 102H50Z"/>',
 dolphinkick:'<path class="prop water" d="M12 145Q30 137 48 145T84 145T120 145T156 145T192 145"/>',
 waterjog:'<path class="prop water" d="M12 145Q30 137 48 145T84 145T120 145T156 145T192 145M12 165Q30 157 48 165T84 165T120 165T156 165T192 165"/>',
 aquajacks:'<path class="prop water" d="M12 145Q30 137 48 145T84 145T120 145T156 145T192 145"/>',
 noodlepress:'<path class="prop water" d="M12 145Q30 137 48 145T84 145T120 145T156 145T192 145"/><path class="prop" d="M55 80Q100 110 145 80"/>',
 sculling:'<path class="prop water" d="M12 145Q30 137 48 145T84 145T120 145T156 145T192 145"/><path class="prop" d="M70 90L45 110M130 90L155 110"/>',
 sidekick:'<path class="prop water" d="M12 145Q30 137 48 145T84 145T120 145T156 145T192 145"/>'
 };
 const gear=equipment[e.id]||'<path class="prop" d="M28 180H172M40 180V190M160 180V190"/>';
 return '<div class="exercise-visual '+extraClass+' exercise-'+safe(e.id)+'"><div class="motion-stage motion-'+group+'"><svg class="anatomy side-anatomy" viewBox="0 0 200 210" role="img" aria-label="Схема упражнения '+safe(e.name)+'. Подсвечены мышцы: '+safe(muscleNames)+'"><g class="machine-props">'+gear+'</g><g class="body"><circle class="head" cx="103" cy="36" r="14"/><path class="torso" d="M94 51Q106 47 113 58L116 91Q112 111 108 126L89 123Q91 103 88 87L88 63Z"/><path class="limb arm-far" d="M91 61Q80 76 77 94L68 112"/><path class="limb arm-near" d="M108 64Q120 77 121 94L135 108"/><path class="limb leg-far" d="M91 120Q81 139 82 157L70 184"/><path class="limb leg-near" d="M106 123Q119 143 115 158L130 184"/>'+hot+'<path class="hand" d="M65 112L71 115M132 106L139 108"/><path class="foot" d="M70 184L59 188M130 184L142 188"/></g></svg></div><div class="muscle-caption"><span class="pulse-dot"></span><span>'+safe(muscleNames)+'</span></div></div>';
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