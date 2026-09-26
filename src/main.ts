import { registerLocaleData } from '@angular/common';
import localeId from '@angular/common/locales/id';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Wajib didaftarkan supaya DatePipe('id-ID') (dipakai formatDate() di
// banyak halaman) tidak throw NG0701 — sebelumnya cuma "aman" karena
// pemanggilnya kebetulan selalu di belakang klik (openPreview), tidak
// pernah kena render path langsung.
registerLocaleData(localeId, 'id-ID');

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
