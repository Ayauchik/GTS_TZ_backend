const Article = require('./model');

// For Authors
const createArticle = async (data, authorId) => {
    const { title, content } = data;
    const newArticle = new Article({ title, content, author: authorId, status: 'draft' });
    await newArticle.save();
    return newArticle;
};

const getMyArticles = async (authorId) => {
    return await Article.find({ author: authorId }).sort({ createdAt: -1 });
};

const submitArticleForModeration = async (articleId, authorId) => {
    const article = await Article.findOne({ _id: articleId, author: authorId });
    if (!article) throw new Error("Article not found or you are not the author.");
    if (article.status !== 'draft' && article.status !== 'rejected') {
        throw new Error(`Cannot submit article with status '${article.status}' for moderation.`);
    }
    article.status = 'on_moderation';
    article.moderatorComments = undefined; // Clear old comments
    await article.save();
    return article;
};

// For Moderators
const getModerationQueue = async () => {
    return await Article.find({ status: 'on_moderation' }).populate('author', 'name').sort({ createdAt: 1 });
};

const moderateArticle = async (articleId, decision, comments = "") => {
    const article = await Article.findById(articleId);
    if (!article) throw new Error("Article not found.");
    if (article.status !== 'on_moderation') {
        throw new Error("This article is not pending moderation.");
    }
    if (decision === 'approve') {
        article.status = 'published';
        article.moderatorComments = undefined;
    } else if (decision === 'reject') {
        if (!comments) throw new Error("Comments are required for rejection.");
        article.status = 'rejected';
        article.moderatorComments = comments;
    } else {
        throw new Error("Invalid decision. Must be 'approve' or 'reject'.");
    }
    await article.save();
    return article;
};

// For All Users
const getPublishedArticles = async () => {
    return await Article.find({ status: 'published' }).populate('author', 'name').sort({ createdAt: -1 });
};

module.exports = {
    createArticle,
    getMyArticles,
    submitArticleForModeration,
    getModerationQueue,
    moderateArticle,
    getPublishedArticles
};