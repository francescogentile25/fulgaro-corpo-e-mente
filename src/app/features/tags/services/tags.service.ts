import { inject, Injectable } from '@angular/core';
import { from, map, Observable } from 'rxjs';
import { SupabaseService } from '../../../core/services/supabase.service';
import { BaseEntityService } from '../../../core/store/base.store';
import { Tag, TagCreateRequest, TagUpdateRequest } from '../models/tag.model';

@Injectable({ providedIn: 'root' })
export class TagsService implements BaseEntityService<Tag, TagCreateRequest, TagUpdateRequest> {

  private supabase = inject(SupabaseService);

  getAll(): Observable<Tag[]> {
    return from(
      this.supabase.client
        .from('tags')
        .select('*')
        .order('name', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as Tag[];
      })
    );
  }

  getById(id: string): Observable<Tag> {
    return from(
      this.supabase.client
        .from('tags')
        .select('*')
        .eq('id', id)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as Tag;
      })
    );
  }

  add(request: TagCreateRequest): Observable<Tag> {
    return from(
      this.supabase.client
        .from('tags')
        .insert(request)
        .select('*')
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as Tag;
      })
    );
  }

  edit(request: TagUpdateRequest): Observable<Tag> {
    const { id, ...fields } = request;
    return from(
      this.supabase.client
        .from('tags')
        .update(fields)
        .eq('id', id)
        .select('*')
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as Tag;
      })
    );
  }

  delete(id: string): Observable<void> {
    return from(
      this.supabase.client
        .from('tags')
        .delete()
        .eq('id', id)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      })
    );
  }

  /** Reset and persist tag set for an article (M:N pivot management). */
  async setArticleTags(articleId: string, tagIds: string[]): Promise<void> {
    const { error: delErr } = await this.supabase.client
      .from('article_tags')
      .delete()
      .eq('article_id', articleId);
    if (delErr) throw delErr;

    if (tagIds.length === 0) return;

    const rows = tagIds.map(tag_id => ({ article_id: articleId, tag_id }));
    const { error: insErr } = await this.supabase.client
      .from('article_tags')
      .insert(rows);
    if (insErr) throw insErr;
  }
}
