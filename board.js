import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp, getDocs } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
const $=id=>document.getElementById(id);
const safe=s=>{const el=document.createElement('span');el.textContent=String(s??'');return el.innerHTML};
const setup=$('boardSetup'),status=$('postStatus'),submit=$('postSubmit'),list=$('postList');
let cfg;
try{const m=await import('./firebase-config.js?v=20261009h');cfg=m.firebaseConfig}catch(e){}
if(!cfg?.apiKey||!cfg?.projectId||cfg.apiKey.includes('YOUR_')){
 setup.innerHTML='<span class="badge">게시판 준비 중</span><p>게시글 저장 서비스가 아직 연결되지 않았습니다. 운영진이 Firebase 설정을 완료하면 누구나 닉네임으로 글을 쓸 수 있습니다.</p>';
 status.textContent='연결 전에는 글을 저장할 수 없습니다.';
}else{
 try{
  const app=initializeApp(cfg),auth=getAuth(app),db=getFirestore(app);
  await signInAnonymously(auth);
  setup.innerHTML='<span class="badge">천살 자유게시판</span><p>로그인 없이 닉네임으로 글과 댓글을 작성할 수 있습니다. 다른 사람의 닉네임을 사칭하지 마세요.</p>';
  submit.disabled=false;status.textContent='글 작성 가능';
  const posts=collection(db,'cheonsal_posts');
  let lastPost=0;
  $('postForm').addEventListener('submit',async e=>{
   e.preventDefault();
   const nickname=$('postNick').value.trim(),title=$('postTitle').value.trim(),body=$('postBody').value.trim();
   if(!nickname||!title||!body)return;
   if(Date.now()-lastPost<30000){status.textContent='연속 등록은 30초 후 가능합니다.';return}
   submit.disabled=true;status.textContent='등록 중…';
   try{await addDoc(posts,{nickname,title,body,createdAt:serverTimestamp(),uid:auth.currentUser.uid});lastPost=Date.now();$('postTitle').value='';$('postBody').value='';status.textContent='등록 완료';}
   catch(err){status.textContent='등록 실패: 연결 및 권한 설정을 확인해 주세요.';console.error(err)}
   finally{submit.disabled=false}
  });
  const q=query(posts,orderBy('createdAt','desc'),limit(50));
  onSnapshot(q,snap=>{
   $('postCount').textContent=snap.size+'개 · 최신 50개';
   list.replaceChildren();
   if(snap.empty){list.innerHTML='<p class="note">아직 게시글이 없습니다. 첫 글을 남겨 주세요!</p>';return}
   snap.forEach(doc=>{
    const p=doc.data(),id=doc.id,article=document.createElement('article');
    article.className='notice';
    const date=p.createdAt?.toDate?.()?.toLocaleString('ko-KR')||'방금';
    article.innerHTML='<h3>'+safe(p.title)+'</h3><p class="note">'+safe(p.nickname)+' · '+safe(date)+'</p><p style="white-space:pre-wrap;overflow-wrap:anywhere">'+safe(p.body)+'</p><h4>댓글</h4><div class="comments"><p class="note">댓글 불러오는 중…</p></div><form class="commentForm toolbar"><input class="nick" maxlength="20" required placeholder="닉네임"><input class="message" maxlength="500" required placeholder="댓글을 입력하세요"><button type="submit">댓글 등록</button></form><p class="note commentStatus"></p>';
    list.appendChild(article);
    const comments=collection(db,'cheonsal_posts',id,'comments'),area=article.querySelector('.comments');
    onSnapshot(query(comments,orderBy('createdAt','asc'),limit(100)),snapshot=>{
     area.replaceChildren();
     if(snapshot.empty){area.innerHTML='<p class="note">첫 댓글을 남겨보세요.</p>';return}
     snapshot.forEach(c=>{const x=c.data(),p=document.createElement('p');p.style.overflowWrap='anywhere';p.innerHTML='<strong>'+safe(x.nickname)+'</strong> '+safe(x.body);area.appendChild(p)})
    },()=>{area.textContent='댓글을 불러올 수 없습니다.'});
    let lastComment=0;
    article.querySelector('.commentForm').addEventListener('submit',async e=>{
     e.preventDefault();const form=e.currentTarget,nickname=form.querySelector('.nick').value.trim(),body=form.querySelector('.message').value.trim(),msg=article.querySelector('.commentStatus');
     if(!nickname||!body)return;
     if(Date.now()-lastComment<10000){msg.textContent='10초 후 다시 작성할 수 있습니다.';return}
     const btn=form.querySelector('button');btn.disabled=true;
     try{await addDoc(comments,{nickname,body,createdAt:serverTimestamp(),uid:auth.currentUser.uid});lastComment=Date.now();form.querySelector('.message').value='';msg.textContent='댓글 등록 완료'}
     catch(e){msg.textContent='댓글 등록에 실패했습니다.';console.error(e)}
     finally{btn.disabled=false}
    });
   });
  },e=>{list.textContent='게시글 조회 실패: Firebase 설정을 확인해 주세요.';console.error(e)});
 }catch(e){setup.innerHTML='<span class="badge">게시판 연결 오류</span><p>Firebase 익명 인증 또는 데이터베이스 설정을 확인해 주세요.</p>';status.textContent='연결 실패: '+(e.code||e.message||'알 수 없는 오류');const detail=document.createElement('p');detail.className='note';detail.textContent='오류 코드: '+(e.code||'없음')+' / '+(e.message||'');setup.appendChild(detail);console.error(e)}
}
