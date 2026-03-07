const express = require('express');
const router = express.Router();
const graphService = require('../services/graphService');
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @route   GET /api/graph/explorer
 * @desc    Get full graph data for visualization
 * @access  Private (Admin/Staff only for explorer)
 */
router.get(
  '/explorer',
  protect,
  authorize('admin', 'superadmin'),
  asyncHandler(async (req, res) => {
    const data = await graphService.getGraphData();
    res.json({
      success: true,
      data
    });
  })
);

/**
 * @route   GET /api/graph/scheme/:name
 * @desc    Get neighborhood of a specific scheme
 * @access  Private
 */
router.get(
  '/scheme/:name',
  protect,
  asyncHandler(async (req, res) => {
    // For now, return a limited graph around the scheme if needed
    // But we'll use the explorer data for the main view
    const suggestions = await graphService.getSuggestions(req.params.name);
    res.json({
      success: true,
      data: suggestions
    });
  })
);

module.exports = router;
