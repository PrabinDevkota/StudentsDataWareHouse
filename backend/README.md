# Student Data Warehouse Backend

A comprehensive backend system for managing student data, placements, research projects, and matching algorithms. Built with Node.js, Express, and MySQL.

## Features

- **Student Management**: Complete CRUD operations for student profiles with skills, interests, and academic data
- **Placement System**: Track job applications, interviews, and placement status
- **Research Projects**: Manage faculty research projects and student participation
- **Matching Algorithm**: Intelligent matching of students to companies and clubs based on skills, CGPA, and interests
- **File Upload**: Avatar upload with local storage using Multer
- **Authentication**: JWT-based authentication with role-based access control
- **Data Seeding**: Comprehensive faker-based seeding for development and testing

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MySQL with `mysql2/promise`
- **Authentication**: JWT, bcrypt
- **File Upload**: Multer
- **Validation**: Joi
- **Logging**: Winston
- **Testing**: Mocha, Chai, Supertest

## Prerequisites

- Node.js (v16 or higher)
- MySQL (v8 or higher)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd student-data-warehouse-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # MySQL connection (use URL or individual vars)
   # MYSQL_URL=mysql://user:password@localhost:3306/student_dw
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_USER=root
   MYSQL_PASSWORD=your-password
   MYSQL_DATABASE=student_dw

   JWT_SECRET=your-super-secret-jwt-key-here
   PORT=4000
   NODE_ENV=development
   BCRYPT_ROUNDS=10
   ```

4. **Database Setup**
   ```bash
   # Create the database (if not auto-created by the app)
   # From MySQL client:
   CREATE DATABASE IF NOT EXISTS student_dw;

   # Import schema (optional if you need structure upfront)
   # mysql -u root -p student_dw < ../../schema.mysql.sql

   # Seed data (if applicable in your setup)
   npm run seed
   npm run seed:faker # optional
   ```

5. **Start the server**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (Admin only)
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

### Students
- `GET /api/students` - Get all students with filters
- `GET /api/students/:id` - Get student by ID
- `POST /api/students` - Create student (Admin only)
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student (Admin only)
- `POST /api/students/:id/avatar` - Upload avatar
- `GET /api/students/:id/skills` - Get student skills
- `POST /api/students/:id/skills` - Add skill to student

### Companies
- `GET /api/companies` - Get all companies
- `GET /api/companies/:id` - Get company by ID
- `POST /api/companies` - Create company (Admin only)
- `PUT /api/companies/:id` - Update company (Admin only)
- `DELETE /api/companies/:id` - Delete company (Admin only)
- `GET /api/companies/:id/candidates` - Get matching candidates
- `POST /api/companies/:id/job-roles` - Create job role (CIR/Admin only). Body must include `company_id` (UUID, equal to `:id`) and `title`.
- `PUT /api/companies/:id/job-roles/:job_role_id` - Update job role (CIR/Admin only)
- `DELETE /api/companies/:id/job-roles/:job_role_id` - Delete job role (CIR/Admin only)

### Placements
- `GET /api/placements` - Get all placements
- `GET /api/placements/:id` - Get placement by ID
- `POST /api/placements` - Create placement (CIR/Admin only)
- `PUT /api/placements/:id/status` - Update placement status
- `GET /api/placements/stats/summary` - Get placement statistics

### Invitations
#### Club Invitations
- `POST /api/clubs/:id/invitations` - Create club invitation (Club owner/Admin). Body: `{ student_id: UUID, role?: string }`
- `GET /api/clubs/:id/invitations` - List invitations for a club (Club owner/Admin)
- `GET /api/students/:id/invitations` - List invitations for a student (Student owner/Admin)
- `POST /api/invitations/:id/respond` - Respond to club invitation (Student owner/Admin). Body: `{ action: 'ACCEPT' | 'DECLINE' }`

#### Placement Invitations
- `POST /api/companies/:id/invitations` - Suggest a student for a company role (CIR/Admin). Body: `{ student_id: UUID, job_role_id?: UUID }`
- `GET /api/companies/:id/invitations` - List placement invitations for a company (CIR/Admin)
- `GET /api/students/:id/placement-invitations` - List placement invitations for a student (Student owner/Admin)
- `POST /api/placement-invitations/:id/respond` - Respond to placement invitation (Student owner/Admin). Body: `{ action: 'ACCEPT' | 'DECLINE' }`

Notes:
- All invitations use Joi validation; `student_id` must be a UUID. Unknown fields are stripped.
- Authorization: Club routes require Club owner or Admin; Placement invitation routes require CIR or Admin except student-owned listing/respond routes.

### Research Projects
- `GET /api/research/projects` - Get all research projects
- `GET /api/research/projects/:id` - Get project by ID
- `POST /api/research/projects` - Create project (Faculty/Admin only)
- `POST /api/research/projects/:id/participants` - Add participant

### Skills & Interests
- `GET /api/skills` - Get all skills
- `POST /api/skills` - Create skill (Admin only)
- `GET /api/interests` - Get all interests
- `POST /api/interests` - Create interest (Admin only)

## Database Schema

The system uses the following main tables:
- `students` - Student profiles and academic data
- `faculty` - Faculty information
- `companies` - Company information
- `placements` - Job placement tracking
- `research_projects` - Research project management
- `skills` - Skills catalog
- `interests` - Interests catalog
- `clubs` - Student clubs and organizations

## Matching Algorithm

The system includes an intelligent matching algorithm that considers:
- **Skills Match** (30% weight) - Required vs. student skills
- **CGPA Score** (25% weight) - Academic performance
- **Attendance** (20% weight) - Attendance percentage
- **Interests** (25% weight) - Interest alignment

## File Upload

Avatar uploads are stored locally in the `uploads/avatars/YYYY/MM/DD/` directory structure with unique filenames.

## Testing

```bash
# Run all tests
npm test

# Run SQL constraint tests
npm run test:sql
```

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed basic data
- `npm run seed:faker` - Seed with faker data
- `npm test` - Run tests

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MYSQL_URL` | MySQL connection string | Optional |
| `MYSQL_HOST` | MySQL host | `localhost` |
| `MYSQL_PORT` | MySQL port | `3306` |
| `MYSQL_USER` | MySQL user | `root` |
| `MYSQL_PASSWORD` | MySQL password |  |
| `MYSQL_DATABASE` | MySQL database name | `student_dw` |
| `JWT_SECRET` | JWT signing secret | Required |
| `PORT` | Server port | 4000 |
| `NODE_ENV` | Environment | development |
| `BCRYPT_ROUNDS` | Bcrypt rounds | 10 |
| `MAX_FILE_SIZE` | Max upload size | 5242880 |
| `ALLOWED_FILE_TYPES` | Allowed file types | image/jpeg,image/png |

## API Response Format

All API responses follow this format:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "meta": { ... }
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## MySQL Migration Notes

- SQL placeholders use `?` instead of PostgreSQL `$n` style.
- Case-insensitive text search uses `LOWER(column) LIKE LOWER(?)` for portability.
- JSON aggregation uses MySQL functions: `JSON_ARRAYAGG` and `JSON_OBJECT` in subqueries.
- `NULL`-safe equality leverages MySQL `<=>` when comparing optional keys (e.g., `job_role_id`).
- Connection is managed via `mysql2/promise` pool; environment variables support either `MYSQL_URL` or individual `MYSQL_*` fields.
- Run create_cir_user, create_admin_user to create a CIR and an Admin user with node <fileName>
