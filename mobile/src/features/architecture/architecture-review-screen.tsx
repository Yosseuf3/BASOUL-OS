import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Screen } from "../../components/Screen";
import { tokens } from "../../theme/tokens";
import type { ArchitecturalFinding, MobileWorkspaceData } from "../../types/domain";

export function ArchitectureReviewScreen({
  data,
  onBack,
  onConvertFinding,
  convertingFindingId,
}: {
  data: MobileWorkspaceData;
  onBack: () => void;
  onConvertFinding: (finding: ArchitecturalFinding, projectId: string) => void;
  convertingFindingId: string;
}) {
  const projectNames = new Map(data.projects.map((project) => [project.id, project.name]));
  const drawingNames = new Map(data.drawings.map((drawing) => [drawing.id, `${drawing.name} · ${drawing.revision}`]));
  const openFindings = data.reviews.flatMap((review) =>
    review.architectural_review_findings
      .filter((finding) => finding.status !== "converted_to_task")
      .map((finding) => ({ finding, projectId: review.project_id })),
  );

  return (
    <Screen>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.back}><Text style={styles.backText}>عودة</Text></TouchableOpacity>
        <View><Text style={styles.kicker}>YAI · MOBILE REVIEW</Text><Text selectable style={styles.title}>الذكاء المعماري</Text></View>
      </View>

      <View style={styles.metrics}>
        <Metric value={String(data.drawings.length)} label="مخططات" />
        <Metric value={String(data.reviews.length)} label="جلسات مراجعة" />
        <Metric value={String(openFindings.length)} label="ملاحظات مفتوحة" />
      </View>

      <Text style={styles.sectionTitle}>آخر جلسات المراجعة</Text>
      {data.reviews.length === 0 ? (
        <View style={styles.empty}><Text selectable style={styles.emptyTitle}>لا توجد جلسات مراجعة بعد</Text><Text selectable style={styles.emptyText}>ارفع مخططًا من نسخة الويب لبدء أول مراجعة هندسية.</Text></View>
      ) : data.reviews.map((review) => (
        <View key={review.id} style={styles.reviewCard}>
          <View style={styles.reviewTop}>
            <View><Text selectable style={styles.health}>{review.plan_health}%</Text><Text style={styles.healthLabel}>صحة المخطط</Text></View>
            <View style={styles.reviewInfo}>
              <Text selectable style={styles.reviewTitle}>{projectNames.get(review.project_id) || "مشروع"}</Text>
              <Text selectable style={styles.meta}>{drawingNames.get(review.drawing_id) || "مخطط محفوظ"}</Text>
            </View>
          </View>
          <View style={styles.findings}>
            {review.architectural_review_findings.map((finding) => (
              <View key={finding.id} style={[styles.finding, finding.severity === "critical" && styles.critical]}>
                <View style={styles.findingTop}><Text style={styles.confidence}>{finding.confidence_score}% ثقة</Text><Text selectable style={styles.findingTitle}>{finding.title}</Text></View>
                <Text selectable style={styles.findingDescription}>{finding.description}</Text>
                <Text selectable style={styles.recommendation}>التوصية: {finding.recommendation}</Text>
                <TouchableOpacity
                  style={[styles.taskButton, finding.status === "converted_to_task" && styles.taskButtonDone]}
                  disabled={finding.status === "converted_to_task" || convertingFindingId === finding.id}
                  onPress={() => onConvertFinding(finding, review.project_id)}
                >
                  <Text style={styles.taskButtonText}>
                    {finding.status === "converted_to_task" ? "تم إنشاء المهمة" : convertingFindingId === finding.id ? "جارٍ الإنشاء…" : "تحويل إلى مهمة"}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      ))}
    </Screen>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return <View style={styles.metric}><Text selectable style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginTop: tokens.space.md },
  back: { borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, paddingHorizontal: 14, paddingVertical: 9 },
  backText: { color: tokens.colors.gold, fontWeight: "800" },
  kicker: { color: tokens.colors.gold, fontSize: 10, fontWeight: "900", textAlign: "right" },
  title: { color: tokens.colors.text, fontSize: 30, fontWeight: "900", textAlign: "right", marginTop: 5 },
  metrics: { flexDirection: "row", gap: 8, marginTop: tokens.space.lg },
  metric: { flex: 1, backgroundColor: tokens.colors.surface, borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, padding: 12 },
  metricValue: { color: tokens.colors.gold, fontSize: 21, fontWeight: "900", textAlign: "right", fontVariant: ["tabular-nums"] },
  metricLabel: { color: tokens.colors.muted, fontSize: 10, textAlign: "right", marginTop: 3 },
  sectionTitle: { color: tokens.colors.text, fontSize: 20, fontWeight: "900", textAlign: "right", marginTop: tokens.space.xl, marginBottom: tokens.space.md },
  empty: { backgroundColor: tokens.colors.surface, borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.lg, padding: tokens.space.lg },
  emptyTitle: { color: tokens.colors.text, fontSize: 17, fontWeight: "900", textAlign: "right" },
  emptyText: { color: tokens.colors.muted, lineHeight: 22, textAlign: "right", marginTop: 6 },
  reviewCard: { backgroundColor: tokens.colors.surface, borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.lg, padding: tokens.space.md, marginBottom: tokens.space.md },
  reviewTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  reviewInfo: { flex: 1, marginLeft: 12 },
  health: { color: tokens.colors.success, fontSize: 27, fontWeight: "900", fontVariant: ["tabular-nums"] },
  healthLabel: { color: tokens.colors.muted, fontSize: 10 },
  reviewTitle: { color: tokens.colors.text, fontSize: 18, fontWeight: "900", textAlign: "right" },
  meta: { color: tokens.colors.muted, fontSize: 11, textAlign: "right", marginTop: 4 },
  findings: { gap: 9, marginTop: tokens.space.md },
  finding: { backgroundColor: tokens.colors.background, borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, padding: 13 },
  critical: { borderColor: "#8d4444" },
  findingTop: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  confidence: { color: tokens.colors.gold, fontSize: 10, fontVariant: ["tabular-nums"] },
  findingTitle: { color: tokens.colors.text, flex: 1, fontWeight: "900", textAlign: "right" },
  findingDescription: { color: tokens.colors.muted, lineHeight: 20, textAlign: "right", marginTop: 7 },
  recommendation: { color: tokens.colors.text, lineHeight: 20, textAlign: "right", marginTop: 7 },
  taskButton: { alignSelf: "flex-end", borderWidth: 1, borderColor: tokens.colors.gold, borderRadius: tokens.radius.sm, paddingHorizontal: 12, paddingVertical: 9, marginTop: 10 },
  taskButtonDone: { borderColor: tokens.colors.success, opacity: .7 },
  taskButtonText: { color: tokens.colors.gold, fontWeight: "900", fontSize: 11 },
});
