const SUPABASE_URL = 'https://kqpzrbaxxakoskpgipbt.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_7pFIDwx-Lvi4VNTAKJ7E6A_6ZliMXZT';

window.fatalFourSupabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

// Homepage presentation helpers. These are intentionally separate from the
// Supabase client setup so the public homepage never exposes backend status.
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const stats = document.querySelectorAll('#home .stats .stat');
    if (stats.length >= 4) {
      stats[0].querySelector('b').textContent = '0';
      stats[0].querySelector('small').textContent = 'players competing';
      stats[1].querySelector('small').textContent = 'your account';
      stats[2].querySelector('small').textContent = 'your bubble teams';
      stats[3].querySelector('small').textContent = 'AP Top 25 teams';
    }
    async function updatePlayerCount() {
      try {
        const { count } = await window.fatalFourSupabase.from('profiles').select('id', { count: 'exact', head: true });
        if (stats[0] && typeof count === 'number') stats[0].querySelector('b').textContent = count.toLocaleString();
      } catch (_) {}
    }
    updatePlayerCount();
    const clock = document.getElementById('clock');
    if (!clock) return;
    function renderCountdown() {
      const kickoff = new Date('2026-08-29T16:00:00Z');
      let total = Math.max(0, Math.floor((kickoff.getTime() - Date.now()) / 1000));
      const days = Math.floor(total / 86400); total %= 86400;
      const hours = Math.floor(total / 3600); total %= 3600;
      const minutes = Math.floor(total / 60); const seconds = total % 60;
      if (!days && !hours && !minutes && !seconds) { clock.innerHTML = '<span class="countdown-locked">LOCKED</span>'; return; }
      const unit = (value, label) => `<span class="countdown-unit"><b>${String(value).padStart(2, '0')}</b><small>${label}</small></span>`;
      clock.innerHTML = `<span class="countdown-grid">${unit(days, 'D')}${unit(hours, 'H')}${unit(minutes, 'M')}${unit(seconds, 'S')}</span>`;
    }
    const style = document.createElement('style');
    style.textContent = `#clock.countdown{white-space:normal;width:100%;margin:12px 0 8px}.countdown-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;width:100%}.countdown-unit{display:flex;flex-direction:column;align-items:center;justify-content:center;background:#13291c;border:1px solid #2b4937;border-radius:9px;padding:8px 4px;min-width:0}.countdown-unit b{font-size:clamp(20px,2.5vw,30px);line-height:1;font-variant-numeric:tabular-nums;letter-spacing:-1px}.countdown-unit small{font-size:10px;color:#b8c9be;font-weight:900;letter-spacing:1px;margin-top:5px}.countdown-locked{display:block;text-align:center;font-size:24px;color:#ff9f2f;font-weight:950}@media(max-width:520px){.countdown-unit{padding:7px 2px}.countdown-unit b{font-size:19px}.countdown-unit small{font-size:9px}}`;
    document.head.appendChild(style);
    const observer = new MutationObserver(() => { if (!clock.querySelector('.countdown-grid,.countdown-locked')) renderCountdown(); });
    observer.observe(clock, { childList: true, characterData: true, subtree: true });
    renderCountdown(); setInterval(renderCountdown, 1000);
  }, 100);
});

// ---------------------------------------------------------------------------
// Prototype-only Demo User mode. Local-only; never bypasses Supabase security.
// ---------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const demoKey = 'fatalFourDemoBubbleV1';
    let demoTeams = [];
    let demoSelected = JSON.parse(localStorage.getItem(demoKey) || '[]');
    const demoActive = () => localStorage.getItem('fatalFourDemoMode') === 'true';
    const escDemo = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    function addDemoButton() {
      const notice = document.getElementById('bubbleNotice'); if (!notice || document.getElementById('demoButton')) return;
      const button = document.createElement('button'); button.id='demoButton'; button.className='outline'; button.style.marginTop='10px'; button.textContent='Continue as Demo User';
      button.onclick=()=>{localStorage.setItem('fatalFourDemoMode','true');startDemo();}; notice.appendChild(document.createElement('br')); notice.appendChild(button);
    }
    async function fetchDemoTeams(){
      if(demoTeams.length)return demoTeams;
      try{const r=await fetch('https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams?limit=1000');const j=await r.json();demoTeams=(j.sports?.[0]?.leagues?.[0]?.teams||[]).map(x=>{const t=x.team;return{id:String(t.id),name:t.displayName,logo:t.logos?.[0]?.href||'',conf:t.conference?.name||'FBS'}})}catch(_){ }
      if(!demoTeams.length) demoTeams=[['Ohio State','Big Ten','194'],['Oregon','Big Ten','2483'],['Texas','SEC','251'],['Georgia','SEC','61'],['Notre Dame','Independent','87'],['Miami','ACC','2390'],['Penn State','Big Ten','213'],['Alabama','SEC','333'],['Clemson','ACC','228'],['Indiana','Big Ten','84']].map(x=>({id:x[2],name:x[0],conf:x[1],logo:'https://a.espncdn.com/i/teamlogos/ncaa/500/'+x[2]+'.png'}));
      return demoTeams;
    }
    function renderDemoTeams(){const list=document.getElementById('teams');if(!list)return;const q=(document.getElementById('search')?.value||'').toLowerCase(),conf=document.getElementById('conf')?.value||'';const filtered=demoTeams.filter(t=>(!q||t.name.toLowerCase().includes(q))&&(!conf||t.conf===conf)).slice(0,100);list.innerHTML=filtered.map(t=>`<button class="team ${demoSelected.includes(t.id)?'selected':''}" data-demo-id="${escDemo(t.id)}"><img class="logo" src="${escDemo(t.logo)}" alt=""><div><div class="teamname">${escDemo(t.name)}</div><div class="meta">${escDemo(t.conf)}</div></div><div class="check">${demoSelected.includes(t.id)?'✓':''}</div></button>`).join('')||'<p class="muted">No teams found.</p>';list.querySelectorAll('[data-demo-id]').forEach(btn=>btn.addEventListener('click',()=>{const id=btn.dataset.demoId;demoSelected=demoSelected.includes(id)?demoSelected.filter(x=>x!==id):[...demoSelected,id];localStorage.setItem(demoKey,JSON.stringify(demoSelected));renderDemoTeams();renderDemoSelection()}));}
    function renderDemoSelection(){const selected=document.getElementById('selected'),size=document.getElementById('bubbleSize');if(size)size.textContent=demoSelected.length+' teams';if(selected)selected.innerHTML=demoSelected.length?demoSelected.map(id=>{const t=demoTeams.find(x=>x.id===id);return`<span class="pill">${escDemo(t?.name||id)}</span>`}).join(''):'<span class="muted">Select teams above.</span>';const stat=document.getElementById('bubbleStat');if(stat)stat.textContent=demoSelected.length;}
    async function startDemo(){await fetchDemoTeams();const notice=document.getElementById('bubbleNotice');if(notice)notice.innerHTML='<b>DEMO USER</b> — Local-only prototype mode. Nothing here is saved to Supabase or visible to real users.';const acct=document.getElementById('acct');if(acct){acct.textContent='Demo User';acct.onclick=()=>{localStorage.removeItem('fatalFourDemoMode');location.reload()};}const search=document.getElementById('search'),conf=document.getElementById('conf');if(search)search.oninput=renderDemoTeams;if(conf){const vals=[...new Set(demoTeams.map(t=>t.conf).filter(Boolean))].sort();conf.innerHTML='<option value="">All conferences</option>'+vals.map(c=>`<option>${escDemo(c)}</option>`).join('');conf.onchange=renderDemoTeams;}const save=document.querySelector('#bubble button.primary');if(save){save.textContent='Save Demo Bubble';save.onclick=()=>{localStorage.setItem(demoKey,JSON.stringify(demoSelected));const state=document.getElementById('saveState');if(state)state.textContent='Demo bubble saved locally on this device.';renderDemoSelection()};}const clear=document.querySelector('#bubble button.outline');if(clear)clear.onclick=()=>{demoSelected=[];localStorage.setItem(demoKey,'[]');renderDemoTeams();renderDemoSelection()};renderDemoTeams();renderDemoSelection();}
    const originalInitBubble=window.initBubble;window.initBubble=async function(){if(demoActive())return startDemo();return originalInitBubble?originalInitBubble():undefined};
    addDemoButton();if(demoActive())startDemo();
  },150);
});

// ---------------------------------------------------------------------------
// Fatal Four product features: AP team intelligence, profile avatars, odds
// leaderboard, bubble tracking, Explore actions, follows, likes and DMs.
// Real social writes use Supabase tables from supabase_social_schema.sql;
// demo mode falls back to localStorage so the prototype remains testable.
// ---------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const demo = () => localStorage.getItem('fatalFourDemoMode') === 'true';
    const local = (key, fallback) => { try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback));}catch(_){return fallback;} };
    const setLocal = (key,val) => localStorage.setItem(key,JSON.stringify(val));
    const style = document.createElement('style');
    style.textContent = `
      .feature-nav{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 18px}.feature-nav button{background:#13291c;color:#fff;border:1px solid #2b4937;border-radius:9px;padding:10px 13px;font-weight:850;cursor:pointer}.feature-nav button:hover{border-color:#ff9f2f}
      .team-row{display:grid;grid-template-columns:42px minmax(150px,1.3fr) repeat(5,minmax(70px,.7fr)) 34px;gap:9px;align-items:center;padding:10px;border-bottom:1px solid #213629}.team-row:hover{background:#102419}.team-stat{font-size:12px;color:#dceae1}.team-stat strong{display:block;color:#fff;font-size:13px}.chance{color:#39df8c;font-weight:950}.trend-up{color:#39df8c}.trend-down{color:#ff6868}.trend-flat{color:#b8c9be}.team-grid-head{display:grid;grid-template-columns:42px minmax(150px,1.3fr) repeat(5,minmax(70px,.7fr)) 34px;gap:9px;padding:8px 10px;color:#b8c9be;font-size:11px;font-weight:950;text-transform:uppercase;letter-spacing:.5px}.avatar-editor{display:grid;grid-template-columns:90px 1fr;gap:18px;align-items:start}.avatar-preview{width:82px;height:82px;border-radius:50%;object-fit:cover;background:#13291c;border:2px solid #3b6248}.leader-row{display:grid;grid-template-columns:38px 1fr auto;gap:12px;align-items:center;padding:12px;border-bottom:1px solid #213629}.rank-badge{font-size:18px;font-weight:1000;color:#ff9f2f}.social-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.social-actions button{background:#07120c;color:#fff;border:1px solid #2b4937;border-radius:8px;padding:7px 10px;cursor:pointer}.social-actions button.active{border-color:#39df8c;color:#39df8c}.bubble-card{background:#102419;border:1px solid #2b4937;border-radius:12px;padding:14px;margin:10px 0}.message-box{display:flex;gap:8px;margin-top:12px}.message-box input{flex:1}.tracker-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.tracker-card{background:#13291c;border:1px solid #2b4937;border-radius:10px;padding:12px}.tracker-card b{font-size:21px}@media(max-width:850px){.team-row,.team-grid-head{grid-template-columns:36px minmax(140px,1fr) repeat(2,minmax(70px,.7fr)) 30px}.team-row .optional-stat,.team-grid-head .optional-stat{display:none}.tracker-grid{grid-template-columns:1fr 1fr}}@media(max-width:520px){.team-row,.team-grid-head{grid-template-columns:32px minmax(120px,1fr) 62px 30px}.team-row .mobile-hide,.team-grid-head .mobile-hide{display:none}.avatar-editor{grid-template-columns:1fr}.tracker-grid{grid-template-columns:1fr}}
    `; document.head.appendChild(style);

    function addFeatureNavigation(){
      const nav=document.querySelector('.links'); if(!nav || document.getElementById('leaderboardNav')) return;
      const b=document.createElement('button');b.id='leaderboardNav';b.textContent='🏆 Leaderboard';b.onclick=()=>showFeaturePage('leaderboard');nav.insertBefore(b,document.getElementById('profileNav'));
    }
    function showFeaturePage(type){
      document.querySelectorAll('.view').forEach(x=>x.classList.remove('active'));
      let id='ff-'+type, el=document.getElementById(id); if(!el){el=document.createElement('section');el.id=id;el.className='view';document.querySelector('main.page').insertBefore(el,document.querySelector('footer'));}
      el.classList.add('active');
      if(type==='leaderboard')renderLeaderboard(el); if(type==='tracker')renderTracker(el); if(type==='social')renderSocial(el);
    }
    window.showFeaturePage=showFeaturePage;

    async function getBubbleRows(){
      if(demo()) return [{id:'demo',user_id:'demo',username:'Demo User',teams:local('fatalFourDemoBubbleV1',[]).length}];
      const {data:bubbles}=await window.fatalFourSupabase.from('bubbles').select('id,user_id'); if(!bubbles)return [];
      const ids=bubbles.map(b=>b.id); if(!ids.length)return [];
      const {data:teams}=await window.fatalFourSupabase.from('bubbles_teams').select('bubble_id,team_name').in('bubble_id',ids);
      const counts=(teams||[]).reduce((m,r)=>(m[r.bubble_id]=(m[r.bubble_id]||0)+1,m),{});
      const {data:profiles}=await window.fatalFourSupabase.from('profiles').select('id,username,avatar_url');
      return bubbles.map(b=>{const p=(profiles||[]).find(x=>x.id===b.user_id);return{id:b.id,user_id:b.user_id,username:p?.username||'Player',avatar_url:p?.avatar_url||'',teams:counts[b.id]||0};}).sort((a,b)=>a.teams-b.teams);
    }
    async function renderLeaderboard(el){
      const rows=await getBubbleRows(); el.innerHTML=`<div class="card"><div class="eyebrow">FATAL FOUR ODDS</div><h2>🏆 Most Likely Bubbles to Win</h2><p>The leaderboard ranks bubbles by how strongly they cover the teams with the best semifinal paths. A smaller bubble is not automatically a better bubble; the final odds model will incorporate each selected team's semifinal probability.</p><div id="leaderRows">${rows.length?rows.map((r,i)=>`<div class="leader-row"><div class="rank-badge">#${i+1}</div><div><b>${esc(r.username)}</b><small class="muted" style="display:block">${r.teams} teams selected</small></div><strong class="chance">${r.teams?Math.max(1,Math.round(100/r.teams*10)/10):0}%</strong></div>`).join(''):'<p class="muted">No bubbles yet.</p>'}</div><p class="muted" style="margin-top:14px">Percentages are prototype estimates until the injury/coach/news-aware odds model is connected.</p></div>`;
    }
    async function renderTracker(el){
      const {data:session}=await window.fatalFourSupabase.auth.getSession();
      if(!session.session&&!demo()){el.innerHTML='<div class="card"><h2>Your Bubble Tracker</h2><div class="notice">Sign in to track your teams.</div></div>';return;}
      const selected=demo()?local('fatalFourDemoBubbleV1',[]):await getUserTeamNames(session.session.user.id);
      el.innerHTML=`<div class="card"><h2>📈 Your Bubble Tracker</h2><p>Track every selected team and its current chance of reaching the CFP semifinals.</p><div class="tracker-grid">${(selected||[]).map((t,i)=>{const name=typeof t==='string'?t:(t.name||t.team_name);return`<div class="tracker-card"><b>${esc(name)}</b><small style="display:block;color:#b8c9be;margin-top:7px">Semifinal chance</small><strong class="chance">—</strong><small style="display:block;color:#b8c9be;margin-top:6px">Live injury/coaching/news model</small></div>`}).join('')||'<p class="muted">Your saved bubble is empty.</p>'}</div></div>`;
    }
    async function getUserTeamNames(uid){const {data:b}=await window.fatalFourSupabase.from('bubbles').select('id').eq('user_id',uid).maybeSingle();if(!b)return[];const {data:r}=await window.fatalFourSupabase.from('bubbles_teams').select('team_name').eq('bubble_id',b.id);return(r||[]).map(x=>x.team_name)}
    async function renderSocial(el){
      const rows=await getBubbleRows(); el.innerHTML=`<div class="card"><h2>👥 Explore Bubbles</h2><p>View public bubbles after kickoff, visit profiles, follow players, like bubbles, or send a direct message.</p>${rows.map(r=>`<div class="bubble-card"><b>${esc(r.username)}</b><small class="muted" style="display:block">${r.teams} teams</small><div class="social-actions"><button onclick="visitProfile('${esc(r.user_id)}')">Visit Profile</button><button onclick="toggleFollow('${esc(r.user_id)}',this)">Follow</button><button onclick="toggleLike('${esc(r.id)}',this)">♡ Like</button><button onclick="openDM('${esc(r.user_id)}','${esc(r.username)}')">💬 DM</button></div></div>`).join('')||'<p class="muted">No public bubbles yet.</p>'}</div>`;
    }
    window.visitProfile=uid=>{if(demo()){alert('Demo User profile preview');return;}showFeaturePage('social');};
    window.toggleFollow=async(uid,btn)=>{if(demo()){btn.classList.toggle('active');btn.textContent=btn.classList.contains('active')?'Following':'Follow';return;}const {data:s}=await window.fatalFourSupabase.auth.getSession();if(!s.session)return alert('Sign in to follow players.');const me=s.session.user.id;const {data:existing}=await window.fatalFourSupabase.from('follows').select('*').eq('follower_id',me).eq('following_id',uid).maybeSingle();if(existing){await window.fatalFourSupabase.from('follows').delete().eq('follower_id',me).eq('following_id',uid);btn.classList.remove('active');btn.textContent='Follow';}else{await window.fatalFourSupabase.from('follows').insert({follower_id:me,following_id:uid});btn.classList.add('active');btn.textContent='Following';}};
    window.toggleLike=async(bid,btn)=>{if(demo()){btn.classList.toggle('active');btn.textContent=btn.classList.contains('active')?'♥ Liked':'♡ Like';return;}const {data:s}=await window.fatalFourSupabase.auth.getSession();if(!s.session)return alert('Sign in to like bubbles.');const uid=s.session.user.id;const {data:existing}=await window.fatalFourSupabase.from('bubble_likes').select('*').eq('bubble_id',bid).eq('user_id',uid).maybeSingle();if(existing){await window.fatalFourSupabase.from('bubble_likes').delete().eq('bubble_id',bid).eq('user_id',uid);btn.classList.remove('active');btn.textContent='♡ Like';}else{await window.fatalFourSupabase.from('bubble_likes').insert({bubble_id:bid,user_id:uid});btn.classList.add('active');btn.textContent='♥ Liked';}};
    window.openDM=(uid,name)=>{const body=prompt(`Message ${name}`);if(!body)return;if(demo()){alert('Demo DM queued locally.');return;}window.fatalFourSupabase.auth.getSession().then(({data:s})=>{if(!s.session)return alert('Sign in to send messages.');window.fatalFourSupabase.from('messages').insert({sender_id:s.session.user.id,recipient_id:uid,body}).then(({error})=>alert(error?'Could not send message.':'Message sent.'));});};

    async function injectProfileEditor(){
      const profile=document.getElementById('profile');if(!profile||document.getElementById('avatarEditor'))return;
      const card=profile.querySelector('.card');if(!card)return;
      const wrap=document.createElement('div');wrap.id='avatarEditor';wrap.className='avatar-editor';wrap.innerHTML=`<img id="avatarPreview" class="avatar-preview" src="https://a.espncdn.com/i/teamlogos/ncaa/500/248.png" alt="Avatar"><div><h3 style="margin-top:0">Profile Avatar</h3><p>Choose any D1 college logo or upload your own image.</p><input id="collegeAvatarSearch" placeholder="Search D1 colleges..."><select id="collegeAvatarSelect" style="width:100%;margin-top:8px"><option value="">Loading D1 colleges…</option></select><div style="margin-top:8px"><input id="avatarUpload" type="file" accept="image/png,image/jpeg,image/webp"></div><button id="saveAvatar" class="primary" style="margin-top:9px">Save Avatar</button><div id="avatarState" class="success"></div></div>`;card.appendChild(wrap);
      let teams=[];try{const r=await fetch('https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams?limit=1000');const j=await r.json();teams=(j.sports?.[0]?.leagues?.[0]?.teams||[]).map(x=>x.team).filter(t=>t.logo||t.logos?.length).map(t=>({id:t.id,name:t.displayName,logo:t.logos?.[0]?.href||t.logo})).sort((a,b)=>a.name.localeCompare(b.name));}catch(_){ }
      const select=document.getElementById('collegeAvatarSelect'),search=document.getElementById('collegeAvatarSearch'),preview=document.getElementById('avatarPreview');
      function renderOpts(){const q=(search.value||'').toLowerCase();select.innerHTML='<option value="">Choose a college…</option>'+teams.filter(t=>t.name.toLowerCase().includes(q)).slice(0,200).map(t=>`<option value="${esc(t.logo)}">${esc(t.name)}</option>`).join('');}
      renderOpts();search.oninput=renderOpts;select.onchange=()=>{if(select.value)preview.src=select.value};document.getElementById('avatarUpload').onchange=e=>{const f=e.target.files?.[0];if(f)preview.src=URL.createObjectURL(f)};
      document.getElementById('saveAvatar').onclick=async()=>{const state=document.getElementById('avatarState');const {data:s}=await window.fatalFourSupabase.auth.getSession();if(!s.session&&!demo()){state.textContent='Sign in to save your avatar.';return;}if(demo()){state.textContent='Demo avatar saved locally for this prototype.';return;}const uid=s.session.user.id;let url=select.value||preview.src;const file=document.getElementById('avatarUpload').files?.[0];if(file){const path=`${uid}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;const {error}=await window.fatalFourSupabase.storage.from('avatars').upload(path,file,{upsert:true});if(error){state.textContent=error.message;return;}url=window.fatalFourSupabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;}const {error}=await window.fatalFourSupabase.from('profiles').update({avatar_url:url,avatar_type:file?'upload':'college'}).eq('id',uid);state.textContent=error?error.message:'Avatar saved.';};
    }

    addFeatureNavigation();
    const profileObserver=new MutationObserver(injectProfileEditor);profileObserver.observe(document.body,{childList:true,subtree:true});
    injectProfileEditor();
    // Add easy-access tracker/social buttons to the existing navigation.
    const nav=document.querySelector('.links');if(nav&&!document.getElementById('trackerNav')){const t=document.createElement('button');t.id='trackerNav';t.textContent='📈 My Bubble';t.onclick=()=>showFeaturePage('tracker');nav.insertBefore(t,document.getElementById('leaderboardNav'));const e=document.createElement('button');e.textContent='🌐 Explore';e.onclick=()=>showFeaturePage('social');nav.insertBefore(e,document.getElementById('leaderboardNav'));}
  }, 250);
});
