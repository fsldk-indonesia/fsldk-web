export const goodsPath = {
  publicIndex: '/fsldk-goods',
  publicDetail: (slug: string) => `/fsldk-goods/${slug}`,
  index: '/cms/goods',
  create: '/cms/goods/form',
  edit: (id: number) => `/cms/goods/form/${id}`,
  categoryIndex: '/cms/goods-categories',
  categoryCreate: '/cms/goods-categories/form',
  categoryEdit: (id: number) => `/cms/goods-categories/form/${id}`,
};
