import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { TiptapEditor } from '../components/tiptap-editor/tiptap-editor';
import { ArticlesService } from '../services/articles.service';
import { ArticlesStore } from '../store/articles.store';
import { AuthStore } from '../../auth/store/auth.store';
import { Article, ArticleStatus, slugify } from '../models/article.model';
import { TagPicker } from '../../tags/components/tag-picker/tag-picker';
import { TagsService } from '../../tags/services/tags.service';
import { Tag } from '../../tags/models/tag.model';

@Component({
  selector: 'app-article-editor-page',
  standalone: true,
  imports: [
    RouterLink, FormsModule, ButtonModule, InputTextModule,
    TextareaModule, ToggleSwitchModule, TooltipModule, TiptapEditor,
    TagPicker,
  ],
  templateUrl: './article-editor-page.html',
  styleUrl: './article-editor-page.scss',
})
export class ArticleEditorPage implements OnInit {
  private route          = inject(ActivatedRoute);
  private router         = inject(Router);
  private articlesService = inject(ArticlesService);
  private tagsService    = inject(TagsService);
  private store          = inject(ArticlesStore);
  private authStore      = inject(AuthStore);
  private messageService = inject(MessageService);

  articleId    = signal<string | null>(null);
  loading      = signal(false);
  saving       = signal(false);
  initialContent = signal<any | null>(null);

  // form fields
  title       = signal('');
  slug        = signal('');
  slugTouched = signal(false);
  excerpt     = signal('');
  coverImage  = signal<string | null>(null);
  publish     = signal(false);
  selectedTags = signal<Tag[]>([]);
  contentJson: any = null;
  contentHtml = '';

  isEdit = computed(() => !!this.articleId());

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.articleId.set(id);
      this.loadArticle(id);
    }

    // auto-slug finché l'utente non lo modifica manualmente
  }

  onTitleChange(v: string): void {
    this.title.set(v);
    if (!this.slugTouched()) {
      this.slug.set(slugify(v));
    }
  }

  onSlugChange(v: string): void {
    this.slugTouched.set(true);
    this.slug.set(slugify(v));
  }

  onContentChange(e: { json: any; html: string }): void {
    this.contentJson = e.json;
    this.contentHtml = e.html;
  }

  private loadArticle(id: string): void {
    this.loading.set(true);
    this.articlesService.getById(id).subscribe({
      next: (a) => {
        this.title.set(a.title);
        this.slug.set(a.slug);
        this.slugTouched.set(true);
        this.excerpt.set(a.excerpt ?? '');
        this.coverImage.set(a.cover_image);
        this.publish.set(a.status === 'published');
        this.selectedTags.set(a.tags ?? []);
        this.contentJson = a.content;
        this.contentHtml = a.content_html ?? '';
        this.initialContent.set(a.content);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error', summary: 'Errore', detail: err?.message ?? 'Articolo non trovato',
        });
        this.router.navigate(['/app/articoli']);
      },
    });
  }

  async onCoverChange(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;
    try {
      const url = await this.articlesService.uploadImage(file);
      this.coverImage.set(url);
    } catch (err: any) {
      this.messageService.add({
        severity: 'error', summary: 'Upload fallito', detail: err?.message ?? 'Errore',
      });
    } finally {
      input.value = '';
    }
  }

  removeCover(): void { this.coverImage.set(null); }

  canSave(): boolean {
    return !!this.title().trim() && !!this.slug().trim() && !this.saving();
  }

  save(): void {
    if (!this.canSave()) return;
    const user = this.authStore.user();
    if (!user) return;

    const status: ArticleStatus = this.publish() ? 'published' : 'draft';
    const nowIso    = new Date().toISOString();
    const basePayload = {
      slug:         this.slug().trim(),
      title:        this.title().trim(),
      excerpt:      this.excerpt().trim() || null,
      cover_image:  this.coverImage(),
      content:      this.contentJson ?? {},
      content_html: this.contentHtml || null,
      status,
    };

    this.saving.set(true);

    const tagIds = this.selectedTags().map(t => t.id);

    if (this.isEdit()) {
      this.articlesService.edit({
        id: this.articleId()!,
        ...basePayload,
        published_at: status === 'published' ? nowIso : null,
      }).subscribe({
        next: async (updated) => {
          try {
            await this.tagsService.setArticleTags(updated.id, tagIds);
            this.onSaved(updated, 'Articolo aggiornato');
          } catch (err) { this.onSaveError(err); }
        },
        error: (err) => this.onSaveError(err),
      });
    } else {
      this.articlesService.add({
        ...basePayload,
        author_id:    user.id,
        published_at: status === 'published' ? nowIso : null,
      } as any).subscribe({
        next: async (created) => {
          try {
            await this.tagsService.setArticleTags(created.id, tagIds);
            this.onSaved(created, 'Articolo creato');
          } catch (err) { this.onSaveError(err); }
        },
        error: (err) => this.onSaveError(err),
      });
    }
  }

  protected onTagsChange(tags: Tag[]): void {
    this.selectedTags.set(tags);
  }

  private onSaved(a: Article, msg: string): void {
    this.saving.set(false);
    this.messageService.add({ severity: 'success', summary: 'Salvato', detail: msg });
    // aggiorno la cache della lista admin
    this.store.refresh$();
    this.router.navigate(['/app/articoli']);
  }

  private onSaveError(err: any): void {
    this.saving.set(false);
    this.messageService.add({
      severity: 'error', summary: 'Errore salvataggio',
      detail: err?.message ?? 'Operazione fallita',
    });
  }
}
