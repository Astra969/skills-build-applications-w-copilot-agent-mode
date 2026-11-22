import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then((data) => {
        setLeaderboard(data.leaderboard);
        setError(null);
      })
      .catch(() => {
        setError('Unable to load leaderboard');
        setLeaderboard([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Leaderboard</h2>
        <p>Compare team point totals.</p>
        {loading && <p role="status">Loading leaderboard...</p>}
        {error && <p role="alert">{error}</p>}
        {!loading && leaderboard.length === 0 && !error && <p>No leaderboard data yet.</p>}
        {!loading && leaderboard.length > 0 && (
          <ol className="list-group list-group-numbered">
            {leaderboard.map((entry) => (
              <li key={entry.rank} className="list-group-item d-flex justify-content-between align-items-start">
                <div className="ms-2 me-auto">
                  <div className="fw-bold">{entry.teamName}</div>
                </div>
                <span className="badge bg-primary rounded-pill">{entry.totalPoints}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
