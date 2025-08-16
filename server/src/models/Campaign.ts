import mongoose, { Document, Schema } from 'mongoose';

export interface ICampaign extends Document {
  name: string;
  product: string;
  audience: string;
  budget: number;
  platform: 'facebook' | 'instagram' | 'google' | 'linkedin';
  headline?: string;
  description?: string;
  imageUrl?: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>({
  name: {
    type: String,
    required: [true, 'Campaign name is required'],
    trim: true,
    maxlength: [100, 'Campaign name cannot exceed 100 characters']
  },
  product: {
    type: String,
    required: [true, 'Product is required'],
    trim: true,
    maxlength: [200, 'Product description cannot exceed 200 characters']
  },
  audience: {
    type: String,
    required: [true, 'Target audience is required'],
    trim: true,
    maxlength: [200, 'Audience description cannot exceed 200 characters']
  },
  budget: {
    type: Number,
    required: [true, 'Budget is required'],
    min: [0, 'Budget must be positive'],
    default: 1000
  },
  platform: {
    type: String,
    required: [true, 'Platform is required'],
    enum: {
      values: ['facebook', 'instagram', 'google', 'linkedin'],
      message: 'Platform must be one of: facebook, instagram, google, linkedin'
    },
    default: 'facebook'
  },
  headline: {
    type: String,
    trim: true,
    maxlength: [200, 'Headline cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  imageUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Allow empty
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Image URL must be a valid HTTP/HTTPS URL'
    }
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
CampaignSchema.index({ createdAt: -1 });
CampaignSchema.index({ platform: 1 });
CampaignSchema.index({ userId: 1 });

export const Campaign = mongoose.model<ICampaign>('Campaign', CampaignSchema); 