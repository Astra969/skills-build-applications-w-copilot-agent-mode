import { Schema, model } from 'mongoose';

// User model with required validation for name, email, and fitness goal
const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  team: { type: Schema.Types.ObjectId, ref: 'Team' },
  fitnessGoal: { type: String, required: true },
});

export const User = model('User', userSchema);
