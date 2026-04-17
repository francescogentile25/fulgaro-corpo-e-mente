import { Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ArticlesStore } from '../store/articles.store';
import { Article } from '../models/article.model';

@Component({
  selector: 'app-articles-admin-page',
  standalone: true,
  imports: [RouterLink, DatePipe, ButtonModule, TableModule, TagModule, TooltipModule, ConfirmDialogModule],
  providers: [ConfirmationService],
  templateUrl: './articles-admin-page.html',
  styleUrl: './articles-admin-page.scss',
})
export class ArticlesAdminPage implements OnInit {
  store = inject(ArticlesStore);
  private confirm = inject(ConfirmationService);

  ngOnInit(): void {
    this.store.getAll$();
  }

  statusLabel(a: Article): string {
    return a.status === 'published' ? 'Pubblicato' : 'Bozza';
  }

  statusSeverity(a: Article): 'success' | 'warn' {
    return a.status === 'published' ? 'success' : 'warn';
  }

  askDelete(a: Article, ev: Event): void {
    this.confirm.confirm({
      target: ev.target as EventTarget,
      message: `Eliminare definitivamente "${a.title}"?`,
      header: 'Conferma eliminazione',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Elimina',
      rejectLabel: 'Annulla',
      accept: () => this.store.delete$(a.id),
    });
  }
}
