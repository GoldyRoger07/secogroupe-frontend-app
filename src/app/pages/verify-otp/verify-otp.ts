import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-verify-otp',
  imports: [
    ReactiveFormsModule,
    FloatLabelModule,
    InputTextModule,
    ButtonModule,
    MessageModule,
    TranslatePipe,
    RouterLink,
  ],
  templateUrl: './verify-otp.html',
  styleUrl: './verify-otp.css',
})
export class VerifyOtp implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  loading = signal(false);
  resendLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  email = signal('');

  form = this.fb.group({
    otpCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  ngOnInit(): void {
    const emailParam = this.route.snapshot.queryParamMap.get('email');
    if (!emailParam) {
      this.router.navigate(['/signup']);
      return;
    }
    this.email.set(emailParam);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.verifyOtp({ email: this.email(), otpCode: this.form.value.otpCode! }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/signin'], { queryParams: { verified: true } });
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 400) {
          this.errorMessage.set('VERIFY_OTP.ERROR_INVALID');
        } else if (err.status === 410) {
          this.errorMessage.set('VERIFY_OTP.ERROR_EXPIRED');
        } else {
          this.errorMessage.set('COMMON.ERROR_SERVER');
        }
      },
    });
  }

  resendCode(): void {
    this.resendLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.authService.resendVerification(this.email()).subscribe({
      next: () => {
        this.resendLoading.set(false);
        this.successMessage.set('VERIFY_OTP.RESEND_SUCCESS');
      },
      error: () => {
        this.resendLoading.set(false);
        this.errorMessage.set('COMMON.ERROR_SERVER');
      },
    });
  }
}
