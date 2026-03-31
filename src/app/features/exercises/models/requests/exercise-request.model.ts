import { TipoEsercizio, ModalitaEsercizio, SubtipoContinua } from '../exercise.model';

export type ExerciseBlockRequest = {
  ripetizioni: number;
  distanza_m: number;
  ritmo_obiettivo?: string | null;
  recupero_min?: number | null;
  tipo_recupero: 'passivo' | 'attivo';
}

export type ExerciseCreateRequest = {
  nome?: string | null;
  tipo: TipoEsercizio;
  modalita: ModalitaEsercizio;
  testo_libero?: string | null;
  subtipo_continua?: SubtipoContinua | null;
  durata_min?: number | null;
  distanza_km?: number | null;
  ritmo_obiettivo?: string | null;
  distanza_gara_km?: number | null;
  note?: string | null;
  created_by?: string | null;
  blocks?: ExerciseBlockRequest[];
}

export type ExerciseUpdateRequest = ExerciseCreateRequest & { id: string }
