import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavBar } from '../../landing-page/components/nav-bar/nav-bar';
import { LandingFooter } from '../../landing-page/components/landing-footer/landing-footer';
import { ArticlesService } from '../services/articles.service';
import { Article } from '../models/article.model';

@Component({
  selector: 'app-articles-public-page',
  standalone: true,
  imports: [RouterLink, DatePipe, NavBar, LandingFooter],
  templateUrl: './articles-public-page.html',
  styleUrl: './articles-public-page.scss',
})
export class ArticlesPublicPage implements OnInit {
  private service = inject(ArticlesService);

  articles = signal<Article[]>([]);
  loading  = signal(false);

  ngOnInit(): void {
    this.loading.set(true);
    this.service.getPublished().subscribe({
      next: (list) => { this.articles.set(list); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
