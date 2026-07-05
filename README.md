# 💬 Chat Application

A full-stack real-time chat application built with **React**, **Node.js**, **Socket.io**, and **MongoDB**. Features instant messaging, online presence indicators, user authentication, profile picture uploads via Cloudinary, and a clean responsive UI with Tailwind CSS.

---

## 🌐 Live Demo

| Service | URL |
|--------|-----|
| 🖥️ Frontend | Deployed on **Vercel** |
| ⚙️ Backend  | Deployed on **Render** |

---

## ✨ Features

- 🔐 **JWT Authentication** — Secure register/login with hashed passwords (bcryptjs)
- ⚡ **Real-time Messaging** — Powered by Socket.io for instant bidirectional communication
- 🟢 **Online Presence** — See which users are currently online in real time
- 🖼️ **Profile Pictures** — Upload and update avatars via Cloudinary
- 📷 **Image Sharing** — Send images in chat (Base64 → Cloudinary)
- 🧑‍🤝‍🧑 **User List Sidebar** — Browse and select users to chat with
- 📱 **Responsive Design** — Works seamlessly on desktop and mobile
- 🌙 **Modern Dark UI** — Clean dark-themed interface built with Tailwind CSS v4
- 🔒 **Protected Routes** — Frontend route guards + backend middleware

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 19 | UI Framework |
| Vite 8 | Build Tool & Dev Server |
| Tailwind CSS v4 | Utility-first Styling |
| React Router DOM v7 | Client-side Routing |
| Socket.io Client | Real-time WebSocket communication |
| Axios | HTTP requests |
| React Hot Toast | Notifications/toasts |
| Context API | Global State Management |

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js + Express v5 | REST API Server |
| Socket.io | WebSocket Server |
| MongoDB + Mongoose | Database & ODM |
| JWT (jsonwebtoken) | Authentication Tokens |
| bcryptjs | Password Hashing |
| Cloudinary | Image Storage & CDN |
| dotenv | Environment Variables |
| nodemon | Dev Auto-restart |

---

## 📁 Project Structure

```
chat-application/
├── client/                     # React Frontend (Vite)
│   ├── public/
│   ├── src/
│   │   ├── assets/             # Static assets
│   │   ├── components/
│   │   │   ├── ChatContainer.jsx   # Main chat window with messages & input
│   │   │   ├── Sidebar.jsx         # User list & search
│   │   │   └── RightSidebar.jsx    # Selected user profile panel
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Global auth & socket state
│   │   ├── lib/                # Axios instance & helpers
│   │   ├── pages/
│   │   │   ├── HomePage.jsx        # Main chat layout
│   │   │   ├── LoginPage.jsx       # Login & Register forms
│   │   │   └── ProfilePage.jsx     # Update profile/avatar
│   │   ├── App.jsx             # Routes definition
│   │   └── main.jsx            # React entry point
│   ├── .env.example            # Client environment variables template
│   ├── vite.config.js
│   └── package.json
│
├── server/                     # Node.js Backend (Express)
│   ├── controllers/
│   │   ├── userController.js       # Auth: register, login, profile update, user list
│   │   └── messageController.js    # Messages: send, fetch, image upload
│   ├── lib/
│   │   ├── db.js                   # MongoDB connection
│   │   └── utils.js                # JWT generator & Cloudinary config
│   ├── middleware/
│   │   └── auth.js                 # JWT protectRoute middleware
│   ├── models/
│   │   ├── User.js                 # User schema (name, email, password, avatar, bio)
│   │   └── Message.js              # Message schema (sender, receiver, text, image)
│   ├── routes/
│   │   ├── userRoutes.js           # /api/auth/* routes
│   │   └── messageRoutes.js        # /api/messages/* routes
│   ├── server.js               # Express + Socket.io entry point
│   ├── .env.example            # Server environment variables template
│   └── package.json
│
├── render.yaml                 # Render.com deployment config
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites

- **Node.js** v18+ and **npm**
- A **MongoDB Atlas** account (or local MongoDB)
- A **Cloudinary** account (free tier is sufficient)

### 1. Clone the repository

```bash
git clone https://github.com/sailor-aman/Chat-application.git
cd Chat-application
```

### 2. Set up the Backend (Server)

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory (use `.env.example` as a reference):

```env
MONGODB_URI="your_mongodb_atlas_connection_string"
PORT=5000
FRONTEND_URL="http://localhost:5173"
JWT_SECRET="your_strong_random_jwt_secret_key"
CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"
```

Start the development server:

```bash
npm run dev    # Uses nodemon for auto-restart
```

The backend will run on **http://localhost:5000**

### 3. Set up the Frontend (Client)

Open a new terminal:

```bash
cd client
npm install
```

Create a `.env` file in the `client/` directory:

```env
VITE_BACKEND_URL="http://localhost:5000"
```

Start the Vite dev server:

```bash
npm run dev
```

The frontend will open on **http://localhost:5173**

---

## 🔌 API Endpoints

### Auth Routes — `/api/auth`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/register` | Public | Register a new user |
| `POST` | `/login` | Public | Login and receive JWT |
| `PUT` | `/update-profile` | Protected | Update name, bio, avatar |
| `GET` | `/check` | Protected | Verify token & get user data |
| `GET` | `/users` | Protected | Get all users (for sidebar) |

### Message Routes — `/api/messages`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/:id` | Protected | Get conversation with a user |
| `POST` | `/send/:id` | Protected | Send a text or image message |

### Status

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/status` | Public | Health check — returns "Server is live" |

---

## ⚡ Real-time Events (Socket.io)

| Event | Direction | Description |
|-------|-----------|-------------|
| `connection` | Client → Server | User connects with their `userId` query param |
| `getOnlineUsers` | Server → All Clients | Broadcasts array of online user IDs |
| `newMessage` | Server → Specific Client | Delivers a new message to the recipient in real time |
| `disconnect` | Client → Server | Removes user from online list, notifies others |

---

## ☁️ Deployment

### Backend → Render

1. Connect your GitHub repo to [Render.com](https://render.com)
2. Select **New Web Service** → choose the repo
3. Set **Root Directory** to `server`
4. **Build Command**: `npm install`
5. **Start Command**: `node server.js`
6. Add all environment variables from `server/.env.example`
7. The `render.yaml` in the repo root auto-configures this for you

### Frontend → Vercel

1. Connect your GitHub repo to [Vercel](https://vercel.com)
2. Set **Root Directory** to `client`
3. **Framework Preset**: Vite
4. Add environment variable: `VITE_BACKEND_URL` = your Render backend URL
5. Deploy!

> **Important**: After deploying, update `FRONTEND_URL` in your Render environment variables with your Vercel URL, and vice versa.

---

## 🔐 Environment Variables Reference

### Server (`server/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB Atlas connection string | ✅ |
| `PORT` | Server port (default: 5000) | ✅ |
| `FRONTEND_URL` | Your frontend URL (for CORS) | ✅ |
| `JWT_SECRET` | Secret key for signing JWTs | ✅ |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | ✅ |
| `CLOUDINARY_API_KEY` | Cloudinary API key | ✅ |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | ✅ |

### Client (`client/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_BACKEND_URL` | Backend API base URL | ✅ |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👤 Author

**Aman**
GitHub: [@sailor-aman](https://github.com/sailor-aman)
Email: amankr31104@gmail.com

---

> ⭐ If you found this project helpful, please give it a star!
