import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml, Title, Meta } from '@angular/platform-browser';
import { NavBar } from '../../landing-page/components/nav-bar/nav-bar';
import { LandingFooter } from '../../landing-page/components/landing-footer/landing-footer';
import { ArticlesService } from '../services/articles.service';
import { Article } from '../models/article.model';

@Component({
  selector: 'app-article-detail-page',
  standalone: true,
  imports: [RouterLink, DatePipe, NavBar, LandingFooter],
  templateUrl: './article-detail-page.html',
  styleUrl: './article-detail-page.scss',
})
export class ArticleDetailPage implements OnInit {
  private route     = inject(ActivatedRoute);
  private router    = inject(Router);
  private service   = inject(ArticlesService);
  private sanitizer = inject(DomSanitizer);
  private titleSrv  = inject(Title);
  private metaSrv   = inject(Meta);

  article = signal<Article | null>(null);
  body    = signal<SafeHtml | null>(null);
  loading = signal(true);
  notFound = signal(false);

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) { this.router.navigate(['/articoli']); return; }

    this.service.getBySlug(slug).subscribe({
      next: (a) => {
        if (!a || a.status !== 'published') {
          this.notFound.set(true);
          this.loading.set(false);
          return;
        }
        this.article.set(a);
        this.body.set(this.sanitizer.bypassSecurityTrustHtml(a.content_html ?? ''));
        this.titleSrv.setTitle(`${a.title} — Fulgaro Corpo e Mente`);
        if (a.excerpt) this.metaSrv.updateTag({ name: 'description', content: a.excerpt });
        this.loading.set(false);
      },
      error: () => { this.notFound.set(true); this.loading.set(false); },
    });
  }
}
