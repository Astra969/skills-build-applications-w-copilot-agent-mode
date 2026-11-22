import { FormEvent, useEffect, useRef, useState } from 'react';
import { getJson, postJson } from '../api/client.js';

type Team = { _id?: string; name: string; mascot: string; members: string[] };
type TeamsResponse = { teams: Team[] };
type TeamResult = { team: Team };

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  async function loadTeams() {
    try {
      setTeams((await getJson<TeamsResponse>('/api/teams')).teams);
      setError('');
    } catch {
      setError('Unable to load teams. Please try again.');
    }
  }

  useEffect(() => { void loadTeams(); }, []);

  async function submitTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const { team } = await postJson<TeamResult>('/api/teams', {
        name: form.get('name'),
        mascot: form.get('mascot'),
        members: String(form.get('members') ?? '').split(',').map((id) => id.trim()).filter(Boolean),
      });
      setTeams((current) => [...(current ?? []), team]);
      setMessage('Team created.');
      setError('');
      formElement.reset();
    } catch {
      setMessage('');
      setError('Unable to create team. Check the member IDs and try again.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return <section>
    <h2>Teams</h2>
    <p>Manage teams and members.</p>
    <form className="card card-body mb-4" onSubmit={submitTeam}>
      <h3 className="h5">Create a team</h3>
      <label className="form-label" htmlFor="team-name">Team name</label>
      <input className="form-control mb-2" id="team-name" name="name" required />
      <label className="form-label" htmlFor="team-mascot">Mascot</label>
      <input className="form-control mb-2" id="team-mascot" name="mascot" required />
      <label className="form-label" htmlFor="team-members">Member user IDs (comma-separated)</label>
      <input className="form-control mb-3" id="team-members" name="members" />
      <button className="btn btn-primary align-self-start" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Create team'}</button>
    </form>
    {message && <p role="status">{message}</p>}
    {error && <p role="alert">{error}</p>}
    {!teams && !error && <p role="status">Loading teams…</p>}
    {teams?.length === 0 && <p>No teams yet.</p>}
    {teams && teams.length > 0 && <ul className="list-group">{teams.map((team, index) =>
      <li className="list-group-item" key={team._id ?? `${team.name}-${index}`}>
        <strong>{team.name}</strong> — {team.mascot} ({team.members.length} members)
      </li>)}</ul>}
  </section>;
}
