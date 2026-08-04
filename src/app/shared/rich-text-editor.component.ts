import { Component, Input, inject, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EditorComponent, TINYMCE_SCRIPT_SRC } from '@tinymce/tinymce-angular';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { UploadService } from '../core/services/upload.service';

/**
 * Editor WYSIWYG untuk field "Konten" Artikel & Berita — TinyMCE Community
 * (self-hosted via npm, TIDAK memakai TinyMCE Cloud/API key). Berkas
 * `node_modules/tinymce` disalin ke `dist/tinymce` lewat `angular.json`
 * (`assets`). Lokasi skrip lokal WAJIB disuntik lewat token DI
 * `TINYMCE_SCRIPT_SRC` — `<editor tinymceScriptSrc="...">` sebagai atribut
 * template TIDAK berfungsi karena bukan `@Input()` pada versi wrapper ini,
 * hanya parameter constructor yang di-resolve lewat DI (kalau tidak
 * disuntik, editor diam-diam jatuh ke TinyMCE Cloud dan menampilkan
 * nag "Add your API key"). `licenseKey="gpl"` menyatakan penggunaan
 * edisi open-source (GPL-2.0-or-later), bukan lisensi berbayar.
 */
@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  imports: [FormsModule, EditorComponent],
  providers: [{ provide: TINYMCE_SCRIPT_SRC, useValue: 'tinymce/tinymce.min.js' }],
  template: `
    <editor
      licenseKey="gpl"
      [init]="editorConfig"
      [(ngModel)]="value"
      (ngModelChange)="valueChange.emit($event)">
    </editor>
  `,
})
export class RichTextEditorComponent {
  @Input() value = '';
  readonly valueChange = output<string>();

  private uploadService = inject(UploadService);

  editorConfig = {
    height: 420,
    menubar: false,
    branding: false,
    promotion: false,
    plugins: 'lists link image table code wordcount autolink',
    toolbar: 'undo redo | blocks | bold italic underline | bullist numlist | link image table | removeformat | code',
    content_style: 'body { font-family: Manrope, Arial, sans-serif; font-size: 15px; }',
    images_upload_handler: (blobInfo: { blob(): Blob; filename(): string }) =>
      firstValueFrom(this.uploadService.uploadImage(blobInfo.blob(), blobInfo.filename()).pipe(map((r) => r.url))),
  };
}
