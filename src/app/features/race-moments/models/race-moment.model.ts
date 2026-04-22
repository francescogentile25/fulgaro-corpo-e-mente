export interface RaceMoment {
  id: string;
  image_url: string;
  label: string;
  description: string;
  span: string;
  order_index: number;
  created_at: string;
}

export interface RaceMomentCreateRequest {
  image_url: string;
  label: string;
  description: string;
  span: string;
  order_index: number;
}

export interface RaceMomentUpdateRequest {
  id: string;
  image_url: string;
  label: string;
  description: string;
  span: string;
  order_index: number;
}
