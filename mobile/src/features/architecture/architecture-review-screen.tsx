import { useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Screen } from "../../components/Screen";
import { nativeDarkTheme as tokens } from "@yosseuf/ui-tokens/native";
import type { ArchitecturalFinding, ArchitecturalPlanElement, ArchitecturalReviewComment, MobileWorkspaceData } from "../../types/domain";
import type { MobileDrawingAnalysisResult, MobileFindingDecision } from "../../services/workspace";

export function ArchitectureReviewScreen({
  data,
  onBack,
  onConvertFinding,
  convertingFindingId,
  onDecideFinding,
  decidingFindingId,
  onDecidePlanElement,
  updatingPlanElementId,
  onUpdateReviewComment,
  updatingReviewCommentId,
  onUploadDrawing,
  uploadingDrawing,
  onRetryDrawing,
  retryingDrawingId,
}: {
  data: MobileWorkspaceData;
  onBack: () => void;
  onConvertFinding: (finding: ArchitecturalFinding, projectId: string) => void;
  convertingFindingId: string;
  onDecideFinding: (finding: ArchitecturalFinding, status: MobileFindingDecision) => void;
  decidingFindingId: string;
  onDecidePlanElement: (elementId: string, status: "confirmed" | "rejected") => void;
  updatingPlanElementId: string;
  onUpdateReviewComment: (comment: ArchitecturalReviewComment, status: ArchitecturalReviewComment["status"]) => void;
  updatingReviewCommentId: string;
  onUploadDrawing: (input: { projectId: string; revision: string; uri: string; name: string; mimeType: string; size: number }) => Promise<MobileDrawingAnalysisResult>;
  uploadingDrawing: boolean;
  onRetryDrawing: (drawingId: string) => Promise<MobileDrawingAnalysisResult>;
  retryingDrawingId: string;
}) {
  const [projectId, setProjectId] = useState(data.projects[0]?.id ?? "");
  const [revision, setRevision] = useState("A");
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [message, setMessage] = useState("");
  const [elementFilter, setElementFilter] = useState<ArchitecturalPlanElement["element_type"] | "all">("all");
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
  const visiblePlanElements = data.planElements.filter((element) => elementFilter === "all" || element.element_type === elementFilter);
  const confirmedElementCount = data.planElements.filter((element) => element.status === "confirmed" || element.status === "corrected").length;
  const visibleReviewComments = data.reviewComments.filter((comment) => !projectId || comment.project_id === projectId);

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
      setMessage("Ø§Ø®ØªØ± Ø§Ù„Ù…Ø´Ø±ÙˆØ¹ ÙˆØ§Ù„Ù…Ù„Ù Ø£ÙˆÙ„Ù‹Ø§.");
      return;
    }
    try {
      const result = await onUploadDrawing({
        projectId,
        revision,
        uri: selectedFile.uri,
        name: selectedFile.name,
        mimeType: selectedFile.mimeType || "application/octet-stream",
        size: selectedFile.size || 0,
      });
      setSelectedFile(null);
      setMessage(result.analysisStatus === "completed"
        ? `تم تحليل المخطط بصريًا واستخراج ${result.detectedElements} عنصرًا للمراجعة.`
        : result.failureCode === "quota_exceeded"
          ? "ØªÙ… Ø­ÙØ¸ Ø§Ù„Ù…Ø®Ø·Ø·. ÙØ¹Ù‘Ù„ Ø±ØµÙŠØ¯ OpenAI API Ø«Ù… Ø£Ø¹Ø¯ Ø§Ù„ØªØ­Ù„ÙŠÙ„ Ø¯ÙˆÙ† Ø±ÙØ¹ Ø§Ù„Ù…Ù„Ù Ù…Ø±Ø© Ø£Ø®Ø±Ù‰."
          : "ØªÙ… Ø­ÙØ¸ Ø§Ù„Ù…Ø®Ø·Ø·ØŒ Ù„ÙƒÙ† Ù„Ù… ØªÙÙƒØªØ´Ù Ø¹Ù†Ø§ØµØ± Ù…ÙˆØ«ÙˆÙ‚Ø©. Ø§Ø³ØªØ®Ø¯Ù… Ù…Ù„ÙÙ‹Ø§ Ø£ÙˆØ¶Ø­ Ø£Ùˆ PDF Ù…ØªØ¬Ù‡ÙŠÙ‹Ø§.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "ØªØ¹Ø°Ø± Ø±ÙØ¹ Ø§Ù„Ù…Ø®Ø·Ø·.");
    }
  }

  async function retryDrawing(drawingId: string) {
    setMessage("");
    try {
      const result = await onRetryDrawing(drawingId);
      setMessage(result.analysisStatus === "completed"
        ? `Ø§ÙƒØªÙ…Ù„ Ø§Ù„ØªØ­Ù„ÙŠÙ„ ÙˆØ§ÙƒØªÙØ´Ù ${result.detectedElements} Ø¹Ù†ØµØ±Ù‹Ø§ Ù„Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©.`
        : result.failureCode === "quota_exceeded"
          ? "Ø±ØµÙŠØ¯ OpenAI API ØºÙŠØ± Ù…ØªØ§Ø­ Ø¨Ø¹Ø¯. ÙŠÙ…ÙƒÙ†Ùƒ Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø© Ù„Ø§Ø­Ù‚Ù‹Ø§ Ø¯ÙˆÙ† Ø±ÙØ¹ Ø§Ù„Ù…Ù„Ù."
          : "Ø§ÙƒØªÙ…Ù„Øª Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø©ØŒ Ù„ÙƒÙ† Ù„Ù… ØªÙÙƒØªØ´Ù Ø¹Ù†Ø§ØµØ± Ù…ÙˆØ«ÙˆÙ‚Ø©.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "تعذرت إعادة تحليل المخطط.");
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
        <Text selectable style={styles.sectionTitleInline}>Ø±ÙØ¹ Ù…Ø®Ø·Ø· Ù„Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©</Text>
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
            <Text style={styles.fileButtonText}>{selectedFile ? "ØªØºÙŠÙŠØ± Ø§Ù„Ù…Ù„Ù" : "Ø§Ø®ØªÙŠØ§Ø± Ù…Ù„Ù"}</Text>
          </TouchableOpacity>
        </View>
        {selectedFile ? <Text selectable style={styles.fileName}>{selectedFile.name}</Text> : null}
        <TouchableOpacity
          style={[styles.uploadButton, (!projectId || !selectedFile || uploadingDrawing) && styles.uploadButtonDisabled]}
          disabled={!projectId || !selectedFile || uploadingDrawing}
          onPress={() => void uploadDrawing()}
        >
          <Text style={styles.uploadButtonText}>{uploadingDrawing ? "Ø¬Ø§Ø±Ù Ø§Ù„Ø±ÙØ¹ ÙˆØ§Ù„ØªØ­Ù„ÙŠÙ„" : "Ø±ÙØ¹ ÙˆØªØ­Ù„ÙŠÙ„ Ø§Ù„Ù…Ø®Ø·Ø·"}</Text>
        </TouchableOpacity>
        {message ? <Text selectable style={styles.uploadMessage}>{message}</Text> : null}
      </View>

      <Text style={styles.sectionTitle}>Ø§Ù„Ù…Ø®Ø·Ø·Ø§Øª Ø§Ù„Ù…Ø­ÙÙˆØ¸Ø©</Text>
      {data.drawings.length === 0 ? (
        <View style={styles.empty}><Text selectable style={styles.emptyTitle}>Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ø®Ø·Ø·Ø§Øª Ù…Ø­ÙÙˆØ¸Ø©</Text><Text selectable style={styles.emptyText}>Ø§Ø±ÙØ¹ Ø£ÙˆÙ„ Ù…Ø®Ø·Ø· Ù„ØªØ´ØºÙŠÙ„ Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„Ù…Ø¹Ù…Ø§Ø±ÙŠØ©.</Text></View>
      ) : data.drawings.map((drawing) => (
        <View key={drawing.id} style={styles.drawingCard}>
          <View style={styles.reviewInfo}>
            <Text selectable style={styles.reviewTitle}>{drawing.name}</Text>
            <Text selectable style={styles.meta}>الإصدار {drawing.revision} · {drawing.format.toUpperCase()}</Text>
          </View>
          <TouchableOpacity
            disabled={Boolean(retryingDrawingId)}
            style={[styles.retryButton, retryingDrawingId === drawing.id && styles.uploadButtonDisabled]}
            onPress={() => void retryDrawing(drawing.id)}
          >
            <Text style={styles.retryButtonText}>{retryingDrawingId === drawing.id ? "Ø¬Ø§Ø±Ù Ø§Ù„ØªØ­Ù„ÙŠÙ„" : "Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„ØªØ­Ù„ÙŠÙ„"}</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Text style={styles.sectionTitle}>ÙÙ‡Ù… Ø¹Ù†Ø§ØµØ± Ø§Ù„Ù…Ø®Ø·Ø·</Text>
      <View style={styles.elementSummary}>
        <Metric value={String(data.planElements.length)} label="Ù…ÙƒØªØ´Ù" />
        <Metric value={String(confirmedElementCount)} label="مؤكد" />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.elementFilters}>
        {(["all", "room", "dimension", "wall", "opening", "label"] as const).map((filter) => (
          <TouchableOpacity key={filter} onPress={() => setElementFilter(filter)} style={[styles.elementFilter, elementFilter === filter && styles.elementFilterActive]}>
            <Text style={[styles.elementFilterText, elementFilter === filter && styles.elementFilterTextActive]}>{filter === "all" ? "الكل" : planElementTypeLabels[filter]}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {data.planElements.length === 0 ? (
        <View style={styles.empty}>
          <Text selectable style={styles.emptyTitle}>لا توجد عناصر مخطط منظمة بعد</Text>
          <Text selectable style={styles.emptyText}>Ø£Ø¶Ù Ø§Ù„Ø¹Ù†Ø§ØµØ± Ø£Ùˆ ØµØ­Ø­Ù‡Ø§ Ù…Ù† Ø§Ù„ÙˆÙŠØ¨ØŒ Ø«Ù… Ø§Ø¹ØªÙ…Ø¯ Ø§Ù„Ù†ØªØ§Ø¦Ø¬ Ù‡Ù†Ø§ Ø£Ø«Ù†Ø§Ø¡ Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„Ù…ÙŠØ¯Ø§Ù†ÙŠØ©.</Text>
        </View>
      ) : visiblePlanElements.length === 0 ? (
        <View style={styles.empty}><Text selectable style={styles.emptyTitle}>لا توجد نتائج مطابقة</Text><Text selectable style={styles.emptyText}>غيّر نوع العنصر لعرض بقية النتائج.</Text></View>
      ) : visiblePlanElements.map((element) => (
        <View key={element.id} style={styles.elementCard}>
          <View style={styles.elementTop}>
            <Text style={styles.elementStatus}>{planElementStatusLabels[element.status]}</Text>
            <Text selectable style={styles.elementTitle}>{element.label || planElementTypeLabels[element.element_type]}</Text>
          </View>
          <Text selectable style={styles.meta}>
            {drawingNames.get(element.drawing_id) || "مخطط معماري"} · {planElementTypeLabels[element.element_type]}
          </Text>
          {element.value ? <Text selectable style={styles.elementValue}>{element.value}{element.unit ? ` ${element.unit}` : ""}</Text> : null}
          {element.geometry?.page ? <Text selectable style={styles.elementLocation}>
            Ø§Ù„ØµÙØ­Ø© {element.geometry.page}
            {typeof element.geometry.x === "number" && typeof element.geometry.y === "number" ? ` · موضع ${Math.round(element.geometry.x)}, ${Math.round(element.geometry.y)}` : ""}
            {typeof element.geometry.width === "number" && typeof element.geometry.height === "number" ? ` · حجم ${Math.round(element.geometry.width)}×${Math.round(element.geometry.height)}` : ""}
          </Text> : null}
          {element.geometry?.kind !== "wall_gap" && element.geometry?.start && element.geometry?.end ? (
            <Text selectable style={styles.elementGeometry}>
              ({element.geometry.start.x}, {element.geometry.start.y}) â† ({element.geometry.end.x}, {element.geometry.end.y})
            </Text>
          ) : null}
          {element.geometry?.kind === "paired_lines" && element.geometry.centerline ? (
            <Text selectable style={styles.elementGeometry}>
              Ù…Ø­ÙˆØ± Ø§Ù„Ø¬Ø¯Ø§Ø±: ({element.geometry.centerline.start.x}, {element.geometry.centerline.start.y}) â† ({element.geometry.centerline.end.x}, {element.geometry.centerline.end.y})
              {"\n"}السماكة المرشحة: {element.geometry.thickness} pt · التداخل {Math.round((element.geometry.overlapRatio ?? 0) * 100)}%
            </Text>
          ) : null}
          {element.geometry?.kind === "wall_gap" && element.geometry.start && element.geometry.end ? (
            <Text selectable style={styles.elementGeometry}>
              ÙØ¬ÙˆØ© Ù…Ø±Ø´Ø­Ø©: ({element.geometry.start.x}, {element.geometry.start.y}) â† ({element.geometry.end.x}, {element.geometry.end.y})
              {"\n"}العرض المرشح: {element.geometry.width} pt · سماكة الجدار المرجعية {element.geometry.averageWallThickness} pt
            </Text>
          ) : null}
          <Text selectable style={styles.elementEvidence}>
            Ø§Ù„Ù…ØµØ¯Ø±: {element.source === "manual" ? "Ø¥Ø¯Ø®Ø§Ù„ Ø¨Ø´Ø±ÙŠ" : "Ø§ÙƒØªØ´Ø§Ù Ø¢Ù„ÙŠ"} Â· Ø§Ù„Ø«Ù‚Ø© {element.confidence_score}%
          </Text>
          {element.status === "detected" ? (
            <View style={styles.decisionRow}>
              <TouchableOpacity disabled={updatingPlanElementId === element.id} style={[styles.decisionButton, styles.acceptButton]} onPress={() => onDecidePlanElement(element.id, "confirmed")}><Text style={styles.decisionText}>تأكيد</Text></TouchableOpacity>
              <TouchableOpacity disabled={updatingPlanElementId === element.id} style={styles.decisionButton} onPress={() => onDecidePlanElement(element.id, "rejected")}><Text style={styles.decisionText}>رفض</Text></TouchableOpacity>
            </View>
          ) : null}
        </View>
      ))}

      <Text style={styles.sectionTitle}>سجل المراجعة المكانية</Text>
      {visibleReviewComments.length === 0 ? (
        <View style={styles.empty}>
          <Text selectable style={styles.emptyTitle}>لا توجد ملاحظات ميدانية لهذا المشروع</Text>
          <Text selectable style={styles.emptyText}>Ø£Ø¶Ù Ù…Ù„Ø§Ø­Ø¸Ø© Ù…Ù† Ø§Ù„Ù…Ø®Ø·Ø· Ø¹Ù„Ù‰ Ø§Ù„ÙˆÙŠØ¨ØŒ ÙˆØ³ØªØ¸Ù‡Ø± Ù‡Ù†Ø§ ÙÙˆØ± Ø§Ù„Ù…Ø²Ø§Ù…Ù†Ø© Ù„Ø§ØªØ®Ø§Ø° Ø§Ù„Ù‚Ø±Ø§Ø± ÙÙŠ Ø§Ù„Ù…ÙˆÙ‚Ø¹.</Text>
        </View>
      ) : visibleReviewComments.map((comment) => (
        <View key={comment.id} style={[styles.commentCard, comment.status === "resolved" && styles.commentResolved]}>
          <View style={styles.commentTop}>
            <Text style={[styles.commentStatus, comment.status === "resolved" && styles.commentStatusResolved]}>
              {comment.status === "resolved" ? "تمت المعالجة" : "تحتاج متابعة"}
            </Text>
            <Text selectable style={styles.commentTitle}>
              {drawingNames.get(comment.drawing_id) || "مخطط معماري"}
            </Text>
          </View>
          <Text selectable style={styles.commentBody}>{comment.body}</Text>
          <Text selectable style={styles.commentLocation}>
            {comment.page_number ? `Ø§Ù„ØµÙØ­Ø© ${comment.page_number}` : "Ø§Ù„Ù…Ø®Ø·Ø·"}
            {comment.plan_element_id ? " · مرتبطة بعنصر" : ""}
            {comment.finding_id ? " · مرتبطة بملاحظة تحليل" : ""}
          </Text>
          <Text selectable style={styles.commentDate}>
            {new Date(comment.created_at).toLocaleString("ar-SA")}
          </Text>
          <TouchableOpacity
            disabled={updatingReviewCommentId === comment.id}
            style={[styles.commentAction, updatingReviewCommentId === comment.id && styles.uploadButtonDisabled]}
            onPress={() => onUpdateReviewComment(comment, comment.status === "open" ? "resolved" : "open")}
          >
            <Text style={styles.commentActionText}>
              {updatingReviewCommentId === comment.id
                ? "Ø¬Ø§Ø±Ù Ø§Ù„Ø­ÙØ¸"
                : comment.status === "open" ? "ØªØ¹Ù„ÙŠÙ… ÙƒÙ…Ø¹Ø§Ù„Ø¬Ø©" : "Ø¥Ø¹Ø§Ø¯Ø© ÙØªØ­"}
            </Text>
          </TouchableOpacity>
        </View>
      ))}

      <Text style={styles.sectionTitle}>سجل جلسات المراجعة</Text>
      {data.reviews.length === 0 ? (
        <View style={styles.empty}><Text selectable style={styles.emptyTitle}>Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¬Ù„Ø³Ø© Ù…Ø±Ø§Ø¬Ø¹Ø© Ø¨Ø¹Ø¯</Text><Text selectable style={styles.emptyText}>Ø§Ø±ÙØ¹ Ù…Ø®Ø·Ø·Ù‹Ø§ Ù…Ù† Ù…Ø´Ø±ÙˆØ¹ Ù†Ø´Ø· Ù„Ø¨Ø¯Ø¡ Ø§Ù„ØªØ­Ù„ÙŠÙ„ Ø§Ù„Ù…Ø¹Ù…Ø§Ø±ÙŠ.</Text></View>
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
                    {finding.status === "converted_to_task" ? "ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ù…Ù‡Ù…Ø©" : convertingFindingId === finding.id ? "Ø¬Ø§Ø±Ù Ø§Ù„Ø¥Ù†Ø´Ø§Ø¡" : "ØªØ­ÙˆÙŠÙ„ Ø¥Ù„Ù‰ Ù…Ù‡Ù…Ø©"}
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
  rejected: "Ù…Ø±ÙÙˆØ¶Ø©",
  resolved: "تمت المعالجة",
  converted_to_task: "تحولت إلى مهمة",
};

const planElementTypeLabels: Record<ArchitecturalPlanElement["element_type"], string> = {
  wall: "جدار",
  opening: "فتحة",
  room: "غرفة",
  label: "تسمية",
  dimension: "بُعد",
};

const planElementStatusLabels: Record<ArchitecturalPlanElement["status"], string> = {
  detected: "بانتظار التحقق",
  confirmed: "مؤكد",
  corrected: "مصحح بشريًا",
  rejected: "Ù…Ø±ÙÙˆØ¶",
};

function Metric({ value, label }: { value: string; label: string }) {
  return <View style={styles.metric}><Text selectable style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginTop: tokens.space.md },
  back: { borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, paddingHorizontal: 14, paddingVertical: 9 },
  backText: { color: tokens.colors.primary, fontWeight: "800" },
  kicker: { color: tokens.colors.primary, fontSize: 10, fontWeight: "900", textAlign: "right" },
  title: { color: tokens.colors.text, fontSize: 30, fontWeight: "900", textAlign: "right", marginTop: 5 },
  metrics: { flexDirection: "row", gap: 8, marginTop: tokens.space.lg },
  metric: { flex: 1, backgroundColor: tokens.colors.surface, borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, padding: 12 },
  metricValue: { color: tokens.colors.primary, fontSize: 21, fontWeight: "900", textAlign: "right", fontVariant: ["tabular-nums"] },
  metricLabel: { color: tokens.colors.muted, fontSize: 10, textAlign: "right", marginTop: 3 },
  uploadCard: { backgroundColor: tokens.colors.surface, borderWidth: 1, borderColor: tokens.colors.primary, borderRadius: tokens.radius.lg, padding: tokens.space.md, marginTop: tokens.space.lg, gap: 10 },
  sectionTitleInline: { color: tokens.colors.text, fontSize: 19, fontWeight: "900", textAlign: "right" },
  uploadHint: { color: tokens.colors.muted, fontSize: 12, textAlign: "right" },
  projectChoices: { flexDirection: "row-reverse", gap: 8 },
  projectChoice: { borderWidth: 1, borderColor: tokens.colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  projectChoiceActive: { borderColor: tokens.colors.primary, backgroundColor: tokens.colors.primarySubtle },
  projectChoiceText: { color: tokens.colors.muted, fontSize: 11, fontWeight: "700" },
  projectChoiceTextActive: { color: tokens.colors.primary },
  uploadRow: { flexDirection: "row", gap: 8 },
  revisionInput: { width: 100, borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, color: tokens.colors.text, paddingHorizontal: 12, paddingVertical: 10 },
  fileButton: { flex: 1, borderWidth: 1, borderColor: tokens.colors.primary, borderRadius: tokens.radius.md, alignItems: "center", justifyContent: "center", paddingVertical: 11 },
  fileButtonText: { color: tokens.colors.primary, fontWeight: "900" },
  fileName: { color: tokens.colors.text, fontSize: 12, textAlign: "right" },
  uploadButton: { backgroundColor: tokens.colors.primary, borderRadius: tokens.radius.md, alignItems: "center", paddingVertical: 13 },
  uploadButtonDisabled: { opacity: .45 },
  uploadButtonText: { color: tokens.colors.background, fontWeight: "900" },
  uploadMessage: { color: tokens.colors.success, lineHeight: 20, textAlign: "right" },
  elementSummary: { flexDirection: "row", gap: 8, marginBottom: 10 },
  elementFilters: { flexDirection: "row-reverse", gap: 7, paddingBottom: 10 },
  elementFilter: { borderWidth: 1, borderColor: tokens.colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  elementFilterActive: { borderColor: tokens.colors.primary, backgroundColor: tokens.colors.primarySubtle },
  elementFilterText: { color: tokens.colors.muted, fontSize: 11, fontWeight: "800" },
  elementFilterTextActive: { color: tokens.colors.primary },
  elementLocation: { color: tokens.colors.primary, fontSize: 11, textAlign: "right", marginTop: 7 },
  drawingCard: { backgroundColor: tokens.colors.surface, borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, padding: 13, marginBottom: 9, flexDirection: "row", alignItems: "center", gap: 10 },
  retryButton: { borderWidth: 1, borderColor: tokens.colors.primary, borderRadius: tokens.radius.sm, paddingHorizontal: 12, paddingVertical: 9 },
  retryButtonText: { color: tokens.colors.primary, fontWeight: "900", fontSize: 11 },
  elementCard: { backgroundColor: tokens.colors.surface, borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, padding: 13, marginBottom: 9 },
  elementTop: { flexDirection: "row", justifyContent: "space-between", gap: 8, alignItems: "center" },
  elementTitle: { color: tokens.colors.text, flex: 1, fontSize: 16, fontWeight: "900", textAlign: "right" },
  elementStatus: { color: tokens.colors.primary, fontSize: 10, fontWeight: "800" },
  elementValue: { color: tokens.colors.text, fontSize: 18, fontWeight: "900", textAlign: "right", marginTop: 8 },
  elementGeometry: { color: tokens.colors.primary, fontSize: 10, textAlign: "right", marginTop: 6, fontVariant: ["tabular-nums"] },
  elementEvidence: { color: tokens.colors.muted, fontSize: 11, textAlign: "right", marginTop: 7 },
  commentCard: { backgroundColor: tokens.colors.surface, borderWidth: 1, borderColor: tokens.colors.primary, borderRadius: tokens.radius.md, padding: 14, marginBottom: 9 },
  commentResolved: { borderColor: tokens.colors.success, opacity: .82 },
  commentTop: { flexDirection: "row", justifyContent: "space-between", gap: 8, alignItems: "center" },
  commentTitle: { color: tokens.colors.text, flex: 1, fontSize: 15, fontWeight: "900", textAlign: "right" },
  commentStatus: { color: tokens.colors.primary, fontSize: 10, fontWeight: "900" },
  commentStatusResolved: { color: tokens.colors.success },
  commentBody: { color: tokens.colors.text, lineHeight: 21, textAlign: "right", marginTop: 10 },
  commentLocation: { color: tokens.colors.primary, fontSize: 11, textAlign: "right", marginTop: 8 },
  commentDate: { color: tokens.colors.muted, fontSize: 10, textAlign: "right", marginTop: 5 },
  commentAction: { alignSelf: "flex-end", borderWidth: 1, borderColor: tokens.colors.primary, borderRadius: tokens.radius.sm, paddingHorizontal: 12, paddingVertical: 9, marginTop: 10 },
  commentActionText: { color: tokens.colors.primary, fontWeight: "900", fontSize: 11 },
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
  critical: { borderColor: tokens.colors.dangerBorder },
  findingTop: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  confidence: { color: tokens.colors.primary, fontSize: 10, fontVariant: ["tabular-nums"] },
  findingTitle: { color: tokens.colors.text, flex: 1, fontWeight: "900", textAlign: "right" },
  findingDescription: { color: tokens.colors.muted, lineHeight: 20, textAlign: "right", marginTop: 7 },
  recommendation: { color: tokens.colors.text, lineHeight: 20, textAlign: "right", marginTop: 7 },
  evidence: { color: tokens.colors.primary, fontSize: 11, lineHeight: 18, textAlign: "right", marginTop: 7 },
  statusLabel: { color: tokens.colors.muted, fontSize: 10, textAlign: "right", marginTop: 8 },
  decisionRow: { flexDirection: "row-reverse", gap: 8, marginTop: 10 },
  decisionButton: { borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.sm, paddingHorizontal: 12, paddingVertical: 8 },
  acceptButton: { borderColor: tokens.colors.success },
  resolveButton: { borderColor: tokens.colors.primary },
  decisionText: { color: tokens.colors.text, fontWeight: "800", fontSize: 11 },
  taskButton: { alignSelf: "flex-end", borderWidth: 1, borderColor: tokens.colors.primary, borderRadius: tokens.radius.sm, paddingHorizontal: 12, paddingVertical: 9, marginTop: 10 },
  taskButtonDone: { borderColor: tokens.colors.success, opacity: .7 },
  taskButtonText: { color: tokens.colors.primary, fontWeight: "900", fontSize: 11 },
});
