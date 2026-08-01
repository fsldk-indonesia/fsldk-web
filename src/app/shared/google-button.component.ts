import { Component, ElementRef, Input, OnInit, output, viewChild } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Tombol "Masuk/Daftar dengan Google" berbasis Google Identity Services.
 * Merender tombol resmi Google (bukan tombol kustom) agar alur ID Token
 * (One Tap / popup) ditangani langsung oleh library Google — tidak perlu
 * menyimpan client secret atau menangani redirect OAuth secara manual.
 *
 * Bila `environment.googleClientId` kosong, komponen tidak merender apa pun;
 * halaman pemanggil (login/register) menampilkan tombol placeholder sendiri.
 */
@Component({
  selector: 'app-google-button',
  standalone: true,
  template: `<div #container class="google-btn-container"></div>`,
  styles: [`.google-btn-container { display: flex; justify-content: center; }`],
})
export class GoogleButtonComponent implements OnInit {
  @Input() text: 'signin_with' | 'signup_with' = 'signin_with';
  readonly credential = output<string>();

  private container = viewChild.required<ElementRef<HTMLDivElement>>('container');

  readonly clientId = environment.googleClientId;

  ngOnInit(): void {
    if (!this.clientId) return;
    this.waitForGsi(() => this.render());
  }

  private waitForGsi(done: () => void, attempts = 0): void {
    if (window.google?.accounts?.id) { done(); return; }
    if (attempts > 40) return; // ~10 detik — script gagal dimuat (mis. diblokir jaringan)
    setTimeout(() => this.waitForGsi(done, attempts + 1), 250);
  }

  private render(): void {
    const google = window.google;
    if (!google) return;
    google.accounts.id.initialize({
      client_id: this.clientId,
      callback: (res) => this.credential.emit(res.credential),
      itp_support: true,
    });
    google.accounts.id.renderButton(this.container().nativeElement, {
      theme: 'outline',
      size: 'large',
      shape: 'pill',
      text: this.text,
      width: 320,
    });
  }
}
