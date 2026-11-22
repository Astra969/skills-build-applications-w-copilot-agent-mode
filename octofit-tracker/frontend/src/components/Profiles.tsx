import { FormEvent, useEffect, useState } from 'react';
import { getJson, postJson } from '../api/client.js';

type Profile = { _id?: string; name: string; email: string; role: 'student' | 'teacher'; fitnessGoal: string; team?: { name: string } };
type ProfilesResponse = { users: Profile[] };
type ProfileResult = { user: Profile };

export default function Profiles() {
  const [profiles, setProfiles] = useState<Profile[]>();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadProfiles() {
    try {
      setProfiles((await getJson<ProfilesResponse>('/api/users')).users);
      setError('');
    } catch {
      setError('Unable to load profiles. Please try again.');
    }
  }

  useEffect(() => { void loadProfiles(); }, []);

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const { user } = await postJson<ProfileResult>('/api/users', {
        name: form.get('name'),
        email: form.get('email'),
        role: form.get('role'),
        fitnessGoal: form.get('fitnessGoal'),
      });
      setProfiles((current) => [...(current ?? []), user]);
      setMessage('Profile created.');
      setError('');
      formElement.reset();
    } catch {
      setMessage('');
      setError('Unable to create profile. Check the details and try again.');
    }
  }

  return <section>
    <h2>Profiles</h2>
    <p>Student and physical education teacher profiles.</p>
    <form className="card card-body mb-4" onSubmit={submitProfile}>
      <h3 className="h5">Create a profile</h3>
      <label className="form-label" htmlFor="profile-name">Name</label>
      <input className="form-control mb-2" id="profile-name" name="name" required />
      <label className="form-label" htmlFor="profile-email">Email</label>
      <input className="form-control mb-2" id="profile-email" name="email" type="email" required />
      <label className="form-label" htmlFor="profile-role">Role</label>
      <select className="form-select mb-2" id="profile-role" name="role" defaultValue="student">
        <option value="student">Student</option>
        <option value="teacher">Physical education teacher</option>
      </select>
      <label className="form-label" htmlFor="profile-goal">Fitness goal</label>
      <input className="form-control mb-3" id="profile-goal" name="fitnessGoal" required />
      <button className="btn btn-primary align-self-start" type="submit">Create profile</button>
    </form>
    {message && <p role="status">{message}</p>}
    {error && <p role="alert">{error}</p>}
    {!profiles && !error && <p role="status">Loading profiles…</p>}
    {profiles?.length === 0 && <p>No profiles yet.</p>}
    {profiles && profiles.length > 0 && <ul className="list-group">{profiles.map((profile, index) =>
      <li className="list-group-item" key={profile._id ?? profile.email ?? index}>
        <strong>{profile.name}</strong> — {profile.role}, goal: {profile.fitnessGoal}{profile.team?.name ? `, team: ${profile.team.name}` : ''}
      </li>)}</ul>}
  </section>;
}
