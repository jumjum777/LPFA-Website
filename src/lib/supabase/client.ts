import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Disable Web Lock API — browser extensions and React Strict Mode
        // cause orphaned locks that hang getSession() indefinitely
        lock: (name: string, acquireTimeout: number, fn: () => Promise<any>) => fn(),
      },
    }
  );
}
