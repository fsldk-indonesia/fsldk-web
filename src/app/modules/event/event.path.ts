export const eventPath = {
  publicIndex: '/event',
  publicDetail: (slug: string) => `/event/${slug}`,
  index: '/cms/events',
  create: '/cms/events/form',
  edit: (id: number) => `/cms/events/form/${id}`,
};
