import { signalStore } from '@ngrx/signals';
import { createEntityStoreConfig } from '../../../core/store/base.store';
import { RaceMomentsService } from '../services/race-moments.service';
import { RaceMoment, RaceMomentCreateRequest, RaceMomentUpdateRequest } from '../models/race-moment.model';

export const RaceMomentsStore = signalStore(
  { providedIn: 'root' },
  ...createEntityStoreConfig<RaceMoment, RaceMomentCreateRequest, RaceMomentUpdateRequest>({
    storeName: 'MomentiDiCorsa',
    serviceToken: RaceMomentsService,
    showSuccessMessages: true,
    showErrorMessages: true,
  })
);
