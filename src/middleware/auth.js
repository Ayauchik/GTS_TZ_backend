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
