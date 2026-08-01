export const newsPath = {
  publicIndex: '/berita',
  publicDetail: (slug: string) => `/berita/${slug}`,
  index: '/cms/news',
  create: '/cms/news/form',
  edit: (id: number) => `/cms/news/form/${id}`,
};
