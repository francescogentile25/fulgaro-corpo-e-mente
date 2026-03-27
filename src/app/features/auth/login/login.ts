import { Component, inject } from '@angular/core';
import { AuthStore } from "../store/auth.store";
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { SimpleFormModel } from "../../../core/utils/simple-form-model.util";
import { LoginRequest } from "../models/requests/login.request";

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  public authStore = inject(AuthStore);
  fb = inject(NonNullableFormBuilder);

  form = this.fb.group<SimpleFormModel<LoginRequest>>({
    username: this.fb.control<string>({ value: '', disabled: false }, [Validators.required]),
    password: this.fb.control<string>({ value: '', disabled: false }, [Validators.required]),
  });

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const request = this.form.getRawValue();
    this.authStore.login$(request);
  }
}
