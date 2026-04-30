export interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
  created_at: string;
}

export type TagCreateRequest = Omit<Tag, 'id' | 'created_at'>;

export type TagUpdateRequest = Partial<Omit<Tag, 'created_at'>> & {
  id: string;
};

export function tagSlugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);
}

export const TAG_COLOR_PALETTE = [
  '#ff8a95',
  '#ffb86b',
  '#f7d774',
  '#9ad26f',
  '#67d3c0',
  '#6fb6ff',
  '#9d8cff',
  '#d77cb8',
  '#a89f84',
  '#5a5140',
];

export function randomTagColor(): string {
  return TAG_COLOR_PALETTE[Math.floor(Math.random() * TAG_COLOR_PALETTE.length)];
}
