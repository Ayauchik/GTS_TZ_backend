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

module.exports = {
    createNewUser, authenticateUser
};
