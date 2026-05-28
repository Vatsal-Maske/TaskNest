# StudyOS Backend 📚

A clean, production-like REST API backend for **StudyOS** — a student productivity platform where users can manage subjects, todos, notes, study sessions, exams, and resources.

---

## 🛠 Tech Stack

| Technology    | Purpose                        |
|---------------|-------------------------------|
| Node.js       | Runtime                        |
| Express.js    | Web Framework                  |
| MongoDB       | Database                       |
| Mongoose      | ODM for MongoDB                |
| JWT           | Authentication Tokens          |
| bcryptjs      | Password Hashing               |
| cookie-parser | Cookie Parsing                 |
| cors          | Cross-Origin Resource Sharing  |
| dotenv        | Environment Variables          |

---

## 📁 Folder Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js                   # MongoDB connection
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── subject.controller.js
│   │   ├── todo.controller.js
│   │   ├── note.controller.js
│   │   ├── exam.controller.js
│   │   ├── studySession.controller.js
│   │   └── resource.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js       # JWT verification
│   │   ├── error.middleware.js      # Global error handler
│   │   └── asyncHandler.js         # Async wrapper utility
│   ├── models/
│   │   ├── user.model.js
│   │   ├── subject.model.js
│   │   ├── todo.model.js
│   │   ├── note.model.js
│   │   ├── exam.model.js
│   │   ├── studySession.model.js
│   │   └── resource.model.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── subject.routes.js
│   │   ├── todo.routes.js
│   │   ├── note.routes.js
│   │   ├── exam.routes.js
│   │   ├── studySession.routes.js
│   │   └── resource.routes.js
│   ├── utils/
│   │   ├── generateToken.js         # JWT + cookie generation
│   │   └── apiError.js              # Custom error class
│   ├── app.js                       # Express app setup
│   └── server.js                    # Server entry point
├── .env
├── .env.example
├── package.json
└── README.md
```

---

## ⚙️ Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
copy .env.example .env
```

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/studyos
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

> **Note:** For `MONGO_URI`, you can use a local MongoDB instance or a [MongoDB Atlas](https://www.mongodb.com/atlas) cloud URI.

### 3. Run the Development Server

```bash
npm run dev
```

The API will be available at: `http://localhost:5000`

---

## 🔐 Authentication

This API uses **JWT tokens stored in HTTP-only cookies** for authentication.

- On login/register, a token is stored in a `token` cookie automatically.
- The cookie is `httpOnly` (not accessible by JavaScript) and `sameSite: strict`.
- All protected routes require this cookie to be present.
- To logout, call `POST /api/auth/logout` which clears the cookie.

---

## 📡 API Reference

### Auth

| Method | Endpoint              | Access  | Description         |
|--------|-----------------------|---------|---------------------|
| POST   | `/api/auth/register`  | Public  | Register a new user |
| POST   | `/api/auth/login`     | Public  | Login user          |
| GET    | `/api/auth/me`        | Private | Get current user    |
| POST   | `/api/auth/logout`    | Private | Logout user         |

---

### Subjects

| Method | Endpoint             | Access  | Description             |
|--------|----------------------|---------|-------------------------|
| POST   | `/api/subjects`      | Private | Create a new subject    |
| GET    | `/api/subjects`      | Private | Get all subjects        |
| GET    | `/api/subjects/:id`  | Private | Get subject by ID       |
| PATCH  | `/api/subjects/:id`  | Private | Update a subject        |
| DELETE | `/api/subjects/:id`  | Private | Delete a subject        |

---

### Todos

| Method | Endpoint          | Access  | Description          |
|--------|-------------------|---------|----------------------|
| POST   | `/api/todos`      | Private | Create a new todo    |
| GET    | `/api/todos`      | Private | Get all todos        |
| GET    | `/api/todos/:id`  | Private | Get todo by ID       |
| PATCH  | `/api/todos/:id`  | Private | Update a todo        |
| DELETE | `/api/todos/:id`  | Private | Delete a todo        |

---

### Notes

| Method | Endpoint          | Access  | Description          |
|--------|-------------------|---------|----------------------|
| POST   | `/api/notes`      | Private | Create a new note    |
| GET    | `/api/notes`      | Private | Get all notes        |
| GET    | `/api/notes/:id`  | Private | Get note by ID       |
| PATCH  | `/api/notes/:id`  | Private | Update a note        |
| DELETE | `/api/notes/:id`  | Private | Delete a note        |

---

### Exams

| Method | Endpoint          | Access  | Description          |
|--------|-------------------|---------|----------------------|
| POST   | `/api/exams`      | Private | Create a new exam    |
| GET    | `/api/exams`      | Private | Get all exams        |
| GET    | `/api/exams/:id`  | Private | Get exam by ID       |
| PATCH  | `/api/exams/:id`  | Private | Update an exam       |
| DELETE | `/api/exams/:id`  | Private | Delete an exam       |

---

### Study Sessions

| Method | Endpoint                      | Access  | Description                   |
|--------|-------------------------------|---------|-------------------------------|
| POST   | `/api/study-sessions`         | Private | Log a new study session       |
| GET    | `/api/study-sessions`         | Private | Get all study sessions        |
| GET    | `/api/study-sessions/stats`   | Private | Get study stats & analytics   |
| DELETE | `/api/study-sessions/:id`     | Private | Delete a study session        |

**Stats Response:**
```json
{
  "success": true,
  "stats": {
    "totalStudyTime": 360,
    "totalSessions": 5,
    "subjectWiseStudyTime": [
      { "subjectId": "...", "name": "Math", "color": "#6366f1", "totalMinutes": 120 }
    ]
  }
}
```

---

### Resources

| Method | Endpoint              | Access  | Description              |
|--------|-----------------------|---------|--------------------------|
| POST   | `/api/resources`      | Private | Add a new resource       |
| GET    | `/api/resources`      | Private | Get all resources        |
| GET    | `/api/resources/:id`  | Private | Get resource by ID       |
| PATCH  | `/api/resources/:id`  | Private | Update a resource        |
| DELETE | `/api/resources/:id`  | Private | Delete a resource        |

---

## 🔒 Security Features

- Passwords are hashed with **bcryptjs** before storing in MongoDB
- JWT tokens are stored in **HTTP-only cookies** (XSS safe)
- Every protected route validates the token via **auth middleware**
- Users can only access **their own data** (userId scoping on all queries)
- Password is **never returned** in API responses

---

## 📬 API Response Format

All responses follow this consistent format:

**Success:**
```json
{
  "success": true,
  "message": "Optional message",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## 🚀 Scripts

| Script        | Command          | Description                   |
|---------------|------------------|-------------------------------|
| Start         | `npm start`      | Start production server       |
| Development   | `npm run dev`    | Start with nodemon auto-reload|
