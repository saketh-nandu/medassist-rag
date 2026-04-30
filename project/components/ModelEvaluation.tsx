import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { 
  BarChart3, Brain, Database, Zap, Target, 
  TrendingUp, Award, Clock, Cpu, CheckCircle 
} from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { radius, shadows, spacing, typography } from '@/constants/theme';

interface ModelMetrics {
  total_chunks: number;
  total_knowledge_entries: number;
  embedding_model: string;
  generation_model: string;
  vector_dimensions: number;
  last_updated: string;
}

interface EvaluationResult {
  overall_score: number;
  retrieval_metrics: {
    average_score: number;
    grade: string;
  };
  generation_metrics: {
    average_score: number;
    grade: string;
  };
  efficiency_metrics: {
    average_score: number;
    grade: string;
    avg_response_time: number;
  };
  category_performance: Record<string, {
    average_score: number;
    grade: string;
    query_count: number;
  }>;
  dataset_metrics: {
    total_chunks: number;
    source_distribution: Record<string, number>;
    category_distribution: Record<string, number>;
  };
  detailed_results: Array<{
    query: string;
    category: string;
    overall_score: number;
    retrieval_score: number;
    generation_score: number;
    efficiency_score: number;
  }>;
}

export default function ModelEvaluation() {
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.EXPO_PUBLIC_RAG_API_URL}/api/model/metrics`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Model evaluation endpoints not yet deployed`);
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setMetrics(data.metrics);
      }
    } catch (error) {
      console.error('Failed to load model metrics:', error);
      
      // Show user-friendly message for deployment in progress
      if (error.message.includes('404') || error.message.includes('not yet deployed')) {
        Alert.alert(
          'Model Evaluation Deploying', 
          'The model evaluation system is currently being deployed to the server. Please try again in 5-10 minutes.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to load model metrics. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const runEvaluation = async () => {
    try {
      setEvaluating(true);
      Alert.alert(
        'Model Evaluation', 
        'This will test the RAG model with 20+ queries and may take 2-3 minutes. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Start Evaluation', 
            onPress: async () => {
              try {
                const response = await fetch(`${process.env.EXPO_PUBLIC_RAG_API_URL}/api/model/evaluate`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' }
                });
                
                if (!response.ok) {
                  throw new Error(`HTTP ${response.status}: Model evaluation endpoints not yet deployed`);
                }
                
                const data = await response.json();
                
                if (data.status === 'success') {
                  setEvaluation(data.evaluation);
                  Alert.alert('Success', 'Model evaluation completed!');
                } else {
                  Alert.alert('Error', data.message || 'Evaluation failed');
                }
              } catch (evalError) {
                console.error('Evaluation error:', evalError);
                if (evalError.message.includes('404') || evalError.message.includes('not yet deployed')) {
                  Alert.alert(
                    'Model Evaluation Deploying', 
                    'The model evaluation system is currently being deployed. Please try again in 5-10 minutes.'
                  );
                } else {
                  Alert.alert('Error', 'Failed to run model evaluation. Please try again.');
                }
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Failed to run evaluation:', error);
      Alert.alert('Error', 'Failed to run model evaluation');
    } finally {
      setEvaluating(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMetrics();
    setRefreshing(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return '#10B981'; // Green
    if (score >= 0.6) return '#F59E0B'; // Orange
    return '#EF4444'; // Red
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return '#10B981';
    if (grade.startsWith('B')) return '#3B82F6';
    if (grade.startsWith('C')) return '#F59E0B';
    return '#EF4444';
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading model metrics...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Brain size={24} color="#fff" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>RAG Model Performance</Text>
          <Text style={styles.headerSubtitle}>Comprehensive evaluation metrics</Text>
        </View>
      </View>

      {/* Model Information */}
      {metrics && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🤖 Model Information</Text>
          <View style={styles.card}>
            <View style={styles.metricRow}>
              <Database size={16} color={colors.textSecondary} />
              <Text style={styles.metricLabel}>Knowledge Base:</Text>
              <Text style={styles.metricValue}>{metrics.total_chunks.toLocaleString()} chunks</Text>
            </View>
            <View style={styles.metricRow}>
              <Cpu size={16} color={colors.textSecondary} />
              <Text style={styles.metricLabel}>Embedding Model:</Text>
              <Text style={styles.metricValue}>{metrics.embedding_model}</Text>
            </View>
            <View style={styles.metricRow}>
              <Brain size={16} color={colors.textSecondary} />
              <Text style={styles.metricLabel}>Generation Model:</Text>
              <Text style={styles.metricValue}>{metrics.generation_model}</Text>
            </View>
            <View style={styles.metricRow}>
              <BarChart3 size={16} color={colors.textSecondary} />
              <Text style={styles.metricLabel}>Vector Dimensions:</Text>
              <Text style={styles.metricValue}>{metrics.vector_dimensions}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Evaluation Controls */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Performance Evaluation</Text>
        <TouchableOpacity 
          style={[styles.evaluateButton, evaluating && styles.evaluateButtonDisabled]}
          onPress={runEvaluation}
          disabled={evaluating}
        >
          {evaluating ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.evaluateButtonText}>Evaluating Model...</Text>
            </>
          ) : (
            <>
              <Target size={20} color="#fff" />
              <Text style={styles.evaluateButtonText}>Run Full Evaluation</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Evaluation Results */}
      {evaluation && (
        <>
          {/* Overall Performance */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 Overall Performance</Text>
            <View style={styles.card}>
              <View style={styles.overallScore}>
                <Text style={styles.overallScoreLabel}>Overall Model Score</Text>
                <Text style={[styles.overallScoreValue, { color: getScoreColor(evaluation.overall_score) }]}>
                  {(evaluation.overall_score * 100).toFixed(1)}%
                </Text>
                <Text style={[styles.overallGrade, { color: getScoreColor(evaluation.overall_score) }]}>
                  Grade: {evaluation.retrieval_metrics.grade}
                </Text>
              </View>
            </View>
          </View>

          {/* Component Scores */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📈 Component Performance</Text>
            <View style={styles.card}>
              <View style={styles.componentScore}>
                <View style={styles.componentHeader}>
                  <Target size={16} color={colors.primary} />
                  <Text style={styles.componentLabel}>Retrieval Quality</Text>
                  <Text style={[styles.componentGrade, { color: getGradeColor(evaluation.retrieval_metrics.grade) }]}>
                    {evaluation.retrieval_metrics.grade}
                  </Text>
                </View>
                <View style={styles.scoreBar}>
                  <View style={[styles.scoreBarFill, { 
                    width: `${evaluation.retrieval_metrics.average_score * 100}%`,
                    backgroundColor: getScoreColor(evaluation.retrieval_metrics.average_score)
                  }]} />
                </View>
                <Text style={styles.scoreValue}>
                  {(evaluation.retrieval_metrics.average_score * 100).toFixed(1)}%
                </Text>
              </View>

              <View style={styles.componentScore}>
                <View style={styles.componentHeader}>
                  <Brain size={16} color={colors.primary} />
                  <Text style={styles.componentLabel}>Generation Quality</Text>
                  <Text style={[styles.componentGrade, { color: getGradeColor(evaluation.generation_metrics.grade) }]}>
                    {evaluation.generation_metrics.grade}
                  </Text>
                </View>
                <View style={styles.scoreBar}>
                  <View style={[styles.scoreBarFill, { 
                    width: `${evaluation.generation_metrics.average_score * 100}%`,
                    backgroundColor: getScoreColor(evaluation.generation_metrics.average_score)
                  }]} />
                </View>
                <Text style={styles.scoreValue}>
                  {(evaluation.generation_metrics.average_score * 100).toFixed(1)}%
                </Text>
              </View>

              <View style={styles.componentScore}>
                <View style={styles.componentHeader}>
                  <Zap size={16} color={colors.primary} />
                  <Text style={styles.componentLabel}>System Efficiency</Text>
                  <Text style={[styles.componentGrade, { color: getGradeColor(evaluation.efficiency_metrics.grade) }]}>
                    {evaluation.efficiency_metrics.grade}
                  </Text>
                </View>
                <View style={styles.scoreBar}>
                  <View style={[styles.scoreBarFill, { 
                    width: `${evaluation.efficiency_metrics.average_score * 100}%`,
                    backgroundColor: getScoreColor(evaluation.efficiency_metrics.average_score)
                  }]} />
                </View>
                <Text style={styles.scoreValue}>
                  {(evaluation.efficiency_metrics.average_score * 100).toFixed(1)}%
                </Text>
              </View>
            </View>
          </View>

          {/* Category Performance */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Performance by Category</Text>
            <View style={styles.card}>
              {Object.entries(evaluation.category_performance).map(([category, metrics]) => (
                <View key={category} style={styles.categoryRow}>
                  <Text style={styles.categoryName}>{category.replace('_', ' ')}</Text>
                  <View style={styles.categoryMetrics}>
                    <Text style={[styles.categoryGrade, { color: getGradeColor(metrics.grade) }]}>
                      {metrics.grade}
                    </Text>
                    <Text style={styles.categoryScore}>
                      {(metrics.average_score * 100).toFixed(0)}%
                    </Text>
                    <Text style={styles.categoryCount}>
                      ({metrics.query_count} queries)
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Dataset Utilization */}
          {evaluation.dataset_metrics && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📚 Dataset Utilization</Text>
              <View style={styles.card}>
                <Text style={styles.datasetStat}>
                  Total Chunks: {evaluation.dataset_metrics.total_chunks.toLocaleString()}
                </Text>
                <Text style={styles.subsectionTitle}>Sources:</Text>
                {Object.entries(evaluation.dataset_metrics.source_distribution).map(([source, count]) => (
                  <View key={source} style={styles.distributionRow}>
                    <Text style={styles.distributionLabel}>{source}:</Text>
                    <Text style={styles.distributionValue}>{count.toLocaleString()}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Top Performing Queries */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏅 Top Performing Queries</Text>
            <View style={styles.card}>
              {evaluation.detailed_results
                .filter(r => !r.error)
                .sort((a, b) => b.overall_score - a.overall_score)
                .slice(0, 5)
                .map((result, i) => (
                  <View key={i} style={styles.queryResult}>
                    <View style={styles.queryRank}>
                      <Text style={styles.queryRankText}>#{i + 1}</Text>
                    </View>
                    <View style={styles.queryInfo}>
                      <Text style={styles.queryText}>{result.query}</Text>
                      <Text style={styles.queryCategory}>{result.category}</Text>
                    </View>
                    <Text style={[styles.queryScore, { color: getScoreColor(result.overall_score) }]}>
                      {(result.overall_score * 100).toFixed(0)}%
                    </Text>
                  </View>
                ))}
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.base,
    backgroundColor: colors.primary,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h2,
    color: '#fff',
  },
  headerSubtitle: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.8)',
  },
  section: {
    margin: spacing.base,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    ...shadows.sm,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  metricLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
  },
  metricValue: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  evaluateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: radius.lg,
    ...shadows.sm,
  },
  evaluateButtonDisabled: {
    backgroundColor: colors.textSecondary,
  },
  evaluateButtonText: {
    ...typography.body,
    color: '#fff',
    fontWeight: '600',
  },
  overallScore: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  overallScoreLabel: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  overallScoreValue: {
    ...typography.h1,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  overallGrade: {
    ...typography.body,
    fontWeight: '600',
  },
  componentScore: {
    marginBottom: spacing.md,
  },
  componentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  componentLabel: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  componentGrade: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
  scoreBar: {
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  scoreValue: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  categoryName: {
    ...typography.body,
    color: colors.text,
    textTransform: 'capitalize',
    flex: 1,
  },
  categoryMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryGrade: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
  categoryScore: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  categoryCount: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  datasetStat: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  subsectionTitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  distributionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  distributionLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  distributionValue: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  queryResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  queryRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queryRankText: {
    ...typography.bodySmall,
    color: '#fff',
    fontWeight: '700',
  },
  queryInfo: {
    flex: 1,
  },
  queryText: {
    ...typography.bodySmall,
    color: colors.text,
  },
  queryCategory: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  queryScore: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
});