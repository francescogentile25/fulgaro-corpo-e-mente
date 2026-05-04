import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavBar } from '../../landing-page/components/nav-bar/nav-bar';
import { LandingFooter } from '../../landing-page/components/landing-footer/landing-footer';
import { ArticlesService } from '../services/articles.service';
import { Article } from '../models/article.model';
import { Tag } from '../../tags/models/tag.model';

@Component({
  selector: 'app-articles-public-page',
  standalone: true,
  imports: [RouterLink, DatePipe, NavBar, LandingFooter],
  templateUrl: './articles-public-page.html',
  styleUrl: './articles-public-page.scss',
})
export class ArticlesPublicPage implements OnInit {
  private service = inject(ArticlesService);

  articles      = signal<Article[]>([]);
  loading       = signal(false);
  selectedTags  = signal<Set<string>>(new Set());
  readonly emptySet = new Set<string>();

  allTags = computed<Tag[]>(() => {
    const seen = new Set<string>();
    const tags: Tag[] = [];
    for (const a of this.articles()) {
      for (const t of (a.tags ?? [])) {
        if (!seen.has(t.id)) { seen.add(t.id); tags.push(t); }
      }
    }
    return tags;
  });

  filteredArticles = computed(() => {
    const sel = this.selectedTags();
    if (sel.size === 0) return this.articles();
    return this.articles().filter(a => a.tags?.some(t => sel.has(t.id)));
  });

  toggleTag(id: string): void {
    const cur = new Set(this.selectedTags());
    cur.has(id) ? cur.delete(id) : cur.add(id);
    this.selectedTags.set(cur);
  }

  ngOnInit(): void {
    this.loading.set(true);
    this.service.getPublished().subscribe({
      next: (list) => { this.articles.set(list); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
