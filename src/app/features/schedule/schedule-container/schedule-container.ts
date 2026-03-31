import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { FormsModule } from '@angular/forms';

import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { AvatarModule } from 'primeng/avatar';
import { SkeletonModule } from 'primeng/skeleton';

import { AtletaStore } from '../../athletes/store/atleta.store';
import { GroupStore } from '../../groups/store/group.store';
import { ProfileModel } from '../../auth/models/responses/profile.model';

@Component({
  selector: 'app-schedule-container',
  imports: [
    RouterOutlet, FormsModule,
    InputTextModule, SelectModule, AvatarModule, SkeletonModule,
  ],
  templateUrl: './schedule-container.html',
  styleUrl: './schedule-container.scss',
})
export class ScheduleContainer implements OnInit {

  atletaStore    = inject(AtletaStore);
  groupStore     = inject(GroupStore);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);

  searchText    = signal('');
  selectedGroup = signal<string | null>(null);

  // Segue la navigazione figlio per sapere quale atleta è selezionato
  selectedId = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => this.route.firstChild?.snapshot.paramMap.get('atletaId') ?? null),
      startWith(this.route.firstChild?.snapshot.paramMap.get('atletaId') ?? null),
    ),
    { initialValue: this.route.firstChild?.snapshot.paramMap.get('atletaId') ?? null }
  );

  hasChild = computed(() => !!this.selectedId());

  groupOptions = computed(() => [
    { label: 'Tutti i gruppi', value: null },
    ...this.groupStore.entities().map(g => ({ label: g.nome, value: g.id })),
  ]);

  filteredAtleti = computed(() => {
    const q   = this.searchText().toLowerCase().trim();
    const gId = this.selectedGroup();
    return this.atletaStore.entities().filter(a => {
      const matchText  = !q   || `${a.nome} ${a.cognome} ${a.email}`.toLowerCase().includes(q);
      const matchGroup = !gId || a.group_id === gId;
      return matchText && matchGroup;
    });
  });

  ngOnInit(): void {
    this.atletaStore.getAll$();
    this.groupStore.getAll$();
  }

  selectAtleta(atleta: ProfileModel): void {
    this.router.navigate([atleta.id], { relativeTo: this.route });
  }

  getInitials(atleta: ProfileModel): string {
    return `${atleta.nome.charAt(0)}${atleta.cognome.charAt(0)}`.toUpperCase();
  }

  getGroupName(groupId: string | null): string {
    if (!groupId) return '';
    return this.groupStore.entities().find(g => g.id === groupId)?.nome ?? '';
  }
}
