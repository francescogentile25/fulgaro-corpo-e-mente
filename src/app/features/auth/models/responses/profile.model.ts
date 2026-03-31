export type ProfileModel = {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  ruolo: 'admin' | 'atleta';
  group_id: string | null;
  attivo: boolean;
  created_at: string;
}
