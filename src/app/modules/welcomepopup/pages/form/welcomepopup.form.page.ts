import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../../../shared/icon.component';
import { WelcomePopup } from '../../entities/welcome-popup';
import { WelcomepopupFormPresenter } from './welcomepopup.form.presenter';
import { WelcomepopupFormView } from './welcomepopup.form.view';

@Component({
  selector: 'app-welcomepopup-form-page',
  standalone: true,
  templateUrl: './welcomepopup.form.page.html',
  imports: [FormsModule, IconComponent],
  providers: [WelcomepopupFormPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    .form-card { display: flex; flex-direction: column; gap: 20px; }
    .popup-code-field { font-family: 'Courier New', monospace; font-size: .85rem; resize: vertical; }
    .form-actions { display: flex; justify-content: flex-end; gap: 10px; padding-top: 22px; margin-top: 4px; border-top: 1px solid var(--color-border); }
  `],
})
export class WelcomepopupFormPage implements OnInit, WelcomepopupFormView {
  private presenter = inject(WelcomepopupFormPresenter);

  loading = signal(true);
  saving = signal(false);

  isEnabled = false;
  htmlContent = '';
  jsContent = '';
  cssContent = '';

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.load();
  }

  save(): void {
    this.presenter.save({
      isEnabled: this.isEnabled, htmlContent: this.htmlContent, jsContent: this.jsContent, cssContent: this.cssContent,
    });
  }

  setForm(data: WelcomePopup): void {
    this.isEnabled = data.isEnabled;
    this.htmlContent = data.htmlContent;
    this.jsContent = data.jsContent;
    this.cssContent = data.cssContent;
  }
  setLoading(loading: boolean): void { this.loading.set(loading); }
  setSaving(saving: boolean): void { this.saving.set(saving); }
}
