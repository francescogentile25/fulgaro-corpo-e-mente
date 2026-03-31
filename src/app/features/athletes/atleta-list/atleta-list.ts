import { Component, inject, OnInit, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { AtletaStore } from '../store/atleta.store';
import { GroupStore } from '../../groups/store/group.store';
import { ProfileModel } from '../../auth/models/responses/profile.model';
import { SimpleFormModel } from '../../../core/utils/simple-form-model.util';
import { globalPaths } from '../../_config/global-paths.config';

type AtletaFormData = {
  nome: string;
  cognome: string;
  group_id: string | null;
  attivo: boolean;
};

@Component({
  selector: 'app-atleta-list',
  imports: [
    RouterLink,
    ReactiveFormsModule, FormsModule,
    TableModule, ButtonModule, DialogModule,
    InputTextModule, MessageModule, SelectModule,
    ToggleSwitchModule, TooltipModule, TagModule,
  ],
  templateUrl: './atleta-list.html',
})
export class AtletaList implements OnInit {

  atletaStore = inject(AtletaStore);
  groupStore  = inject(GroupStore);
  fb          = inject(NonNullableFormBuilder);

  readonly scheduleUrl = globalPaths.schedeAtletaUrl;

  // Dialog modifica
  dialogVisible = false;
  editingAtleta: ProfileModel | null = null;

  // Dialog conferma eliminazione
  deleteVisible = false;
  atletaToDelete: ProfileModel | null = null;

  // Filtro testo
  searchText = '';

  // Opzioni select gruppo (include "Nessun gruppo")
  readonly groupOptions = computed(() => [
    { label: '— Nessun gruppo —', value: null },
    ...this.groupStore.entities().map(g => ({ label: g.nome, value: g.id })),
  ]);

  form = this.fb.group<SimpleFormModel<AtletaFormData>>({
    nome:     this.fb.control('', [Validators.required]),
    cognome:  this.fb.control('', [Validators.required]),
    group_id: this.fb.control<string | null>(null),
    attivo:   this.fb.control(true),
  });

  ngOnInit(): void {
    this.atletaStore.getAll$();
    this.groupStore.getAll$();
  }

  // ── Filtraggio ──────────────────────────────────────────

  get filteredAtleti(): ProfileModel[] {
    const q = this.searchText.toLowerCase().trim();
    if (!q) return this.atletaStore.entities();
    return this.atletaStore.entities().filter(a =>
      `${a.nome} ${a.cognome} ${a.email}`.toLowerCase().includes(q)
    );
  }

  // ── Edit ────────────────────────────────────────────────

  openEdit(atleta: ProfileModel): void {
    this.editingAtleta = atleta;
    this.form.patchValue({
      nome:     atleta.nome,
      cognome:  atleta.cognome,
      group_id: atleta.group_id,
      attivo:   atleta.attivo,
    });
    this.dialogVisible = true;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.editingAtleta) return;

    this.atletaStore.edit$({
      id: this.editingAtleta.id,
      ...this.form.getRawValue(),
    });
    this.dialogVisible = false;
  }

  // ── Toggle attivo rapido ─────────────────────────────────

  toggleAttivo(atleta: ProfileModel): void {
    this.atletaStore.edit$({
      id:       atleta.id,
      nome:     atleta.nome,
      cognome:  atleta.cognome,
      group_id: atleta.group_id,
      attivo:   !atleta.attivo,
    });
  }

  // ── Delete ───────────────────────────────────────────────

  confirmDelete(atleta: ProfileModel): void {
    this.atletaToDelete = atleta;
    this.deleteVisible  = true;
  }

  doDelete(): void {
    if (this.atletaToDelete) {
      this.atletaStore.delete$(this.atletaToDelete.id);
    }
    this.deleteVisible  = false;
    this.atletaToDelete = null;
  }

  // ── Helpers view ────────────────────────────────────────

  getGroupName(groupId: string | null): string {
    if (!groupId) return '—';
    return this.groupStore.entities().find(g => g.id === groupId)?.nome ?? '—';
  }
}
