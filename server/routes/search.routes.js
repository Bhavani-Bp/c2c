const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Search for YouTube videos
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query string
 *     responses:
 *       200:
 *         description: List of videos
 *       400:
 *         description: Missing query parameter
 *       500:
 *         description: Server error
 */
router.get('/', searchController.searchVideos);

module.exports = router;
