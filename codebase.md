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
    "dev": "nodemon --watch src --exec node src/index.js"
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

# src\domain\user\controller.js

```js
const  User = require('./model');
const { hashData, verifyHash } = require('../../util/hashData');
const createToken = require('../../util/createToken'); 

const authenticateUser = async (data) => {
    try {
        const { name, password } = data; 
        const user = await User.findOne({ name }); 
        if(!user) {
            throw new Error("User not found");
        }

        //compare the password with the hashed password in the database
        
        const hashedPassword = user.password;
        const isPasswordValid = await verifyHash(password, hashedPassword);
        if (!isPasswordValid) {
            throw new Error("Invalid password");
        }
        
        //create a token for the user (optional, can be JWT or any other method)

        const tokenData = { userId: user._id, name };
        const token = await createToken(tokenData);
        user.token = token; //store the token in the user object (optional)        
        await user.save();
        //if the password is valid, return the user
        return user;

    } catch (error) {
        throw new Error("Error authenticating user: " + error.message);   
    }
}

const createNewUser = async (data) => {
    try {
        const { name, password } = data; 
        const existingUser = await User.findOne({ name });
        if (existingUser) {
            throw new Error("User already exists");
        }   

        //hash the password
        const hashedPassword = await hashData(password);
        const newUser = new User({ name, password: hashedPassword });
        const savedUser = await newUser.save(); 
        return savedUser;

    } catch (error) {
        throw new Error("Error creating user: " + error.message);   
    }
}

module.exports = {
    createNewUser, authenticateUser
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
    name: String,
    password: String,
    token: String
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
```

# src\domain\user\routes.js

```js
const express = require('express');
const routes = express.Router();
const {createNewUser, authenticateUser} = require('./controller');
const auth = require('../../middleware/auth'); // Assuming you have an auth middleware for token verification

// Middleware to parse JSON bodies
routes.get("/private_data", auth, (req, res) => {
    res.status(200).send(`This is private data of ${req.currentUser.name}`);
});


//Signin route
routes.post("/signin", async (req, res) => {
    try {
        let { name, password } = req.body;
        name = name.trim();
        password = password.trim();
        if (!name || !password) {
            return res.status(400).json({ message: "Name and password are required" });
        }
        // Here you would typically check the credentials against a database
        // For simplicity, we will just return a success message

        const user = await authenticateUser({ name, password });
        return res.status(200).json({user, message: "User signed in successfully"});
    } catch (error) {
        res.status(400).json({ message: "Error signing in: " + error.message });
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

module.exports = verifyToken;

```

# src\routes\index.js

```js
const express = require('express');
const router = express.Router();

const userRoutes = require('../domain/user/routes');
router.use('/user', userRoutes);

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

