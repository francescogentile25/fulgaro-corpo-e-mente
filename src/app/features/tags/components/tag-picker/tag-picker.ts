import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { TagsStore } from '../../store/tags.store';
import { TagsService } from '../../services/tags.service';
import {
  randomTagColor,
  Tag,
  tagSlugify,
  TAG_COLOR_PALETTE,
} from '../../models/tag.model';

@Component({
  selector: 'app-tag-picker',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './tag-picker.html',
  styleUrl: './tag-picker.scss',
})
export class TagPicker implements OnInit {
  // ─── Public API ────────────────────────────────────────────────
  readonly selected = input<Tag[]>([]);
  readonly selectedChange = output<Tag[]>();
  readonly compact = input(false);

  // ─── Deps ──────────────────────────────────────────────────────
  protected readonly store = inject(TagsStore);
  private readonly service = inject(TagsService);
  private readonly messages = inject(MessageService);

  // ─── State ─────────────────────────────────────────────────────
  protected readonly query = signal('');
  protected readonly open = signal(false);
  protected readonly creating = signal(false);
  protected readonly internalSelected = signal<Tag[]>([]);

  protected readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  protected readonly rootRef = viewChild<ElementRef<HTMLElement>>('rootEl');

  protected readonly palette = TAG_COLOR_PALETTE;

  protected readonly availableTags = computed(() => {
    const q = this.query().trim().toLowerCase();
    const selectedIds = new Set(this.internalSelected().map(t => t.id));
    return this.store.entities()
      .filter(t => !selectedIds.has(t.id))
      .filter(t => !q || t.name.toLowerCase().includes(q));
  });

  protected readonly canCreateNew = computed(() => {
    const q = this.query().trim();
    if (q.length < 1) return false;
    const lower = q.toLowerCase();
    return !this.store.entities().some(t => t.name.toLowerCase() === lower);
  });

  constructor() {
    effect(() => {
      this.internalSelected.set(this.selected() ?? []);
    });
  }

  ngOnInit(): void {
    if (this.store.entities().length === 0) {
      this.store.getAll$();
    }
  }

  // ─── Selection ─────────────────────────────────────────────────

  protected toggle(tag: Tag): void {
    const current = this.internalSelected();
    const exists = current.some(t => t.id === tag.id);
    const next = exists ? current.filter(t => t.id !== tag.id) : [...current, tag];
    this.internalSelected.set(next);
    this.selectedChange.emit(next);
  }

  protected remove(tag: Tag, event?: Event): void {
    event?.stopPropagation();
    const next = this.internalSelected().filter(t => t.id !== tag.id);
    this.internalSelected.set(next);
    this.selectedChange.emit(next);
  }

  protected isSelected(tag: Tag): boolean {
    return this.internalSelected().some(t => t.id === tag.id);
  }

  // ─── Inline create ─────────────────────────────────────────────

  protected async createInline(): Promise<void> {
    const name = this.query().trim();
    if (!name || this.creating()) return;
    this.creating.set(true);
    try {
      const newTag = await this.service.add({
        name,
        slug: tagSlugify(name),
        color: randomTagColor(),
      }).toPromise();
      if (!newTag) throw new Error('Creazione fallita');

      this.store.addOne(newTag);

      const next = [...this.internalSelected(), newTag];
      this.internalSelected.set(next);
      this.selectedChange.emit(next);

      this.query.set('');
      this.inputRef()?.nativeElement.focus();
    } catch (err: any) {
      this.messages.add({
        severity: 'error',
        summary: 'Errore',
        detail: err?.message ?? 'Impossibile creare il tag',
      });
    } finally {
      this.creating.set(false);
    }
  }

  // ─── Dropdown control ──────────────────────────────────────────

  protected focusInput(): void {
    this.inputRef()?.nativeElement.focus();
  }

  protected onFocus(): void { this.open.set(true); }

  protected onBlur(): void {
    setTimeout(() => this.open.set(false), 150);
  }

  protected onKeyDown(ev: KeyboardEvent): void {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      const list = this.availableTags();
      if (list.length > 0) {
        this.toggle(list[0]);
        this.query.set('');
      } else if (this.canCreateNew()) {
        this.createInline();
      }
    } else if (ev.key === 'Backspace' && !this.query() && this.internalSelected().length > 0) {
      const last = this.internalSelected()[this.internalSelected().length - 1];
      this.remove(last);
    } else if (ev.key === 'Escape') {
      this.open.set(false);
      this.inputRef()?.nativeElement.blur();
    }
  }
}
