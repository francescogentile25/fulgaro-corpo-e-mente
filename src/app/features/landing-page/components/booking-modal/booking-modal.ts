import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { BookingService } from '../../../../core/services/booking.service';

type State = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-booking-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './booking-modal.html',
  styleUrl: './booking-modal.scss',
})
export class BookingModal implements OnChanges {
  @Input()  open  = false;
  @Output() close = new EventEmitter<void>();

  private fb      = inject(FormBuilder);
  private booking = inject(BookingService);

  state = signal<State>('idle');

  form = this.fb.nonNullable.group({
    nome:      ['', Validators.required],
    cognome:   ['', Validators.required],
    email:     ['', [Validators.required, Validators.email]],
    messaggio: ['', Validators.required],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']?.currentValue === true) {
      this.form.reset();
      this.state.set('idle');
    }
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.state.set('loading');

    this.booking.send(this.form.getRawValue()).subscribe({
      next: () => {
        this.state.set('success');
        setTimeout(() => this.close.emit(), 2500);
      },
      error: () => this.state.set('error'),
    });
  }

  onBackdrop(ev: MouseEvent): void {
    if ((ev.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }

  hasError(field: string): boolean {
    const ctrl = this.form.get(field)!;
    return ctrl.invalid && ctrl.touched;
  }
}
