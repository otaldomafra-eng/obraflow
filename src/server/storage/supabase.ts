import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "documents";

function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase storage configuration");
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function uploadFile(path: string, file: File): Promise<string> {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  return data.path;
}

export async function getFileStream(path: string): Promise<ReadableStream<Uint8Array>> {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .download(path);

  if (error) throw new Error(`Storage download failed: ${error.message}`);
  return data.stream();
}

export async function deleteFile(path: string): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .remove([path]);

  if (error) throw new Error(`Storage delete failed: ${error.message}`);
}
