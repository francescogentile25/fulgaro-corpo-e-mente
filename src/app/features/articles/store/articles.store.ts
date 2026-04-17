import { signalStore } from '@ngrx/signals';
import { createEntityStoreConfig } from '../../../core/store/base.store';
import { ArticlesService } from '../services/articles.service';
import { Article, ArticleCreateRequest, ArticleUpdateRequest } from '../models/article.model';

export const ArticlesStore = signalStore(
  { providedIn: 'root' },
  ...createEntityStoreConfig<Article, ArticleCreateRequest, ArticleUpdateRequest>({
    storeName: 'Articoli',
    serviceToken: ArticlesService,
    showSuccessMessages: true,
    showErrorMessages: true,
  })
);
