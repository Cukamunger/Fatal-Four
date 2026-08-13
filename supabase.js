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

    function updateCountdown() {
      const clock = document.getElementById('clock');
      if (!clock) return;
      const kickoff = new Date('2026-08-29T16:00:00Z');
      let seconds = Math.max(0, Math.floor((kickoff.getTime() - Date.now()) / 1000));
      const days = Math.floor(seconds / 86400);
      seconds %= 86400;
      const hours = Math.floor(seconds / 3600);
      seconds %= 3600;
      const minutes = Math.floor(seconds / 60);
      seconds %= 60;
      clock.textContent = days > 0
        ? `${days} day${days === 1 ? '' : 's'} ${hours} hour${hours === 1 ? '' : 's'} ${minutes} minute${minutes === 1 ? '' : 's'} ${seconds} second${seconds === 1 ? '' : 's'}`
        : `${hours} hour${hours === 1 ? '' : 's'} ${minutes} minute${minutes === 1 ? '' : 's'} ${seconds} second${seconds === 1 ? '' : 's'}`;
      if (seconds === 0 && days === 0 && hours === 0 && minutes === 0) {
        clock.textContent = 'Kickoff is here';
      }
    }
    updateCountdown();
    setInterval(updateCountdown, 1000);
  }, 100);
});
