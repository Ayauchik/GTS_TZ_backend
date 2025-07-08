const Article = require('./model');

// For Authors
const createArticle = async (data, authorId) => {
    const { title, content } = data;
    const newArticle = new Article({ title, content, author: authorId, status: 'draft' });
    await newArticle.save();
    await newArticle.populate('author', 'name'); // Populate author name
    return newArticle;
};

const getMyArticles = async (authorId) => {
    // Populate author name
    return await Article.find({ author: authorId }).populate('author', 'name').sort({ createdAt: -1 });
};

const updateArticle = async (articleId, authorId, updateData) => {
    // Find the article, but only if it belongs to the current author
    const article = await Article.findOne({ _id: articleId, author: authorId });

    if (!article) {
        throw new Error("Article not found or you are not the author.");
    }

    // Check if the article is in an editable state
    if (article.status !== 'draft' && article.status !== 'rejected') {
        throw new Error(`Cannot edit an article with status '${article.status}'.`);
    }

    // Partially update the article with new data if provided
    if (updateData.title) {
        article.title = updateData.title;
    }
    if (updateData.content) {
        article.content = updateData.content;
    }

    // Save the changes
    await article.save();
    
    // Populate the author's name for the response
    await article.populate('author', 'name');
    return article;
};

const deleteArticle = async (articleId, authorId) => {
    // 1. Find the article, ensuring it belongs to the requesting author.
    // This is a crucial security check.
    const article = await Article.findOne({ _id: articleId, author: authorId });

    // 2. If no article is found, throw an error.
    if (!article) {
        throw new Error("Article not found or you are not the author.");
    }

    // 3. Check if the article's status allows for deletion.
    if (article.status !== 'draft' && article.status !== 'rejected') {
        throw new Error(`Cannot delete an article with status '${article.status}'. Only drafts or rejected articles can be deleted.`);
    }

    // 4. If all checks pass, perform the deletion.
    await Article.findByIdAndDelete(articleId);
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
    await article.populate('author', 'name'); // Populate author name
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
    await article.populate('author', 'name'); // Populate author name
    return article;
};

// For All Users
const getPublishedArticles = async () => {
    return await Article.find({ status: 'published' }).populate('author', 'name').sort({ createdAt: -1 });
};

const getPublishedArticleById = async (articleId) => {
    // Find a single published article by its ID
    const article = await Article.findOne({ _id: articleId })
        .populate('author', 'name'); // Populate author's name
    
    if (!article) {
        throw new Error("Published article not found.");
    }
    return article;
};

module.exports = {
    createArticle,
    getMyArticles,
    submitArticleForModeration,
    getModerationQueue,
    moderateArticle,
    getPublishedArticles,
    getPublishedArticleById,
    updateArticle,
    deleteArticle
};