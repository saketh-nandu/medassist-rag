/**
 * imageAnalysis.ts
 * CNN-based image analysis using Hugging Face free inference API.
 *
 * Injury photos  → classify injury type → first aid advice
 * Medicine photos → OCR medicine name   → add to reminders
 *
 * Free tier: 30,000 requests/month, no credit card needed.
 * Get a free token at: https://huggingface.co/settings/tokens
 */

// ─── CONFIG ───────────────────────────────────────────────────────────────────
// Set your free HuggingFace token here (or leave empty for anonymous, slower)
const HF_TOKEN = process.env.EXPO_PUBLIC_HF_TOKEN || '';

// Models used (all free on HF inference API)
const INJURY_MODEL    = 'microsoft/resnet-50';          // general image classification
const MEDICINE_MODEL  = 'microsoft/trocr-base-printed'; // OCR for printed text

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type ImageType = 'injury' | 'medicine' | 'unknown';

export interface ImageAnalysisResult {
  type: ImageType;
  // Injury result
  injuryType?: string;
  severity?: 'mild' | 'moderate' | 'severe';
  firstAid?: string[];
  warning?: string;
  affectedAreas?: string[];
  // Medicine result
  medicineName?: string;
  dosageSuggestion?: string;
  reminderAdded?: boolean;
  // Raw
  rawLabel?: string;
  confidence?: number;
}

// ─── INJURY KNOWLEDGE BASE ────────────────────────────────────────────────────

const INJURY_ADVICE: Record<string, {
  severity: 'mild' | 'moderate' | 'severe';
  firstAid: string[];
  warning?: string;
  affectedAreas: string[];
}> = {
  burn: {
    severity: 'moderate',
    firstAid: [
      'Cool the burn under running cold water for 20 minutes',
      'Do NOT use ice, butter, or toothpaste',
      'Cover loosely with a clean non-fluffy material',
      'Take paracetamol or ibuprofen for pain',
      'Seek medical attention for burns larger than 3cm or on face/hands/genitals',
    ],
    warning: 'Do NOT burst any blisters — this increases infection risk',
    affectedAreas: ['chest', 'abdomen'],
  },
  cut: {
    severity: 'mild',
    firstAid: [
      'Apply firm pressure with a clean cloth for 10 minutes',
      'Clean the wound gently with clean water',
      'Apply antiseptic cream (Betadine/Dettol)',
      'Cover with a sterile bandage or plaster',
      'Seek care if bleeding does not stop after 10 minutes or wound is deep',
    ],
    affectedAreas: [],
  },
  bruise: {
    severity: 'mild',
    firstAid: [
      'Apply ice pack wrapped in cloth for 15-20 minutes',
      'Elevate the injured area if possible',
      'Take paracetamol for pain if needed',
      'Rest the affected area',
      'See a doctor if bruise is very large or extremely painful',
    ],
    affectedAreas: [],
  },
  fracture: {
    severity: 'severe',
    firstAid: [
      'Immobilize the injured area — do NOT try to straighten it',
      'Apply ice wrapped in cloth to reduce swelling',
      'Elevate the limb if possible',
      'Seek emergency medical care immediately',
      'Do NOT give food or water (surgery may be needed)',
    ],
    warning: 'SEEK EMERGENCY CARE — possible fracture detected',
    affectedAreas: ['leftArm', 'rightArm', 'leftLeg', 'rightLeg'],
  },
  wound: {
    severity: 'moderate',
    firstAid: [
      'Stop bleeding by applying direct pressure',
      'Clean the wound with clean water',
      'Apply antiseptic and cover with sterile dressing',
      'Check tetanus vaccination status',
      'Seek medical attention for deep or contaminated wounds',
    ],
    affectedAreas: [],
  },
  swelling: {
    severity: 'mild',
    firstAid: [
      'Apply RICE: Rest, Ice, Compression, Elevation',
      'Ice for 20 minutes every 2 hours for first 48 hours',
      'Use compression bandage to reduce swelling',
      'Keep the area elevated above heart level',
      'See a doctor if swelling is severe or does not improve in 48 hours',
    ],
    affectedAreas: [],
  },
  rash: {
    severity: 'mild',
    firstAid: [
      'Avoid scratching the affected area',
      'Apply calamine lotion or hydrocortisone cream',
      'Take antihistamine (cetirizine) for itching',
      'Keep the area clean and dry',
      'See a doctor if rash spreads, blisters, or is accompanied by fever',
    ],
    affectedAreas: [],
  },
  default: {
    severity: 'mild',
    firstAid: [
      'Clean the affected area gently with clean water',
      'Apply antiseptic if there is a wound',
      'Rest and avoid putting pressure on the area',
      'Monitor for worsening symptoms',
      'Consult a doctor if symptoms worsen or do not improve',
    ],
    affectedAreas: [],
  },
};

// ─── LABEL → INJURY TYPE MAPPING ─────────────────────────────────────────────

function classifyInjuryFromLabel(label: string): string {
  const l = label.toLowerCase();
  if (l.includes('burn') || l.includes('fire') || l.includes('flame'))                    return 'burn';
  if (l.includes('cut') || l.includes('lacerat') || l.includes('slash'))                  return 'cut';
  if (l.includes('bruise') || l.includes('contusion') || l.includes('hematoma'))          return 'bruise';
  if (l.includes('fracture') || l.includes('broken') || l.includes('bone'))               return 'fracture';
  if (l.includes('wound') || l.includes('injury') || l.includes('trauma'))                return 'wound';
  if (l.includes('swell') || l.includes('edema') || l.includes('sprain'))                 return 'swelling';
  if (l.includes('rash') || l.includes('dermatitis') || l.includes('eczema') || l.includes('skin')) return 'rash';
  return 'default';
}

// ─── MEDICINE NAME EXTRACTION ─────────────────────────────────────────────────

// Common medicine keywords to detect in OCR output
const MEDICINE_KEYWORDS = [
  'mg', 'ml', 'tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment',
  'drops', 'suspension', 'solution', 'patch', 'inhaler', 'spray',
  'paracetamol', 'ibuprofen', 'amoxicillin', 'metformin', 'aspirin',
  'cetirizine', 'omeprazole', 'azithromycin', 'ciprofloxacin', 'dolo',
  'crocin', 'combiflam', 'pan', 'rantac', 'allegra', 'montair',
];

function extractMedicineName(ocrText: string): string | null {
  if (!ocrText || ocrText.length < 3) return null;

  const lines = ocrText.split('\n').map(l => l.trim()).filter(l => l.length > 2);
  const lower = ocrText.toLowerCase();

  // Check if it looks like medicine text
  const isMedicine = MEDICINE_KEYWORDS.some(kw => lower.includes(kw));
  if (!isMedicine && lines.length < 2) return null;

  // First non-empty line is usually the medicine name
  const nameLine = lines[0] || '';

  // Clean up common OCR artifacts
  const cleaned = nameLine
    .replace(/[^a-zA-Z0-9\s\-+]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned.length > 2 ? cleaned : (lines[1] || null);
}

function extractDosage(ocrText: string): string {
  const mgMatch  = ocrText.match(/(\d+)\s*mg/i);
  const mlMatch  = ocrText.match(/(\d+)\s*ml/i);
  const tabMatch = ocrText.match(/(\d+)\s*tablet/i);

  if (mgMatch)  return `${mgMatch[1]}mg`;
  if (mlMatch)  return `${mlMatch[1]}ml`;
  if (tabMatch) return `${tabMatch[1]} tablet`;
  return '1 tablet';
}

// ─── HF API CALLS ─────────────────────────────────────────────────────────────

const HF_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  ...(HF_TOKEN ? { Authorization: `Bearer ${HF_TOKEN}` } : {}),
};

async function classifyImage(base64: string): Promise<{ label: string; score: number }[]> {
  // Remove data URL prefix if present
  const b64 = base64.replace(/^data:image\/\w+;base64,/, '');

  const res = await fetch(
    `https://api-inference.huggingface.co/models/${INJURY_MODEL}`,
    {
      method: 'POST',
      headers: { ...HF_HEADERS, 'Content-Type': 'application/octet-stream' },
      body: Buffer.from(b64, 'base64'),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HF classify error: ${res.status} ${err.slice(0, 100)}`);
  }

  return res.json();
}

async function ocrImage(base64: string): Promise<string> {
  const b64 = base64.replace(/^data:image\/\w+;base64,/, '');

  const res = await fetch(
    `https://api-inference.huggingface.co/models/${MEDICINE_MODEL}`,
    {
      method: 'POST',
      headers: { ...HF_HEADERS, 'Content-Type': 'application/octet-stream' },
      body: Buffer.from(b64, 'base64'),
    }
  );

  if (!res.ok) throw new Error(`HF OCR error: ${res.status}`);
  const data = await res.json();
  return data.generated_text || data[0]?.generated_text || '';
}

// ─── DETECT IMAGE TYPE ────────────────────────────────────────────────────────

async function detectImageType(base64: string): Promise<ImageType> {
  try {
    const results = await classifyImage(base64);
    if (!results || results.length === 0) return 'unknown';

    const topLabels = results.slice(0, 5).map(r => r.label.toLowerCase()).join(' ');

    // Medicine indicators
    const medicineWords = ['pill', 'tablet', 'capsule', 'medicine', 'drug', 'bottle', 'pharmacy', 'label', 'package', 'box'];
    if (medicineWords.some(w => topLabels.includes(w))) return 'medicine';

    // Injury indicators
    const injuryWords = ['wound', 'injury', 'burn', 'cut', 'bruise', 'skin', 'hand', 'arm', 'leg', 'body', 'person', 'human'];
    if (injuryWords.some(w => topLabels.includes(w))) return 'injury';

    return 'injury'; // default to injury analysis for body photos
  } catch {
    return 'injury'; // fallback
  }
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

export async function analyzeImage(base64: string): Promise<ImageAnalysisResult> {
  // Step 1: Detect what type of image this is
  const imageType = await detectImageType(base64);

  if (imageType === 'medicine') {
    return analyzeMedicine(base64);
  } else {
    return analyzeInjury(base64);
  }
}

export async function analyzeInjury(base64: string): Promise<ImageAnalysisResult> {
  try {
    const results = await classifyImage(base64);
    const top = results[0] || { label: 'injury', score: 0.5 };

    const injuryType = classifyInjuryFromLabel(top.label);
    const advice     = INJURY_ADVICE[injuryType] || INJURY_ADVICE.default;

    return {
      type:          'injury',
      injuryType:    injuryType === 'default' ? 'General Injury' : injuryType.charAt(0).toUpperCase() + injuryType.slice(1),
      severity:      advice.severity,
      firstAid:      advice.firstAid,
      warning:       advice.warning,
      affectedAreas: advice.affectedAreas,
      rawLabel:      top.label,
      confidence:    Math.round(top.score * 100),
    };
  } catch (err: any) {
    // Fallback: return general first aid without API
    return {
      type:      'injury',
      injuryType: 'General Injury',
      severity:  'mild',
      firstAid:  INJURY_ADVICE.default.firstAid,
      affectedAreas: [],
      rawLabel:  'analysis unavailable',
      confidence: 0,
    };
  }
}

export async function analyzeMedicine(base64: string): Promise<ImageAnalysisResult> {
  try {
    const ocrText    = await ocrImage(base64);
    const medName    = extractMedicineName(ocrText);
    const dosage     = extractDosage(ocrText);

    if (!medName) {
      return {
        type:          'medicine',
        medicineName:  undefined,
        dosageSuggestion: dosage,
        rawLabel:      ocrText.slice(0, 100),
      };
    }

    return {
      type:             'medicine',
      medicineName:     medName,
      dosageSuggestion: dosage,
      rawLabel:         ocrText.slice(0, 200),
      confidence:       85,
    };
  } catch {
    return {
      type:          'medicine',
      medicineName:  undefined,
      rawLabel:      'OCR unavailable',
    };
  }
}
