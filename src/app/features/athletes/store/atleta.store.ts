import { signalStore } from '@ngrx/signals';
import { createEntityStoreConfig } from '../../../core/store/base.store';
import { AtletaService } from '../services/atleta.service';
import { ProfileModel } from '../../auth/models/responses/profile.model';
import { AtletaUpdateRequest } from '../models/requests/atleta-request.model';

export const AtletaStore = signalStore(
  { providedIn: 'root' },
  ...createEntityStoreConfig<ProfileModel, never, AtletaUpdateRequest>({
    storeName: 'Atleti',
    serviceToken: AtletaService,
    showSuccessMessages: true,
    showErrorMessages: true,
  })
);
