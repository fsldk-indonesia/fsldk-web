export const dynamicFormPath = {
  index: '/cms/dynamic-forms',
  create: '/cms/dynamic-forms/form',
  edit: (id: number) => `/cms/dynamic-forms/form/${id}`,
  builder: (id: number) => `/cms/dynamic-forms/${id}/builder`,
  responses: (id: number) => `/cms/dynamic-forms/${id}/responses`,
  responseEdit: (id: number, subId: number) => `/cms/dynamic-forms/${id}/responses/${subId}`,
  analytics: (id: number) => `/cms/dynamic-forms/${id}/analytics`,
  publicFill: (slug: string) => `/form/${slug}`,
};
