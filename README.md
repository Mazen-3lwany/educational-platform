# 🎓 Educational Platform

A backend application for an educational platform built with **NestJS**, providing authentication, user management, course management, and lesson management.

---

##  Features

###  Authentication & Authorization

The application provides a complete authentication and authorization system.

* User Registration
* Email Verification
* Resend Verification Email
* User Login
* JWT Access Token
* Refresh Token
* Refresh Token Rotation
* Forgot Password
* Reset Password
* Change Password
* User Logout
* Role-Based Access Control (RBAC)

###  User Management

The application provides user profile and administration functionality.

#### User Profile

* View personal profile
* Update personal profile
* Profile image management
* Delete personal account

#### User Administration

* Get all users
* Get a specific user
* Update a user
* Delete a specific user

###  Course Management

The application provides a complete course management system with CRUD operations, instructor-specific course management, course status control, and course restoration.

#### Course Operations

* Create courses
* Update courses
* Delete courses
* Get all courses
* Get a specific course

#### Instructor Course Management

* Get courses by instructor
* Get instructor's own courses

#### Course Status & Recovery

* Update course status
* Restore deleted courses

###  Lesson Management

The application provides lesson management functionality, including lesson creation, deletion, retrieval, and file management.

#### Lesson Operations

* Create lessons
* Delete lessons
* Get a specific lesson
* Get all lessons for a course

#### Lesson File Management

* Add files to lessons
* Delete files from lessons

---

##  Tech Stack

* **Backend:** NestJS
* **Language:** TypeScript
* **Database:** PostgreSQL
* **ORM:** Prisma
* **Authentication:** JWT
* **Rate Limiting:** @nestjs/throttler
* **Caching:** Redis
* **API Documentation:** Swagger
* **File Storage:** Cloudinary
* **Email Service:** Nodemailer

> Add or remove technologies according to the technologies actually used in the project.

---

## 🏗️ Project Structure

```text
src/
│
├── auth/
├── users/
├── courses/
├── lessons/
├── common/
├── config/
├── prisma/
│
├── app.module.ts
└── main.ts
```

The project follows a modular architecture where each major feature is organized into its own module.

---

## ⚙️ Installation

Clone the repository:

```bash
git clone <your-repository-url>
```

Navigate to the project directory:

```bash
cd <project-name>
```

Install the dependencies:

```bash
npm install
```

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL=

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

REDIS_HOST=
REDIS_PORT=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

MAIL_HOST=
MAIL_PORT=
MAIL_USER=
MAIL_PASSWORD=
```

> Never commit your `.env` file to the repository.

---

## 🗄️ Database Setup

Run Prisma migrations:

```bash
npx prisma migrate dev
```

Generate the Prisma Client:

```bash
npx prisma generate
```

---

## ▶️ Running the Application

### Development

```bash
npm run start:dev
```

### Production

```bash
npm run build
npm run start:prod
```

---

## 📚 API Documentation

The project provides API documentation using **Swagger**.

After starting the application, open:

```text
http://localhost:3000/apis/educational-platform
```

Swagger provides detailed information about:

* Available endpoints
* Request parameters
* Request body
* Authentication
* Responses
* API schemas

---

##  Authentication Flow

The authentication system follows this general flow:

```text
Register
   ↓
Email Verification
   ↓
Login
   ↓
Access Token + Refresh Token
   ↓
Access Protected Resources
   ↓
Access Token Expired
   ↓
Refresh Token
   ↓
New Access Token + Refresh Token
```

The application uses **Refresh Token Rotation** to improve authentication security.

---

##  API Modules

The main API modules currently include:

* Authentication
* Users
* Courses
* Lessons

Additional modules will be added as the platform grows.

---



## 📌 Project Status

🚧 **Under Development**

The platform is actively being developed, with additional educational features planned.

---

## 👨‍💻 Author

**Mazen Elwany**

Backend Developer — Node.js / NestJS

---

## 📄 License

This project is for educational and development purposes.
