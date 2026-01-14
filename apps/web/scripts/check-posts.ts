import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkPosts() {
  const { data: posts } = await supabase
    .from('opportunities')
    .select('id, title, slug, content, source_url, status')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(10);

  if (!posts) return;

  for (const post of posts) {
    console.log('-------------------');
    console.log('ID:', post.id);
    console.log('Title:', post.title);
    console.log('Slug:', post.slug);
    console.log('View: http://localhost:3000/p/' + post.slug);
    console.log('Source URL:', post.source_url);
    console.log('Content length:', post.content?.length || 0);
    console.log('Content preview:', post.content?.substring(0, 500) + '...');
  }
}

checkPosts();
