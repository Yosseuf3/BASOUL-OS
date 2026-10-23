import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Screen } from "../../components/Screen";
import { basoulYvlNative as tokens } from "@basoul/yvl-adapter/native";
import type { Project, Task } from "../../types/domain";

const statusLabels: Record<Project["status"], string> = { Planning: "تخطيط", Active: "نشط", "On Hold": "متوقف مؤقتًا", Completed: "مكتمل" };

export function ProjectsScreen({projects,tasks,selectedId,onSelect,onTask,onCreate,onBack}:{projects:Project[];tasks:Task[];selectedId:string|null;onSelect:(id:string|null)=>void;onTask:(task:Task)=>void;onCreate:()=>void;onBack:()=>void}) {
  const selected=projects.find(p=>p.id===selectedId);
  if(selected)return <Screen><Header title={selected.name} onBack={()=>onSelect(null)}/><TouchableOpacity accessibilityRole="button" onPress={onCreate} style={styles.back}><Text style={styles.backText}>مهمة للمشروع / Project task</Text></TouchableOpacity>{tasks.filter(t=>t.project_id===selected.id).map(task=><TouchableOpacity key={task.id} accessibilityRole="button" style={styles.card} onPress={()=>onTask(task)}><Text style={styles.name}>{task.title}</Text><Text style={styles.meta}>{task.status}</Text></TouchableOpacity>)}<Text style={styles.empty}>إدارة الملفات والملاحظات متاحة عبر Web. / Files and notes are managed on Web.</Text></Screen>;
  return (
    <Screen>
      <Header title="المشاريع" onBack={onBack} />
      <Text style={styles.summary}>{projects.length} مشروع مرتبط بحسابك</Text>
      {projects.length === 0 ? <Text style={styles.empty}>لا توجد مشاريع بعد.</Text> : projects.map((project) => (
        <View key={project.id} style={styles.card}>
          <View style={styles.cardTop}><Text style={styles.status}>{statusLabels[project.status]}</Text><Text style={styles.number}>{project.project_number || "PROJECT"}</Text></View>
          <TouchableOpacity accessibilityRole="button" onPress={()=>onSelect(project.id)}><Text style={styles.name}>{project.name}</Text><Text style={styles.backText}>فتح المشروع / Open project</Text></TouchableOpacity>
          <Text style={styles.meta}>{project.client_name || "بدون عميل"}{project.location ? ` · ${project.location}` : ""}</Text>
          <View style={styles.details}><Text style={styles.detail}>المرحلة: {project.design_phase || "غير محددة"}</Text><Text style={styles.detail}>الأولوية: {project.priority}</Text></View>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, project.progress))}%` }]} /></View>
          <Text style={styles.progressText}>{project.progress}% تقدم</Text>
        </View>
      ))}
    </Screen>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return <View style={styles.header}><TouchableOpacity onPress={onBack} style={styles.back}><Text style={styles.backText}>عودة</Text></TouchableOpacity><Text style={styles.title}>{title}</Text></View>;
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: tokens.space.md },
  title: { color: tokens.colors.text, fontSize: 32, fontWeight: "900", textAlign: "right" },
  back: { borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, paddingHorizontal: 14, paddingVertical: 9 },
  backText: { color: tokens.colors.accentText, fontWeight: "800" },
  summary: { color: tokens.colors.muted, textAlign: "right", marginTop: tokens.space.sm, marginBottom: tokens.space.lg },
  empty: { color: tokens.colors.muted, textAlign: "center", marginTop: tokens.space.xl },
  card: { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border, borderWidth: 1, borderRadius: tokens.radius.lg, padding: tokens.space.lg, marginBottom: tokens.space.md },
  cardTop: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" },
  status: { color: tokens.colors.success, fontWeight: "800" },
  number: { color: tokens.colors.muted, fontSize: 12 },
  name: { color: tokens.colors.text, fontSize: 22, fontWeight: "900", textAlign: "right", marginTop: tokens.space.md },
  meta: { color: tokens.colors.muted, textAlign: "right", marginTop: 5 },
  details: { marginTop: tokens.space.md, gap: 4 },
  detail: { color: tokens.colors.muted, textAlign: "right" },
  progressTrack: { height: 7, backgroundColor: tokens.colors.background, borderRadius: 4, overflow: "hidden", marginTop: tokens.space.lg },
  progressFill: { height: "100%", backgroundColor: tokens.colors.primary },
  progressText: { color: tokens.colors.text, textAlign: "right", marginTop: 7, fontWeight: "800" },
});
