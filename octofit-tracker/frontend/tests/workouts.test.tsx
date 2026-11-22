import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App.js';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('OctoFit workout suggestions', () => {
  it('ignores a stale response after another profile is requested', async () => {
    let resolveMona!: (response: Response) => void;
    const monaResponse = new Promise<Response>((resolve) => { resolveMona = resolve; });
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      if (String(input).includes('mona%40example.com')) return monaResponse;
      return Promise.resolve(new Response(JSON.stringify({
        suggestions: [{ title: 'Coach workout', focus: 'mobility', minutes: 20, difficulty: 'easy', reason: 'For Coach' }],
      }), { status: 200 }));
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/workouts']}><App /></MemoryRouter>);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const email = screen.getByLabelText('Profile email');
    await user.clear(email);
    await user.type(email, 'coach@example.com');
    await user.click(screen.getByRole('button', { name: 'Get suggestions' }));
    await waitFor(() => expect(screen.getByText(/Coach workout/)).toBeInTheDocument());

    resolveMona(new Response(JSON.stringify({
      suggestions: [{ title: 'Mona workout', focus: 'endurance', minutes: 30, difficulty: 'moderate', reason: 'For Mona' }],
    }), { status: 200 }));

    await waitFor(() => expect(screen.getByText(/Coach workout/)).toBeInTheDocument());
    expect(screen.queryByText(/Mona workout/)).not.toBeInTheDocument();
  });
});
