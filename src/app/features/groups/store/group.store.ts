import { signalStore } from '@ngrx/signals';
import { createEntityStoreConfig } from '../../../core/store/base.store';
import { GroupService } from '../services/group.service';
import { GroupModel } from '../models/group.model';
import { GroupCreateRequest, GroupUpdateRequest } from '../models/requests/group-request.model';

export const GroupStore = signalStore(
  { providedIn: 'root' },
  ...createEntityStoreConfig<GroupModel, GroupCreateRequest, GroupUpdateRequest>({
    storeName: 'Gruppi',
    serviceToken: GroupService,
    showSuccessMessages: true,
    showErrorMessages: true,
  })
);
