export type ExerciseBlockModel = {
  id: string;
  exercise_id: string;
  ordine: number;
  ripetizioni: number;
  distanza_m: number;
  ritmo_obiettivo: string | null;
  recupero_min: number | null;
  tipo_recupero: 'passivo' | 'attivo';
}
