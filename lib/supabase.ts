import { createClient } from "@supabase/supabase-js";
import {withTaskCreationContract} from '../packages/shared-types/src/task-create-transport';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error("Supabase environment variables are missing.");
}

export const supabase = createClient(url, key, {global:{fetch:withTaskCreationContract((input,init)=>fetch(input,init))}});
