import { Component, Input, inject, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EditorComponent } from '@tinymce/tinymce-angular';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { UploadService } from '../core/services/upload.service';

/**
 * Editor WYSIWYG untuk field "Konten" Artikel & Berita — TinyMCE Community
 * (self-hosted via npm, TIDAK memakai TinyMCE Cloud/API key). Berkas
 * `node_modules/tinymce` disalin ke `dist/tinymce` lewat `angular.json`
 * (`assets`), dimuat lokal via `tinymceScriptSrc="tinymce/tinymce.min.js"`.
 * `license_key: 'gpl'` menyatakan penggunaan open-source (GPL-2.0-or-later),
 * bukan lisensi berbayar.
 */
@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  imports: [FormsModule, EditorComponent],
  template: `
    <editor
      tinymceScriptSrc="tinymce/tinymce.min.js"
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
    license_key: 'gpl',
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
