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
        const { count } = await window.fatalFourSupabase
          .from('profiles')
          .select('id', { count: 'exact', head: true });
        if (stats[0] && typeof count === 'number') {
          stats[0].querySelector('b').textContent = count.toLocaleString();
        }
      } catch (_) {
        // Keep the safe zero display if public profile counting is unavailable.
      }
    }
    updatePlayerCount();

    const clock = document.getElementById('clock');
    if (!clock) return;

    function renderCountdown() {
      const kickoff = new Date('2026-08-29T16:00:00Z');
      let total = Math.max(0, Math.floor((kickoff.getTime() - Date.now()) / 1000));
      const days = Math.floor(total / 86400);
      total %= 86400;
      const hours = Math.floor(total / 3600);
      total %= 3600;
      const minutes = Math.floor(total / 60);
      const seconds = total % 60;

      if (days === 0 && hours === 0 && minutes === 0 && seconds === 0) {
        clock.innerHTML = '<span class="countdown-locked">LOCKED</span>';
        return;
      }

      const unit = (value, label) =>
        `<span class="countdown-unit"><b>${String(value).padStart(2, '0')}</b><small>${label}</small></span>`;

      clock.innerHTML =
        `<span class="countdown-grid">${unit(days, 'D')}${unit(hours, 'H')}${unit(minutes, 'M')}${unit(seconds, 'S')}</span>`;
    }

    const style = document.createElement('style');
    style.textContent = `
      #clock.countdown{white-space:normal;width:100%;margin:12px 0 8px}
      .countdown-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;width:100%}
      .countdown-unit{display:flex;flex-direction:column;align-items:center;justify-content:center;background:#13291c;border:1px solid #2b4937;border-radius:9px;padding:8px 4px;min-width:0}
      .countdown-unit b{font-size:clamp(20px,2.5vw,30px);line-height:1;font-variant-numeric:tabular-nums;letter-spacing:-1px}
      .countdown-unit small{font-size:10px;color:#b8c9be;font-weight:900;letter-spacing:1px;margin-top:5px}
      .countdown-locked{display:block;text-align:center;font-size:24px;color:#ff9f2f;font-weight:950}
      @media(max-width:520px){.countdown-unit{padding:7px 2px}.countdown-unit b{font-size:19px}.countdown-unit small{font-size:9px}}
    `;
    document.head.appendChild(style);

    const observer = new MutationObserver(() => {
      if (!clock.querySelector('.countdown-grid,.countdown-locked')) renderCountdown();
    });
    observer.observe(clock, { childList: true, characterData: true, subtree: true });

    renderCountdown();
    setInterval(renderCountdown, 1000);
  }, 100);
});

// ---------------------------------------------------------------------------
// Prototype-only Demo User mode.
// This is intentionally isolated from Supabase authentication and data.
// It uses localStorage only, is clearly labeled, and does not bypass RLS,
// email confirmation, or any production security control.
// ---------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const demoKey = 'fatalFourDemoBubbleV1';
    let demoTeams = [];
    let demoSelected = JSON.parse(localStorage.getItem(demoKey) || '[]');

    const demoActive = () => localStorage.getItem('fatalFourDemoMode') === 'true';
    const escDemo = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

    function addDemoButton() {
      const notice = document.getElementById('bubbleNotice');
      if (!notice || document.getElementById('demoButton')) return;
      const button = document.createElement('button');
      button.id = 'demoButton';
      button.className = 'outline';
      button.style.marginTop = '10px';
      button.textContent = 'Continue as Demo User';
      button.onclick = () => {
        localStorage.setItem('fatalFourDemoMode', 'true');
        document.getElementById('modal')?.classList.remove('show');
        startDemo();
      };
      notice.appendChild(document.createElement('br'));
      notice.appendChild(button);
    }

    async function fetchDemoTeams() {
      if (demoTeams.length) return demoTeams;
      try {
        const r = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams?limit=1000');
        const j = await r.json();
        demoTeams = (j.sports?.[0]?.leagues?.[0]?.teams || []).map(x => {
          const t = x.team;
          return {id:String(t.id),name:t.displayName,logo:t.logos?.[0]?.href || '',conf:t.conference?.name || 'FBS'};
        });
      } catch (_) {}
      if (!demoTeams.length) {
        demoTeams = [
          ['Ohio State','Big Ten','194'],['Oregon','Big Ten','2483'],['Texas','SEC','251'],['Georgia','SEC','61'],
          ['Notre Dame','Independent','87'],['Miami','ACC','2390'],['Penn State','Big Ten','213'],['Alabama','SEC','333'],
          ['Clemson','ACC','228'],['Indiana','Big Ten','84']
        ].map(x => ({id:x[2],name:x[0],conf:x[1],logo:'https://a.espncdn.com/i/teamlogos/ncaa/500/'+x[2]+'.png'}));
      }
      return demoTeams;
    }

    function renderDemoTeams() {
      const list = document.getElementById('teams');
      if (!list) return;
      const q = (document.getElementById('search')?.value || '').toLowerCase();
      const conf = document.getElementById('conf')?.value || '';
      const filtered = demoTeams.filter(t => (!q || t.name.toLowerCase().includes(q)) && (!conf || t.conf === conf)).slice(0,100);
      list.innerHTML = filtered.map(t => `<button class="team ${demoSelected.includes(t.id) ? 'selected' : ''}" data-demo-id="${escDemo(t.id)}"><img class="logo" src="${escDemo(t.logo)}" alt=""><div><div class="teamname">${escDemo(t.name)}</div><div class="meta">${escDemo(t.conf)}</div></div><div class="check">${demoSelected.includes(t.id) ? '✓' : ''}</div></button>`).join('') || '<p class="muted">No teams found.</p>';
      list.querySelectorAll('[data-demo-id]').forEach(btn => btn.addEventListener('click', () => {
        const id = btn.dataset.demoId;
        demoSelected = demoSelected.includes(id) ? demoSelected.filter(x => x !== id) : [...demoSelected, id];
        localStorage.setItem(demoKey, JSON.stringify(demoSelected));
        renderDemoTeams();
        renderDemoSelection();
      }));
    }

    function renderDemoSelection() {
      const selected = document.getElementById('selected');
      const size = document.getElementById('bubbleSize');
      if (size) size.textContent = demoSelected.length + ' teams';
      if (selected) {
        selected.innerHTML = demoSelected.length
          ? demoSelected.map(id => { const t = demoTeams.find(x => x.id === id); return `<span class="pill">${escDemo(t?.name || id)}</span>`; }).join('')
          : '<span class="muted">Select teams above.</span>';
      }
      const stat = document.getElementById('bubbleStat');
      if (stat) stat.textContent = demoSelected.length;
    }

    async function startDemo() {
      await fetchDemoTeams();
      const notice = document.getElementById('bubbleNotice');
      if (notice) notice.innerHTML = '<b>DEMO USER</b> — You are testing the prototype with a local-only demo account. Nothing here is saved to Supabase or visible to real users.';
      const acct = document.getElementById('acct');
      if (acct) {
        acct.textContent = 'Demo User';
        acct.onclick = () => { localStorage.removeItem('fatalFourDemoMode'); location.reload(); };
      }
      const search = document.getElementById('search');
      const conf = document.getElementById('conf');
      if (search) search.oninput = renderDemoTeams;
      if (conf) {
        const vals = [...new Set(demoTeams.map(t => t.conf).filter(Boolean))].sort();
        conf.innerHTML = '<option value="">All conferences</option>' + vals.map(c => `<option>${escDemo(c)}</option>`).join('');
        conf.onchange = renderDemoTeams;
      }
      const save = document.querySelector('#bubble button.primary');
      if (save) {
        save.textContent = 'Save Demo Bubble';
        save.onclick = () => {
          localStorage.setItem(demoKey, JSON.stringify(demoSelected));
          const state = document.getElementById('saveState');
          if (state) state.textContent = 'Demo bubble saved locally on this device.';
          renderDemoSelection();
        };
      }
      const clear = document.querySelector('#bubble button.outline');
      if (clear) clear.onclick = () => { demoSelected = []; localStorage.setItem(demoKey, '[]'); renderDemoTeams(); renderDemoSelection(); };
      renderDemoTeams();
      renderDemoSelection();
    }

    // Override only the prototype's bubble entry point while Demo User is active.
    const originalInitBubble = window.initBubble;
    window.initBubble = async function() {
      if (demoActive()) return startDemo();
      return originalInitBubble ? originalInitBubble() : undefined;
    };

    addDemoButton();
    if (demoActive()) startDemo();
  }, 150);
});
