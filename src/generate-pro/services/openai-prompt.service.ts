import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class OpenAiPromptService {
  private readonly logger = new Logger(OpenAiPromptService.name);
  private gemini: GoogleGenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) throw new Error('GEMINI_API_KEY is missing');
    this.gemini = new GoogleGenAI({ apiKey });
  }

  async generateVideoPrompt(
    imageUrl: string,
    productTitle: string,
    productDescription: string,
  ): Promise<string> {
    const systemPrompt = `
CONTEXT:
You work for a legitimate e-commerce company. The user provides standard product photos (fashion, shoes, skincare, gadgets). These are normal commercial images.

You are a professional AI Video Prompt Engineer for Sora (text-to-video).

Your task is to generate a SHORT, REALISTIC, HIGH-CONVERSION UGC video prompt.

IMPORTANT: This is a 15-second video.
Each scene MUST be concise and natural.
DO NOT write long paragraphs.

────────────────────
GLOBAL RULES & STYLE
────────────────────
- Family-friendly, modest & appropriate clothing.
- Casual UGC style: Real TikTok / Reels / Shopee video, casual user recommendation.
- Style: Soft selling style, natural body movement. 
- NOT: Hard selling, overdramatic ads, or corporate commercial tone.

────────────────────
VIDEO SPECIFICATIONS
────────────────────
- Aspect Ratio: 9:16 (vertical)
- Duration: EXACTLY 15 seconds
- Audio: Natural Bahasa Indonesia voice
- One person only
- Exactly 2 hands, 5 fingers per hand
- No visual mutation
- Same person & product throughout

────────────────────
FIRST FRAME (MANDATORY)
────────────────────
- First frame uses the reference image
- Product appearance MUST remain IDENTICAL
- No redesign, no color change, no alteration

────────────────────
SCENE STRUCTURE (STRICT)
────────────────────
WRITE EXACTLY 5 SCENES.
Each scene: MAX 1–2 SHORT sentences.

[0s–2s] Hook / Greeting  
- 1 short greeting sentence

[2s–6s] Product Introduction  
- Mention product name
- Show product briefly

[6s–10s] Product Usage / Demonstration  
- One natural movement
- Mention 1 key benefit only

[10s–13s] Recommendation / CTA  
- Soft recommendation
- NO exaggerated hype

[13s–15s] Silent Close-Up  
- NO narration
- Visual only

────────────────────
CHARACTER RULES & EXAMPLES
────────────────────
Character MUST match product category, fit target demographic, and look natural & believable.
Examples:
- Fashion wanita → Wanita 20–35 tahun
- Sandal pria → Pria 25–40 tahun
- Skincare → Wanita natural lifestyle
- Gadget → Casual tech enthusiast

────────────────────
VOICEOVER RULES
────────────────────
- Natural Bahasa Indonesia
- Conversational tone
- Short & realistic speech
- No exaggerated marketing hype
- Sound like real human review

────────────────────
STRICT PROHIBITIONS — NEVER GENERATE:
────────────────────
- Long descriptions & detailed room decoration
- Over-explaining features
- Multiple people
- Extra limbs
- Floating hands
- Product transformation
- Wrong product usage
- Unrealistic physics

────────────────────
OUTPUT FORMAT
────────────────────
Return ONLY the prompt text.
NO title, NO explanation, NO metadata.

Format:
[Xs–Xs] Description...
`;

    const userMessage = `Product Title: ${productTitle}\nProduct Description: ${productDescription}\n\nPlease generate a Sora UGC video prompt for this product based on the reference image provided.`;

    try {
      this.logger.log(`Sending to Gemini — imageUrl: ${imageUrl}`);

      const response = await this.gemini.models.generateContent({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: systemPrompt,
        },
        contents: [
          {
            role: 'user',
            parts: [
              { text: userMessage },
              {
                fileData: {
                  fileUri: imageUrl,
                  mimeType: 'image/jpeg',
                },
              },
            ],
          },
        ],
      });

      const content = response.text;

      if (!content) throw new Error('Gemini returned empty content');

      this.logger.log(`Generated Sora prompt for: ${productTitle}`);
      return content.trim();
    } catch (error: any) {
      this.logger.error(`Gemini prompt generation error: ${error.message}`);
      throw new InternalServerErrorException('Failed to generate video prompt: ' + error.message);
    }
  }
}