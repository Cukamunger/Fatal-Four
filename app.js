const KICKOFF = new Date('2026-08-29T16:00:00Z');
const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football';
let teams = [], selected = new Set();

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const locked = () => Date.now() >= KICKOFF;

function nav() {
  return `<header class="top"><nav class="nav"><a class="brand" href="index.html">Fatal <span>Four</span></a><span class="season">2026–27</span><div class="links"><a href="index.html">Home</a><a href="bubble.html">Make a Bubble</a><a href="rankings.html">AP Poll</a><a href="explore.html">Explore</a><a href="messages.html">Messages</a><a href="profile.html">Profile</a></div></nav></header>`;
}

function initPage(page) {
  const navEl = document.getElementById('nav');
  if (navEl) navEl.innerHTML = nav();
  if (page === 'bubble') initBubble();
  if (page === 'rankings') initRankings();
  if (page === 'explore') initExplore();
  if (page === 'messages') initMessages();
  if (page === 'profile') initProfile();
}

async function getTeams() {
  if (teams.length) return teams;
  try {
    const r = await fetch(ESPN + '/teams?limit=1000');
    const j = await r.json();
    const a = j.sports?.[0]?.leagues?.[0]?.teams || [];
    teams = a.map(x => { const t = x.team; return {id:t.id,name:t.displayName,logo:t.logos?.[0]?.href||'',conf:t.conference?.name||'FBS'}; });
  } catch (e) {
    teams = [];
  }
  return teams;
}

async function initBubble() {
  document.getElementById('loginNotice').innerHTML = locked()
    ? '<b>Submissions are locked.</b> Kickoff has passed.'
    : '<b>Build your bubble.</b> Your selections stay private until TCU vs. North Carolina kickoff.';
  document.getElementById('builder').classList.remove('hidden');
  await getTeams();
  renderTeams();
  const search = document.getElementById('search');
  if (search) search.oninput = renderTeams;
}

function renderTeams() {
  const q = (document.getElementById('search')?.value || '').toLowerCase();
  const list = document.getElementById('teams');
  if (!list) return;
  list.innerHTML = teams.filter(t => t.name.toLowerCase().includes(q)).map(t => `<button class="team ${selected.has(t.id)?'selected':''}" onclick="toggle('${esc(t.id)}')"><img class="logo" src="${esc(t.logo)}" alt=""><div><div class="teamname">${esc(t.name)}</div><div class="meta">${esc(t.conf)}</div></div><div class="check">${selected.has(t.id)?'✓':''}</div></button>`).join('');
  const count = document.getElementById('count');
  if (count) count.textContent = `${selected.size} teams`;
  const bubble = document.getElementById('bubble');
  if (bubble) bubble.innerHTML = selected.size ? [...selected].map(id => { const t=teams.find(x=>x.id==id); return `<div class="pill"><img src="${esc(t.logo)}" alt="">${esc(t.name)}</div>`; }).join('') : '<span class="muted">No teams selected.</span>';
}

function toggle(id) {
  if (locked()) return;
  selected.has(id) ? selected.delete(id) : selected.add(id);
  renderTeams();
}

function clearAll() { selected.clear(); renderTeams(); }

function saveBubble() {
  if (locked()) return alert('Submissions are locked after kickoff.');
  if (!selected.size) return alert('Select at least one team.');
  localStorage.setItem('fatalFourBubble', JSON.stringify([...selected]));
  const state = document.getElementById('state');
  if (state) state.textContent = 'Bubble saved on this device. Backend persistence comes next.';
}

async function initRankings() {
  const weeks = document.getElementById('week');
  if (!weeks) return;
  ['Preseason','Week 1','Week 2','Week 3','Week 4','Week 5','Week 6','Week 7','Week 8','Week 9','Week 10','Week 11','Week 12','Week 13','Week 14','Final'].forEach((w,i) => weeks.innerHTML += `<option value="${i}">${w}</option>`);
  await getTeams(); renderPoll(); weeks.onchange = renderPoll;
}

function renderPoll() {
  const poll = document.getElementById('poll');
  if (!poll) return;
  poll.innerHTML = teams.slice(0,25).map((t,i) => `<tr><td><b>${i+1}</b></td><td><div class="rankteam"><img src="${esc(t.logo)}" alt="">${esc(t.name)}</div></td><td>0–0</td><td>${1600-i*45}</td><td class="same">—</td></tr>`).join('');
}

function initExplore() {
  const lockNotice = document.getElementById('lockNotice');
  if (lockNotice) lockNotice.innerHTML = locked() ? '<b class="up">Public.</b> Bubbles can now be viewed.' : '<b>Private mode.</b> Individual bubbles remain hidden until kickoff.';
  const feed = document.getElementById('feed');
  if (feed) feed.innerHTML = locked() ? '<div class="bubblecard"><b>Public feed</b><p class="muted">Backend connection will populate real player bubbles, likes, follows and profiles.</p></div>' : '<div class="notice">No individual bubbles are visible yet.</div>';
}

function initMessages() {
  document.querySelector('.wrap')?.insertAdjacentHTML('beforeend', `<div class="card" style="margin-top:18px"><h2>Direct messages</h2><p class="muted">Messaging unlocks after kickoff. Production will include conversations plus block/report controls.</p><div class="notice">${locked()?'Messaging is unlocked.':'Messaging is locked until kickoff.'}</div></div>`);
}

function initProfile() {
  document.querySelector('.wrap')?.insertAdjacentHTML('beforeend', '<div class="card"><h1>Your profile</h1><p class="muted">Username, avatar, bubble history, likes, follows and season results will live here.</p><h2>Avatar</h2><p class="muted">Choose from every D1/FBS school logo or upload an image.</p><button class="primary">Choose avatar</button></div>');
}
