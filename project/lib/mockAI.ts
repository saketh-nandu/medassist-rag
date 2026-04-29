/**
 * mockAI.ts
 * Calls the RAG backend API.
 * Falls back to local keyword matching if backend is unreachable.
 */

import { SeverityLevel } from '@/context/AppContext';

export interface AIResponse {
  content: string;
  severity: SeverityLevel;
  conditions: string[];
  suggestedActions: string[];
  affectedAreas: string[];
  isEmergency: boolean;
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────

// Change this to your deployed backend URL in production
const RAG_API_URL = process.env.EXPO_PUBLIC_RAG_API_URL || 'http://localhost:3001';
const TIMEOUT_MS = 30000; // 30s — accounts for Render free tier cold start

// ─── RAG API CALL ─────────────────────────────────────────────────────────────

async function callRAGBackend(message: string, history: {role: string; content: string}[] = []): Promise<AIResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${RAG_API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data as AIResponse;
  } finally {
    clearTimeout(timer);
  }
}

// ─── LOCAL FALLBACK ───────────────────────────────────────────────────────────

const EMERGENCY_KEYWORDS = [
  'chest pain', 'chest pressure', 'heart attack', "can't breathe",
  'difficulty breathing', 'stroke', 'unconscious', 'seizure',
  'severe bleeding', 'coughing blood', 'sudden numbness', 'face drooping',
  'loss of consciousness', 'not breathing',
];

const localResponses: Record<string, AIResponse> = {
  headache: {
    content: 'Based on your symptoms, you may be experiencing a tension headache or migraine. Stress or dehydration could be contributing factors. Please consult a doctor if it persists.',
    severity: 'low',
    conditions: ['Tension Headache', 'Migraine', 'Dehydration', 'Sinusitis'],
    suggestedActions: ['Drink 2-3 glasses of water', 'Rest in a quiet dark room', 'Apply cold compress', 'Take Paracetamol if needed', 'See doctor if persists > 72 hours'],
    affectedAreas: ['head'],
    isEmergency: false,
  },
  fever: {
    content: "You appear to have a fever — your body's response to infection. Monitor temperature and stay hydrated. Seek care if fever exceeds 40°C.",
    severity: 'medium',
    conditions: ['Viral Infection', 'Bacterial Infection', 'Influenza', 'COVID-19'],
    suggestedActions: ['Check temperature every 4 hours', 'Stay hydrated (8-10 glasses/day)', 'Take Paracetamol 500mg if >38.5°C', 'Seek care if fever >40°C'],
    affectedAreas: ['head', 'chest'],
    isEmergency: false,
  },
  cough: {
    content: 'A persistent cough can indicate a common cold, respiratory infection, or allergies. Monitor duration and associated symptoms.',
    severity: 'low',
    conditions: ['Common Cold', 'Bronchitis', 'Allergies', 'COVID-19'],
    suggestedActions: ['Stay hydrated with warm fluids', 'Try steam inhalation', 'Avoid smoke/dust', 'See doctor if cough persists > 2 weeks'],
    affectedAreas: ['chest', 'throat'],
    isEmergency: false,
  },
  stomach: {
    content: 'Stomach pain can have many causes. Monitor location, severity, and associated symptoms. Avoid solid food temporarily and sip clear fluids.',
    severity: 'medium',
    conditions: ['Gastritis', 'IBS', 'Food Poisoning', 'Appendicitis'],
    suggestedActions: ['Avoid solid food for 2-4 hours', 'Sip clear liquids slowly', 'Apply warm compress', 'Seek immediate care if pain is severe or worsening'],
    affectedAreas: ['abdomen'],
    isEmergency: false,
  },
  back: {
    content: 'Back pain is a common musculoskeletal complaint. It can range from muscle strain to spinal issues.',
    severity: 'low',
    conditions: ['Muscle Strain', 'Herniated Disc', 'Sciatica', 'Poor Posture'],
    suggestedActions: ['Rest but avoid prolonged bed rest', 'Apply ice first 48h then heat', 'Take anti-inflammatory medication', 'See doctor if pain radiates down leg'],
    affectedAreas: ['back'],
    isEmergency: false,
  },
  emergency: {
    content: '🚨 EMERGENCY: Your symptoms indicate a possible medical emergency. Call 108 immediately. Do not drive yourself.',
    severity: 'high',
    conditions: ['Possible Cardiac Event', 'Stroke', 'Respiratory Emergency'],
    suggestedActions: ['CALL 108 IMMEDIATELY', 'Do not drive yourself', 'Sit or lie down', 'Loosen tight clothing', 'Stay on line with emergency services'],
    affectedAreas: ['chest', 'head'],
    isEmergency: true,
  },
};

function localFallback(message: string): AIResponse {
  const lower = message.toLowerCase().trim();

  // ── Greetings ──
  const greetings = ['hi', 'hello', 'hey', 'hii', 'helo', 'howdy', 'sup', 'good morning', 'good afternoon', 'good evening', 'namaste'];
  if (greetings.some(g => lower === g || lower.startsWith(g + ' ') || lower.startsWith(g + '!'))) {
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    return {
      content: `${timeGreeting}! 👋 I'm MedAssist RAG, your personal health assistant.\n\nI can help you with:\n• **Symptom analysis** — describe what you're feeling\n• **Disease information** — ask about any condition\n• **Medication guidance** — dosage and precautions\n• **First aid advice** — for injuries and emergencies\n\nHow are you feeling today? Tell me your symptoms and I'll help you understand what might be going on.`,
      severity: 'low',
      conditions: [],
      suggestedActions: ['Describe your symptoms to get started', 'Ask about a specific disease or condition', 'Ask about medications or treatments'],
      affectedAreas: [],
      isEmergency: false,
    };
  }

  // ── How are you / small talk ──
  if (lower.includes('how are you') || lower.includes('what can you do') || lower.includes('who are you') || lower.includes('what are you')) {
    return {
      content: `I'm MedAssist RAG — your AI-powered health assistant! 🏥\n\nI'm doing great and ready to help you.\n\nI can analyze your symptoms, provide information about diseases and conditions, suggest when to seek medical care, and help you understand your health better.\n\nJust describe what you're experiencing and I'll do my best to help. Remember, I'm here to guide you — always consult a doctor for proper diagnosis.`,
      severity: 'low',
      conditions: [],
      suggestedActions: ['Tell me your symptoms', 'Ask about a health condition', 'Ask about medications'],
      affectedAreas: [],
      isEmergency: false,
    };
  }

  // ── Thank you ──
  if (lower.includes('thank') || lower.includes('thanks') || lower.includes('ok thanks') || lower.includes('okay')) {
    return {
      content: `You're welcome! 😊 Take care of yourself.\n\nRemember:\n• Stay hydrated and get enough rest\n• Don't ignore persistent symptoms\n• Consult a doctor for proper diagnosis\n\nFeel free to ask me anything else about your health!`,
      severity: 'low',
      conditions: [],
      suggestedActions: ['Stay hydrated', 'Get adequate rest', 'Consult a doctor if symptoms persist'],
      affectedAreas: [],
      isEmergency: false,
    };
  }

  // ── Medical symptoms ──
  if (EMERGENCY_KEYWORDS.some((kw) => lower.includes(kw))) return localResponses.emergency;
  if (lower.includes('headache') || lower.includes('migraine') || lower.includes('head pain') || lower.includes('head hurts')) return localResponses.headache;
  if (lower.includes('fever') || lower.includes('temperature') || lower.includes('chills')) return localResponses.fever;
  if (lower.includes('cough') || lower.includes('cold') || lower.includes('sore throat')) return localResponses.cough;
  if (lower.includes('stomach') || lower.includes('abdomen') || lower.includes('nausea') || lower.includes('vomit')) return localResponses.stomach;
  if (lower.includes('back') || lower.includes('spine') || lower.includes('lumbar')) return localResponses.back;

  return {
    content: `I've noted your message: "${message}".\n\nIf you're describing symptoms, please provide more details like:\n• Where exactly is the pain or discomfort?\n• How long have you had this?\n• Is it mild, moderate, or severe?\n\nThis will help me give you better guidance. Remember to consult a qualified healthcare professional for proper diagnosis.`,
    severity: 'low',
    conditions: ['Requires Medical Evaluation'],
    suggestedActions: ['Describe your symptoms in more detail', 'Note when symptoms started', 'Stay hydrated and rest', 'Consult a doctor if concerned'],
    affectedAreas: [],
    isEmergency: false,
  };
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

export async function getAIResponse(userMessage: string, history: {role: string; content: string}[] = []): Promise<AIResponse> {
  try {
    const response = await callRAGBackend(userMessage, history);
    return response;
  } catch (err) {
    // Backend unreachable — use local fallback
    console.warn('RAG backend unreachable, using local fallback:', err);
    // Simulate thinking time
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
    return localFallback(userMessage);
  }
}
