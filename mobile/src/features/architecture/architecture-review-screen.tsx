import { useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Screen } from "../../components/Screen";
import { tokens } from "../../theme/tokens";
import type { ArchitecturalFinding, MobileWorkspaceData } from "../../types/domain";
import type { MobileFindingDecision } from "../../services/workspace";

export function ArchitectureReviewScreen({
  data,
  onBack,
  onConvertFinding,
  convertingFindingId,
  onDecideFinding,
  decidingFindingId,
  onUploadDrawing,
  uploadingDrawing,
}: {
  data: MobileWorkspaceData;
  onBack: () => void;
  onConvertFinding: (finding: ArchitecturalFinding, projectId: string) => void;
  convertingFindingId: string;
  onDecideFinding: (finding: ArchitecturalFinding, status: MobileFindingDecision) => void;
  decidingFindingId: string;
  onUploadDrawing: (input: { projectId: string; revision: string; uri: string; name: string; mimeType: string; size: number }) => Promise<void>;
  uploadingDrawing: boolean;
}) {
  const [projectId, setProjectId] = useState(data.projects[0]?.id ?? "");
  const [revision, setRevision] = useState("A");
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [message, setMessage] = useState("");
  const projectNames = new Map(data.projects.map((project) => [project.id, project.name]));
  const drawingNames = new Map(data.drawings.map((drawing) => [drawing.id, `${drawing.name} · ${drawing.revision}`]));
  const openFindings = data.reviews.flatMap((review) =>
    review.architectural_review_findings
      .filter((finding) => finding.status === "open" || finding.status === "accepted")
      .map((finding) => ({ finding, projectId: review.project_id })),
  );
  const acceptedCount = data.reviews.reduce(
    (total, review) => total + review.architectural_review_findings.filter((finding) => finding.status === "accepted").length,
    0,
  );
  const completedCount = data.reviews.reduce(
    (total, review) => total + review.architectural_review_findings.filter((finding) => ["rejected", "resolved", "converted_to_task"].includes(finding.status)).length,
    0,
  );

  async function chooseDrawing() {
    setMessage("");
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/png", "image/jpeg", "image/webp"],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (!result.canceled) setSelectedFile(result.assets[0]);
  }

  async function uploadDrawing() {
    if (!projectId || !selectedFile) {
      setMessage("اختر المشروع والملف أولًا.");
      return;
    }
    try {
      await onUploadDrawing({
        projectId,
        revision,
        uri: selectedFile.uri,
        name: selectedFile.name,
        mimeType: selectedFile.mimeType || "application/octet-stream",
        size: selectedFile.size || 0,
      });
      setSelectedFile(null);
      setMessage("تم رفع المخطط وتحليله وإنشاء جلسة مراجعة.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "تعذر رفع المخطط.");
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.back}><Text style={styles.backText}>رجوع</Text></TouchableOpacity>
        <View><Text style={styles.kicker}>YAI · MOBILE REVIEW</Text><Text selectable style={styles.title}>المراجعة المعمارية</Text></View>
      </View>

      <View style={styles.metrics}>
        <Metric value={String(openFindings.length)} label="تحتاج قرارًا" />
        <Metric value={String(acceptedCount)} label="معتمدة" />
        <Metric value={String(completedCount)} label="مغلقة" />
      </View>

      <View style={styles.uploadCard}>
        <Text selectable style={styles.sectionTitleInline}>رفع مخطط للمراجعة</Text>
        <Text selectable style={styles.uploadHint}>PDF أو PNG أو JPG أو WebP، بحد أقصى 50 MB.</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.projectChoices}>
          {data.projects.map((project) => (
            <TouchableOpacity
              key={project.id}
              onPress={() => setProjectId(project.id)}
              style={[styles.projectChoice, projectId === project.id && styles.projectChoiceActive]}
            >
              <Text selectable style={[styles.projectChoiceText, projectId === project.id && styles.projectChoiceTextActive]}>{project.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.uploadRow}>
          <TextInput
            value={revision}
            onChangeText={setRevision}
            maxLength={12}
            placeholder="الإصدار A"
            placeholderTextColor={tokens.colors.muted}
            style={styles.revisionInput}
            textAlign="right"
          />
          <TouchableOpacity style={styles.fileButton} onPress={() => void chooseDrawing()}>
            <Text style={styles.fileButtonText}>{selectedFile ? "تغيير الملف" : "اختيار ملف"}</Text>
          </TouchableOpacity>
        </View>
        {selectedFile ? <Text selectable style={styles.fileName}>{selectedFile.name}</Text> : null}
        <TouchableOpacity
          style={[styles.uploadButton, (!projectId || !selectedFile || uploadingDrawing) && styles.uploadButtonDisabled]}
          disabled={!projectId || !selectedFile || uploadingDrawing}
          onPress={() => void uploadDrawing()}
        >
          <Text style={styles.uploadButtonText}>{uploadingDrawing ? "جارٍ الرفع والتحليل" : "رفع وتحليل المخطط"}</Text>
        </TouchableOpacity>
        {message ? <Text selectable style={styles.uploadMessage}>{message}</Text> : null}
      </View>

      <Text style={styles.sectionTitle}>سجل جلسات المراجعة</Text>
      {data.reviews.length === 0 ? (
        <View style={styles.empty}><Text selectable style={styles.emptyTitle}>لا توجد جلسة مراجعة بعد</Text><Text selectable style={styles.emptyText}>ارفع مخططًا من مشروع نشط لبدء التحليل المعماري.</Text></View>
      ) : data.reviews.map((review) => (
        <View key={review.id} style={styles.reviewCard}>
          <View style={styles.reviewTop}>
            <View><Text selectable style={styles.health}>{review.plan_health}%</Text><Text style={styles.healthLabel}>صحة المخطط</Text></View>
            <View style={styles.reviewInfo}>
              <Text selectable style={styles.reviewTitle}>{projectNames.get(review.project_id) || "مشروع"}</Text>
              <Text selectable style={styles.meta}>{drawingNames.get(review.drawing_id) || "مخطط معماري"}</Text>
            </View>
          </View>
          <View style={styles.findings}>
            {review.architectural_review_findings.map((finding) => (
              <View key={finding.id} style={[styles.finding, finding.severity === "critical" && styles.critical]}>
                <View style={styles.findingTop}><Text style={styles.confidence}>{finding.confidence_score}% ثقة</Text><Text selectable style={styles.findingTitle}>{finding.title}</Text></View>
                <Text selectable style={styles.findingDescription}>{finding.description}</Text>
                <Text selectable style={styles.recommendation}>التوصية: {finding.recommendation}</Text>
                {finding.evidence?.length ? <Text selectable style={styles.evidence}>الأدلة: {finding.evidence.map((item) => `${item.observation}${item.value == null ? "" : ` (${String(item.value)})`}`).join(" · ")}</Text> : null}
                <Text selectable style={styles.statusLabel}>الحالة: {statusLabels[finding.status]}</Text>
                {finding.status === "open" ? <View style={styles.decisionRow}>
                  <TouchableOpacity disabled={decidingFindingId === finding.id} style={[styles.decisionButton, styles.acceptButton]} onPress={() => onDecideFinding(finding, "accepted")}><Text style={styles.decisionText}>اعتماد</Text></TouchableOpacity>
                  <TouchableOpacity disabled={decidingFindingId === finding.id} style={styles.decisionButton} onPress={() => onDecideFinding(finding, "rejected")}><Text style={styles.decisionText}>رفض</Text></TouchableOpacity>
                </View> : null}
                {finding.status === "accepted" ? <View style={styles.decisionRow}>
                  <TouchableOpacity disabled={decidingFindingId === finding.id} style={[styles.decisionButton, styles.resolveButton]} onPress={() => onDecideFinding(finding, "resolved")}><Text style={styles.decisionText}>تمت المعالجة</Text></TouchableOpacity>
                </View> : null}
                <TouchableOpacity
                  style={[styles.taskButton, finding.status === "converted_to_task" && styles.taskButtonDone]}
                  disabled={finding.status !== "accepted" || convertingFindingId === finding.id}
                  onPress={() => onConvertFinding(finding, review.project_id)}
                >
                  <Text style={styles.taskButtonText}>
                    {finding.status === "converted_to_task" ? "تم إنشاء مهمة" : convertingFindingId === finding.id ? "جارٍ الإنشاء" : "تحويل إلى مهمة"}
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

const statusLabels: Record<ArchitecturalFinding["status"], string> = {
  open: "بانتظار القرار",
  accepted: "معتمدة",
  rejected: "مرفوضة",
  resolved: "تمت المعالجة",
  converted_to_task: "تحولت إلى مهمة",
};

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
  uploadCard: { backgroundColor: tokens.colors.surface, borderWidth: 1, borderColor: tokens.colors.gold, borderRadius: tokens.radius.lg, padding: tokens.space.md, marginTop: tokens.space.lg, gap: 10 },
  sectionTitleInline: { color: tokens.colors.text, fontSize: 19, fontWeight: "900", textAlign: "right" },
  uploadHint: { color: tokens.colors.muted, fontSize: 12, textAlign: "right" },
  projectChoices: { flexDirection: "row-reverse", gap: 8 },
  projectChoice: { borderWidth: 1, borderColor: tokens.colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  projectChoiceActive: { borderColor: tokens.colors.gold, backgroundColor: "#2d2717" },
  projectChoiceText: { color: tokens.colors.muted, fontSize: 11, fontWeight: "700" },
  projectChoiceTextActive: { color: tokens.colors.gold },
  uploadRow: { flexDirection: "row", gap: 8 },
  revisionInput: { width: 100, borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, color: tokens.colors.text, paddingHorizontal: 12, paddingVertical: 10 },
  fileButton: { flex: 1, borderWidth: 1, borderColor: tokens.colors.gold, borderRadius: tokens.radius.md, alignItems: "center", justifyContent: "center", paddingVertical: 11 },
  fileButtonText: { color: tokens.colors.gold, fontWeight: "900" },
  fileName: { color: tokens.colors.text, fontSize: 12, textAlign: "right" },
  uploadButton: { backgroundColor: tokens.colors.gold, borderRadius: tokens.radius.md, alignItems: "center", paddingVertical: 13 },
  uploadButtonDisabled: { opacity: .45 },
  uploadButtonText: { color: tokens.colors.background, fontWeight: "900" },
  uploadMessage: { color: tokens.colors.success, lineHeight: 20, textAlign: "right" },
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
  evidence: { color: tokens.colors.gold, fontSize: 11, lineHeight: 18, textAlign: "right", marginTop: 7 },
  statusLabel: { color: tokens.colors.muted, fontSize: 10, textAlign: "right", marginTop: 8 },
  decisionRow: { flexDirection: "row-reverse", gap: 8, marginTop: 10 },
  decisionButton: { borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.sm, paddingHorizontal: 12, paddingVertical: 8 },
  acceptButton: { borderColor: tokens.colors.success },
  resolveButton: { borderColor: tokens.colors.gold },
  decisionText: { color: tokens.colors.text, fontWeight: "800", fontSize: 11 },
  taskButton: { alignSelf: "flex-end", borderWidth: 1, borderColor: tokens.colors.gold, borderRadius: tokens.radius.sm, paddingHorizontal: 12, paddingVertical: 9, marginTop: 10 },
  taskButtonDone: { borderColor: tokens.colors.success, opacity: .7 },
  taskButtonText: { color: tokens.colors.gold, fontWeight: "900", fontSize: 11 },
});
