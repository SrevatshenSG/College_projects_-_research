import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface GeneratePayload {
  product: string;
  audience: string;
}

export interface GenerateResult {
  headline: string;
  description: string;
  variants: string[];
  imageUrl: string;
}

export const generateCreative = async (payload: GeneratePayload): Promise<GenerateResult> => {
  try {
    const { product, audience } = payload;

    // Generate main headline and description
    const mainPrompt = `Create an advertising campaign for a product called "${product}" targeting "${audience}".

Requirements:
- Create 1 compelling headline (max 60 characters)
- Create 1 detailed description (max 150 characters)
- Make it engaging and persuasive
- Focus on benefits and value proposition

Format your response as JSON:
{
  "headline": "Your headline here",
  "description": "Your description here"
}`;

    const mainResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert advertising copywriter. Create compelling, persuasive ad copy that converts."
        },
        {
          role: "user",
          content: mainPrompt
        }
      ],
      temperature: 0.8,
      max_tokens: 300
    });

    // Generate variant headlines
    const variantPrompt = `Create 2 alternative headlines for a product called "${product}" targeting "${audience}".

Requirements:
- Each headline should be different in tone/approach
- Max 60 characters each
- Make them compelling and persuasive

Format your response as JSON:
{
  "variants": ["Variant 1", "Variant 2"]
}`;

    const variantResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert advertising copywriter. Create compelling, persuasive ad copy that converts."
        },
        {
          role: "user",
          content: variantPrompt
        }
      ],
      temperature: 0.9,
      max_tokens: 200
    });

    // Parse responses
    let mainContent, variantContent;
    
    try {
      mainContent = JSON.parse(mainResponse.choices[0]?.message?.content || '{}');
    } catch (error) {
      console.error('Error parsing main response:', error);
      mainContent = {
        headline: `Amazing ${product} for ${audience}`,
        description: `Discover the perfect ${product} designed specifically for ${audience}.`
      };
    }

    try {
      variantContent = JSON.parse(variantResponse.choices[0]?.message?.content || '{}');
    } catch (error) {
      console.error('Error parsing variant response:', error);
      variantContent = {
        variants: [
          `Transform your ${product} experience`,
          `The ${product} ${audience} love`
        ]
      };
    }

    // Generate mock image URL based on product
    const imageUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(product)},advertising`;

    return {
      headline: mainContent.headline || `Amazing ${product} for ${audience}`,
      description: mainContent.description || `Discover the perfect ${product} designed specifically for ${audience}.`,
      variants: variantContent.variants || [
        `Transform your ${product} experience`,
        `The ${product} ${audience} love`
      ],
      imageUrl
    };

  } catch (error) {
    console.error('Error generating creative content:', error);
    
    // Fallback response
    return {
      headline: `Amazing ${payload.product} for ${payload.audience}`,
      description: `Discover the perfect ${payload.product} designed specifically for ${payload.audience}.`,
      variants: [
        `Transform your ${payload.product} experience`,
        `The ${payload.product} ${payload.audience} love`
      ],
      imageUrl: `https://source.unsplash.com/800x600/?${encodeURIComponent(payload.product)},advertising`
    };
  }
}; 