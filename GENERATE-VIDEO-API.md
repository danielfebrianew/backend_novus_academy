# Generate Video API

## Endpoints

### 1. `POST /generate/text` — Generate Script
**Payload:**
```json
{
  "imageUrl": "https://s3.../product.jpg",
  "promptCount": 4,       // 4-6, optional
  "productName": "Product Name"
}
```
**Response:**
```json
{
  "voiceover": "Script text 20-30 seconds...",
  "videoPrompts": ["prompt 1", "prompt 2", "prompt 3", "prompt 4"],
  "captionComponents": {
    "hooks": ["hook1", "hook2", "hook3", "hook4", "hook5"],
    "bodies": ["body1", "body2", "body3", "body4", "body5"],
    "ctas": ["cta1", "cta2", "cta3", "cta4", "cta5"],
    "hashtags": ["#set1", "#set2", "#set3", "#set4"]
  }
}
```

---

### 2. `POST /generate/video` — Generate & Compose Videos
**Payload:**
```json
{
  "images": ["https://s3.../img1.jpg", "https://s3.../img2.jpg"],
  "productName": "Product Name",
  "prompts": ["prompt 1", "prompt 2", "prompt 3", "prompt 4"],
  "script": "Voiceover script text...",
  "jobId": "unique-job-id",
  "targetCount": 3,
  "voiceGender": "female"
}
```
| Field | Type | Rules |
|-------|------|-------|
| images | string[] | min 1, valid URLs |
| prompts | string[] | 4-6 items |
| targetCount | number | 1-100 (number of variation videos) |
| voiceGender | string | `"male"` or `"female"` |

**Response:**
```json
{
  "jobId": "unique-job-id",
  "totalVariations": 3,
  "videos": [
    { "variationIndex": 1, "videoUrl": "https://s3.../results/job-id/variation_1.mp4", "thumbnailUrl": "https://s3.../results/job-id/thumbnail.jpg" },
    { "variationIndex": 2, "videoUrl": "https://s3.../results/job-id/variation_2.mp4", "thumbnailUrl": "https://s3.../results/job-id/thumbnail.jpg" },
    { "variationIndex": 3, "videoUrl": "https://s3.../results/job-id/variation_3.mp4", "thumbnailUrl": "https://s3.../results/job-id/thumbnail.jpg" }
  ]
}
```

---

### 3. `POST /generate/upload` — Upload Product Images
**Payload:** `multipart/form-data`
| Field | Type | Rules |
|-------|------|-------|
| files | File[] | max 6, jpg/png/webp only |

**Response:**
```json
{
  "imageUrls": [
    "https://s3.../inputs/input_123_img.jpg"
  ]
}
```

---

### 4. `GET /generate/progress/:jobId` — SSE Progress Stream
**Response:** Server-Sent Events
```
data: { "message": "Generating video clips...", "progress": 5 }
data: { "message": "Composing variation 1/3...", "progress": 60 }
data: { "message": "All variations composed successfully.", "progress": 100 }
```

---

## Processing Pipeline
1. Wavespeed AI generates 4-6 video clips (5s each, 720p)
2. Gemini TTS generates voiceover audio
3. Clips + audio uploaded to S3 (`assets/{jobId}/`)
4. Shuffle variations created (unique clip orderings)
5. **fal.ai ffmpeg** composes each variation (clips + audio → single video)
6. Composed videos re-uploaded to S3 (`results/{jobId}/`)
7. Results saved to gallery DB
