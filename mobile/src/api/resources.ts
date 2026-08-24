import api from './client';

export const servicesApi = {
  getAll: (vehicleId: string) => api.get(`/vehicles/${vehicleId}/services`),
  create: (vehicleId: string, data: any) => api.post(`/vehicles/${vehicleId}/services`, data),
  delete: (vehicleId: string, id: string) => api.delete(`/vehicles/${vehicleId}/services/${id}`),
};

export const expensesApi = {
  getAll: (vehicleId: string) => api.get(`/vehicles/${vehicleId}/expenses`),
  create: (vehicleId: string, data: any) => api.post(`/vehicles/${vehicleId}/expenses`, data),
  delete: (vehicleId: string, id: string) => api.delete(`/vehicles/${vehicleId}/expenses/${id}`),
  getSummary: (vehicleId: string) => api.get(`/vehicles/${vehicleId}/expenses/summary`),
  getUserSummary: () => api.get('/expenses/summary'),
};

export const remindersApi = {
  getAll: (vehicleId: string) => api.get(`/vehicles/${vehicleId}/reminders`),
  create: (vehicleId: string, data: any) => api.post(`/vehicles/${vehicleId}/reminders`, data),
  update: (vehicleId: string, id: string, data: any) => api.put(`/vehicles/${vehicleId}/reminders/${id}`, data),
  delete: (vehicleId: string, id: string) => api.delete(`/vehicles/${vehicleId}/reminders/${id}`),
  getUpcoming: () => api.get('/reminders/upcoming'),
};

export const partsApi = {
  getAll: (vehicleId: string) => api.get(`/vehicles/${vehicleId}/parts`),
  create: (vehicleId: string, data: any) => api.post(`/vehicles/${vehicleId}/parts`, data),
  delete: (vehicleId: string, id: string) => api.delete(`/vehicles/${vehicleId}/parts/${id}`),
};

export const repairsApi = {
  getAll: (vehicleId: string) => api.get(`/vehicles/${vehicleId}/repairs`),
  create: (vehicleId: string, data: any) => api.post(`/vehicles/${vehicleId}/repairs`, data),
  delete: (vehicleId: string, id: string) => api.delete(`/vehicles/${vehicleId}/repairs/${id}`),
};

export const serviceCentersApi = {
  getAll: () => api.get('/service-centers'),
  create: (data: any) => api.post('/service-centers', data),
  delete: (id: string) => api.delete(`/service-centers/${id}`),
};
