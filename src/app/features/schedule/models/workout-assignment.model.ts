import { ExerciseModel } from '../../exercises/models/exercise.model';

export type WorkoutAssignmentModel = {
  id: string;
  exercise_id: string;
  atleta_id: string;
  data_workout: string; // 'YYYY-MM-DD'
  completato: boolean;
  note_atleta: string | null;
  assigned_by: string | null;
  created_at: string;
  exercise: ExerciseModel;
};
