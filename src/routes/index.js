const express = require('express');
const router = express.Router();

const userRoutes = require('../domain/user/routes');
const articleRoutes = require('../domain/article/routes'); // Import article routes

router.use('/user', userRoutes);
router.use('/articles', articleRoutes); // Use article routes

module.exports = router;