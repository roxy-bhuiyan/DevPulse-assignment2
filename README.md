DevPulse – 

Internal Tech Issue & Feature Tracker
A collaborative platform for software teams to report bugs, suggest features, and coordinate resolutions.

## live url
`https://dev-pulse-assignment2.vercel.app/`

## Tech Stack
- Node.js + TypeScript + Express.js + PostgreSQL (NeonDB) + bcrypt + jsonwebtoken




## API Endpoints
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | /api/auth/signup | Public | Register user |
| POST | /api/auth/login | Public | Login & get token |
| POST | /api/issues | Authenticated | Create issue |
| GET | /api/issues | Public | Get all issues |
| GET | /api/issues/:id | Public | Get single issue |
| PATCH | /api/issues/:id | Authenticated | Update issue |
| DELETE | /api/issues/:id | Maintainer | Delete issue |

## Database Schema
### users
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL | Primary key |
| name | VARCHAR(100) | Required |
| email | VARCHAR(255) | Unique |
| password | TEXT | Hashed |
| role | VARCHAR(20) | contributor / maintainer |
| created_at | TIMESTAMPTZ | Auto |
| updated_at | TIMESTAMPTZ | Auto |

### issues
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL | Primary key |
| title | VARCHAR(150) | Required |
| description | TEXT | Min 20 chars |
| type | VARCHAR(20) | bug / feature_request |
| status | VARCHAR(20) | open / in_progress / resolved |
| reporter_id | INTEGER | FK to users.id |
| created_at | TIMESTAMPTZ | Auto |
| updated_at | TIMESTAMPTZ | Auto |