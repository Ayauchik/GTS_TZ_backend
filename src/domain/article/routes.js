const express = require('express');
const routes = express.Router();
const controller = require('./controller');
const auth = require('../../middleware/auth');
const checkRole = require('../../middleware/checkRole');

// --- FOR ALL AUTHENTICATED USERS ---
routes.get('/published', auth, async (req, res) => {
    try {
        const articles = await controller.getPublishedArticles();
        res.status(200).json(articles);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


// --- AUTHOR-SPECIFIC ROUTES ---
routes.post('/', auth, checkRole(['AUTHOR']), async (req, res) => {
    try {
        const { title, content } = req.body;
        if (!title || !content) {
            return res.status(400).json({ message: "Title and content are required." });
        }
        const authorId = req.currentUser.userId;
        const newArticle = await controller.createArticle({ title, content }, authorId);
        res.status(201).json(newArticle);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// --- MODERATOR-SPECIFIC ROUTES ---
routes.get('/moderation-queue', auth, checkRole(['MODERATOR']), async (req, res) => {
    try {
        const articles = await controller.getModerationQueue();
        res.status(200).json(articles);
    } catch (error)
        {
        res.status(400).json({ message: error.message });
    }
});


routes.get('/my-articles', auth, checkRole(['AUTHOR']), async (req, res) => {
    try {
        const authorId = req.currentUser.userId;
        const articles = await controller.getMyArticles(authorId);
        res.status(200).json(articles);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});




routes.patch('/:id/edit', auth, checkRole(['AUTHOR']), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;
        const authorId = req.currentUser.userId;

        // Ensure at least one field is being updated
        if (!title && !content) {
            return res.status(400).json({ message: "Either title or content must be provided to update." });
        }

        const updatedArticle = await controller.updateArticle(id, authorId, { title, content });
        res.status(200).json({ message: "Article updated successfully.", article: updatedArticle });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

routes.delete('/:id', auth, checkRole(['AUTHOR']), async (req, res) => {
    try {
        const { id } = req.params;
        const authorId = req.currentUser.userId;

        // Call the controller function to perform the deletion logic
        await controller.deleteArticle(id, authorId);

        // If the controller function completes without error, send a success response.
        res.status(200).json({ message: "Article deleted successfully." });

    } catch (error) {
        // The controller will throw an error if not found, not owner, or wrong status.
        // We catch it here and send a 4xx response to the client.
        res.status(400).json({ message: error.message });
    }
});

// Get a single published article by ID
routes.get('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const article = await controller.getPublishedArticleById(id);
        res.status(200).json(article);
    } catch (error) {
        // Return 404 if the article is not found
        if (error.message.includes("not found")) {
            return res.status(404).json({ message: error.message });
        }
        res.status(400).json({ message: error.message });
    }
});

routes.patch('/:id/submit', auth, checkRole(['AUTHOR']), async (req, res) => {
    try {
        const { id } = req.params;
        const authorId = req.currentUser.userId;
        const article = await controller.submitArticleForModeration(id, authorId);
        res.status(200).json({ message: "Article submitted for moderation.", article });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});



routes.patch('/:id/approve', auth, checkRole(['MODERATOR']), async (req, res) => {
    try {
        const { id } = req.params;
        const article = await controller.moderateArticle(id, 'approve');
        res.status(200).json({ message: "Article approved and published.", article });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

routes.patch('/:id/reject', auth, checkRole(['MODERATOR']), async (req, res) => {
    try {
        const { id } = req.params;
        const { comments } = req.body;
        if (!comments) {
            return res.status(400).json({ message: "Rejection comments are required." });
        }
        const article = await controller.moderateArticle(id, 'reject', comments);
        res.status(200).json({ message: "Article rejected.", article });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = routes;