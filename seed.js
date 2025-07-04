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