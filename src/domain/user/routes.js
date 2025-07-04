const express = require('express');
const routes = express.Router();
const {createNewUser, authenticateUser} = require('./controller');
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