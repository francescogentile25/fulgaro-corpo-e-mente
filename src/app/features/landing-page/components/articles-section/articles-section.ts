import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ArticlesService } from '../../../articles/services/articles.service';
import { Article } from '../../../articles/models/article.model';

@Component({
  selector: 'app-articles-section',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './articles-section.html',
  styleUrl: './articles-section.scss',
})
export class ArticlesSection implements OnInit {
  private service = inject(ArticlesService);
  articles = signal<Article[]>([]);

  ngOnInit(): void {
    this.service.getPublished(3).subscribe({
      next: (list) => this.articles.set(list),
    });
  }
}
