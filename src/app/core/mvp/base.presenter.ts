/**
 * Plumbing MVP minimal: presenter menyimpan referensi ke page yang meng-
 * implementasikan kontrak View-nya, lalu memanggil method di atasnya untuk
 * memperbarui UI. Page memanggil `attachView(this)` pada ngOnInit.
 */
export abstract class BasePresenter<TView> {
  protected view!: TView;

  attachView(view: TView): void {
    this.view = view;
  }
}
