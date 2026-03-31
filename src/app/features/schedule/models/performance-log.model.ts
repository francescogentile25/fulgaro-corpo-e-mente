export type PerformanceLogModel = {
  id: string;
  assignment_id: string;
  block_id: string | null;
  ripetizione_n: number;
  tempo_sec: number | null;
  tempo_display: string;
  inserito_da: string | null;
  created_at: string;
};

export type PerformanceLogInsert = {
  assignment_id: string;
  block_id: string;
  ripetizione_n: number;
  tempo_sec: number;
  tempo_display: string;
  inserito_da: string;
};
