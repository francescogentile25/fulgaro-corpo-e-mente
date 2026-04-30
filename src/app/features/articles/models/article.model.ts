import { Tag } from '../../tags/models/tag.model';

export type ArticleStatus = 'draft' | 'published';

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image: string | null;
  content: any;          // Tiptap JSON (ProseMirror)
  content_html: string | null;
  status: ArticleStatus;
  author_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
}

export type ArticleCreateRequest = Omit<Article, 'id' | 'created_at' | 'updated_at'>;

export type ArticleUpdateRequest = Partial<Omit<Article, 'created_at' | 'updated_at'>> & {
  id: string;
};

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}
