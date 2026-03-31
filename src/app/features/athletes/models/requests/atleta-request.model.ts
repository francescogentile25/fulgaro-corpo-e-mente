export type AtletaUpdateRequest = {
  id: string;
  nome: string;
  cognome: string;
  group_id: string | null;
  attivo: boolean;
}
