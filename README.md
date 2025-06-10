# Task Manager API

Backend API for the Task Manager application.

## Features

- User authentication (login, register, Google OAuth)
- Task management (create, read, update, delete)
- Task organization (status, priority, tags)
- Subtask management
- User profile management

## Tech Stack

- Node.js
- Express.js
- MongoDB
- JWT Authentication
- Google OAuth

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

## Deployment

This API is deployed on Netlify as serverless functions.

- **API URL**: https://taskms.greenhacker.tech
- **Frontend URL**: https://task.greenhacker.tech

## Frontend

The frontend for this application is deployed separately on Netlify at https://task.greenhacker.tech.
