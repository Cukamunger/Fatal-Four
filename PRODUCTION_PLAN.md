# Fatal Four 2026-27 — Production Plan

## Confirmed product requirements

- Green/orange visual identity with high-contrast, readable typography.
- Separate routes/pages: Home, Make a Bubble, AP Poll, Explore, Messages, Profile.
- Account required before a user can create or submit a bubble.
- Bubble selection uses a ranked Top 25 list first (1–25 only), with conference filtering revealing the rest of FBS and a search bar.
- Each team row includes actual team logo and current stats.
- AP movement displays `↑ N` or `↓ N`; no movement displays `-`.
- AP history stores every weekly poll, including rank, vote total, previous rank, and movement.
- Individual bubbles remain private until the exact server-side kickoff timestamp.
- The server, not the browser, determines whether a bubble is locked. Client clocks, JavaScript flags, and URL parameters are never authoritative.
- At kickoff, new submissions are rejected server-side and public bubbles become readable.
- Pre-kickoff aggregate entry counts and team selection percentages are public; individual selections remain private.
- Post-kickoff likes, follows, public profiles, and DMs.
- Profile avatars can use FBS school logos or an uploaded image.
- Team dashboard includes record, AP rank, conference rank/record, overall record, and current semifinal probability.
- Footer: `Fatal Four 2026-27` and `Made by Charles Schmidt`.

## Bubble win-probability leaderboard

A live leaderboard will appear after kickoff and update throughout the season. It estimates how likely each submitted bubble is to ultimately win the game, using the current server-side semifinal probabilities for teams in that bubble and the bubble's size.

The leaderboard will show:

1. Rank
2. Username/avatar
3. Bubble size
4. Current estimated chance to win
5. Change since the previous update
6. A compact preview of the bubble after public reveal

The leaderboard is an estimate, not an official score. Final results are deterministic: a bubble must contain all four actual CFP semifinalists, and among qualifying bubbles the fewest teams wins. Ties can use submission timestamp as the deterministic tiebreaker.

## Lock security

The production submission endpoint must perform a database transaction that checks `now()` against the season's `kickoff_at`. The UI countdown is only informational. A malicious client changing its clock, calling the endpoint directly, or modifying JavaScript must still receive a server rejection after kickoff.

## Deployment

GitHub stores the source code. The finished application will be deployed to a public web host and connected to Supabase (authentication + PostgreSQL + storage). A custom domain can be connected later. The site will therefore be accessible from the internet through its public domain/hosting URL, not merely usable inside GitHub.
