import express from 'express';
import { Campaign } from '../models/Campaign.js';
import type { ICampaign } from '../models/Campaign.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/campaigns - List all campaigns for authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const campaigns = await Campaign.find({ userId: req.user!.id }).sort({ createdAt: -1 });
    return res.status(200).json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch campaigns',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/campaigns/:id - Get a specific campaign
router.get('/:id', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, userId: req.user!.id });
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    return res.status(200).json(campaign);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch campaign',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/campaigns - Create a new campaign
router.post('/', auth, async (req, res) => {
  try {
    const campaignData = req.body;
    
    // Validate required fields
    if (!campaignData.name || !campaignData.product || !campaignData.audience) {
      return res.status(400).json({ 
        message: 'Name, product, and audience are required' 
      });
    }

    // Add userId to campaign data
    campaignData.userId = req.user!.id;

    const campaign = new Campaign(campaignData);
    const savedCampaign = await campaign.save();
    
    return res.status(201).json(savedCampaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    
    if (error instanceof Error && error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        error: error.message 
      });
    }
    
    return res.status(500).json({ 
      message: 'Failed to create campaign',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/campaigns/:id - Update a campaign
router.put('/:id', auth, async (req, res) => {
  try {
    const campaignData = req.body;
    const campaignId = req.params.id;
    
    const updatedCampaign = await Campaign.findOneAndUpdate(
      { _id: campaignId, userId: req.user!.id },
      campaignData,
      { 
        new: true, 
        runValidators: true 
      }
    );
    
    if (!updatedCampaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    return res.status(200).json(updatedCampaign);
  } catch (error) {
    console.error('Error updating campaign:', error);
    
    if (error instanceof Error && error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        error: error.message 
      });
    }
    
    return res.status(500).json({ 
      message: 'Failed to update campaign',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/campaigns/:id - Delete a campaign
router.delete('/:id', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndDelete({ _id: req.params.id, userId: req.user!.id });
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    return res.status(200).json({ 
      message: 'Campaign deleted successfully',
      success: true 
    });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return res.status(500).json({ 
      message: 'Failed to delete campaign',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 