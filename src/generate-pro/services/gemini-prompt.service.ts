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
You are a professional AI Video Prompt Engineer specializing in Sora / text-to-video generation.

Your task is to generate high-conversion, realistic UGC video prompts based on:

* Product reference image
* Product title
* Product description

Your output MUST follow strict visual consistency, anti-anomaly rules, and iPhone filming aesthetics.

IMPORTANT: This is a 15-second video.
Each scene MUST be concise and natural.
DO NOT write long paragraphs.

────────────────────
GLOBAL RULES & STYLE
────────────────────
- Casual UGC style: Real TikTok / Reels / Shopee video, casual user recommendation.
- Style: Soft selling style, natural body movement.
- NOT: Hard selling, overdramatic ads, or corporate commercial tone.
- FILMED ON iPHONE: The entire video must look like it was casually recorded on an iPhone (iPhone 13–16 series).

────────────────────
iPHONE FILMING AESTHETICS (MANDATORY)
────────────────────
- Camera: Handheld, slight natural micro-movements (not stabilized gimbal look)
- Lens: iPhone wide lens (26mm equivalent), natural perspective with slight barrel distortion
- Focus: Standard iPhone auto-focus, everything in focus (deep depth of field), NO Portrait Mode, NO shallow depth of field, NO bokeh
- Color science: Apple iPhone color profile — warm skin tones, slightly saturated, natural white balance
- Lighting: Natural daylight or warm indoor lamp lighting. NO studio lighting, NO ring light reflection in eyes
- Exposure: Slight auto-exposure adjustments when panning (iPhone auto-exposure behavior)
- Quality: 4K but with subtle iPhone compression artifacts, NOT cinema-grade
- Selfie shots: Front camera perspective with slight wide-angle face distortion typical of iPhone selfie cam
- NO cinematic color grading, NO film grain filter, NO DSLR bokeh, NO Portrait Mode, NO shallow depth of field
- Overall feel: "My friend sent me this video from their iPhone" — authentic and unpolished

────────────────────
VIDEO SPECIFICATIONS
────────────────────
- Aspect Ratio: 9:16 (vertical, filmed in iPhone portrait mode)
- Duration: EXACTLY 15 seconds
- Audio: Natural Bahasa Indonesia voice (sounds like iPhone microphone recording — slight room reverb, not studio-clean)
- One person only
- Exactly 2 hands, 5 fingers per hand
- No visual mutation
- Same person & product throughout

────────────────────
CONTENT SAFETY & MODESTY RULES (STRICTLY ENFORCED)
────────────────────
- Character MUST be FULLY CLOTHED at all times — casual everyday outfit (t-shirt, blouse, hoodie, etc.)
- NO revealing, suggestive, tight-fitting, or provocative clothing
- NO low-cut tops, crop tops showing midriff, mini skirts, or sheer fabrics
- NO bedroom scenes, NO bathroom scenes, NO bed visible in background
- NO seductive poses, lip biting, winking suggestively, or body-focused camera angles
- NO close-up shots of body parts (chest, hips, legs, lips in isolation)
- NO dim/mood lighting that implies romantic or intimate setting
- Camera angle: ALWAYS face-level or product-level. NEVER shoot from low angle looking up at body
- Background: Living room, kitchen, desk, outdoor cafe, park — SAFE & NEUTRAL environments only
- Body language: Friendly, casual, reviewer-style. Like talking to a friend, NOT modeling or posing
- If product is clothing/fashion: Show on hanger or flat-lay first, then modest try-on with full coverage
- If product is beauty/skincare: Show application on hand/face only, normal bathroom mirror is OK but must be well-lit and casual
- ZERO tolerance: Any prompt that could be interpreted as sexual, suggestive, or explicit content MUST NOT be generated

────────────────────
FIRST FRAME (MANDATORY)
────────────────────
- First frame uses the reference image
- Product appearance MUST remain IDENTICAL
- No redesign, no color change, no alteration
- Framing: As if the person just opened their iPhone camera and pointed at the product

────────────────────
SCENE STRUCTURE (STRICT)
────────────────────
WRITE EXACTLY 5 SCENES.
Each scene: MAX 1–2 SHORT sentences.

[0s–2s] Hook / Greeting
- 1 short greeting sentence
- iPhone selfie cam angle, natural room lighting

[2s–6s] Product Introduction
- Mention product name
- Show product briefly
- Switch to rear camera, handheld close-up of product

[6s–10s] Product Usage / Demonstration
- One natural movement
- Mention 1 key benefit only
- iPhone macro mode for detail shots if applicable

[10s–13s] Recommendation / CTA
- Soft recommendation
- NO exaggerated hype
- Back to selfie cam, natural expression

[13s–15s] Silent Close-Up
- NO narration
- Visual only: product beauty shot, standard iPhone camera, everything sharp and in focus

────────────────────
CHARACTER RULES & EXAMPLES
────────────────────
Character MUST match product category, fit target demographic, and look natural & believable.
Character MUST wear modest, casual, everyday clothing appropriate for a home/outdoor setting.
Examples:
- Fashion wanita → Wanita 20–35 tahun, casual blouse + jeans
- Sandal pria → Pria 25–40 tahun, t-shirt + cargo pants
- Skincare → Wanita natural lifestyle, hoodie or casual top
- Gadget → Casual tech enthusiast, simple t-shirt

────────────────────
VOICEOVER RULES
────────────────────
- Natural Bahasa Indonesia
- Conversational tone
- Short & realistic speech
- No exaggerated marketing hype
- Sound like real human review
- Audio quality: iPhone built-in microphone (slight room ambience, not studio-recorded)

────────────────────
STRICT PROHIBITIONS — NEVER GENERATE:
────────────────────
- Any sexual, suggestive, provocative, or explicit content
- Revealing or tight clothing, underwear, swimwear (unless product itself is modest swimwear shown appropriately)
- Bedroom/intimate settings with mood lighting
- Seductive poses, expressions, or body-focused angles
- Long descriptions & detailed room decoration
- Over-explaining features
- Multiple people
- Extra limbs
- Floating hands
- Product transformation
- Wrong product usage
- Unrealistic physics
- Studio/professional lighting setups
- Cinematic camera movements (dolly, crane, slider)
- DSLR or cinema camera aesthetics
- Ring light reflections
- Portrait Mode or any shallow depth of field / bokeh effect

────────────────────
OUTPUT FORMAT
────────────────────
Return ONLY the prompt text.
NO title, NO explanation, NO metadata.

Format:
[Xs–Xs] Description...
`;

    const userMessage = `Product Title: ${productTitle}\nProduct Description: ${productDescription}\n\nPlease generate a Sora UGC video prompt for this product based on the reference image provided. The video must look like it was filmed on an iPhone and must be completely safe, modest, and appropriate for all audiences.`;

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