import api from './client';

export const fuelApi = {
  getAll: (vehicleId: string) => api.get(`/vehicles/${vehicleId}/fuel`),
  getById: (vehicleId: string, id: string) => api.get(`/vehicles/${vehicleId}/fuel/${id}`),
  create: (vehicleId: string, data: any) => api.post(`/vehicles/${vehicleId}/fuel`, data),
  update: (vehicleId: string, id: string, data: any) => api.put(`/vehicles/${vehicleId}/fuel/${id}`, data),
  delete: (vehicleId: string, id: string) => api.delete(`/vehicles/${vehicleId}/fuel/${id}`),
  getSummary: (vehicleId: string) => api.get(`/vehicles/${vehicleId}/fuel/summary`),
  getLivePrices: (city?: string) => api.get('/fuel/live-prices', { params: { city } }),
  getCities: () => api.get('/fuel/cities'),
};
