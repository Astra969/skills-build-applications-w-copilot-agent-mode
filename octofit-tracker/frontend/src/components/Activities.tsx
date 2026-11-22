import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Activity = { type: string; minutes: number; points: number };

// Display a list of activities with loading, error, and empty states
export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJson<{ activities: Activity[] }>('/api/activities')
      .then((data) => {
        setActivities(data.activities);
        setError(null);
      })
      .catch(() => {
        setError('Unable to load activities');
        setActivities([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Activities</h2>
        <p>Track student activity minutes and points.</p>
        {loading && <p role="status">Loading activities...</p>}
        {error && <p role="alert">{error}</p>}
        {!loading && activities.length === 0 && !error && <p>No activities yet.</p>}
        {!loading && activities.length > 0 && (
          <ul className="list-group">
            {activities.map((activity, index) => (
              <li key={index} className="list-group-item">
                <strong>{activity.type}</strong> - {activity.minutes} minutes ({activity.points} points)
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
