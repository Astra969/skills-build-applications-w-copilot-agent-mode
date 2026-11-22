import { FormEvent, useEffect, useRef, useState } from 'react';
import { getJson, postJson } from '../api/client.js';

type Activity = { _id?: string; type: string; minutes: number; points: number; occurredAt?: string };
type ActivityResponse = { activities: Activity[] };
type ActivityResult = { activity: Activity };

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  async function loadActivities() {
    try {
      setActivities((await getJson<ActivityResponse>('/api/activities')).activities);
      setError('');
    } catch {
      setError('Unable to load activities. Please try again.');
    }
  }

  useEffect(() => { void loadActivities(); }, []);

  async function submitActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const { activity } = await postJson<ActivityResult>('/api/activities', {
        userId: form.get('userId'),
        teamId: form.get('teamId'),
        type: form.get('type'),
        minutes: Number(form.get('minutes')),
      });
      setActivities((current) => [activity, ...(current ?? [])]);
      setMessage('Activity recorded.');
      setError('');
      formElement.reset();
    } catch {
      setMessage('');
      setError('Unable to record activity. Check the user and team IDs and try again.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return <section>
    <h2>Activities</h2>
    <p>Track student activity minutes and points.</p>
    <form className="card card-body mb-4" onSubmit={submitActivity}>
      <h3 className="h5">Record activity</h3>
      <label className="form-label" htmlFor="activity-user">User ID</label>
      <input className="form-control mb-2" id="activity-user" name="userId" required />
      <label className="form-label" htmlFor="activity-team">Team ID</label>
      <input className="form-control mb-2" id="activity-team" name="teamId" required />
      <label className="form-label" htmlFor="activity-type">Activity</label>
      <input className="form-control mb-2" id="activity-type" name="type" required />
      <label className="form-label" htmlFor="activity-minutes">Minutes</label>
      <input className="form-control mb-3" id="activity-minutes" name="minutes" type="number" min="1" required />
      <button className="btn btn-primary align-self-start" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save activity'}</button>
    </form>
    {message && <p role="status">{message}</p>}
    {error && <p role="alert">{error}</p>}
    {!activities && !error && <p role="status">Loading activities…</p>}
    {activities?.length === 0 && <p>No activities yet.</p>}
    {activities && activities.length > 0 && <ul className="list-group">{activities.map((activity, index) =>
      <li className="list-group-item" key={activity._id ?? `${activity.type}-${index}`}>
        <strong>{activity.type}</strong> — {activity.minutes} minutes, {activity.points} points
      </li>)}</ul>}
  </section>;
}
