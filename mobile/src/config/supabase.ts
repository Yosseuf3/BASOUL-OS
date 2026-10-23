import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import {withTaskCreationContract} from '../../../packages/shared-types/src/task-create-transport';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isMobileConfigured = Boolean(url && anonKey);
export const isSyntheticLocalEnvironment = url === 'http://127.0.0.1:35439';

export const supabase = url && anonKey
  ? createClient(url, anonKey, {
      global:{fetch:withTaskCreationContract((input,init)=>fetch(input,init))},
      auth: {
        ...(isSyntheticLocalEnvironment && process.env.EXPO_PUBLIC_BASOUL_LOCAL_SESSION_RUN
          ? {storageKey:`basoul-synthetic-${process.env.EXPO_PUBLIC_BASOUL_LOCAL_SESSION_RUN}`} : {}),
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;
