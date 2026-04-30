import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagsStore } from '../store/tags.store';
import {
  randomTagColor,
  Tag,
  TAG_COLOR_PALETTE,
  TagCreateRequest,
  TagUpdateRequest,
  tagSlugify,
} from '../models/tag.model';

interface TagForm {
  name: string;
  slug: string;
  color: string;
}

@Component({
  selector: 'app-tags-admin-page',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule, TableModule, DialogModule,
    InputTextModule, TooltipModule, ConfirmDialogModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './tags-admin-page.html',
  styleUrl: './tags-admin-page.scss',
})
export class TagsAdminPage implements OnInit {
  readonly store = inject(TagsStore);
  private readonly confirm = inject(ConfirmationService);

  protected readonly palette = TAG_COLOR_PALETTE;

  dialogVisible = false;
  editingId = signal<string | null>(null);
  slugTouched = signal(false);

  form: TagForm = this.emptyForm();

  ngOnInit(): void {
    this.store.getAll$();
  }

  openNew(): void {
    this.editingId.set(null);
    this.slugTouched.set(false);
    this.form = this.emptyForm();
    this.dialogVisible = true;
  }

  openEdit(tag: Tag): void {
    this.editingId.set(tag.id);
    this.slugTouched.set(true);
    this.form = { name: tag.name, slug: tag.slug, color: tag.color };
    this.dialogVisible = true;
  }

  onNameChange(v: string): void {
    this.form.name = v;
    if (!this.slugTouched()) {
      this.form.slug = tagSlugify(v);
    }
  }

  onSlugChange(v: string): void {
    this.slugTouched.set(true);
    this.form.slug = tagSlugify(v);
  }

  pickColor(c: string): void { this.form.color = c; }

  save(): void {
    if (!this.isFormValid) return;
    const id = this.editingId();
    if (id) {
      this.store.edit$({ id, ...this.form } as TagUpdateRequest);
    } else {
      this.store.add$({ ...this.form } as TagCreateRequest);
    }
    this.dialogVisible = false;
  }

  askDelete(tag: Tag, ev: Event): void {
    this.confirm.confirm({
      target: ev.target as EventTarget,
      message: `Eliminare il tag "${tag.name}"? Verrà rimosso da tutti gli articoli.`,
      header: 'Conferma',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Elimina',
      rejectLabel: 'Annulla',
      accept: () => this.store.delete$(tag.id),
    });
  }

  get isFormValid(): boolean {
    return !!this.form.name.trim() && !!this.form.slug.trim() && !!this.form.color;
  }

  private emptyForm(): TagForm {
    return { name: '', slug: '', color: randomTagColor() };
  }
}
