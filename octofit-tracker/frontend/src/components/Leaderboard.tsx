import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Entry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: Entry[] };

export default function Leaderboard() {
  const [entries, setEntries] = useState<Entry[]>();
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<LeaderboardResponse>('/api/leaderboard')
      .then(({ leaderboard }) => setEntries(leaderboard))
      .catch(() => setError('Unable to load leaderboard. Please try again.'));
  }, []);

  return <section>
    <h2>Leaderboard</h2>
    <p>Compare team point totals.</p>
    {error && <p role="alert">{error}</p>}
    {!entries && !error && <p role="status">Loading leaderboard…</p>}
    {entries?.length === 0 && <p>No leaderboard scores yet.</p>}
    {entries && entries.length > 0 && <ol className="list-group list-group-numbered">{entries.map((entry) =>
      <li className="list-group-item" key={entry.teamName}>
        <strong>{entry.teamName}</strong> — {entry.totalPoints} points
      </li>)}</ol>}
  </section>;
}
