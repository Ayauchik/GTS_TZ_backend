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