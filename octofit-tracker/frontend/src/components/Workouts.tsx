import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Workout = { title: string; reason: string };

export default function Workouts() {
  const [userEmail, setUserEmail] = useState('mona@example.com');
  const [suggestions, setSuggestions] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const encodedEmail = encodeURIComponent(userEmail);
    getJson<{ suggestions: Workout[] }>(`/api/workouts/suggestions/${encodedEmail}`)
      .then((data) => {
        setSuggestions(data.suggestions);
        setError(null);
      })
      .catch(() => {
        setError('Unable to load workout suggestions');
        setSuggestions([]);
      })
      .finally(() => setLoading(false));
  }, [userEmail]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Workout suggestions</h2>
        <p>Recommend workouts from activity patterns.</p>
        <div className="mb-3">
          <label htmlFor="userEmail" className="form-label">
            User Email
          </label>
          <input type="email" className="form-control" id="userEmail" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} />
        </div>
        {loading && <p role="status">Loading workout suggestions...</p>}
        {error && <p role="alert">{error}</p>}
        {!loading && suggestions.length === 0 && !error && <p>No workout suggestions available.</p>}
        {!loading && suggestions.length > 0 && (
          <ul className="list-group">
            {suggestions.map((workout, index) => (
              <li key={index} className="list-group-item">
                <strong>{workout.title}</strong>
                <p className="mb-0 small text-muted">{workout.reason}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
