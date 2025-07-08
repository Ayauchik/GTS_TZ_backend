const  User = require('./model');
const { hashData, verifyHash } = require('../../util/hashData');
const createToken = require('../../util/createToken'); 

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_IN_MINUTES = 15;

const authenticateUser = async (data) => {
    try {
        const { login, password } = data;
        const user = await User.findOne({ login });

        if (!user) {
            // It's important to throw the same generic error to prevent attackers
            // from knowing if a username is valid or not ("username enumeration").
            throw new Error("Invalid login credentials");
        }

        // 1. Check if the account is currently locked
        if (user.lockUntil && user.lockUntil > Date.now()) {
            const remainingMinutes = Math.round((user.lockUntil - Date.now()) / 60000);
            throw new Error(`Account locked. Please try again in ${remainingMinutes} minutes.`);
        }

        const hashedPassword = user.password;
        const isPasswordValid = await verifyHash(password, hashedPassword);

        if (!isPasswordValid) {
            // 2. If the password is not valid, increment login attempts
            user.loginAttempts += 1;

            // 3. If attempts exceed the max, lock the account
            if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
                user.lockUntil = Date.now() + LOCK_TIME_IN_MINUTES * 60 * 1000;
                await user.save();
                throw new Error(`Invalid login credentials. Account has been locked for ${LOCK_TIME_IN_MINUTES} minutes due to too many failed attempts.`);
            }

            // Save the increased attempt count
            await user.save();
            throw new Error("Invalid login credentials");
        }

        // 4. If the login is successful, reset attempts and remove the lock
        user.loginAttempts = 0;
        user.lockUntil = undefined; // Use undefined to remove the field

        const tokenData = { userId: user._id, login: user.login, name: user.name, role: user.role };
        const token = await createToken(tokenData);
        user.token = token;
        
        await user.save();
        return { user, token };

    } catch (error) {
        // The specific errors thrown above will be caught here
        throw new Error(error.message);
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