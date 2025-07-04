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