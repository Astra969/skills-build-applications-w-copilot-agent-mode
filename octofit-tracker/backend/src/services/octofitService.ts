import { Activity, Team, User, Workout } from '../models/index.js';
import mongoose from 'mongoose';

// OctoFit application services: activity tracking, team management, leaderboard, and workout suggestions
export async function listActivities() {
  const activities = await Activity.find().lean();
  return activities.map((a) => ({
    ...a,
    user: a.user.toString(),
    team: a.team.toString(),
  }));
}

export async function createActivity(input: unknown) {
  const body = input as Record<string, unknown>;
  const { userId, teamId, type, minutes } = body;

  // Validate required fields
  if (!userId || !teamId || !type || minutes === undefined) {
    const error = Object.assign(new Error('Missing required fields'), { status: 400 });
    throw error;
  }

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(userId as string) || !mongoose.Types.ObjectId.isValid(teamId as string)) {
    const error = Object.assign(new Error('Invalid user or team ID format'), { status: 400 });
    throw error;
  }

  // Verify user and team exist
  const user = await User.findById(userId);
  const team = await Team.findById(teamId);

  if (!user || !team) {
    const error = Object.assign(new Error('User or team not found'), { status: 400 });
    throw error;
  }

  // Calculate points (simple multiplier based on type)
  const pointsMap: Record<string, number> = { run: 1, cycle: 1, strength: 1 };
  const points = (minutes as number) * (pointsMap[type as string] || 1);

  // Create activity
  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes,
    points,
    occurredAt: new Date(),
  });

  const obj = activity.toObject();
  return {
    ...obj,
    user: obj.user.toString(),
    team: obj.team.toString(),
  };
}

export async function listTeams() {
  const teams = await Team.find().lean();
  return teams.map((t) => ({
    ...t,
    members: (t.members as mongoose.Types.ObjectId[]).map((m) => m.toString()),
  }));
}

export async function createTeam(input: unknown) {
  const body = input as Record<string, unknown>;
  const { name, mascot, members } = body;

  // Validate required fields
  if (!name) {
    const error = Object.assign(new Error('Team name is required'), { status: 400 });
    throw error;
  }

  // Create team
  const team = await Team.create({
    name,
    mascot,
    members: (members as string[]) || [],
  });

  const obj = team.toObject();
  return {
    ...obj,
    members: (obj.members as mongoose.Types.ObjectId[]).map((m) => m.toString()),
  };
}

export async function getLeaderboard() {
  const activities = await Activity.aggregate([
    {
      $group: {
        _id: '$team',
        totalPoints: { $sum: '$points' },
      },
    },
    {
      $lookup: {
        from: 'teams',
        localField: '_id',
        foreignField: '_id',
        as: 'teamData',
      },
    },
    {
      $unwind: '$teamData',
    },
    {
      $sort: { totalPoints: -1 },
    },
  ]);

  return activities.map((item, index) => ({
    teamName: item.teamData.name,
    totalPoints: item.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  // Find user
  const user = await User.findOne({ email: userEmail });

  if (!user) {
    const error = Object.assign(new Error('User not found'), { status: 404 });
    throw error;
  }

  // Find most common activity type for this user
  const recentActivities = await Activity.aggregate([
    { $match: { user: user._id } },
    { $group: { _id: '$type', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 1 },
  ]);

  const userFocus = recentActivities.length > 0 ? recentActivities[0]._id : user.fitnessGoal;

  // Find workout matching the focus
  const workouts = await Workout.find({ focus: userFocus }).lean();

  if (workouts.length === 0) {
    // Fallback: return workout matching fitness goal
    const goalWorkouts = await Workout.find({ focus: user.fitnessGoal }).lean();
    return goalWorkouts.map((w) => ({
      ...w,
      _id: (w._id as mongoose.Types.ObjectId).toString(),
      reason: `Matches your ${user.fitnessGoal} goal`,
    }));
  }

  return workouts.map((w) => ({
    ...w,
    _id: (w._id as mongoose.Types.ObjectId).toString(),
    reason: `Matches your recent ${userFocus} activity`,
  }));
}

export { User };
