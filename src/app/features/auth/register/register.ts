import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AbstractControl, FormsModule, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../services/auth.service';
import { globalPaths } from '../../_config/global-paths.config';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirm  = control.get('confirmPassword')?.value;
  return password && confirm && password !== confirm ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-register',
  imports: [
    RouterLink, ReactiveFormsModule, FormsModule,
    InputTextModule, PasswordModule, ButtonModule, MessageModule,
  ],
  templateUrl: './register.html',
})
export class Register {
  private authService    = inject(AuthService);
  private router         = inject(Router);
  private messageService = inject(MessageService);
  private fb             = inject(NonNullableFormBuilder);

  readonly loginUrl = globalPaths.loginUrl;

  loading       = signal(false);
  emailSent     = signal(false);

  form = this.fb.group(
    {
      nome:            this.fb.control('', [Validators.required]),
      cognome:         this.fb.control('', [Validators.required]),
      email:           this.fb.control('', [Validators.required, Validators.email]),
      password:        this.fb.control('', [Validators.required, Validators.minLength(6)]),
      confirmPassword: this.fb.control('', [Validators.required]),
    },
    { validators: passwordMatchValidator }
  );

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const { nome, cognome, email, password } = this.form.getRawValue();

    const { data, error } = await this.authService.register({ nome, cognome, email, password });

    this.loading.set(false);

    if (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Errore registrazione',
        detail: error.message,
      });
      return;
    }

    if (data.session) {
      // Email confirmation disabilitata → sessione attiva subito
      this.messageService.add({
        severity: 'success',
        summary: 'Registrazione completata',
        detail: 'Account creato. Attendi che l\'admin attivi il tuo profilo.',
      });
      this.router.navigateByUrl(globalPaths.loginUrl);
    } else {
      // Email confirmation abilitata → mostra messaggio
      this.emailSent.set(true);
    }
  }
}
