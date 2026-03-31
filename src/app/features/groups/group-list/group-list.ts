import { Component, inject, OnInit } from '@angular/core';
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TooltipModule } from 'primeng/tooltip';
import { GroupStore } from '../store/group.store';
import { GroupModel } from '../models/group.model';
import { SimpleFormModel } from '../../../core/utils/simple-form-model.util';

type GroupFormData = { nome: string };

@Component({
  selector: 'app-group-list',
  imports: [
    ReactiveFormsModule, FormsModule,
    TableModule, ButtonModule, DialogModule,
    InputTextModule, MessageModule, TooltipModule,
    DatePipe,
  ],
  templateUrl: './group-list.html',
})
export class GroupList implements OnInit {

  store = inject(GroupStore);
  fb    = inject(NonNullableFormBuilder);

  // Dialog crea/modifica
  dialogVisible  = false;
  editingGroup: GroupModel | null = null;

  // Dialog conferma eliminazione
  deleteVisible  = false;
  groupToDelete: GroupModel | null = null;

  form = this.fb.group<SimpleFormModel<GroupFormData>>({
    nome: this.fb.control('', [Validators.required, Validators.minLength(2)])
  });

  ngOnInit(): void {
    this.store.getAll$();
  }

  // ── Create / Edit ────────────────────────────────────────

  openCreate(): void {
    this.editingGroup = null;
    this.form.reset();
    this.dialogVisible = true;
  }

  openEdit(group: GroupModel): void {
    this.editingGroup = group;
    this.form.patchValue({ nome: group.nome });
    this.dialogVisible = true;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { nome } = this.form.getRawValue();

    if (this.editingGroup) {
      this.store.edit$({ id: this.editingGroup.id, nome });
    } else {
      this.store.add$({ nome });
    }
    this.dialogVisible = false;
  }

  // ── Delete ───────────────────────────────────────────────

  confirmDelete(group: GroupModel): void {
    this.groupToDelete = group;
    this.deleteVisible = true;
  }

  doDelete(): void {
    if (this.groupToDelete) {
      this.store.delete$(this.groupToDelete.id);
    }
    this.deleteVisible = false;
    this.groupToDelete = null;
  }
}
