# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- **Presentation tier decision:** React 19 components with Bootstrap styling for each route (/activities, /teams, /leaderboard, /workouts). Use React Router for navigation, shared API client for backend calls, and accessible ARIA labels. Implement loading states and error boundaries.

- **Logic tier decision:** Express TypeScript routes with service layer separation. Routes validate input and delegate to services. Services contain business logic (points calculation, leaderboard aggregation, suggestion matching). Error handling returns deliberate 4xx responses for invalid input, never 500 from validation.

- **Data tier decision:** Mongoose schemas with required field validation. User, Team, Activity, and Workout models enforce constraints at document level. Relationships use ObjectId references. Seed data provides test fixtures for activity patterns and user goals.

- **Activity tracking approach:** POST /api/activities accepts userId, teamId, type, minutes. Service validates IDs exist, calculates points based on activity type (points = minutes × multiplier). Activity document stores user, team, type, minutes, computed points, and occurredAt timestamp.

- **Team management approach:** POST /api/teams accepts name, mascot, optional members array. Reject missing name with 400. Members array maintains ObjectId references to User documents. GET /api/teams lists all teams with their members populated.

- **Leaderboard approach:** Service aggregates activities by team, sums points per team, orders descending. Response includes teamName, totalPoints, and 1-based rank index. Lazy-computed at request time from activity collection.

- **Workout suggestions approach:** Match user's recent activity type to workout suggestions. First suggestion focus aligns with user's fitnessGoal or most common recent activity. Include reason explaining the connection (e.g., "matches your running activities").

## Test plan

Record the commands you run and what each failure means.

**Data-tier command:** `npm run test:data --prefix octofit-tracker/backend`
- Status: 4 of 5 tests failing
- User model: Missing required field validations (name, email, fitnessGoal)
- Team model: Missing required field validations (name, mascot)
- Activity model: Missing required field validations (type, user, team, points, occurredAt)
- Workout model: Missing required field validations (focus, minutes, difficulty)

**API command:** `npm run test:api --prefix octofit-tracker/backend`
- Status: 4 of 4 tests failing
- POST /api/activities rejects invalid input: Expected 400 status, getting 501 (Not Implemented)
- POST /api/teams rejects missing name: Expected 400 status, getting 501
- GET /api/leaderboard returns empty array: Expected ordered team entries with totalPoints and rank
- GET /api/workouts/suggestions/:userEmail missing reason field: Expected reason explaining suggestion rationale

**Frontend command:** `npm test --prefix octofit-tracker/frontend`
- Status: 15 of 15 tests failing
- All pages show "Implementation pending" placeholder
- API data not rendering: Activities, Teams, Leaderboard, Workout suggestions all missing
- Loading states, empty states, and error boundaries not implemented

**Backend build command:** `npm run build --prefix octofit-tracker/backend`
- Expected to pass after models and routes are implemented

**Frontend build command:** `npm run build --prefix octofit-tracker/frontend`
- Expected to pass after components are implemented
