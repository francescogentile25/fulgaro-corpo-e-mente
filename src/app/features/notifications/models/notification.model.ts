export type NotificationType =
  | 'esercizio_assegnato'
  | 'pagamento_ricevuto'
  | 'pagamento_scaduto'
  | 'custom';

export interface NotificationModel {
  id: string;
  destinatario_id: string;
  tipo: NotificationType;
  titolo: string;
  messaggio: string;
  letta: boolean;
  data_riferimento: string | null;
  ref_id: string | null;
  created_at: string;
}

export interface NotificationCreateRequest {
  destinatario_id: string;
  tipo: NotificationType;
  titolo: string;
  messaggio: string;
  data_riferimento?: string | null;
  ref_id?: string | null;
}
