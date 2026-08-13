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

    // The main page script also updates #clock every second. This observer
    // keeps the visual presentation compact and fixed-width regardless of
    // that update, so the countdown never changes the card's layout.
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
