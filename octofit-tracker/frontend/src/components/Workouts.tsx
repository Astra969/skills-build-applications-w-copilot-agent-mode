import { FormEvent, useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Workout = { _id?: string; title: string; focus: string; minutes: number; difficulty: string; reason: string };
type SuggestionsResponse = { suggestions: Workout[] };

export default function Workouts() {
  const [email, setEmail] = useState('mona@example.com');
  const [suggestions, setSuggestions] = useState<Workout[]>();
  const [error, setError] = useState('');

  async function loadSuggestions(userEmail: string) {
    try {
      const result = await getJson<SuggestionsResponse>(`/api/workouts/suggestions/${encodeURIComponent(userEmail)}`);
      setSuggestions(result.suggestions);
      setError('');
    } catch {
      setSuggestions(undefined);
      setError('Unable to load workout suggestions. Check the profile email and try again.');
    }
  }

  useEffect(() => { void loadSuggestions(email); }, []);

  function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadSuggestions(email);
  }

  return <section>
    <h2>Workout suggestions</h2>
    <p>Recommendations are tailored to a student’s fitness goal and recent activity.</p>
    <form className="mb-4" onSubmit={submitEmail}>
      <label className="form-label" htmlFor="suggestion-email">Profile email</label>
      <div className="input-group">
        <input className="form-control" id="suggestion-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        <button className="btn btn-primary" type="submit">Get suggestions</button>
      </div>
    </form>
    {error && <p role="alert">{error}</p>}
    {!suggestions && !error && <p role="status">Loading workout suggestions…</p>}
    {suggestions?.length === 0 && <p>No workout suggestions available.</p>}
    {suggestions && suggestions.length > 0 && <ul className="list-group">{suggestions.map((workout, index) =>
      <li className="list-group-item" key={workout._id ?? `${workout.title}-${index}`}>
        <strong>{workout.title}</strong> — {workout.focus}, {workout.minutes} minutes, {workout.difficulty}. {workout.reason}
      </li>)}</ul>}
  </section>;
}
