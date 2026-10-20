import {useRef,useState} from 'react';
import {Text,TextInput,TouchableOpacity,View} from 'react-native';
import {Screen} from '../../components/Screen';
import {basoulYvlNative as tokens} from '@basoul/yvl-adapter/native';
import type {Task} from '../../types/domain';
import type {TaskFieldEdit} from '../../services/task-edits';
import {taskStatusLabel} from '../../../../packages/shared-types/src/task-status-contract';
import {safeOperationError} from '../../organizations/operation';

export function TaskDetailsScreen({task,onBack,onSave,onArchive,readOnly=false}:{task:Task;onBack:()=>void;onSave:(input:TaskFieldEdit)=>Promise<void>;onArchive?:()=>Promise<void>;readOnly?:boolean}) {
 const [title,setTitle]=useState(task.title),[progress,setProgress]=useState(String(task.progress)),[due,setDue]=useState(task.due_date??'');
 const [busy,setBusy]=useState(false),[error,setError]=useState('');const lock=useRef(false);
 const valid=title.trim().length>0 && title.trim().length<=160 && /^\d{1,3}$/.test(progress) && Number(progress)<=100
  && (!due || /^\d{4}-\d{2}-\d{2}$/.test(due));
 async function save(){if(lock.current||!valid||readOnly)return;lock.current=true;setBusy(true);setError('');
  try{await onSave({title:title.trim(),progress:Number(progress),due_date:due||null});}
  catch(cause){setError(safeOperationError(cause).message);}
  finally{lock.current=false;setBusy(false);}}
 async function archive(){if(lock.current||readOnly||!onArchive)return;lock.current=true;setBusy(true);setError('');
 try{await onArchive();}catch(cause){setError(safeOperationError(cause).message);}finally{lock.current=false;setBusy(false);}}
 const field={color:tokens.colors.text,borderColor:tokens.colors.border,borderWidth:1,padding:tokens.space.md};
 return <Screen><View style={{gap:tokens.space.md}}>
  <TouchableOpacity accessibilityRole="button" onPress={onBack} disabled={busy}><Text style={{color:tokens.colors.accentText}}>عودة / Back</Text></TouchableOpacity>
  <Text accessibilityRole="header" style={{color:tokens.colors.text}}>{task.title}</Text>
  <Text style={{color:tokens.colors.text}}>{taskStatusLabel(task.status)} / {task.status}</Text>
  {readOnly&&<Text style={{color:tokens.colors.muted}}>قراءة فقط / Read only</Text>}
  <TextInput accessibilityLabel="عنوان المهمة / Task title" value={title} onChangeText={setTitle} editable={!busy&&!readOnly} style={field}/>
  <TextInput accessibilityLabel="التقدم / Progress" value={progress} onChangeText={setProgress} editable={!busy&&!readOnly} keyboardType="number-pad" style={field}/>
  <TextInput accessibilityLabel="الموعد YYYY-MM-DD / Due date" value={due} onChangeText={setDue} editable={!busy&&!readOnly} style={field}/>
  {!valid&&<Text accessibilityRole="alert" style={{color:tokens.colors.danger}}>تحقق من العنوان والتقدم (0–100) والتاريخ. / Check title, progress (0–100), and date.</Text>}
  {!!error&&<Text accessibilityRole="alert" style={{color:tokens.colors.danger}}>{error}</Text>}
  <TouchableOpacity accessibilityRole="button" disabled={busy||!valid||readOnly} onPress={()=>void save()}><Text style={{color:tokens.colors.accentText}}>حفظ البيانات / Save fields</Text></TouchableOpacity>
  {onArchive&&!readOnly&&<TouchableOpacity accessibilityRole="button" disabled={busy} onPress={()=>void archive()}><Text style={{color:tokens.colors.accentText}}>أرشفة مع حفظ السجل / Archive and preserve history</Text></TouchableOpacity>}
 </View></Screen>;
}
