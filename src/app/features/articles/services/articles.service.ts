import { inject, Injectable } from '@angular/core';
import { from, map, Observable } from 'rxjs';
import { SupabaseService } from '../../../core/services/supabase.service';
import { BaseEntityService } from '../../../core/store/base.store';
import { Article, ArticleCreateRequest, ArticleUpdateRequest } from '../models/article.model';
import { Tag } from '../../tags/models/tag.model';

const BUCKET = 'article-images';

const SELECT_WITH_TAGS = '*, article_tags(tag:tags(*))';

interface ArticleRowWithJoin extends Omit<Article, 'tags'> {
  article_tags?: Array<{ tag: Tag | null }>;
}

function flattenTags(row: ArticleRowWithJoin): Article {
  const tags = (row.article_tags ?? [])
    .map(at => at.tag)
    .filter((t): t is Tag => !!t);
  const { article_tags, ...rest } = row;
  return { ...rest, tags };
}

@Injectable({ providedIn: 'root' })
export class ArticlesService implements BaseEntityService<Article, ArticleCreateRequest, ArticleUpdateRequest> {

  private supabase = inject(SupabaseService);

  // ─── CRUD ────────────────────────────────────────────────────────────────

  getAll(): Observable<Article[]> {
    return from(
      this.supabase.client
        .from('articles')
        .select(SELECT_WITH_TAGS)
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return ((data ?? []) as unknown as ArticleRowWithJoin[]).map(flattenTags);
      })
    );
  }

  getPublished(limit?: number): Observable<Article[]> {
    let q = this.supabase.client
      .from('articles')
      .select(SELECT_WITH_TAGS)
      .eq('status', 'published')
      .order('published_at', { ascending: false });
    if (limit) q = q.limit(limit);
    return from(q).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return ((data ?? []) as unknown as ArticleRowWithJoin[]).map(flattenTags);
      })
    );
  }

  getBySlug(slug: string): Observable<Article | null> {
    return from(
      this.supabase.client
        .from('articles')
        .select(SELECT_WITH_TAGS)
        .eq('slug', slug)
        .maybeSingle()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        if (!data) return null;
        return flattenTags(data as unknown as ArticleRowWithJoin);
      })
    );
  }

  getById(id: string): Observable<Article> {
    return from(
      this.supabase.client
        .from('articles')
        .select(SELECT_WITH_TAGS)
        .eq('id', id)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return flattenTags(data as unknown as ArticleRowWithJoin);
      })
    );
  }

  add(request: ArticleCreateRequest): Observable<Article> {
    return from(
      this.supabase.client
        .from('articles')
        .insert(request)
        .select('*')
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as Article;
      })
    );
  }

  edit(request: ArticleUpdateRequest): Observable<Article> {
    const { id, ...fields } = request;
    return from(
      this.supabase.client
        .from('articles')
        .update(fields)
        .eq('id', id)
        .select('*')
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as Article;
      })
    );
  }

  delete(id: string): Observable<void> {
    return from(
      this.supabase.client
        .from('articles')
        .delete()
        .eq('id', id)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      })
    );
  }

  // ─── STORAGE IMMAGINI ───────────────────────────────────────────────────

  async uploadImage(file: File): Promise<string> {
    const ext = file.name.split('.').pop() ?? 'bin';
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await this.supabase.client.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;
    const { data } = this.supabase.client.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }
}
