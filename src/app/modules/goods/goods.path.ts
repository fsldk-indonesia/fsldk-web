export const goodsPath = {
  publicIndex: '/fsldk-goods',
  publicDetail: (slug: string) => `/fsldk-goods/${slug}`,
  index: '/cms/goods/products',
  create: '/cms/goods/products/form',
  edit: (id: number) => `/cms/goods/products/form/${id}`,
  categoryIndex: '/cms/goods/categories',
  categoryCreate: '/cms/goods/categories/form',
  categoryEdit: (id: number) => `/cms/goods/categories/form/${id}`,
};
