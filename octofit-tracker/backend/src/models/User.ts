import { Schema, model } from 'mongoose';

function isValidEmail(email: string) {
  const atIndex = email.indexOf('@');
  const finalDotIndex = email.lastIndexOf('.');
  return atIndex > 0
    && atIndex === email.lastIndexOf('@')
    && finalDotIndex > atIndex + 1
    && finalDotIndex < email.length - 1
    && !email.includes(' ');
}

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true, validate: { validator: isValidEmail, message: 'Email must be valid' } },
  role: { type: String, enum: ['student', 'teacher'], default: 'student', required: true },
  team: { type: Schema.Types.ObjectId, ref: 'Team' },
  fitnessGoal: { type: String, required: true, trim: true },
});

export const User = model('User', userSchema);
