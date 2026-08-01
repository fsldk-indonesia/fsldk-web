export const articlePath = {
  publicIndex: '/artikel',
  publicDetail: (slug: string) => `/artikel/${slug}`,
  index: '/cms/articles',
  create: '/cms/articles/form',
  edit: (id: number) => `/cms/articles/form/${id}`,
};
