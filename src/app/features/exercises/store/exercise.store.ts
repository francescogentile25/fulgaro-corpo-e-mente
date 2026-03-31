import { signalStore } from '@ngrx/signals';
import { createEntityStoreConfig } from '../../../core/store/base.store';
import { ExerciseService } from '../services/exercise.service';
import { ExerciseModel } from '../models/exercise.model';
import { ExerciseCreateRequest, ExerciseUpdateRequest } from '../models/requests/exercise-request.model';

export const ExerciseStore = signalStore(
  { providedIn: 'root' },
  ...createEntityStoreConfig<ExerciseModel, ExerciseCreateRequest, ExerciseUpdateRequest>({
    storeName: 'Esercizi',
    serviceToken: ExerciseService,
    showSuccessMessages: true,
    showErrorMessages: true,
  })
);
