import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';

export const FACE_CHARACTER_GENDER: Record<string, 'male' | 'female'> = {
  remaja_wanita: 'female',
  remaja_pria: 'male',
  wanita_casual: 'female',
  pria_casual: 'male',
  wanita_hijab: 'female',
  pria_professional: 'male',
  wanita_karir: 'female',
  sesuai_foto: 'male',
};

const FACE_CHARACTER_MAP: Record<string, string> = {
  remaja_wanita: 'A young Indonesian teenage girl (16-19 years old) wearing casual daily wear, natural look, friendly expression',
  remaja_pria: 'A young Indonesian teenage boy (16-19 years old) wearing casual daily wear, natural look, friendly expression',
  wanita_casual: 'A young Indonesian woman (20-28 years old) wearing casual modern outfit, natural makeup, warm and approachable',
  pria_casual: 'A young Indonesian man (20-30 years old) wearing casual outfit, clean and neat appearance, friendly expression',
  wanita_hijab: 'A young Indonesian woman wearing modern hijab style, modest and stylish outfit, warm and confident expression',
  pria_professional: 'An Indonesian professional man (25-40 years old) wearing office/formal attire, neat and confident',
  wanita_karir: 'An Indonesian career woman (25-35 years old) wearing professional office attire, confident and elegant',
  sesuai_foto: 'A friendly person ( from reference image )',
};

@Injectable()
export class GeminiVideoPromptService {
  private readonly logger = new Logger(GeminiVideoPromptService.name);
  private readonly ai: GoogleGenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) throw new Error('GEMINI_API_KEY is missing');

    this.ai = new GoogleGenAI({ apiKey });
  }

  private resolveCharacterDescription(faceCharacter?: string, customFaceCharacter?: string): string | null {
    if (!faceCharacter) return null;
    if (faceCharacter === 'custom' && customFaceCharacter) return customFaceCharacter;
    return FACE_CHARACTER_MAP[faceCharacter] ?? null;
  }

  async generateVideoPrompt(
    imageUrl: string,
    productTitle: string,
    productDescription: string,
    faceCharacter?: string,
    customFaceCharacter?: string,
  ): Promise<string> {
    const characterDescription = this.resolveCharacterDescription(faceCharacter, customFaceCharacter);
    const characterLine = characterDescription
      ? `- CHARACTER: ${characterDescription}. The person in the video MUST match this character description exactly.`
      : '- Use the person from the reference image as the character.';

    // SYSTEM PROMPT SUDAH DIBERSIHKAN DARI KATA-KATA VULGAR
    const systemInstruction = `CONTEXT:
You are a professional AI Video Prompt Engineer specializing in text-to-video generation.
Your task is to generate high-conversion, realistic UGC video prompts based on product reference image, title, and description.

IMPORTANT: This is a 15-second video. Each scene MUST be concise. DO NOT write long paragraphs.

════════════════════════════════════════
⚠️ STRICT MODESTY & SAFETY POLICY ⚠️
════════════════════════════════════════
1. MODEST LANGUAGE ONLY: The language and visuals MUST be highly conservative, modest, and safe for work.
2. NO BODY SHAPE DESCRIPTIONS: Never describe body figures or how clothing fits/hugs the body. Focus exclusively on product quality, fabric comfort ("halus", "lembut", "adem"), neat cuts, and overall styling.
3. SAFE INTERACTIONS: Model must already be fully clothed. Interactions with the product must be limited to gently stretching or showing the fabric ON THE SLEEVE or LOWER HEM only.
4. SAFE CAMERA ANGLES: Stick to STATIC medium shots. ANY close-up shots MUST strictly focus only on the SLEEVE, CUFF, or LOWER HEM. Never focus on the torso or neck area.
════════════════════════════════════════

────────────────────
GLOBAL RULES & STYLE
────────────────────
- Casual UGC style: Real TikTok / Reels / Shopee video, casual user recommendation. Soft selling style.
- FILMED ON A SMARTPHONE: Handheld, slight natural micro-movements, shallow depth of field (bokeh effect) simulating smartphone "Portrait" mode. Natural daylight.
- Aspect Ratio: 9:16 (vertical, portrait mode). Duration: EXACTLY 15 seconds.
- One person only, exact anatomy (2 hands, 5 fingers per hand).
${characterLine}

────────────────────
MOUTH MOVEMENT & TALKING (CRITICAL)
────────────────────
- The person MUST be visibly TALKING with natural, realistic MOUTH MOVEMENTS in EVERY scene that has voiceover narration (Scene 1 through 4).
- In every narrated scene description, explicitly mention: "person is talking to the camera with visible mouth movement".

────────────────────
FIRST FRAME (MANDATORY)
────────────────────
- First frame uses the reference image. Product appearance MUST remain IDENTICAL.
- Framing: As if the person just opened their phone camera with portrait mode enabled.

────────────────────
SCENE STRUCTURE (STRICT)
────────────────────
WRITE EXACTLY 5 SCENES. Each scene: MAX 1–2 SHORT sentences.

[0s–2s] Hook / Greeting
- 1 short greeting sentence. Person is TALKING TO CAMERA with visible mouth movement. Front-facing camera.

[2s–6s] Product Introduction
- Mention product name, be concise. Switch to rear camera. STATIC handheld medium shot. Person is SPEAKING.

[6s–10s] Product Detail / Visual Feature
- Mention 1 key feature (e.g., fabric quality). Detail MUST be shown on a safe area (e.g., "focusing on the sleeve").
- VOICEOVER RULE: Focus on comfort or neat cut. Person is TALKING to camera.

[10s–13s] Recommendation / CTA
- Soft recommendation ending with "yuk segera checkout". Person is SPEAKING to camera. Back to front-facing camera.

[13s–15s] Silent Close-Up
- NO narration, NO talking. Casual macro/close-up shot ONLY on the SLEEVE, CUFF, or LOWER HEM of the product. Steady camera.

────────────────────
OUTPUT FORMAT
────────────────────
Return ONLY the prompt text. NO title, NO explanation.
Format:
[Xs–Xs] Description...
VOICEOVER: "..."`;

    const userMessage = `Product Title: ${productTitle}
Product Description: ${productDescription}

Please generate a UGC video prompt for this product based on the reference image provided. Follow all system instructions strictly.`;

    try {
      this.logger.log(`Fetching image for Gemini — imageUrl: ${imageUrl}`);
      const { base64, mimeType } = await this.fetchImageAsBase64(imageUrl);

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        config: {
          // PINDAHKAN SYSTEM PROMPT KE SINI
          systemInstruction: systemInstruction, 
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          ],
        },
        contents: [
          {
            role: 'user',
            parts: [
              { text: userMessage }, // Hanya User Message di sini
              {
                inlineData: {
                  data: base64,
                  mimeType: mimeType,
                },
              },
            ],
          },
        ],
      });

      const candidate = response.candidates?.[0];
      const finishReason = candidate?.finishReason;

      if (finishReason && finishReason !== 'STOP') {
        this.logger.warn(`Gemini blocked response: ${finishReason} — Ratings: ${JSON.stringify(candidate?.safetyRatings)}`);
        throw new Error(`Gemini blocked response: finishReason=${finishReason}`);
      }

      const content = response.text;

      // Tambahkan Log untuk melihat jika model mengembalikan string kosong ("")
      if (!content || content.trim() === '') {
          this.logger.error(`Gemini returned empty string. Full candidate object: ${JSON.stringify(candidate)}`);
          throw new Error('Gemini returned empty content (Prompt Paralysis)');
      }

      this.logger.log(`Generated video prompt for: ${productTitle}`);
      return content.trim();
    } catch (error: any) {
      this.logger.error(`Gemini prompt generation error: ${error.message}`);
      throw new InternalServerErrorException('Failed to generate video prompt: ' + error.message);
    }
  }

  private async fetchImageAsBase64(url: string): Promise<{ base64: string; mimeType: string }> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const mimeType = contentType.split(';')[0].trim();
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return { base64, mimeType };
  }
}