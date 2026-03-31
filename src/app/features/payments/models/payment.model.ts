export type PaymentStato = 'non_pagato' | 'comunicato' | 'confermato';

export const MESI_IT = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

export function getMeseLabel(mese: number): string {
  return MESI_IT[mese - 1] ?? '';
}

export interface PaymentModel {
  id: string;
  atleta_id: string;
  mese: number;
  anno: number;
  stato: PaymentStato;
  comunicato_at: string | null;
  confermato_at: string | null;
  note: string | null;
  created_at: string;
}

export interface PaymentWithAtleta extends PaymentModel {
  atleta: { nome: string; cognome: string } | null;
  /** true = record virtuale, non esiste in DB (atleta non ha ancora pagato) */
  isVirtual?: boolean;
}
