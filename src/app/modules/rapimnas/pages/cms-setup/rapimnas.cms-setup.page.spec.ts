import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { RapimnasCmsSetupPage } from './rapimnas.cms-setup.page';
import { RapimnasCmsSetupPresenter } from './rapimnas.cms-setup.presenter';
import { RapimnasRepository } from '../../repositories/rapimnas.repository';
import { ToastService } from '../../../../core/services/toast.service';
import { RapimnasCms, RapimnasUpdatePayload } from '../../entities/rapimnas';

/**
 * Covers RapimnasCmsSetupPage.buildPayload() — the most complex logic in the
 * rapimnas module (6 repeaters reindexed by array position, price coercion,
 * contact split/merge by type). buildPayload() is private, so it's exercised
 * through the public save() -> presenter.save(payload) path, matching how the
 * component itself calls it; presenter.save() is spied so the presenter's own
 * behaviour (already covered by rapimnas.cms-setup.presenter.spec.ts) does
 * not need to run here.
 */
describe('RapimnasCmsSetupPage - buildPayload()', () => {
  let component: RapimnasCmsSetupPage;
  let presenter: RapimnasCmsSetupPresenter;
  let repo: jasmine.SpyObj<RapimnasRepository>;
  let toast: jasmine.SpyObj<ToastService>;

  // sortOrder values are deliberately out of order / non-sequential on every
  // repeater so the test can only pass if buildPayload() truly recomputes
  // sortOrder from array position rather than copying the input's sortOrder.
  const sample: RapimnasCms = {
    heroBadgeText: 'Diponegoro\'s Spirit',
    heroTitle: 'Rapimnas FSLDK 2026',
    heroDateRangeText: '1-3 November 2026',
    heroTaglineQuote: 'Satukan Langkah, Teguhkan Dakwah',
    heroImageUrl: null,
    countdownTargetDate: '2026-11-15T09:30:00.000Z',
    feature1IconKey: 'star',
    feature1Title: 'Fitur 1',
    feature1Desc: 'Deskripsi fitur 1',
    feature2IconKey: 'calendar',
    feature2Title: 'Fitur 2',
    feature2Desc: 'Deskripsi fitur 2',
    ctaTitle: 'Gabung Sekarang',
    ctaDescription: 'Deskripsi CTA',
    ctaButtonLabel: 'Daftar',
    ctaMascotImageUrl: null,
    footerContactEmail: 'rapimnas@fsldk.or.id',
    footerCopyrightText: '(c) 2026 FSLDK',
    footerIgHandle: '@rapimnas',
    footerIgUrl: 'https://instagram.com/rapimnas',
    footerTiktokHandle: '@rapimnas',
    footerTiktokUrl: 'https://tiktok.com/@rapimnas',
    jadwalHeaderSubtitle: 'Rundown Acara',
    tentangTaglineQuote: 'Tagline Tentang',
    tentangDescParagraph1: 'Paragraf 1',
    tentangDescParagraph2: 'Paragraf 2',
    tentangVisiText: 'Visi FSLDK',
    tentangMisi: ['Misi Satu', 'Misi Dua'],
    tentangTujuan: ['Tujuan Satu', 'Tujuan Dua'],
    tentangKegiatan: ['Kegiatan Satu', 'Kegiatan Dua'],
    pesertaEarlyBirdDateRange: '1-10 Oktober 2026',
    pesertaRegulerDateRange: '11-20 Oktober 2026',
    pesertaHargaNonSemarangEarlyBird: 150000,
    pesertaHargaNonSemarangReguler: 200000,
    pesertaHargaSemarangEarlyBird: 100000,
    pesertaHargaSemarangReguler: 150000,
    pesertaBankName: 'BCA',
    pesertaBankAccountNumber: '1234567890',
    pesertaBankAccountHolder: 'FSLDK Pusat',
    pesertaGuidebookUrl: 'https://fsldk.or.id/guidebook.pdf',
    pesertaGoogleFormUrl: 'https://forms.gle/xxx',
    pesertaMapEmbedUrl: 'https://maps.google.com/embed',
    panitiaIsOpen: true,
    panitiaClosedMessage: '',
    galleryImages: [
      { imageUrl: 'gallery-a.jpg', sortOrder: 9 },
      { imageUrl: 'gallery-b.jpg', sortOrder: 1 },
    ],
    homeCards: [
      { iconKey: 'star', title: 'Card A', description: 'Desc A', sortOrder: 5 },
      { iconKey: 'calendar', title: 'Card B', description: 'Desc B', sortOrder: 2 },
    ],
    rundownDays: [
      {
        dayLabel: 'Hari 1',
        dateText: '1 November 2026',
        sortOrder: 7,
        events: [
          { time: '08:00', title: 'Event A', description: 'Desc A', venue: 'Aula', sortOrder: 4 },
          { time: '09:00', title: 'Event B', description: 'Desc B', venue: 'Aula', sortOrder: 1 },
        ],
      },
      {
        dayLabel: 'Hari 2',
        dateText: '2 November 2026',
        sortOrder: 3,
        events: [
          { time: '10:00', title: 'Event C', description: 'Desc C', venue: 'Hall', sortOrder: 6 },
          { time: '11:00', title: 'Event D', description: 'Desc D', venue: 'Hall', sortOrder: 0 },
        ],
      },
    ],
    resources: [
      { title: 'Resource A', description: 'Desc A', iconKey: 'file', url: 'a.pdf', buttonLabel: 'Unduh', isVisible: true, sortOrder: 8 },
      { title: 'Resource B', description: 'Desc B', iconKey: 'file', url: 'b.pdf', buttonLabel: 'Unduh', isVisible: true, sortOrder: 3 },
    ],
    pickupLocations: [
      { name: 'Lokasi A', type: 'bus', description: 'Desc A', mapLink: 'https://maps/a', sortOrder: 6 },
      { name: 'Lokasi B', type: 'train', description: 'Desc B', mapLink: 'https://maps/b', sortOrder: 2 },
    ],
    contacts: [
      { contactType: 'peserta_cp', name: 'CP A', phoneNumber: '081100000001', sortOrder: 5 },
      { contactType: 'footer_wa', name: 'WA A', phoneNumber: '081200000001', sortOrder: 9 },
      { contactType: 'peserta_cp', name: 'CP B', phoneNumber: '081100000002', sortOrder: 1 },
      { contactType: 'footer_wa', name: 'WA B', phoneNumber: '081200000002', sortOrder: 0 },
    ],
    updatedDate: '2026-10-01T00:00:00.000Z',
    updatedBy: 1,
  };

  beforeEach(() => {
    repo = jasmine.createSpyObj('RapimnasRepository', ['get', 'update']);
    toast = jasmine.createSpyObj('ToastService', ['success', 'error']);
    repo.get.and.returnValue(of(sample));

    TestBed.configureTestingModule({
      imports: [RapimnasCmsSetupPage],
      providers: [
        { provide: RapimnasRepository, useValue: repo },
        { provide: ToastService, useValue: toast },
      ],
    });

    // Intentionally not calling fixture.detectChanges(): this test only needs
    // the component instance + its own injector-scoped presenter, not a
    // rendered view (rendering would instantiate child upload components
    // that need HttpClient/UploadService wiring unrelated to this test).
    const fixture = TestBed.createComponent(RapimnasCmsSetupPage);
    component = fixture.componentInstance;
    presenter = fixture.debugElement.injector.get(RapimnasCmsSetupPresenter);
  });

  function savedPayload(): RapimnasUpdatePayload {
    const spy = presenter.save as jasmine.Spy;
    expect(spy).toHaveBeenCalledTimes(1);
    return spy.calls.mostRecent().args[0] as RapimnasUpdatePayload;
  }

  it('recomputes sortOrder by array position for every repeater, including nested rundown events', () => {
    spyOn(presenter, 'save');
    component.setForm(sample);

    component.save();
    const payload = savedPayload();

    // Note on expected order below: setForm() first sorts each repeater
    // ascending by the INPUT sortOrder (so the form displays items in their
    // persisted order), then buildPayload() reindexes that sorted array by
    // position. The sample's sortOrder values were chosen out of declaration
    // order specifically so this test fails if either step regresses: a
    // broken sort would leave declaration order instead of sortOrder-ascending
    // order, and a broken reindex would leave gaps/duplicates instead of
    // clean 0,1,2...

    // galleryImages: input sortOrder 9 (gallery-a), 1 (gallery-b) -> sorted
    // ascending -> gallery-b first -> reindexed 0,1.
    expect(payload.galleryImages.map((g) => g.sortOrder)).toEqual([0, 1]);
    expect(payload.galleryImages.map((g) => g.imageUrl)).toEqual(['gallery-b.jpg', 'gallery-a.jpg']);

    // homeCards: input sortOrder 5 (Card A), 2 (Card B) -> Card B first.
    expect(payload.homeCards.map((c) => c.sortOrder)).toEqual([0, 1]);
    expect(payload.homeCards.map((c) => c.title)).toEqual(['Card B', 'Card A']);

    // resources: input sortOrder 8 (Resource A), 3 (Resource B) -> Resource B first.
    expect(payload.resources.map((r) => r.sortOrder)).toEqual([0, 1]);
    expect(payload.resources.map((r) => r.title)).toEqual(['Resource B', 'Resource A']);

    // pickupLocations: input sortOrder 6 (Lokasi A), 2 (Lokasi B) -> Lokasi B first.
    expect(payload.pickupLocations.map((p) => p.sortOrder)).toEqual([0, 1]);
    expect(payload.pickupLocations.map((p) => p.name)).toEqual(['Lokasi B', 'Lokasi A']);

    // rundownDays: input sortOrder 7 (Hari 1), 3 (Hari 2) -> Hari 2 first.
    expect(payload.rundownDays.map((d) => d.sortOrder)).toEqual([0, 1]);
    expect(payload.rundownDays.map((d) => d.dayLabel)).toEqual(['Hari 2', 'Hari 1']);

    // ...and each day's nested events independently reindexed from 0, not
    // sharing a running counter across days. Hari 2's events: sortOrder 6
    // (Event C), 0 (Event D) -> Event D first. Hari 1's events (now second
    // day): sortOrder 4 (Event A), 1 (Event B) -> Event B first.
    expect(payload.rundownDays[0].events.map((e) => e.sortOrder)).toEqual([0, 1]);
    expect(payload.rundownDays[0].events.map((e) => e.title)).toEqual(['Event D', 'Event C']);
    expect(payload.rundownDays[1].events.map((e) => e.sortOrder)).toEqual([0, 1]);
    expect(payload.rundownDays[1].events.map((e) => e.title)).toEqual(['Event B', 'Event A']);
  });

  it('preserves the Tentang string-list arrays in their given order (no sortOrder field to recompute)', () => {
    spyOn(presenter, 'save');
    component.setForm(sample);

    component.save();
    const payload = savedPayload();

    expect(payload.tentangMisi).toEqual(['Misi Satu', 'Misi Dua']);
    expect(payload.tentangTujuan).toEqual(['Tujuan Satu', 'Tujuan Dua']);
    expect(payload.tentangKegiatan).toEqual(['Kegiatan Satu', 'Kegiatan Dua']);
  });

  it('splits contacts into pesertaCpContacts/footerWaContacts on load, then re-merges and reindexes each group independently on save', () => {
    spyOn(presenter, 'save');
    component.setForm(sample);

    component.save();
    const payload = savedPayload();

    expect(payload.contacts.length).toBe(4);

    const cp = payload.contacts.filter((c) => c.contactType === 'peserta_cp');
    const wa = payload.contacts.filter((c) => c.contactType === 'footer_wa');

    // extractContacts() (called from setForm) sorts each type ascending by
    // the input sortOrder before the component stores it: peserta_cp input
    // sortOrder 5 (CP A), 1 (CP B) -> CP B first; footer_wa input sortOrder
    // 9 (WA A), 0 (WA B) -> WA B first. buildPayload() then reindexes each
    // group independently from 0 on save.
    expect(cp.map((c) => c.sortOrder)).toEqual([0, 1]);
    expect(cp.map((c) => c.name)).toEqual(['CP B', 'CP A']);
    expect(cp.map((c) => c.phoneNumber)).toEqual(['081100000002', '081100000001']);

    expect(wa.map((c) => c.sortOrder)).toEqual([0, 1]);
    expect(wa.map((c) => c.name)).toEqual(['WA B', 'WA A']);
    expect(wa.map((c) => c.phoneNumber)).toEqual(['081200000002', '081200000001']);
  });

  it('coerces a null price field to 0 while passing other numeric price fields through unchanged', () => {
    spyOn(presenter, 'save');
    component.setForm(sample);
    component.pesertaHargaNonSemarangEarlyBird = null;

    component.save();
    const payload = savedPayload();

    expect(payload.pesertaHargaNonSemarangEarlyBird).toBe(0);
    expect(payload.pesertaHargaNonSemarangReguler).toBe(200000);
    expect(payload.pesertaHargaSemarangEarlyBird).toBe(100000);
    expect(payload.pesertaHargaSemarangReguler).toBe(150000);
  });
});
