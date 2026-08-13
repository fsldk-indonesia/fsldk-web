import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/toast.component';
import { AlertDialogComponent } from './shared/alert-dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent, AlertDialogComponent],
  template: `<router-outlet /><app-toast /><app-alert-dialog />`,
})
export class AppComponent {}
