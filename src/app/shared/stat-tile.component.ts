import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconComponent } from './icon.component';

/**
 * Kartu statistik ber-ikon dengan tautan navigasi opsional — dipakai widget
 * "Statistik" dashboard CMS (satu kartu per modul) dan bisa dipakai ulang di
 * mana pun butuh angka + ikon + label yang bisa diklik langsung ke modulnya.
 */
@Component({
  selector: 'app-stat-tile',
  standalone: true,
  imports: [IconComponent, RouterLink, NgClass],
  template: `
    <a [routerLink]="link" class="stat-tile stagger-in" [style.--stagger-i]="index">
      <span class="stat-tile-icon icon-badge md" [ngClass]="'icon-badge-' + variant">
        <app-icon [name]="icon" [size]="19" />
      </span>
      <span class="stat-tile-body">
        <span class="stat-tile-value">{{ value }}</span>
        <span class="stat-tile-label">{{ label }}</span>
      </span>
    </a>
  `,
  styles: [`
    .stat-tile {
      display: flex; align-items: center; gap: 14px; padding: 16px 18px; min-height: 84px;
      background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm); color: inherit; text-decoration: none;
      transition: transform var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) ease, border-color var(--motion-fast) ease;
    }
    .stat-tile:hover { transform: translateY(-3px); box-shadow: var(--shadow); border-color: var(--color-primary-soft); text-decoration: none; color: inherit; }
    .stat-tile-icon { flex-shrink: 0; }
    .stat-tile-body { display: flex; flex-direction: column; justify-content: center; gap: 3px; min-width: 0; flex: 1; }
    /* Nilai & label BOLEH melipat ke baris berikutnya (mis. "Rp600.000" atau
       "Format Laporan Keuangan") — sebelumnya dipotong paksa jadi "..." lewat
       white-space:nowrap/text-overflow:ellipsis, membuat sebagian teks tidak
       terbaca sama sekali di kartu sesempit ini. Kartu sekarang tumbuh
       vertikal (min-height, bukan height tetap) supaya tetap rapi walau ada
       yang 1 baris dan ada yang 2 baris dalam satu grid. */
    .stat-tile-value { font-family: var(--font-heading); font-weight: 800; font-size: 1.3rem; line-height: 1.25; color: var(--color-text); overflow-wrap: anywhere; }
    .stat-tile-label { font-size: .76rem; color: var(--color-text-secondary); font-weight: 600; line-height: 1.35; overflow-wrap: anywhere; }
  `],
})
export class StatTileComponent {
  @Input() icon = 'info';
  @Input() label = '';
  @Input() value: string | number = 0;
  @Input() link = '.';
  @Input() variant: 'solid' | 'soft' | 'gold' | 'ember' | 'info' | 'danger' = 'solid';
  @Input() index = 0;
}
