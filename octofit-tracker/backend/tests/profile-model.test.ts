import { describe, expect, it } from 'vitest';
import { User } from '../src/models/User.js';

describe('OctoFit profile model', () => {
  it('accepts student and teacher roles with a valid email', () => {
    for (const role of ['student', 'teacher']) {
      const user = new User({ name: 'Coach', email: 'coach@example.com', role, fitnessGoal: 'mobility' });
      expect(user.validateSync()).toBeUndefined();
    }
  });

  it('rejects malformed email addresses', () => {
    const user = new User({ name: 'Student', email: 'not-an-email', fitnessGoal: 'endurance' });
    expect(user.validateSync()?.errors.email).toBeDefined();
  });
});
