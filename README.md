# GTS_TZ Backend

This is the complete Node.js, Express, and MongoDB backend for the GTS_TZ Content Management & Moderation Platform. It provides a RESTful API to handle user authentication, role-based access control, and full CRUD (Create, Read, Update, Delete) operations for articles.

## Key Features

-   **Role-Based Access Control (RBAC):** Supports three distinct user roles (`ADMIN`, `AUTHOR`, `MODERATOR`) with specific permissions for each.
-   **Secure Authentication:** Uses JSON Web Tokens (JWT) for secure, stateless authentication. Passwords are never stored in plain text and are hashed using `bcrypt`.
-   **Brute-Force Protection:** Implements login attempt throttling to lock accounts after multiple failed attempts.
-   **Full Article Lifecycle:**
    -   Authors can create, edit, delete, and submit articles.
    -   Moderators can review, approve, or reject articles.
    -   Published articles are available to all authenticated users.
-   **Admin Panel Functionality:** Admins can create and manage users of any role.

## Tech Stack & Architecture

-   **Framework:** Node.js with Express.js
-   **Database:** MongoDB with Mongoose for Object Data Modeling (ODM).
-   **Authentication:** `jsonwebtoken` for JWT generation, `bcrypt` for password hashing.
-   **Middleware:**
    -   `cors` for enabling cross-origin requests from the Android client.
    -   Custom middleware for token verification (`auth.js`) and role checking (`checkRole.js`).
-   **Environment Management:** `dotenv` for handling environment variables.
-   **Development:** `nodemon` for automatic server restarts during development.
-   **Architecture:** The project follows a Domain-Driven structure, with logic separated by features (`user`, `article`) into `model`, `controller`, and `routes` files.

---

## Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18.x or later recommended)
-   `npm` or `yarn` package manager
-   A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account and a connection URI.

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd <repository-folder>
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root of the project by copying the example:

```bash
# On Windows (Command Prompt)
copy .env.example .env

# On macOS/Linux
cp .env.example .env
```

Now, open the `.env` file and fill in the required values:

```env
# The connection string for your MongoDB Atlas cluster
MONGODB_URI="mongodb+srv://<user>:<password>@<cluster-url>/<db-name>?retryWrites=true&w=majority"

# The port the server will run on
PORT=5000

# A secret key for signing JSON Web Tokens. Make this a long, random string.
TOKEN_KEY="yourSuperSecretKey"

# The expiration time for tokens (e.g., "2h", "7d", "30m")
TOKEN_EXPIRY="2h"
```

### 4. Seed the Database

To use the application, you need an initial `ADMIN` user. Run the seed script to create one.

```bash
npm run seed
```
This will create a user with the following credentials:
-   **Login:** `admin`
-   **Password:** `admin1234`

### 5. Running the Server

-   **For Development (with auto-reload):**
    ```bash
    npm run dev
    ```
-   **For Production:**
    ```bash
    npm start
    ```
The server will be running at `http://localhost:5000` (or the port you specified).

---

## API Documentation

All endpoints are prefixed with `/api/v1`. Authentication is required for most endpoints and is provided via the `x-access-token` HTTP header.

### User Endpoints (`/user`)

| Method | Endpoint         | Auth     | Role(s) | Description                           |
| :----- | :--------------- | :------- | :------ | :------------------------------------ |
| `POST` | `/signin`        | None     | -       | Authenticates a user and returns a JWT. |
| `POST` | `/create`        | Required | ADMIN   | Creates a new user.                   |
| `GET`  | `/all`           | Required | ADMIN   | Retrieves a list of all users.        |
| `GET`  | `/private_data`  | Required | Any     | Example protected route.              |

### Article Endpoints (`/articles`)

| Method   | Endpoint                  | Auth     | Role(s)   | Description                                            |
| :------- | :------------------------ | :------- | :-------- | :----------------------------------------------------- |
| `GET`    | `/published`              | Required | Any       | Gets all articles with "published" status.             |
| `GET`    | `/my-articles`            | Required | AUTHOR    | Gets all articles created by the current author.       |
| `POST`   | `/`                       | Required | AUTHOR    | Creates a new article as a 'draft'.                    |
| `GET`    | `/:id`                    | Required | Any       | Gets a single published article by its ID.             |
| `PATCH`  | `/:id/edit`               | Required | AUTHOR    | Updates the title/content of a draft/rejected article. |
| `DELETE` | `/:id`                    | Required | AUTHOR    | Deletes a draft or rejected article.                   |
| `PATCH`  | `/:id/submit`             | Required | AUTHOR    | Submits a draft/rejected article for moderation.       |
| `GET`    | `/moderation-queue`       | Required | MODERATOR | Gets all articles pending moderation.                  |
| `PATCH`  | `/:id/approve`            | Required | MODERATOR | Approves an article, changing its status to 'published'.|
| `PATCH`  | `/:id/reject`             | Required | MODERATOR | Rejects an article, adding comments.                   |
