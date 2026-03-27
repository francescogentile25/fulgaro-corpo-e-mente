export type UserResponse = {
  id: string;
  matricola: string;
  email: string;
  nome: string;
  cognome: string;
  numeroDiTelefono: string;
  isLdap: boolean;
  isDeleted: boolean;
  ruoli: string[];
}
