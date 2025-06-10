# Task Manager API

A robust RESTful API for managing tasks and subtasks with user authentication, built with Node.js and Express. This backend service provides comprehensive task organization features and is deployed as serverless functions on Netlify.

## Features

- **User Authentication**: Register, login, and Google OAuth integration
- **Task Management**: Create, read, update, and delete tasks
- **Task Organization**: Status tracking, priority levels, and tagging system
- **Subtask Management**: Create and manage subtasks with progress tracking
- **User Profile Management**: Update profile information and change password
- **Time Tracking**: Track time spent on tasks

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT, Google OAuth
- **Deployment**: Netlify Functions (Serverless)
- **Security**: Helmet, CORS, Express Rate Limit
- **Validation**: Express Validator

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login with email and password
- `POST /api/auth/google` - Login with Google

### Users
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update user profile
- `PUT /api/users/password` - Change password

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get a specific task
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task

### Subtasks
- `POST /api/tasks/:id/subtasks` - Add a subtask
- `PUT /api/tasks/:id/subtasks/:subtaskId` - Update a subtask
- `DELETE /api/tasks/:id/subtasks/:subtaskId` - Delete a subtask

## Task Model

Tasks include the following properties:
- Title and description
- Status (Draft, In Progress, Editing, Done)
- Type (Main Task, Secondary Task, Tertiary Task)
- Priority (Low, Medium, High, Urgent)
- Progress tracking (0-100%)
- Tags and categories
- Due dates
- Time tracking

## Deployment

This API is deployed on Netlify as serverless functions.

- **API URL**: https://taskms.greenhacker.tech
- **Frontend URL**: https://task.greenhacker.tech

## Local Development

1. Clone the repository
   ```
   git clone https://github.com/yourusername/task-manager-api.git
   cd task-manager-api
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRATION=7d
   GOOGLE_CLIENT_ID=your_google_client_id
   FRONTEND_URL=http://localhost:8080
   ```

4. Start the development server
   ```
   npm run dev
   ```

## Deployment to Netlify

1. Install Netlify CLI
   ```
   npm install -g netlify-cli
   ```

2. Login to Netlify
   ```
   netlify login
   ```

3. Deploy to Netlify
   ```
   netlify deploy --prod
   ```

4. Set environment variables in Netlify dashboard

## Frontend

**Frontend GitHub Repository**: [Task Manager Frontend](https://github.com/GreenHacker420/task-manager-frontend)

The frontend for this application is built with React and is deployed separately on Netlify at https://task.greenhacker.tech.

## License

MIT
