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
 const safe=s=>String(s||"").replace(/[&<>"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch]));
 const muscleNames=(e.muscles||[]).slice(0,3).join(" · ");
  const muscleGroup=({chest:"chest",back:"back",legs:"legs",shoulders:"shoulders",glutes:"glutes",arms:"arms",core:"core"})[e.type]||"core";
  const primaryMuscle=(e.muscles||[])[0]||e.category;
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

 const poses={
 bench:{body:'<circle class="head" cx="58" cy="111" r="10"/><path class="torso" d="M69 106L111 105L125 117L83 121Z"/><path class="limb" d="M82 109L82 83L73 66M105 108L105 82L115 65M83 121L66 133L50 134M116 118L137 132L157 132"/>',hot:'<path class="hot" d="M80 107L111 106L119 115L84 117Z"/>'},
 chestpress:{body:'<circle class="head" cx="82" cy="53" r="10"/><path class="torso" d="M75 65Q95 59 108 75L112 112L78 114L69 84Z"/><path class="limb" d="M76 75L54 84L38 82M105 76L127 84L147 82M82 113L78 151L72 169M107 113L116 150L126 169"/>',hot:'<path class="hot" d="M74 75Q93 66 107 78L109 94L78 94Z"/>'},
 latpull:{body:'<circle class="head" cx="91" cy="65" r="10"/><path class="torso" d="M80 77Q99 69 112 84L113 118L79 119Z"/><path class="limb" d="M82 83L66 60L54 42M108 83L122 60L137 42M84 118L78 150L70 168M108 118L117 150L127 168"/>',hot:'<path class="hot" d="M82 82Q98 75 110 87L108 111L82 110Z"/>'},
 row:{body:'<circle class="head" cx="80" cy="66" r="10"/><path class="torso" d="M89 72L124 83L117 111L84 100Z"/><path class="limb" d="M96 79L75 98L54 104M112 86L132 103L151 105M88 101L77 139L66 165M115 110L126 141L141 164"/>',hot:'<path class="hot" d="M91 76L119 84L114 105L88 98Z"/>'},
 squat:{body:'<circle class="head" cx="104" cy="48" r="10"/><path class="torso" d="M94 61L117 61L124 96L91 99Z"/><path class="limb" d="M96 69L79 83L70 99M116 69L130 83L138 99M96 98L76 119L96 139L78 165M119 98L139 119L120 140L144 164"/>',hot:'<path class="hot" d="M94 97L123 96L138 118L120 132L99 119L77 119Z"/>'},
 legpress:{body:'<circle class="head" cx="64" cy="72" r="9"/><path class="torso" d="M73 69L106 79L101 108L68 99Z"/><path class="limb" d="M75 91L61 111L45 115M101 92L119 103L137 106M98 106L119 124L145 121L165 95M74 100L87 125L113 131"/>',hot:'<path class="hot" d="M87 105L104 108L129 124L149 117L143 132L112 139L87 122Z"/>'},
 shoulder:{body:'<circle class="head" cx="101" cy="51" r="10"/><path class="torso" d="M88 64Q102 58 115 66L120 111L84 111Z"/><path class="limb" d="M89 72L74 50L70 28M114 72L128 50L132 28M88 110L81 145L77 169M115 110L122 145L127 169"/>',hot:'<path class="hot" d="M88 66Q101 57 115 67L119 82L85 82Z"/>'},
 lateral:{body:'<circle class="head" cx="101" cy="45" r="10"/><path class="torso" d="M88 58Q102 53 115 61L117 108L86 108Z"/><path class="limb" d="M90 67L66 64L43 65M113 67L137 64L160 65M90 108L84 145L80 171M113 108L120 145L126 171"/>',hot:'<ellipse class="hot" cx="88" cy="66" rx="10" ry="9"/><ellipse class="hot" cx="115" cy="66" rx="10" ry="9"/>'},
 curl:{body:'<circle class="head" cx="101" cy="44" r="10"/><path class="torso" d="M88 57Q102 52 115 60L117 108L86 108Z"/><path class="limb" d="M90 68L81 93L93 102L96 79M113 68L122 93L110 102L108 79M90 108L84 145L80 171M113 108L120 145L126 171"/>',hot:'<path class="hot" d="M81 80L94 91L100 82L94 70Z"/><path class="hot" d="M121 80L108 91L102 82L108 70Z"/>'},
 plank:{body:'<circle class="head" cx="35" cy="91" r="9"/><path class="torso" d="M44 88L105 91L137 94L137 103L104 101L45 98Z"/><path class="limb" d="M48 95L35 125L20 125M104 99L125 119L158 119M134 101L157 119L181 119"/>',hot:'<path class="hot" d="M45 89L105 92L136 95L136 101L104 98L45 95Z"/>'},
 legextension:{body:'<circle class="head" cx="78" cy="51" r="9"/><path class="torso" d="M72 63L101 65L108 104L74 105Z"/><path class="limb" d="M76 73L60 91L52 110M102 74L119 91L132 109M82 103L78 133L100 139L130 139L155 139M105 104L116 130L133 139"/>',hot:'<path class="hot" d="M83 105L105 106L124 134L151 134L152 144L121 145L99 124Z"/>'},
 legcurl:{body:'<circle class="head" cx="43" cy="99" r="9"/><path class="torso" d="M53 95L111 96L118 108L54 108Z"/><path class="limb" d="M60 100L50 123L37 129M108 104L133 119L151 115L163 96M107 106L130 124L145 143L163 131"/>',hot:'<path class="hot" d="M105 104L134 118L151 112L162 95L169 101L158 126L132 133L109 116Z"/>'},
 hipabduction:{body:'<circle class="head" cx="101" cy="48" r="9"/><path class="torso" d="M88 60Q101 55 114 62L117 105L85 105Z"/><path class="limb" d="M90 71L76 90L72 104M112 71L126 90L130 104M91 104L72 127L46 135M111 104L130 127L156 135"/>',hot:'<path class="hot" d="M87 100L115 100L136 125L153 131L149 141L124 137L101 119L76 137L48 141L45 132L72 124Z"/>'},
 pecdeck:{body:'<circle class="head" cx="101" cy="48" r="9"/><path class="torso" d="M88 60Q101 55 114 62L117 105L85 105Z"/><path class="limb" d="M89 70L69 83L50 72M113 70L133 83L152 72M91 105L82 143L79 168M111 105L120 143L124 168"/>',hot:'<path class="hot" d="M88 67Q101 60 115 67L115 91L88 91Z"/>'},
 smithsquat:{body:'<circle class="head" cx="101" cy="49" r="9"/><path class="torso" d="M89 61L113 61L120 99L86 99Z"/><path class="limb" d="M90 70L73 78L69 88M112 70L129 78L133 88M91 98L72 119L92 139L75 166M115 98L136 119L117 139L143 166"/>',hot:'<path class="hot" d="M87 98L120 98L137 119L118 136L97 120L73 119Z"/>'},
 assistedpullup:{body:'<circle class="head" cx="101" cy="65" r="9"/><path class="torso" d="M88 77Q101 70 114 78L117 113L85 113Z"/><path class="limb" d="M90 83L78 55L75 28M112 83L124 55L127 28M90 113L83 140L81 158M112 113L119 140L121 158"/>',hot:'<path class="hot" d="M87 79Q101 71 115 80L113 105L88 105Z"/>'},
 tricepspushdown:{body:'<circle class="head" cx="101" cy="45" r="9"/><path class="torso" d="M88 57Q101 52 114 59L117 107L85 107Z"/><path class="limb" d="M90 67L111 78L122 102L124 126M113 67L129 83L139 104L139 126M90 107L83 145L79 170M112 107L120 145L126 170"/>',hot:'<path class="hot" d="M111 78L123 98L128 123L120 125L113 102L104 86Z"/>'},
 calfraise:{body:'<circle class="head" cx="101" cy="42" r="9"/><path class="torso" d="M88 55Q101 50 114 57L117 104L85 104Z"/><path class="limb" d="M91 104L88 140L94 165L85 169M111 104L114 140L108 165L118 169M88 140L82 148M114 140L121 148"/>',hot:'<path class="hot" d="M83 136L96 137L99 162L88 166Z"/><path class="hot" d="M106 137L119 136L117 166L106 162Z"/>'},
 };
 const p=poses[e.id]||poses.plank;
 const gear=equipment[e.id]||'<path class="prop" d="M28 180H172"/>';
 const EXERCISE_IMAGE_MAP={"bench":"bench-press","chestpress":"chest-press-machine","latpull":"lat-pulldown","row":"seated-cable-row","squat":"goblet-squat","legpress":"leg-press","shoulder":"dumbbell-shoulder-press","lateral":"lateral-raises","curl":"biceps-curl","legextension":"leg-extension","legcurl":"leg-curl","hipabduction":"hip-abduction-machine","pecdeck":"pec-deck","smithsquat":"smith-machine-squat","assistedpullup":"assisted-pull-up","calfraise":"seated-calf-raise"};
 const imageId=EXERCISE_IMAGE_MAP[e.id];
 const imageBase=imageId?'https://raw.githubusercontent.com/MarvinNazari/exercise-images/main/images/'+imageId+'/':'';
 const photo=imageId?'<img class="exercise-photo" src="'+imageBase+'start.webp" data-end="'+imageBase+'end.webp" alt="Техника: '+safe(e.name)+'" loading="lazy" decoding="async">':'';
 return '<div data-muscle-group="'+muscleGroup+'" class="exercise-visual '+extraClass+' exercise-'+safe(e.id)+'">'+photo+'<div class="exercise-vector-fallback"><svg class="anatomy side-anatomy exercise-inline-svg" viewBox="0 0 200 210" role="img" aria-label="Схема упражнения '+safe(e.name)+'. Работающие мышцы: '+safe(muscleNames)+'"><g class="machine-props">'+gear+'</g><g class="body">'+p.body+p.hot+'</g></svg></div><div class="muscle-caption"><span class="pulse-dot"></span><span class="primary-muscle">'+safe(primaryMuscle)+'</span><span class="secondary-muscles">'+safe((e.muscles||[]).slice(1,3).join(" · "))+'</span></div></div>';
}

// Надёжная загрузка иллюстраций: основной raw GitHub + резервный jsDelivr.
// Если обе сети недоступны, остаётся встроенная схема упражнения.
function mountExerciseMedia(root=document){
 root.querySelectorAll(".exercise-photo").forEach(img=>{
  if(img.dataset.mediaBound)return;
  img.dataset.mediaBound="1";
  const raw=img.getAttribute("src");
  const endRaw=img.dataset.end;
  const cdn=u=>u.replace("https://raw.githubusercontent.com/MarvinNazari/exercise-images/main/","https://cdn.jsdelivr.net/gh/MarvinNazari/exercise-images@main/");
  let failedHosts=0, showingEnd=false, timer=null;
  const card=img.closest(".exercise-visual");
  img.addEventListener("load",()=>{
   card.classList.add("media-loaded");
   if(!timer && endRaw){timer=setInterval(()=>{
    showingEnd=!showingEnd;
    img.src=(showingEnd?endRaw:raw);
   },1700);}
  });
  img.addEventListener("error",()=>{
   if(failedHosts===0){failedHosts=1;img.src=cdn(showingEnd?endRaw:raw);}
   else {if(timer)clearInterval(timer);img.remove();card.classList.remove("media-loaded");}
  });
  if(img.complete && img.naturalWidth)img.dispatchEvent(new Event("load"));
 });
}

function renderCatalog(){
 const q=$("#searchInput").value.toLowerCase();
 const list=EXERCISES.filter(e=>(activeFilter==="all"||e.type===activeFilter)&&(`${e.name} ${e.machine} ${e.category} ${e.muscles.join(" ")}`).toLowerCase().includes(q));
 $("#catalogCount").textContent=list.length;
 $("#exerciseGrid").innerHTML=list.map(e=>`<article class="exercise-card" data-id="${e.id}"><div class="exercise-image">${exerciseVisual(e)}<span class="muscle-tag">${e.category.toUpperCase()}</span></div><div class="exercise-info"><h3>${e.name}</h3><p>${e.machine} · ${e.muscles.slice(0,2).join(", ")}</p><a class="card-video-link" href="${e.video}" target="_blank" rel="noopener" aria-label="Видео: ${e.name}" onclick="event.stopPropagation()">▶ Видео с техникой</a><div class="card-bottom"><span>${e.sets} подхода · ${e.reps}</span><b>Подробнее ↗</b></div></div></article>`).join("") || '<p class="text-sm text-gray-400">Ничего не найдено. Попробуй изменить запрос.</p>';
 $(".exercise-card").forEach(c=>c.addEventListener("click",()=>openExercise(c.dataset.id)));
 mountExerciseMedia($("#exerciseGrid"));
 
}
$("#searchInput").addEventListener("input",renderCatalog);
$$("[data-filter]").forEach(b=>b.addEventListener("click",()=>{activeFilter=b.dataset.filter;$$("[data-filter]").forEach(x=>x.classList.toggle("active",x===b));renderCatalog();}));
function openExercise(id){
 const e=EXERCISES.find(x=>x.id===id);if(!e)return;
 $("#modalContent").innerHTML=`<div class="modal-video-top"><a class="video-link video-link-primary" target="_blank" rel="noopener" href="${e.video}">▶ СМОТРЕТЬ ВИДЕО ТЕХНИКИ НА YOUTUBE</a></div>${exerciseVisual(e,"modal-image")}<div class="eyebrow">${e.category.toUpperCase()} · ${e.machine}</div><h2>${e.name}</h2><div class="muscle-pills">${e.muscles.map(m=>`<span>${m}</span>`).join("")}</div>${e.machineDescription?`<div class="detail-panel"><h4>О ТРЕНАЖЁРЕ / УПРАЖНЕНИИ</h4><p>${e.machineDescription}</p><p><b>Назначение:</b> ${e.purpose||""}</p><p><b>Настройка:</b> ${e.setup||""}</p></div>`:""}<h4>ТЕХНИКА ВЫПОЛНЕНИЯ</h4><ol>${e.steps.map(s=>`<li>${s}</li>`).join("")}</ol>${e.mistakes?`<div class="detail-panel"><h4>ЧАСТЫЕ ОШИБКИ</h4><ul>${e.mistakes.map(m=>`<li>${m}</li>`).join("")}</ul></div>`:""}<p><b>Ориентир:</b> ${e.sets} подхода · ${e.reps} · отдых ${e.rest} сек.</p>${e.imagePage?`<p class="image-credit">Фото: <a href="${e.imagePage}" target="_blank" rel="noopener">${e.imageCredit||"Источник изображения"}</a> · ${e.imageLicense||""}</p>`:""}<div class="modal-actions"><button class="btn-secondary" id="addExercise">Добавить в мой план</button></div>`;

 $("#exerciseModal").classList.remove("hidden");
 mountExerciseMedia($("#modalContent"));
 $("#addExercise").addEventListener("click",()=>{if(!currentPlan)currentPlan={title:"Мой список упражнений",days:[{name:"Избранные упражнения",items:[]}]};if(!currentPlan.days[0].items.some(x=>x.id===e.id))currentPlan.days[0].items.push({...e,weight:"—"});savePlan();$("#exerciseModal").classList.add("hidden");});
}
$$("[data-close]").forEach(b=>b.addEventListener("click",()=>$("#exerciseModal").classList.add("hidden")));
$("#exerciseModal").addEventListener("click",e=>{if(e.target.classList.contains("modal-backdrop"))$("#exerciseModal").classList.add("hidden")});
function getSelectedEquipment(){return $$('input[name="equipment"]:checked').map(x=>x.value)}
function buildProgram(p){
 const available=EXERCISES.filter(e=>{
  if(e.machine==="Гантели")return p.equipment.includes("dumbbells")||p.equipment.includes("gym");
  if(e.machine==="Собственный вес")return p.equipment.includes("body")||p.equipment.includes("gym");
  return p.equipment.includes("gym")||p.equipment.includes("barbell");
 });
 let groups;
 if(p.level==="beginner")groups=[["Тренировка A — всё тело",["bench","latpull","squat","shoulder","plank"]],["Тренировка B — всё тело",["chestpress","row","legpress","lateral","curl"]]];
 else if(p.level==="intermediate")groups=[["День 1 — Верх тела",["bench","latpull","shoulder","row","curl"]],["День 2 — Низ тела и кор",["squat","legpress","plank"]],["День 3 — Верх тела",["chestpress","row","lateral","curl","plank"]]];
 else groups=[["День 1 — Грудь и плечи",["bench","chestpress","shoulder","lateral"]],["День 2 — Спина и руки",["latpull","row","curl"]],["День 3 — Ноги и кор",["squat","legpress","plank"]],["День 4 — Смешанная",["chestpress","latpull","lateral","plank"]]];
 const zoneExercises={
   chest:["bench","chestpress","pecdeck"], back:["latpull","row","assistedpullup"],
   shoulders:["shoulder","lateral"], arms:["curl","tricepspushdown"],
   abdomen:["plank"], glutes:["hipabduction","squat","legpress","smithsquat"],
   thighs:["squat","legpress","legextension","legcurl","smithsquat"], calves:["calfraise"]
  };
  const focusIds=[...new Set((p.problemZones||[]).flatMap(z=>zoneExercises[z]||[]))];
  if(focusIds.length){
   const already=new Set(groups.flatMap(g=>g[1]));
   const extras=focusIds.filter(id=>available.some(e=>e.id===id)&&!already.has(id));
   groups=groups.map(([name,ids],index)=>[name,ids.concat(extras.filter((id,i)=>i%groups.length===index))]);
  }
  const levelFactor={beginner:.45,intermediate:.60,advanced:.70}[p.level];
 const goalSets={fat:3,mass:4,tone:3,maintain:2}[p.goal];
 const goalReps={fat:"12–15",mass:"6–12",tone:"10–15",maintain:"8–12"}[p.goal];
 const rest={fat:60,mass:120,tone:60,maintain:90}[p.goal];
 const days=groups.map(([name,ids])=>({name,items:ids.map(id=>available.find(e=>e.id===id)).filter(Boolean).map(e=>{
  const base=(p.weight*(e.type==="legs"?.35:e.type==="back"?.22:.16));
  const kg=Math.max(1,Math.round(base*levelFactor/2.5)*2.5);
  const sets=p.level==="beginner"?2:goalSets;
  return {...e,sets,reps:goalReps,rest,weight:`${kg} кг*`};
 })}));
 return {title:`Программа: ${({fat:"Похудение",mass:"Набор массы",tone:"Рельеф",maintain:"Поддержание формы"})[p.goal]}`,profile:p,days,created:new Date().toLocaleDateString("ru-RU"),note:"* Оценка стартового рабочего веса условная. Начни с лёгкого веса, оставляй 2–3 повтора в запасе и корректируй нагрузку по технике и самочувствию."};
}
$("#profileForm").addEventListener("submit",e=>{
 e.preventDefault();
 const p={sex:$("#sex").value,age:+$("#age").value,weight:+$("#weight").value,height:+$("#height").value,level:$("#level").value,goal:$("#goal").value,equipment:getSelectedEquipment(),problemZones:$$("input[name=\"problemZone\"]:checked").map(x=>x.value)};
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