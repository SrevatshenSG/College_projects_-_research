import express from 'express';
import { generateCreative } from '../services/aiService.js';

const router = express.Router();

// POST /api/generate - Generate creative content
router.post('/', async (req, res) => {
  try {
    const { product, audience } = req.body;
    
    // Validate required fields
    if (!product || !audience) {
      return res.status(400).json({ 
        message: 'Product and audience are required' 
      });
    }

    // Generate creative content
    const result = await generateCreative({ product, audience });
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error generating creative content:', error);
    return res.status(500).json({ 
      message: 'Failed to generate creative content',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 