import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from "../store/auth.store";
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { SimpleFormModel } from "../../../core/utils/simple-form-model.util";
import { LoginRequest } from "../models/requests/login.request";
import { InputTextModule } from "primeng/inputtext";
import { PasswordModule } from "primeng/password";
import { ButtonModule } from "primeng/button";
import { MessageModule } from "primeng/message";
import { globalPaths } from "../../_config/global-paths.config";

@Component({
  selector: 'app-login',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    FormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    MessageModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  public authStore = inject(AuthStore);
  fb = inject(NonNullableFormBuilder);
  readonly registerUrl = globalPaths.registerUrl;

  form = this.fb.group<SimpleFormModel<LoginRequest>>({
    email: this.fb.control<string>({ value: '', disabled: false }, [Validators.required, Validators.email]),
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
