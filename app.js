const SHEET='1ai7IKTxgIhXjxiB6eI8E0D_KFdkgMGACCq7TBO_YCIA',GID='225266656';
const JOBS=['버서커','레인저','어쌔신','나이트','아티산','블레스드','오라클','엘리멘탈리스트'];
const fmt=n=>Number(n||0).toLocaleString('ko-KR');let members=[];
function clean(s){return String(s??'').trim()}function num(v){return Number(String(v??'').replace(/[^\d.-]/g,''))||0}
function parseGViz(t){const a=t.indexOf('{'),b=t.lastIndexOf('}');if(a<0||b<0)throw Error('구글 시트 응답을 읽을 수 없습니다.');const d=JSON.parse(t.slice(a,b+1));if(d.status==='error')throw Error('시트 접근 오류: 공개 설정을 확인하세요.');return d.table}
function parseMembers(table){
 const rows=(table.rows||[]).map(r=>(r.c||[]).map(c=>c?.f??c?.v??''));
 const labels=(table.cols||[]).map(c=>clean(c.label));
 const patterns={name:/캐릭터|닉네임|캐릭명|이름|길드원/i,job:/직업|클래스|직군/i,power:/전투력|투력|power/i,level:/레벨|^lv$|level/i};
 const candidates=[{heads:labels,start:0},...rows.slice(0,12).map((r,i)=>({heads:r.map(clean),start:i+1}))];
 let best=null,bestScore=-1;
 for(const c of candidates){const idx={};let score=0;for(const [k,re] of Object.entries(patterns)){idx[k]=c.heads.findIndex(h=>re.test(clean(h)));if(idx[k]>=0)score++}if(score>bestScore){best={...c,idx};bestScore=score}}
 let {name:ni,job:ji,power:pi,level:li}=best.idx;
 const data=rows.slice(best.start).filter(r=>r.some(v=>clean(v)));
 const width=Math.max(labels.length,...rows.map(r=>r.length),0);
 if(ji<0){const scores=Array.from({length:width},(_,i)=>data.filter(r=>JOBS.includes(clean(r[i]))).length);const max=Math.max(0,...scores);ji=max?scores.indexOf(max):-1}
 if(pi<0){const scores=Array.from({length:width},(_,i)=>i===ji?-1:data.filter(r=>num(r[i])>=10000).length);const max=Math.max(0,...scores);pi=max?scores.indexOf(max):-1}
 if(ni<0){const scores=Array.from({length:width},(_,i)=>i===ji||i===pi?-1:data.filter(r=>{const v=clean(r[i]);return v.length>0&&v.length<30&&!/^[-+]?\\d[\\d,.]*$/.test(v)&&!JOBS.includes(v)}).length);const max=Math.max(0,...scores);ni=max?scores.indexOf(max):-1}
 if(ni<0||ji<0||pi<0)throw Error('시트에서 캐릭터명·직업·전투력 열을 인식하지 못했습니다.');
 const found=data.map(r=>({name:clean(r[ni]),job:clean(r[ji]),power:num(r[pi]),level:li>=0?num(r[li]):0})).filter(r=>r.name&&JOBS.includes(r.job)&&r.power>0&&!/합계|총계/.test(r.name)).sort((a,b)=>b.power-a.power);
 if(!found.length)throw Error('시트에서 유효한 길드원 데이터를 찾지 못했습니다.');
 return found;
}
function el(id){return document.getElementById(id)}function put(id,s){if(el(id))el(id).textContent=s}
function setupFilters(){let select=el('job');if(select)select.innerHTML='<option value="">전체 직업</option>'+JOBS.map(j=>`<option value="${j}">${j}</option>`).join('');el('search')?.addEventListener('input',render);select?.addEventListener('change',render);el('refresh')?.addEventListener('click',load)}
function filtered(){const q=clean(el('search')?.value).toLowerCase(),j=el('job')?.value;return members.filter(m=>(!j||m.job===j)&&(!q||m.name.toLowerCase().includes(q)))}
function td(tr,v,cls){let c=document.createElement('td');c.textContent=v;if(cls)c.className=cls;tr.append(c)}
function render(){let tbody=el('rows');if(tbody){tbody.replaceChildren();let all=filtered();all.forEach((m,i)=>{let tr=document.createElement('tr');let global=members.indexOf(m)+1;td(tr,global+'위',global<=3?'rank'+global:'');td(tr,m.name);td(tr,m.job);td(tr,m.level?fmt(m.level):'-');td(tr,fmt(m.power));tbody.append(tr)});put('count',`${all.length}명 표시 / 전체 ${members.length}명`)}if(el('toprows')){el('toprows').replaceChildren();members.slice(0,5).forEach((m,i)=>{let tr=document.createElement('tr');td(tr,(i+1)+'위','rank'+(i+1));td(tr,m.name);td(tr,m.job);td(tr,fmt(m.power));el('toprows').append(tr)})}const total=members.reduce((s,m)=>s+m.power,0);put('total',fmt(members.length));put('avg',fmt(members.length?Math.round(total/members.length):0));put('max',fmt(members[0]?.power||0));put('jobcount',fmt(new Set(members.map(m=>m.job)).size));let jt=el('jobrows');if(jt){jt.replaceChildren();JOBS.forEach(j=>{let a=members.filter(m=>m.job===j);if(!a.length)return;let tr=document.createElement('tr');td(tr,j);td(tr,fmt(a.length));td(tr,fmt(Math.round(a.reduce((s,m)=>s+m.power,0)/a.length)));td(tr,fmt(Math.max(...a.map(m=>m.power))));jt.append(tr)})}renderGrowth()}
function snapshot(){try{const key='cheonsal_history_v1',list=JSON.parse(localStorage.getItem(key)||'[]'),today=new Date().toLocaleDateString('en-CA');let i=list.findIndex(x=>x.date===today);const item={date:today,players:members.map(m=>({name:m.name,power:m.power}))};if(i>=0)list[i]=item;else list.push(item);localStorage.setItem(key,JSON.stringify(list.slice(-90)))}catch(e){}}
function renderGrowth(){let t=el('growrows');if(!t)return;t.replaceChildren();let list=[];try{list=JSON.parse(localStorage.getItem('cheonsal_history_v1')||'[]')}catch(e){}const today=new Date().toLocaleDateString('en-CA'),previous=[...list].reverse().find(x=>x.date!==today);put('baseline',previous?'비교 기준: '+previous.date:'이 브라우저에 이전 날짜 기록이 없습니다. 다른 날 다시 접속하면 비교할 수 있습니다.');if(!previous)return;const old=new Map(previous.players.map(p=>[p.name,p.power]));members.filter(m=>old.has(m.name)).map(m=>({...m,change:m.power-old.get(m.name)})).sort((a,b)=>b.change-a.change).forEach((m,i)=>{let tr=document.createElement('tr');td(tr,i+1);td(tr,m.name);td(tr,fmt(m.power));td(tr,(m.change>0?'+':'')+fmt(m.change));t.append(tr)})}
async function load(){put('status','구글 시트 불러오는 중…');try{const r=await fetch(`https://docs.google.com/spreadsheets/d/${SHEET}/gviz/tq?gid=${GID}&tqx=out:json&_=${Date.now()}`,{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);members=parseMembers(parseGViz(await r.text()));snapshot();render();put('status','연동 완료 · '+new Date().toLocaleTimeString('ko-KR')+' 기준')}catch(e){put('status','불러오기 실패: '+e.message);console.error(e)}}
document.addEventListener('DOMContentLoaded',()=>{setupFilters();load()});
