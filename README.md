# Fullstack Todo App

A MERN stack Todo application with a React frontend, Express/Node backend, and MongoDB database. Users can create, read, update, and delete todos through a responsive interface connected to REST APIs.

## Tech Stack

- Frontend: React.js, Vite, CSS
- Backend: Node.js, Express.js
- Database: MongoDB with Mongoose

## Features

- Add new todos
- View saved todos from MongoDB
- Edit existing todos
- Delete todos
- Responsive UI

## Project Structure

```text
frontend/   React client
backend/    Express API and MongoDB models
```

## Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```text
MONGODB_URL=your_mongodb_connection_string
PORT=5000
```

Run the backend:

```bash
npm start
```

## Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/` if your backend is not running at `http://localhost:5000`:

```text
VITE_API_URL=http://localhost:5000
```

Run the frontend:

```bash
npm run dev
```
