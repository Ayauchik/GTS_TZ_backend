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