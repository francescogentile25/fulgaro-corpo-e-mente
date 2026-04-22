import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { RaceMomentsStore } from '../store/race-moments.store';
import { RaceMomentsService } from '../services/race-moments.service';
import { RaceMoment, RaceMomentCreateRequest, RaceMomentUpdateRequest } from '../models/race-moment.model';

interface SpanOption { label: string; value: string; }

interface MomentForm {
  image_url: string;
  label: string;
  description: string;
  span: string;
  order_index: number;
}

@Component({
  selector: 'app-race-moments-admin-page',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule, TableModule, DialogModule,
    InputTextModule, TextareaModule, SelectModule,
    InputNumberModule, TooltipModule,
  ],
  templateUrl: './race-moments-admin-page.html',
})
export class RaceMomentsAdminPage implements OnInit {
  readonly store = inject(RaceMomentsStore);
  private readonly service = inject(RaceMomentsService);

  dialogVisible = false;
  editingId = signal<string | null>(null);
  uploading = signal(false);
  previewUrl = signal<string | null>(null);
  pendingFile = signal<File | null>(null);

  form: MomentForm = this.emptyForm();

  readonly spanOptions: SpanOption[] = [
    { label: 'Normale (1×1)',  value: 'col-span-1 row-span-1' },
    { label: 'Alto (1×2)',     value: 'col-span-1 row-span-2' },
    { label: 'Largo (2×1)',    value: 'col-span-2 row-span-1' },
    { label: 'Grande (2×2)',   value: 'col-span-2 row-span-2' },
  ];

  ngOnInit(): void {
    this.store.getAll$();
  }

  openNew(): void {
    this.editingId.set(null);
    this.form = this.emptyForm();
    this.previewUrl.set(null);
    this.pendingFile.set(null);
    this.dialogVisible = true;
  }

  openEdit(m: RaceMoment): void {
    this.editingId.set(m.id);
    this.form = {
      image_url: m.image_url,
      label: m.label,
      description: m.description,
      span: m.span,
      order_index: m.order_index,
    };
    this.previewUrl.set(m.image_url);
    this.pendingFile.set(null);
    this.dialogVisible = true;
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.pendingFile.set(file);
    const reader = new FileReader();
    reader.onload = (e) => this.previewUrl.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  async save(): Promise<void> {
    this.uploading.set(true);
    try {
      let imageUrl = this.form.image_url;
      const file = this.pendingFile();
      if (file) {
        imageUrl = await this.service.uploadImage(file);
      }
      const id = this.editingId();
      if (id) {
        this.store.edit$({ id, ...this.form, image_url: imageUrl } as RaceMomentUpdateRequest);
      } else {
        this.store.add$({ ...this.form, image_url: imageUrl } as RaceMomentCreateRequest);
      }
      this.dialogVisible = false;
    } finally {
      this.uploading.set(false);
    }
  }

  askDelete(m: RaceMoment): void {
    this.store.delete$(m.id);
  }

  spanLabel(span: string): string {
    return this.spanOptions.find(o => o.value === span)?.label ?? span;
  }

  get isFormValid(): boolean {
    return !!this.previewUrl() && !!this.form.label && !!this.form.description;
  }

  private emptyForm(): MomentForm {
    return {
      image_url: '',
      label: '',
      description: '',
      span: 'col-span-1 row-span-1',
      order_index: this.store.entities().length,
    };
  }
}
