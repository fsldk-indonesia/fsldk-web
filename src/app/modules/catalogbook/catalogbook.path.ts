export const catalogbookPath = {
  publicIndex: '/perpustakaan',
  publicDetail: (slug: string) => `/perpustakaan/${slug}`,
  index: '/cms/catalog-books',
  create: '/cms/catalog-books/form',
  edit: (id: number) => `/cms/catalog-books/form/${id}`,
};
