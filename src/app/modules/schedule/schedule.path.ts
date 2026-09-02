export const schedulePath = {
  publicIndex: '/jadwal',
  index: '/cms/schedules',
  create: '/cms/schedules/form',
  edit: (id: number) => `/cms/schedules/form/${id}`,
};
