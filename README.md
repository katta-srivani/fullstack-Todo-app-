# Fullstack Todo App

A MERN stack Todo application with a React frontend, Express/Node backend, and MongoDB database. Users can create, read, update, and delete todos through a responsive interface connected to REST APIs.

## Tech Stack

- Frontend: React.js, Vite, CSS
- Backend: Node.js, Express.js or Vercel Serverless API
- Database: MongoDB with Mongoose

## Features

- Add new todos
- View saved todos from MongoDB
- Edit existing todos
- Delete todos
- Responsive UI
- Production-safe API calls that do not point to localhost
- Browser-storage fallback when the database API is unavailable

## Project Structure

```text
frontend/        React client
frontend/api/    Vercel serverless API for deployed frontend
backend/         Express API and MongoDB models for local or separate backend hosting
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

Create a `.env` file in `frontend/` only if you are calling a separately hosted backend:

```text
VITE_API_URL=http://localhost:5000
```

Run the frontend:

```bash
npm run dev
```

## Vercel Deployment

Deploy the `frontend/` folder on Vercel and add this environment variable in the Vercel project settings:

```text
MONGODB_URL=your_mongodb_connection_string
```

When `VITE_API_URL` is not set in production, the React app calls the same-origin `/api/todos` serverless route, so the deployed app will not call `http://localhost:5000` in the browser.
