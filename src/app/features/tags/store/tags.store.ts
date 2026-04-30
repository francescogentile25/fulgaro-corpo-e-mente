import { signalStore } from '@ngrx/signals';
import { createEntityStoreConfig } from '../../../core/store/base.store';
import { TagsService } from '../services/tags.service';
import { Tag, TagCreateRequest, TagUpdateRequest } from '../models/tag.model';

export const TagsStore = signalStore(
  { providedIn: 'root' },
  ...createEntityStoreConfig<Tag, TagCreateRequest, TagUpdateRequest>({
    storeName: 'Tag',
    serviceToken: TagsService,
    showSuccessMessages: true,
    showErrorMessages: true,
  })
);
