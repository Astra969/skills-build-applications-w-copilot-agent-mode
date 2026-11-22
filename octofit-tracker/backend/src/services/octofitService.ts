import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function httpError(message: string, status: number) {
  return Object.assign(new Error(message), { status });
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

function requireText(value: unknown, field: string) {
  if (typeof value !== 'string' || value.trim().length === 0) throw httpError(`${field} is required`, 400);
  return value.trim();
}

function requireObjectId(value: unknown, field: string) {
  if (typeof value !== 'string' || !mongoose.isValidObjectId(value)) throw httpError(`${field} must be a valid ID`, 400);
  return new mongoose.Types.ObjectId(value);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw httpError('Activity details are required', 400);
  const userId = requireObjectId(input.userId, 'userId');
  const teamId = requireObjectId(input.teamId, 'teamId');
  const type = requireText(input.type, 'type');
  const minutes = input.minutes;
  if (typeof minutes !== 'number' || !Number.isInteger(minutes) || minutes < 1) throw httpError('minutes must be a positive whole number', 400);
  const occurredAt = input.occurredAt === undefined ? new Date() : new Date(String(input.occurredAt));
  if (Number.isNaN(occurredAt.getTime())) throw httpError('occurredAt must be a valid date', 400);

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) throw httpError('The selected user or team does not exist', 404);
  if (!user.team || user.team.toString() !== teamId.toString()) throw httpError('The activity team must match the user team', 400);

  return Activity.create({ user: userId, team: teamId, type, minutes, points: minutes, occurredAt });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw httpError('Team details are required', 400);
  const name = requireText(input.name, 'name');
  const mascot = requireText(input.mascot, 'mascot');
  const memberInputs = input.members === undefined ? [] : input.members;
  if (!Array.isArray(memberInputs)) throw httpError('members must be a list of user IDs', 400);
  const memberIds = [...new Map(memberInputs.map((member) => {
    const id = requireObjectId(member, 'member');
    return [id.toString(), id] as const;
  })).values()];
  const members = await User.find({ _id: { $in: memberIds } });
  if (members.length !== memberIds.length) throw httpError('One or more team members do not exist', 404);

  const team = await Team.create({ name, mascot, members: memberIds });
  for (const member of members) {
    if (member.team && member.team.toString() !== team._id.toString()) {
      await Team.updateOne({ _id: member.team }, { $pull: { members: member._id } });
    }
    member.team = team._id;
    await member.save();
  }
  return team;
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $lookup: { from: Team.collection.name, localField: '_id', foreignField: '_id', as: 'team' } },
    { $unwind: '$team' },
    { $project: { _id: 0, teamId: '$_id', teamName: '$team.name', totalPoints: 1 } },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);
  return totals.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function listUsers() {
  return User.find().populate('team', 'name').sort({ name: 1 }).lean();
}

export async function createUser(input: unknown) {
  if (!isRecord(input)) throw httpError('Profile details are required', 400);
  const name = requireText(input.name, 'name');
  const email = requireText(input.email, 'email').toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw httpError('email must be valid', 400);
  const fitnessGoal = requireText(input.fitnessGoal, 'fitnessGoal');
  const role = input.role ?? 'student';
  if (role !== 'student' && role !== 'teacher') throw httpError('role must be student or teacher', 400);
  const teamId = input.teamId === undefined || input.teamId === '' ? undefined : requireObjectId(input.teamId, 'teamId');
  if (teamId && !(await Team.exists({ _id: teamId }))) throw httpError('The selected team does not exist', 404);
  if (await User.exists({ email })) throw httpError('A profile with this email already exists', 409);

  const user = await User.create({ name, email, role, fitnessGoal, ...(teamId ? { team: teamId } : {}) });
  if (teamId) await Team.updateOne({ _id: teamId }, { $addToSet: { members: user._id } });
  return user;
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() });
  if (!user) throw httpError('Profile not found', 404);
  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const focus = user.fitnessGoal.trim().toLowerCase();
  const activityType = recentActivity?.type.toLowerCase();
  const matchesGoal = await Workout.find({ focus: new RegExp(`^${focus.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }).lean();
  const matchesActivity = activityType
    ? await Workout.find({ focus: new RegExp(`^${activityType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }).lean()
    : [];
  const matchingIds = new Set([...matchesGoal, ...matchesActivity].map((workout) => workout._id.toString()));
  const allWorkouts = await Workout.find().sort({ title: 1 }).lean();
  const ordered = [...allWorkouts].sort((a, b) => Number(matchingIds.has(b._id.toString())) - Number(matchingIds.has(a._id.toString())));
  return ordered.slice(0, 3).map((workout) => ({
    ...workout,
    reason: workout.focus.toLowerCase() === focus
      ? `Recommended to support your ${user.fitnessGoal} goal`
      : workout.focus.toLowerCase() === activityType
        ? `Based on your recent ${recentActivity?.type} activity`
        : 'A varied workout to support your fitness progress',
  }));
}

export { User };
