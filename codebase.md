# .gitignore

```
*.env
node_modules
```

# main.py

```py
from flask import Flask, request, jsonify

app = Flask(__name__)

# --- Dummy Users ---
dummy_users = [
    {
        "id": 1,
        "name": "Admin User",
        "login": "admin",
        "password": "admin123",
        "role": "ADMIN"
    },
    {
        "id": 2,
        "name": "Иван Петров",
        "login": "ivan_p",
        "password": "pass1",
        "role": "AUTHOR"
    },
    {
        "id": 3,
        "name": "Мария Сидорова",
        "login": "maria_s",
        "password": "pass2",
        "role": "AUTHOR"
    },
    {
        "id": 4,
        "name": "Сергей Васильев",
        "login": "sergey_v",
        "password": "pass3",
        "role": "MODERATOR"
    }
]

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    login = data.get('login')
    password = data.get('password')

    for user in dummy_users:
        if user["login"] == login and user["password"] == password:
            return jsonify({
                "id": user["id"],
                "name": user["name"],
                "role": user["role"]
            }), 200

    return jsonify({"error": "Invalid login or password"}), 401


if __name__ == '__main__':
    app.run(debug=True)

```

# package.json

```json
{
  "name": "gts_tz_backend",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node src/index.js",
    "test": "echo \"Error: no test specified\" && exit 1",
    "dev": "nodemon --watch src --exec node src/index.js",
    "seed": "node seed.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "description": "",
  "dependencies": {
    "bcrypt": "^6.0.0",
    "cors": "^2.8.5",
    "dotenv": "^17.0.1",
    "express": "^5.1.0",
    "jsonwebtoken": "^9.0.2",
    "mongodb": "^6.17.0",
    "mongoose": "^8.16.1",
    "nodemailer": "^7.0.4",
    "nodemon": "^3.1.10"
  }
}

```

# seed.js

```js
require("dotenv").config();
const mongoose = require("mongoose");
// Corrected path from root:
const User = require("./src/domain/user/model"); 
// Corrected path from root:
const { hashData } = require("./src/util/hashData"); 

const MONGO_URI = process.env.MONGODB_URI;

const seedAdmin = async () => {
  if (!MONGO_URI) {
    console.error("❌ MONGODB_URI is not defined in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected for seeding");

    const adminLogin = "admin";
    const existingAdmin = await User.findOne({ login: adminLogin });

    if (existingAdmin) {
      console.log("👍 Admin user already exists.");
      return;
    }

    const hashedPassword = await hashData("admin1234");
    const adminUser = new User({
      name: "Default Admin",
      login: adminLogin,
      password: hashedPassword,
      role: "ADMIN",
    });

    await adminUser.save();
    console.log("✅ Admin user created successfully!");
    console.log(`   Login: ${adminLogin}`);
    console.log(`   Password: admin1234`);

  } catch (error) {
    console.error("❌ Error seeding database:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected.");
  }
};

seedAdmin();
```

# src\app.js

```js
require('./db')
const express = require('express');
const cors = require('cors');
const bodyParser = express.json(); 

const routes = require('./routes'); 

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser); 


app.get("/", (req, res) => {
    res.send("GTS_TZ API is working ✅");
  });
  
app.use('/api/v1', routes); 

module.exports = app;

```

# src\db.js

```js
const mongoose = require("mongoose");

const connectDB = async () => {
  const MONGO_URI = process.env.MONGODB_URI;
  if (!MONGO_URI) throw new Error("MONGODB_URI is not defined in .env");

  try {
    await mongoose.connect(MONGO_URI); // no options needed
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

```

# src\domain\article\controller.js

```js
const Article = require('./model');

// For Authors
const createArticle = async (data, authorId) => {
    const { title, content } = data;
    const newArticle = new Article({ title, content, author: authorId, status: 'draft' });
    await newArticle.save();
    await newArticle.populate('author', 'name'); // Populate author name
    return newArticle;
};

const getMyArticles = async (authorId) => {
    // Populate author name
    return await Article.find({ author: authorId }).populate('author', 'name').sort({ createdAt: -1 });
};

const submitArticleForModeration = async (articleId, authorId) => {
    const article = await Article.findOne({ _id: articleId, author: authorId });
    if (!article) throw new Error("Article not found or you are not the author.");
    if (article.status !== 'draft' && article.status !== 'rejected') {
        throw new Error(`Cannot submit article with status '${article.status}' for moderation.`);
    }
    article.status = 'on_moderation';
    article.moderatorComments = undefined; // Clear old comments
    await article.save();
    await article.populate('author', 'name'); // Populate author name
    return article;
};

// For Moderators
const getModerationQueue = async () => {
    return await Article.find({ status: 'on_moderation' }).populate('author', 'name').sort({ createdAt: 1 });
};

const moderateArticle = async (articleId, decision, comments = "") => {
    const article = await Article.findById(articleId);
    if (!article) throw new Error("Article not found.");
    if (article.status !== 'on_moderation') {
        throw new Error("This article is not pending moderation.");
    }
    if (decision === 'approve') {
        article.status = 'published';
        article.moderatorComments = undefined;
    } else if (decision === 'reject') {
        if (!comments) throw new Error("Comments are required for rejection.");
        article.status = 'rejected';
        article.moderatorComments = comments;
    } else {
        throw new Error("Invalid decision. Must be 'approve' or 'reject'.");
    }
    await article.save();
    await article.populate('author', 'name'); // Populate author name
    return article;
};

// For All Users
const getPublishedArticles = async () => {
    return await Article.find({ status: 'published' }).populate('author', 'name').sort({ createdAt: -1 });
};

const getPublishedArticleById = async (articleId) => {
    // Find a single published article by its ID
    const article = await Article.findOne({ _id: articleId })
        .populate('author', 'name'); // Populate author's name
    
    if (!article) {
        throw new Error("Published article not found.");
    }
    return article;
};

module.exports = {
    createArticle,
    getMyArticles,
    submitArticleForModeration,
    getModerationQueue,
    moderateArticle,
    getPublishedArticles,
    getPublishedArticleById // Export the new function
};
```

# src\domain\article\model.js

```js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ArticleSchema = new Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
        type: String,
        enum: ['draft', 'on_moderation', 'published', 'rejected'],
        default: 'draft'
    },
    moderatorComments: { type: String }
}, { timestamps: true }); // Automatically adds createdAt and updatedAt

const Article = mongoose.model("Article", ArticleSchema);

module.exports = Article;
```

# src\domain\article\routes.js

```js
const express = require('express');
const routes = express.Router();
const controller = require('./controller');
const auth = require('../../middleware/auth');
const checkRole = require('../../middleware/checkRole');

// --- FOR ALL AUTHENTICATED USERS ---
routes.get('/published', auth, async (req, res) => {
    try {
        const articles = await controller.getPublishedArticles();
        res.status(200).json(articles);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


// --- AUTHOR-SPECIFIC ROUTES ---
routes.post('/', auth, checkRole(['AUTHOR']), async (req, res) => {
    try {
        const { title, content } = req.body;
        if (!title || !content) {
            return res.status(400).json({ message: "Title and content are required." });
        }
        const authorId = req.currentUser.userId;
        const newArticle = await controller.createArticle({ title, content }, authorId);
        res.status(201).json(newArticle);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

routes.get('/my-articles', auth, checkRole(['AUTHOR']), async (req, res) => {
    try {
        const authorId = req.currentUser.userId;
        const articles = await controller.getMyArticles(authorId);
        res.status(200).json(articles);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get a single published article by ID
routes.get('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const article = await controller.getPublishedArticleById(id);
        res.status(200).json(article);
    } catch (error) {
        // Return 404 if the article is not found
        if (error.message.includes("not found")) {
            return res.status(404).json({ message: error.message });
        }
        res.status(400).json({ message: error.message });
    }
});

routes.patch('/:id/submit', auth, checkRole(['AUTHOR']), async (req, res) => {
    try {
        const { id } = req.params;
        const authorId = req.currentUser.userId;
        const article = await controller.submitArticleForModeration(id, authorId);
        res.status(200).json({ message: "Article submitted for moderation.", article });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// --- MODERATOR-SPECIFIC ROUTES ---
routes.get('/moderation-queue', auth, checkRole(['MODERATOR']), async (req, res) => {
    try {
        const articles = await controller.getModerationQueue();
        res.status(200).json(articles);
    } catch (error)
        {
        res.status(400).json({ message: error.message });
    }
});

routes.patch('/:id/approve', auth, checkRole(['MODERATOR']), async (req, res) => {
    try {
        const { id } = req.params;
        const article = await controller.moderateArticle(id, 'approve');
        res.status(200).json({ message: "Article approved and published.", article });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

routes.patch('/:id/reject', auth, checkRole(['MODERATOR']), async (req, res) => {
    try {
        const { id } = req.params;
        const { comments } = req.body;
        if (!comments) {
            return res.status(400).json({ message: "Rejection comments are required." });
        }
        const article = await controller.moderateArticle(id, 'reject', comments);
        res.status(200).json({ message: "Article rejected.", article });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = routes;
```

# src\domain\user\controller.js

```js
const  User = require('./model');
const { hashData, verifyHash } = require('../../util/hashData');
const createToken = require('../../util/createToken'); 

const authenticateUser = async (data) => {
    try {
        const { login, password } = data; 
        const user = await User.findOne({ login }); 
        if(!user) {
            throw new Error("Invalid login credentials");
        }

        //compare the password with the hashed password in the database
        
        const hashedPassword = user.password;
        const isPasswordValid = await verifyHash(password, hashedPassword);
        if (!isPasswordValid) {
            throw new Error("Invalid password");
        }
        
        //create a token for the user (optional, can be JWT or any other method)

        const tokenData = { userId: user._id, login: user.login, name: user.name, role: user.role };
        const token = await createToken(tokenData);
        user.token = token; //store the token in the user object (optional)        
        await user.save();
        //if the password is valid, return the user
        return {user, token};

    } catch (error) {
        throw new Error("Error authenticating user: " + error.message);   
    }
}

const createNewUser = async (data) => {
    try {
        const { login, name, password, role } = data; 
        const existingUser = await User.findOne({ login });
        if (existingUser) {
            throw new Error("User already exists");
        }   

        //hash the password
        const hashedPassword = await hashData(password);
        const newUser = new User({ login ,name, password: hashedPassword, role });
        const savedUser = await newUser.save(); 
        
        savedUser.password = undefined; //remove password from the response

        return savedUser;

    } catch (error) {
        throw new Error("Error creating user: " + error.message);   
    }
}

const getAllUsers = async () => {
    try {
        // Fetch users and select only the necessary fields
        const users = await User.find({}, 'name login role');
        return users;
    } catch (error) {
        throw new Error("Error fetching users: " + error.message);
    }
};

module.exports = {
    createNewUser, authenticateUser, getAllUsers
};
```

# src\domain\user\index.js

```js
const routes = require('./routes');
module.exports = routes;

```

# src\domain\user\model.js

```js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    name: {type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 20},
    login: {type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 20},
    role: {type: String, enum: ["ADMIN", "AUTHOR", "MODERATOR"], default: "AUTHOR"},
    password: {type: String, required: true, trim: true, minlength: 6},
    token: String
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
```

# src\domain\user\routes.js

```js
const express = require('express');
const routes = express.Router();
const { createNewUser, authenticateUser, getAllUsers } = require('./controller');
const checkRole = require('../../middleware/checkRole');
const auth = require('../../middleware/auth'); // Assuming you have an auth middleware for token verification

// Middleware to parse JSON bodies
routes.get("/private_data", auth, (req, res) => {
    res.status(200).send(`This is private data of ${req.currentUser.name}`);
});


//Signin route
routes.post("/signin", async (req, res) => {
    try {
        let { login, password } = req.body;
        login = login.trim();
        password = password.trim();
        if (!login || !password) {
            return res.status(400).json({ message: "Login and password are required" });
        }
        // Here you would typically check the credentials against a database
        // For simplicity, we will just return a success message

        const {user, token} = await authenticateUser({ login, password });

        const userResponse = {
            id: user._id,
            name: user.name,
            login: user.login,
            role: user.role,
            token: token
        };

        return res.status(200).json({userResponse, message: "User signed in successfully"});
    } catch (error) {
        res.status(400).json({ message: "Error signing in: " + error.message });
    }
});


// Create User route (Admin only)
routes.post("/create", auth, checkRole(['ADMIN']), async (req, res) => {
    try {
        let { name, login, password, role } = req.body;
        name = name?.trim();
        login = login?.trim();
        password = password?.trim();

        if (!name || !login || !password || !role) {
            return res.status(400).json({ message: "Name, login, password, and role are required" });
        }

        if (!['ADMIN', 'AUTHOR', 'MODERATOR'].includes(role)) {
            return res.status(400).json({ message: "Invalid role specified" });
        }

        const newUser = await createNewUser({ name, login, password, role });
        res.status(201).json({ message: "User created successfully", user: newUser });

    } catch (error) {
        res.status(400).json({ message: "Error creating user: " + error.message });
    }
});

// Get all users (Admin only)
routes.get("/all", auth, checkRole(['ADMIN']), async (req, res) => {
    try {
        const users = await getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


//Signup route
routes.post("/signup", async (req, res) => {
    try {
        let { name, password } = req.body;
        name = name.trim();
        password = password.trim();

        if (!name || !password) {
            return res.status(400).json({ message: "Name and password are required" });
        } else if (name.length < 3 || password.length < 6) {
            return res.status(400).json({ message: "Name must be at least 3 characters and password at least 6 characters" });
        } else if (name.length > 20 || password.length > 20) {
            return res.status(400).json({ message: "Name and password must not exceed 20 characters" });
        } else if (!/^[a-zA-Z0-9]+$/.test(name)) {
            return res.status(400).json({ message: "Name can only contain alphanumeric characters" });
        }else{
            const user = await createNewUser({ name, password });
            return res.status(201).json({ message: "User created successfully", user });
        }

    } catch (error) {
        res.status(400).json({ message: "Error creating user: " + error.message });
    }

});

module.exports = routes;
```

# src\index.js

```js
require("dotenv").config(); // Load .env first

const app = require("./app");
const connectDB = require("./db"); // Your DB file

const PORT = process.env.PORT || 5000;

const startApp = async () => {
  await connectDB(); // connect to MongoDB

  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
};

startApp();

```

# src\middleware\auth.js

```js
const jwt = require('jsonwebtoken');

const TOKEN_KEY = process.env.TOKEN_KEY;
if (!TOKEN_KEY) {
  throw new Error("❌ TOKEN_KEY is missing in your .env file");
}

const verifyToken = async (req, res, next) => {
  try {
    const token =
      (req.body && req.body.token) ||
      (req.query && req.query.token) ||
      (req.headers && req.headers['x-access-token']) ||
      null;

    if (!token) {
      return res.status(403).json({ message: "❌ No token provided" });
    }

    const decoded = jwt.verify(token, TOKEN_KEY);
    req.currentUser = decoded;


  } catch (err) {
    return res.status(401).json({ message: "❌ Invalid or expired token" });
  }

  next();
};




module.exports = verifyToken; // Export both functions as an object

```

# src\middleware\checkRole.js

```js
const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.currentUser || !req.currentUser.role) {
            return res.status(403).json({ message: "Forbidden: No role information" });
        }

        const userRole = req.currentUser.role;
        
        if (allowedRoles.includes(userRole)) {
            next(); // Role is allowed, proceed to the next middleware/handler
        } else {
            return res.status(403).json({ message: `Forbidden: Access denied. Required role(s): ${allowedRoles.join(', ')}` });
        }
    };
};

module.exports = checkRole;
```

# src\routes\index.js

```js
const express = require('express');
const router = express.Router();

const userRoutes = require('../domain/user/routes');
const articleRoutes = require('../domain/article/routes'); // Import article routes

router.use('/user', userRoutes);
router.use('/articles', articleRoutes); // Use article routes

module.exports = router;
```

# src\util\createToken.js

```js
const jwt = require('jsonwebtoken');

const {TOKEN_KEY, TOKEN_EXPIRY} = process.env;

const createToken = async(
    tokenData, 
    tokenKey = TOKEN_KEY, 
    expiresIn = TOKEN_EXPIRY
) => {
    try {
        const token = await jwt.sign(tokenData, tokenKey, { expiresIn });
        return token;
    } catch (error) {
        throw new Error("Error creating token: " + error.message);
    }
};

module.exports = createToken;
```

# src\util\hashData.js

```js
const bcrypt = require('bcrypt');

const hashData = async (data, saltRounds=10) => {
    try {
        const hashedData = await bcrypt.hash(data, saltRounds);
        return hashedData;
    } catch (error) {
        throw new Error("Error hashing data: " + error.message);
    }
}

const verifyHash = async (data, hash) => {
    try {
        const isMatch = await bcrypt.compare(data, hash);
        return isMatch;
    } catch (error) {
        throw new Error("Error verifying hash: " + error.message);
    }
}

module.exports = {hashData, verifyHash};
```

# versel.json

```json
{
    "version": 2,
    "builds": [
        {
            "src": "src/index.js",
            "use": "@vercel/node"
        }
    ],
    "routes": [
        {
            "src": "/(.*)",
            "dest": "src/index.js"
        }
    ]
}
```

