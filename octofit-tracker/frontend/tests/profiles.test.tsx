import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/App.js';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('OctoFit profiles', () => {
  it('lists profiles and creates a teacher profile', async () => {
    let resolvePost!: (response: Response) => void;
    const pendingPost = new Promise<Response>((resolve) => { resolvePost = resolve; });
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'POST') return pendingPost;
      return new Response(JSON.stringify({ users: [{ name: 'Mona', email: 'mona@example.com', role: 'student', fitnessGoal: 'endurance' }] }), { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/profiles']}><App /></MemoryRouter>);

    await waitFor(() => expect(screen.getByText(/Mona/)).toBeInTheDocument());
    await user.type(screen.getByLabelText('Name'), 'Coach');
    await user.type(screen.getByLabelText('Email'), 'coach@example.com');
    await user.selectOptions(screen.getByLabelText('Role'), 'teacher');
    await user.type(screen.getByLabelText('Fitness goal'), 'mobility');
    await user.dblClick(screen.getByRole('button', { name: 'Create profile' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled());
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(1);
    resolvePost(new Response(JSON.stringify({ user: { name: 'Coach', email: 'coach@example.com', role: 'teacher', fitnessGoal: 'mobility' } }), { status: 201 }));
    await waitFor(() => expect(screen.getByText('Profile created.')).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith('/api/users', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ name: 'Coach', email: 'coach@example.com', role: 'teacher', fitnessGoal: 'mobility' }),
    }));
  });
});
