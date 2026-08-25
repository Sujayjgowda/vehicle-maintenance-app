import api from './client';

export const aiApi = {
  diagnose: (symptoms: string, vehicleInfo?: any) =>
    api.post('/ai/diagnose', { symptoms, vehicleInfo }),
  getPredictiveHealth: (vehicleId: string) =>
    api.get(`/ai/vehicles/${vehicleId}/predictive-health`),
  parseReceipt: (text: string) =>
    api.post('/ai/parse-receipt', { text }),
};
