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
