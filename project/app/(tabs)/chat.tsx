import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, Image,
  TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform,
  Modal, ActivityIndicator, Alert, Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Send, Camera, Trash2, X, Pill, AlertTriangle, CheckCircle,
  ImageIcon, Stethoscope, User, Phone, Database, Sparkles,
  ShieldAlert, Hand, Brain, Thermometer, Scissors,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useApp, ChatMessage } from '@/context/AppContext';
import TypingIndicator from '@/components/TypingIndicator';
import { getAIResponse } from '@/lib/mockAI';
import { analyzeImage, ImageAnalysisResult } from '@/lib/imageAnalysis';
import { colors } from '@/constants/colors';
import { radius, shadows, spacing, typography } from '@/constants/theme';

// ─── QUICK ACTIONS (same as chatfront) ───────────────────────────────────────
const QUICK_ACTIONS = [
  { id: '1', label: 'Skin issue',        Icon: Hand,          prompt: 'I have a skin issue I need help with' },
  { id: '2', label: 'Head injury',       Icon: Brain,         prompt: 'I have a head injury I need guidance on' },
  { id: '3', label: 'Fever',             Icon: Thermometer,   prompt: 'I have a fever and need advice' },
  { id: '4', label: 'Wound care',        Icon: Scissors,      prompt: 'I need wound care guidance' },
  { id: '5', label: 'When to seek help', Icon: AlertTriangle, prompt: 'When should I seek emergency medical help?' },
];

// ─── LOADING INDICATOR ───────────────────────────────────────────────────────
type LoadState = 'loading' | 'retrieving' | 'responding';

function LoadingIndicator({ state }: { state: LoadState }) {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  useEffect(() => {
    const anims = dots.map((d, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * 150),
        Animated.timing(d, { toValue: -6, duration: 300, useNativeDriver: true }),
        Animated.timing(d, { toValue: 0,  duration: 300, useNativeDriver: true }),
      ]))
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);

  const cfg = {
    loading:    { Icon: Stethoscope, text: 'Analyzing your question...',     color: colors.textSecondary },
    retrieving: { Icon: Database,    text: 'Searching medical literature...', color: colors.primary },
    responding: { Icon: Sparkles,    text: 'Generating response...',          color: colors.primary },
  }[state];

  return (
    <View style={li.row}>
      <View style={li.iconWrap}><cfg.Icon size={15} color={cfg.color} /></View>
      <View>
        <Text style={[li.text, { color: cfg.color }]}>{cfg.text}</Text>
        <View style={li.dots}>
          {dots.map((d, i) => (
            <Animated.View key={i} style={[li.dot, { transform: [{ translateY: d }] }]} />
          ))}
        </View>
      </View>
    </View>
  );
}
const li = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.base },
  iconWrap:{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.borderLight, alignItems: 'center', justifyContent: 'center' },
  text:    { fontSize: 13, fontWeight: '500' },
  dots:    { flexDirection: 'row', gap: 4, marginTop: 4 },
  dot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
});

// ─── CONFIDENCE METER ────────────────────────────────────────────────────────
function ConfidenceMeter({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const barColor   = pct >= 90 ? '#10B981' : pct >= 75 ? colors.primary : pct >= 60 ? '#F59E0B' : '#EF4444';
  const labelColor = pct >= 75 ? '#10B981' : pct >= 60 ? '#F59E0B' : '#EF4444';
  const label      = pct >= 90 ? 'High' : pct >= 75 ? 'Good' : pct >= 60 ? 'Moderate' : 'Low';
  return (
    <View style={cm.row}>
      <Text style={cm.label}>Confidence:</Text>
      <View style={cm.track}><View style={[cm.fill, { width: `${pct}%` as any, backgroundColor: barColor }]} /></View>
      <Text style={cm.pct}>{pct}%</Text>
      <Text style={[cm.grade, { color: labelColor }]}>({label})</Text>
    </View>
  );
}
const cm = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderLight },
  label: { fontSize: 11, color: colors.textSecondary },
  track: { width: 72, height: 5, backgroundColor: colors.borderLight, borderRadius: 3, overflow: 'hidden' },
  fill:  { height: '100%', borderRadius: 3 },
  pct:   { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
  grade: { fontSize: 11 },
});

// ─── EMERGENCY BANNER ────────────────────────────────────────────────────────
function EmergencyBanner() {
  return (
    <View style={eb.wrap}>
      <View style={eb.iconWrap}><AlertTriangle size={20} color="#DC2626" /></View>
      <View style={eb.body}>
        <Text style={eb.title}>EMERGENCY DETECTED</Text>
        <Text style={eb.desc}>Your symptoms may indicate a medical emergency. Please seek immediate attention.</Text>
        <TouchableOpacity style={eb.btn}>
          <Phone size={13} color="#fff" />
          <Text style={eb.btnText}>Call 108</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const eb = StyleSheet.create({
  wrap:    { flexDirection: 'row', gap: spacing.md, margin: spacing.base, padding: spacing.base, backgroundColor: '#FEF2F2', borderWidth: 2, borderColor: '#FCA5A5', borderRadius: radius.lg },
  iconWrap:{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  body:    { flex: 1 },
  title:   { fontSize: 11, fontWeight: '800', color: '#991B1B', letterSpacing: 0.5, marginBottom: 4 },
  desc:    { fontSize: 13, color: '#B91C1C', lineHeight: 18, marginBottom: spacing.md },
  btn:     { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: '#DC2626', paddingHorizontal: spacing.md, paddingVertical: 7, borderRadius: radius.md },
  btnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});

// ─── DISCLAIMER ──────────────────────────────────────────────────────────────
function Disclaimer() {
  return (
    <View style={dc.wrap}>
      <ShieldAlert size={15} color="#D97706" />
      <Text style={dc.text}><Text style={dc.bold}>Medical Disclaimer: </Text>General health information only. Not a substitute for professional medical advice. Always consult a qualified healthcare provider.</Text>
    </View>
  );
}
const dc = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: spacing.sm, padding: spacing.base, backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', borderRadius: radius.lg },
  text: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 18 },
  bold: { fontWeight: '700' },
});

// ─── MESSAGE BUBBLE ──────────────────────────────────────────────────────────
function MessageBubble({ message, onViewBody }: { message: ChatMessage & { confidence?: number; isEmergency?: boolean; ragMetadata?: any }; onViewBody?: (a: string[]) => void }) {
  const isUser      = message.role === 'user';
  const isEmergency = message.isEmergency;
  const confidence  = message.confidence;
  const ragData     = message.ragMetadata;
  const [showRAGDetails, setShowRAGDetails] = useState(false);

  function renderText(text: string) {
    return text.split(/(\*\*.*?\*\*)/g).map((p, i) =>
      p.startsWith('**') && p.endsWith('**')
        ? <Text key={i} style={{ fontWeight: '700' }}>{p.slice(2, -2)}</Text>
        : <Text key={i}>{p}</Text>
    );
  }

  if (isUser) {
    return (
      <View style={mb.userRow}>
        <View style={mb.userBubble}><Text style={mb.userText}>{message.content}</Text></View>
        <View style={mb.userAvatar}><User size={14} color={colors.primary} /></View>
      </View>
    );
  }

  return (
    <View style={mb.aiRow}>
      <View style={[mb.aiAvatar, isEmergency && mb.aiAvatarEmergency]}>
        {isEmergency ? <AlertTriangle size={14} color="#DC2626" /> : <Stethoscope size={14} color={colors.textSecondary} />}
      </View>
      <View style={mb.aiContent}>
        <View style={[mb.aiCard, isEmergency && mb.aiCardEmergency]}>
          {isEmergency && (
            <View style={mb.emergencyHeader}>
              <AlertTriangle size={11} color="#DC2626" />
              <Text style={mb.emergencyLabel}>EMERGENCY ALERT</Text>
            </View>
          )}
          <Text style={[mb.aiText, isEmergency && { color: '#7F1D1D' }]}>{renderText(message.content)}</Text>
          {confidence !== undefined && <ConfidenceMeter score={confidence} />}
          
          {/* Enhanced RAG Sources Display with Detailed Scores */}
          {ragData && ragData.topSources && ragData.topSources.length > 0 && (
            <View style={mb.ragSources}>
              <View style={mb.ragHeader}>
                <Text style={mb.ragSourcesTitle}>📚 Medical Sources ({ragData.pipelineStats.finalResults} selected)</Text>
                <TouchableOpacity 
                  style={mb.ragToggle} 
                  onPress={() => setShowRAGDetails(!showRAGDetails)}
                >
                  <Text style={mb.ragToggleText}>{showRAGDetails ? 'Hide' : 'Show'} Scores</Text>
                </TouchableOpacity>
              </View>
              
              {showRAGDetails && (
                <>
                  {/* Pipeline Statistics */}
                  <View style={mb.pipelineStats}>
                    <Text style={mb.pipelineStatsTitle}>🔍 RAG Pipeline Results:</Text>
                    <Text style={mb.pipelineStatsText}>
                      Vector: {ragData.pipelineStats.vectorResults} • Keyword: {ragData.pipelineStats.keywordResults} • 
                      Fused: {ragData.pipelineStats.fusedResults} • Final: {ragData.pipelineStats.finalResults}
                    </Text>
                  </View>

                  {/* Detailed Source Information with Scores */}
                  {ragData.topSources.slice(0, 3).map((source: any, i: number) => (
                    <View key={i} style={mb.sourceItemEnhanced}>
                      <View style={mb.sourceHeader}>
                        <Text style={mb.sourceRank}>#{i + 1}</Text>
                        <Text style={mb.sourceTitle}>{source.title?.slice(0, 35)}...</Text>
                      </View>
                      
                      <Text style={mb.sourceDetails}>📁 {source.datasetPath}</Text>
                      
                      {/* Score Bars */}
                      <View style={mb.scoreSection}>
                        {source.vectorScore && (
                          <View style={mb.scoreRow}>
                            <Text style={mb.scoreLabel}>Vector:</Text>
                            <View style={mb.scoreBarContainer}>
                              <View style={[mb.scoreBar, { width: `${Math.min(parseFloat(source.vectorScore), 100)}%`, backgroundColor: '#10B981' }]} />
                            </View>
                            <Text style={mb.scoreValue}>{source.vectorScore}%</Text>
                          </View>
                        )}
                        
                        {source.rrfScore && (
                          <View style={mb.scoreRow}>
                            <Text style={mb.scoreLabel}>RRF:</Text>
                            <View style={mb.scoreBarContainer}>
                              <View style={[mb.scoreBar, { width: `${Math.min(parseFloat(source.rrfScore) * 5000, 100)}%`, backgroundColor: '#3B82F6' }]} />
                            </View>
                            <Text style={mb.scoreValue}>{source.rrfScore}</Text>
                          </View>
                        )}
                        
                        {source.rerankScore && (
                          <View style={mb.scoreRow}>
                            <Text style={mb.scoreLabel}>Rerank:</Text>
                            <View style={mb.scoreBarContainer}>
                              <View style={[mb.scoreBar, { width: `${Math.min(parseFloat(source.rerankScore), 100)}%`, backgroundColor: '#F59E0B' }]} />
                            </View>
                            <Text style={mb.scoreValue}>{source.rerankScore}%</Text>
                          </View>
                        )}
                      </View>
                      
                      <Text style={mb.sourceChunkInfo}>
                        📑 Chunk {source.chunkIndex + 1} • {source.category} • {source.source}
                      </Text>
                    </View>
                  ))}
                  
                  {/* Generation Statistics */}
                  {ragData.generationStats && (
                    <View style={mb.generationStats}>
                      <Text style={mb.generationStatsTitle}>🤖 AI Generation:</Text>
                      <Text style={mb.generationStatsText}>
                        {ragData.generationStats.model} • {ragData.generationStats.responseTime}ms • ~{ragData.generationStats.tokensUsed} tokens
                      </Text>
                      {ragData.queryExpansion && (
                        <Text style={mb.queryExpansion}>
                          🔍 Query expanded with medical terms
                        </Text>
                      )}
                    </View>
                  )}
                </>
              )}
              
              {/* Always show basic source info */}
              {!showRAGDetails && (
                <View style={mb.basicSources}>
                  {ragData.topSources.slice(0, 2).map((source: any, i: number) => (
                    <Text key={i} style={mb.basicSourceText}>
                      • {source.title?.slice(0, 30)}... ({source.vectorScore || 'N/A'}% match)
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {message.conditions && message.conditions.length > 0 && (
          <View style={mb.tagsRow}>
            {message.conditions.slice(0, 3).map((c, i) => (
              <View key={i} style={mb.tag}><Text style={mb.tagText}>{c}</Text></View>
            ))}
          </View>
        )}

        {message.suggestedActions && message.suggestedActions.length > 0 && (
          <View style={mb.actionsBox}>
            <Text style={mb.actionsTitle}>Suggested Actions</Text>
            {message.suggestedActions.slice(0, 4).map((a, i) => (
              <View key={i} style={mb.actionRow}>
                <View style={mb.actionNum}><Text style={mb.actionNumText}>{i + 1}</Text></View>
                <Text style={mb.actionText}>{a}</Text>
              </View>
            ))}
          </View>
        )}

        {message.affectedAreas && message.affectedAreas.length > 0 && onViewBody && (
          <TouchableOpacity style={mb.bodyBtn} onPress={() => onViewBody(message.affectedAreas!)}>
            <Text style={mb.bodyBtnText}>View on Body Map →</Text>
          </TouchableOpacity>
        )}

        <Text style={mb.time}>{message.timestamp.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</Text>
      </View>
    </View>
  );
}
const mb = StyleSheet.create({
  userRow:   { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-end', gap: spacing.sm, marginBottom: spacing.base, paddingHorizontal: spacing.base },
  userBubble:{ backgroundColor: colors.primary, borderRadius: radius.xl, borderBottomRightRadius: 4, paddingHorizontal: spacing.base, paddingVertical: spacing.md, maxWidth: '80%', ...shadows.sm },
  userText:  { color: '#fff', fontSize: 14, lineHeight: 20 },
  userAvatar:{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#F0FDFA', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  aiRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.base, paddingHorizontal: spacing.base },
  aiAvatar:  { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.borderLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  aiAvatarEmergency: { backgroundColor: '#FEE2E2' },
  aiContent: { flex: 1 },
  aiCard:    { backgroundColor: colors.surface, borderRadius: radius.xl, borderTopLeftRadius: 4, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.base, paddingVertical: spacing.md, ...shadows.sm },
  aiCardEmergency: { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5', borderWidth: 2 },
  emergencyHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: spacing.sm, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: '#FCA5A5' },
  emergencyLabel:  { fontSize: 10, fontWeight: '800', color: '#991B1B', letterSpacing: 0.5 },
  aiText:    { fontSize: 14, color: colors.text, lineHeight: 21 },
  
  // RAG Sources Styles
  ragSources:      { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderLight },
  ragHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  ragSourcesTitle: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  ragToggle:       { paddingHorizontal: spacing.sm, paddingVertical: 4, backgroundColor: colors.primaryLight, borderRadius: radius.sm },
  ragToggleText:   { fontSize: 10, fontWeight: '600', color: colors.primary },
  
  // Basic Sources (when collapsed)
  basicSources:    { paddingLeft: spacing.sm },
  basicSourceText: { fontSize: 10, color: colors.textSecondary, marginBottom: 2 },
  
  // Pipeline Statistics
  pipelineStats:      { backgroundColor: '#F8FAFC', padding: spacing.sm, borderRadius: radius.md, marginBottom: spacing.sm },
  pipelineStatsTitle: { fontSize: 10, fontWeight: '700', color: colors.textSecondary, marginBottom: 2 },
  pipelineStatsText:  { fontSize: 9, color: colors.textTertiary },
  
  // Enhanced Source Items
  sourceItemEnhanced: { marginBottom: spacing.md, padding: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderLight },
  sourceHeader:       { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  sourceRank:         { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary, color: '#fff', fontSize: 10, fontWeight: '700', textAlign: 'center', lineHeight: 20 },
  sourceTitle:        { flex: 1, fontSize: 12, fontWeight: '600', color: colors.text },
  sourceDetails:      { fontSize: 10, color: colors.textSecondary, marginBottom: spacing.sm },
  
  // Score Visualization
  scoreSection:       { marginBottom: spacing.sm },
  scoreRow:           { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 4 },
  scoreLabel:         { width: 50, fontSize: 9, fontWeight: '600', color: colors.textSecondary },
  scoreBarContainer:  { flex: 1, height: 8, backgroundColor: colors.borderLight, borderRadius: 4, overflow: 'hidden' },
  scoreBar:           { height: '100%', borderRadius: 4 },
  scoreValue:         { width: 45, fontSize: 9, fontWeight: '600', color: colors.text, textAlign: 'right' },
  
  sourceChunkInfo:    { fontSize: 9, color: colors.textTertiary, fontStyle: 'italic' },
  
  // Generation Statistics
  generationStats:      { backgroundColor: '#F0F9FF', padding: spacing.sm, borderRadius: radius.md, marginTop: spacing.sm },
  generationStatsTitle: { fontSize: 10, fontWeight: '700', color: colors.textSecondary, marginBottom: 2 },
  generationStatsText:  { fontSize: 9, color: colors.textTertiary },
  queryExpansion:       { fontSize: 9, color: colors.textTertiary, marginTop: 2, fontStyle: 'italic' },
  
  tagsRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  tag:       { backgroundColor: '#F0FDFA', paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full, borderWidth: 1, borderColor: '#99F6E4' },
  tagText:   { fontSize: 11, color: colors.primary, fontWeight: '600' },
  actionsBox:   { backgroundColor: colors.borderLight, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm },
  actionsTitle: { fontSize: 10, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
  actionRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: 5 },
  actionNum:    { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  actionNumText:{ color: '#fff', fontSize: 10, fontWeight: '700' },
  actionText:   { flex: 1, fontSize: 13, color: colors.text, lineHeight: 18 },
  bodyBtn:      { alignSelf: 'flex-start', marginTop: spacing.sm, paddingVertical: 5, paddingHorizontal: spacing.md, backgroundColor: '#F0FDFA', borderRadius: radius.md, borderWidth: 1, borderColor: '#99F6E4' },
  bodyBtnText:  { fontSize: 12, color: colors.primary, fontWeight: '600' },
  time:         { fontSize: 11, color: colors.textTertiary, marginTop: 4 },
});

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────
export default function ChatScreen() {
  const router  = useRouter();
  const params  = useLocalSearchParams<{ initialMessage?: string }>();
  const { messages, addMessage, clearMessages, setEmergencyActive, setHighlightedAreas, addReminder, messagesLoading } = useApp();

  const [input,       setInput]       = useState('');
  const [loadState,   setLoadState]   = useState<LoadState | null>(null);
  const [imageModal,  setImageModal]  = useState(false);
  const [analyzing,   setAnalyzing]   = useState(false);
  const [imageResult, setImageResult] = useState<ImageAnalysisResult | null>(null);
  const [pickedImage, setPickedImage] = useState<string | null>(null);
  const scrollRef   = useRef<ScrollView>(null);
  const initialSent = useRef(false);

  useEffect(() => {
    if (params.initialMessage && !initialSent.current) {
      initialSent.current = true;
      sendMessage(params.initialMessage);
    }
  }, [params.initialMessage]);

  function scrollToBottom() {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    addMessage({ id: Date.now().toString(), role: 'user', content: trimmed, timestamp: new Date() });
    setInput('');
    setLoadState('loading');
    scrollToBottom();

    // Use refs for timeouts so we can cancel them if response arrives early
    const t1 = setTimeout(() => setLoadState(s => s !== null ? 'retrieving' : null), 400);
    const t2 = setTimeout(() => setLoadState(s => s !== null ? 'responding' : null), 900);

    try {
      const history = messages.slice(-6).map((m: ChatMessage) => ({
        role: m.role,
        content: m.content.slice(0, 300),
      }));
      const response = await getAIResponse(trimmed, history);
      
      // Log RAG details to browser console with dataset sources
      if (response.ragMetadata) {
        console.group('🧠 RAG Pipeline Results');
        console.log('📊 Pipeline Stats:', response.ragMetadata.pipelineStats);
        console.log('🔍 Query Expansion:', response.ragMetadata.queryExpansion || 'None');
        console.log('🤖 Generation Stats:', response.ragMetadata.generationStats);
        
        // Enhanced source logging with dataset paths
        console.group('📚 Retrieved Sources with Dataset Paths');
        response.ragMetadata.topSources.forEach((source, i) => {
          console.log(`${i + 1}. ${source.title}`);
          console.log(`   📁 Dataset: ${source.datasetPath}`);
          console.log(`   📈 Scores: Vector ${source.vectorScore}% | RRF ${source.rrfScore} | Rerank ${source.rerankScore}%`);
          console.log(`   📑 Chunk ${source.chunkIndex + 1} of document "${source.docId}"`);
          console.log(`   🏷️ Category: ${source.category} | Source: ${source.source}`);
          if (source.metadata && Object.keys(source.metadata).length > 0) {
            console.log('   📋 Metadata:', source.metadata);
          }
          console.log('');
        });
        console.groupEnd();
        
        console.groupEnd();
      }
      
      const aiMsg = Object.assign(
        { id: (Date.now() + 1).toString(), role: 'assistant' as const, content: response.content, timestamp: new Date(),
          severity: response.severity, conditions: response.conditions,
          suggestedActions: response.suggestedActions, affectedAreas: response.affectedAreas },
        { confidence: response.severity === 'high' ? 0.95 : response.severity === 'medium' ? 0.75 : 0.65,
          isEmergency: response.isEmergency,
          ragMetadata: response.ragMetadata }
      );
      addMessage(aiMsg as ChatMessage);
      if (response.affectedAreas.length > 0) setHighlightedAreas(response.affectedAreas);
      if (response.isEmergency) { setEmergencyActive(true); setTimeout(() => router.push('/emergency'), 400); }
    } catch (err) {
      // Show error message in chat instead of silent infinite loop
      addMessage({
        id: (Date.now() + 1).toString(), role: 'assistant', content:
          'Sorry, I could not reach the medical knowledge base right now. Please check your connection and try again.\n\n*If this persists, the backend may be starting up — try again in 30 seconds.*',
        timestamp: new Date(), severity: 'low', conditions: [], suggestedActions: [], affectedAreas: [],
      });
    } finally {
      // Cancel pending state transitions before clearing
      clearTimeout(t1);
      clearTimeout(t2);
      setLoadState(null);
      scrollToBottom();
    }
  }

  async function pickImage(source: 'camera' | 'gallery') {
    setImageModal(false);
    let result;
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission needed', 'Camera permission is required.'); return; }
      result = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.7, mediaTypes: ImagePicker.MediaTypeOptions.Images });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission needed', 'Gallery permission is required.'); return; }
      result = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.7, mediaTypes: ImagePicker.MediaTypeOptions.Images });
    }
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setPickedImage(asset.uri);
    setAnalyzing(true);
    setImageResult(null);
    setImageModal(true);
    try {
      const analysis = await analyzeImage(asset.base64 || '');
      setImageResult(analysis);
      if (analysis.type === 'injury') {
        const sev = analysis.severity === 'severe' ? 'high' : analysis.severity === 'moderate' ? 'medium' : 'low';
        let msg = `**Image Analysis Result**\n\n**Detected:** ${analysis.injuryType || 'Injury'}\n`;
        if (analysis.warning) msg += `\n**${analysis.warning}**\n`;
        msg += `\n**First Aid Steps:**\n`;
        (analysis.firstAid || []).forEach((s, i) => { msg += `${i + 1}. ${s}\n`; });
        msg += `\n*AI-assisted analysis only. Consult a medical professional.*`;
        addMessage(Object.assign(
          { id: Date.now().toString(), role: 'assistant' as const, content: msg, timestamp: new Date(),
            severity: sev as any, conditions: [analysis.injuryType || 'Injury'],
            suggestedActions: analysis.firstAid || [], affectedAreas: analysis.affectedAreas || [] },
          { confidence: 0.72 }
        ) as ChatMessage);
        if (analysis.affectedAreas?.length) setHighlightedAreas(analysis.affectedAreas);
      }
    } catch { setImageResult({ type: 'unknown' }); }
    finally { setAnalyzing(false); }
  }

  function addMedicineReminder(result: ImageAnalysisResult) {
    if (!result.medicineName) return;
    addReminder({
      id: Date.now().toString(),
      medicineName: result.medicineName,
      dosage: result.dosageSuggestion || '1 tablet',
      frequency: 'Daily',
      timeSlots: ['08:00 AM'],
      status: 'active',
      takenToday: false,
      totalDoses: 14,
      takenDoses: 0,
      startDate: new Date().toISOString().split('T')[0],
      durationDays: 7,
      notificationIds: [],
    });
    addMessage({ id: Date.now().toString(), role: 'assistant', content: `**Medicine Added!**\n\n**${result.medicineName}** — ${result.dosageSuggestion || '1 tablet'} daily at 08:00 AM\n\nCheck the Monitor tab to manage reminders.\n\n*Always follow your doctor's prescribed dosage.*`, timestamp: new Date(), severity: 'low', conditions: [], suggestedActions: [], affectedAreas: [] });
    setImageModal(false); setImageResult(null); setPickedImage(null);
  }

  const hasEmergency = (messages as any[]).some(m => m.isEmergency);
  const isEmpty      = messages.length === 0 && !loadState && !messagesLoading;

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.headerIcon}><Stethoscope size={16} color="#fff" /></View>
          <View>
            <Text style={s.headerTitle}>MedAssist AI</Text>
            <Text style={s.headerSub}>RAG · Medical Knowledge Base</Text>
          </View>
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity style={s.camBtn} onPress={() => setImageModal(true)}>
            <Camera size={18} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
          {messages.length > 0 && (
            <TouchableOpacity onPress={clearMessages} style={s.camBtn}>
              <Trash2 size={18} color="rgba(255,255,255,0.75)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {hasEmergency && <EmergencyBanner />}

        <ScrollView
          ref={scrollRef}
          style={s.scroll}
          contentContainerStyle={isEmpty ? s.emptyContent : s.msgContent}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        >
          {messagesLoading && (
            <View style={s.centerWrap}>
              <ActivityIndicator color={colors.primary} />
              <Text style={s.loadingText}>Loading conversation...</Text>
            </View>
          )}

          {isEmpty && (
            <View style={s.welcome}>
              <View style={s.welcomeIcon}><Stethoscope size={32} color={colors.primary} /></View>
              <Text style={s.welcomeTitle}>MedAssist AI</Text>
              <Text style={s.welcomeSub}>Describe your symptoms or ask a medical question. I'll search through medical literature to provide evidence-based guidance.</Text>
              <View style={s.quickActions}>
                {QUICK_ACTIONS.map(({ id, label, Icon, prompt }) => (
                  <TouchableOpacity key={id} style={s.qaChip} onPress={() => sendMessage(prompt)} activeOpacity={0.8}>
                    <Icon size={14} color={colors.primary} />
                    <Text style={s.qaChipText}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Disclaimer />
            </View>
          )}

          {(messages as (ChatMessage & { confidence?: number; isEmergency?: boolean })[]).map(msg => (
            <MessageBubble key={msg.id} message={msg} onViewBody={areas => { setHighlightedAreas(areas); router.push('/(tabs)/monitor'); }} />
          ))}

          {loadState && <LoadingIndicator state={loadState} />}
        </ScrollView>

        {/* Input bar */}
        <View style={s.inputBar}>
          <View style={s.inputRow}>
            <TextInput
              style={s.input}
              placeholder="Describe your symptoms or ask a medical question..."
              placeholderTextColor={colors.textTertiary}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[s.sendBtn, input.trim().length > 0 && s.sendBtnActive]}
              onPress={() => sendMessage(input)}
              disabled={!input.trim() || loadState !== null}
            >
              <Send size={16} color={input.trim() ? '#fff' : colors.textTertiary} />
            </TouchableOpacity>
          </View>
          <Text style={s.inputNote}>MedAssist AI provides general guidance only. Always consult a healthcare professional.</Text>
        </View>
      </KeyboardAvoidingView>

      {/* Image Modal */}
      <Modal visible={imageModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{!pickedImage ? 'Analyze Image' : analyzing ? 'Analyzing...' : imageResult?.type === 'injury' ? 'Injury Analysis' : 'Medicine Detected'}</Text>
              <TouchableOpacity onPress={() => { setImageModal(false); setPickedImage(null); setImageResult(null); }}>
                <X size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {!pickedImage && (
              <View style={s.pickOptions}>
                <Text style={s.pickSub}>Take or upload a photo of an injury or medicine label</Text>
                <TouchableOpacity style={s.pickBtn} onPress={() => pickImage('camera')}>
                  <Camera size={22} color="#fff" /><Text style={s.pickBtnText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.pickBtn, s.pickBtnAlt]} onPress={() => pickImage('gallery')}>
                  <ImageIcon size={22} color={colors.primary} /><Text style={[s.pickBtnText, { color: colors.primary }]}>Choose from Gallery</Text>
                </TouchableOpacity>
              </View>
            )}

            {pickedImage && (
              <View style={s.previewWrap}>
                <Image source={{ uri: pickedImage }} style={s.preview} resizeMode="cover" />
                {analyzing && (
                  <View style={s.analyzingOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={s.analyzingText}>Analyzing with AI...</Text>
                  </View>
                )}
              </View>
            )}

            {imageResult?.type === 'injury' && !analyzing && (
              <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
                <View style={[s.sevBadge, { backgroundColor: imageResult.severity === 'severe' ? colors.emergencyLight : imageResult.severity === 'moderate' ? colors.warningLight : colors.secondaryLight }]}>
                  <Text style={[s.sevText, { color: imageResult.severity === 'severe' ? colors.emergency : imageResult.severity === 'moderate' ? colors.warning : colors.secondary }]}>{imageResult.severity?.toUpperCase()} · {imageResult.injuryType}</Text>
                </View>
                {imageResult.warning && <View style={s.warnBox}><AlertTriangle size={14} color={colors.emergency} /><Text style={s.warnText}>{imageResult.warning}</Text></View>}
                <Text style={s.firstAidTitle}>First Aid Steps:</Text>
                {(imageResult.firstAid || []).map((step, i) => (
                  <View key={i} style={s.stepRow}>
                    <View style={s.stepNum}><Text style={s.stepNumText}>{i + 1}</Text></View>
                    <Text style={s.stepText}>{step}</Text>
                  </View>
                ))}
                <TouchableOpacity style={s.doneBtn} onPress={() => { setImageModal(false); setPickedImage(null); setImageResult(null); }}>
                  <CheckCircle size={16} color="#fff" /><Text style={s.doneBtnText}>Got it</Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            {imageResult?.type === 'medicine' && !analyzing && (
              <View>
                {imageResult.medicineName ? (
                  <>
                    <View style={s.medRow}><Pill size={22} color={colors.secondary} /><View style={{ flex: 1 }}><Text style={s.medName}>{imageResult.medicineName}</Text><Text style={s.medDose}>{imageResult.dosageSuggestion || '1 tablet'}</Text></View></View>
                    <TouchableOpacity style={s.addBtn} onPress={() => addMedicineReminder(imageResult)}><Pill size={16} color="#fff" /><Text style={s.addBtnText}>Add to Reminders</Text></TouchableOpacity>
                    <TouchableOpacity style={s.skipBtn} onPress={() => { setImageModal(false); setPickedImage(null); setImageResult(null); }}><Text style={s.skipText}>Skip</Text></TouchableOpacity>
                  </>
                ) : (
                  <View style={s.noResult}><Text style={s.noResultText}>Could not read medicine name. Try a clearer photo.</Text><TouchableOpacity style={s.retryBtn} onPress={() => { setPickedImage(null); setImageResult(null); }}><Text style={s.retryText}>Try Again</Text></TouchableOpacity></View>
                )}
              </View>
            )}

            {imageResult?.type === 'unknown' && !analyzing && (
              <View style={s.noResult}><Text style={s.noResultText}>Could not analyze this image. Try a clearer photo.</Text><TouchableOpacity style={s.retryBtn} onPress={() => { setPickedImage(null); setImageResult(null); }}><Text style={s.retryText}>Try Again</Text></TouchableOpacity></View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: colors.background },
  flex:  { flex: 1 },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md, backgroundColor: colors.primary },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerIcon:  { width: 34, height: 34, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontWeight: '700', fontSize: 16 },
  headerSub:   { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  camBtn:      { padding: spacing.sm },

  scroll:      { flex: 1, backgroundColor: colors.background },
  emptyContent:{ flexGrow: 1 },
  msgContent:  { paddingVertical: spacing.base },
  centerWrap:  { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  loadingText: { ...typography.bodySmall, color: colors.textSecondary },

  welcome:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.xxl },
  welcomeIcon: { width: 64, height: 64, borderRadius: 16, backgroundColor: '#F0FDFA', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  welcomeTitle:{ fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  welcomeSub:  { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: spacing.xl },

  quickActions:{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center', marginBottom: spacing.xl },
  qaChip:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.base, paddingVertical: 10, borderRadius: radius.lg, borderWidth: 1, borderColor: '#99F6E4', backgroundColor: colors.surface, ...shadows.sm },
  qaChipText:  { fontSize: 13, fontWeight: '500', color: colors.primary },

  inputBar:    { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: spacing.base, paddingTop: spacing.md, paddingBottom: spacing.base },
  inputRow:    { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  input:       { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20, maxHeight: 100, paddingVertical: spacing.sm },
  sendBtn:     { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.borderLight, alignItems: 'center', justifyContent: 'center' },
  sendBtnActive:{ backgroundColor: colors.primary },
  inputNote:   { textAlign: 'center', fontSize: 11, color: colors.textTertiary, marginTop: spacing.sm },

  modalOverlay:{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalSheet:  { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl, maxHeight: '90%', ...shadows.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.base },
  modalTitle:  { ...typography.h3, color: colors.text },

  pickOptions: { alignItems: 'center', paddingVertical: spacing.base },
  pickSub:     { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
  pickBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, backgroundColor: colors.primary, paddingVertical: spacing.base, paddingHorizontal: spacing.xl, borderRadius: radius.lg, width: '100%', marginBottom: spacing.md },
  pickBtnAlt:  { backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.primary },
  pickBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  previewWrap:     { borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.base, position: 'relative' },
  preview:         { width: '100%', height: 200 },
  analyzingOverlay:{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  analyzingText:   { color: '#fff', fontWeight: '600', fontSize: 14 },

  sevBadge:    { paddingHorizontal: spacing.base, paddingVertical: spacing.sm, borderRadius: radius.md, marginBottom: spacing.base, alignSelf: 'flex-start' },
  sevText:     { fontWeight: '700', fontSize: 13 },
  warnBox:     { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: colors.emergencyLight, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.base },
  warnText:    { flex: 1, color: colors.emergency, fontSize: 13, fontWeight: '600' },
  firstAidTitle:{ ...typography.h4, color: colors.text, marginBottom: spacing.md },
  stepRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.md },
  stepNum:     { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNumText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  stepText:    { flex: 1, ...typography.bodySmall, color: colors.text, lineHeight: 20 },
  doneBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.secondary, paddingVertical: spacing.md, borderRadius: radius.lg, marginTop: spacing.base },
  doneBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  medRow:      { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.secondaryLight, padding: spacing.base, borderRadius: radius.lg, marginBottom: spacing.base },
  medName:     { ...typography.h4, color: colors.text },
  medDose:     { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  addBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.secondary, paddingVertical: spacing.base, borderRadius: radius.lg, marginBottom: spacing.sm },
  addBtnText:  { color: '#fff', fontWeight: '700', fontSize: 15 },
  skipBtn:     { alignItems: 'center', paddingVertical: spacing.md },
  skipText:    { color: colors.textSecondary, fontWeight: '600' },
  noResult:    { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.md },
  noResultText:{ ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  retryBtn:    { backgroundColor: colors.primaryLight, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.lg },
  retryText:   { color: colors.primary, fontWeight: '700' },
});
