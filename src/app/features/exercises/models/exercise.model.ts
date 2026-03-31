import { ExerciseBlockModel } from './exercise-block.model';

export type TipoEsercizio    = 'intervallato' | 'continua' | 'potenziamento' | 'riposo' | 'gara';
export type ModalitaEsercizio = 'strutturato' | 'testo_libero';
export type SubtipoContinua   = 'easy' | 'lungo' | 'progressione' | 'tempo';

export type ExerciseModel = {
  id: string;
  nome: string | null;
  tipo: TipoEsercizio;
  modalita: ModalitaEsercizio;
  testo_libero: string | null;
  subtipo_continua: SubtipoContinua | null;
  durata_min: number | null;
  distanza_km: number | null;
  ritmo_obiettivo: string | null;
  distanza_gara_km: number | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
  exercise_blocks: ExerciseBlockModel[];
}
