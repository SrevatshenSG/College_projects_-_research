import axios from 'axios';
import type { Campaign, GeneratePayload, GenerateResult } from '../types';
import { useAuthStore } from '../store/auth';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

// Debug logging
console.log('API Configuration:', { baseURL, env: import.meta.env.VITE_API_URL });

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

// Export types
export type { Campaign, GeneratePayload, GenerateResult };

// Test API connection
export async function testApiConnection(): Promise<boolean> {
  try {
    console.log('Testing API connection to:', baseURL);
    const healthCheckApi = axios.create({ baseURL: 'http://localhost:3002' });
    const response = await healthCheckApi.get('/health');
    console.log('API connection successful:', response.data);
    return true;
  } catch (error) {
    console.error('API connection failed:', error);
    return false;
  }
}

// Helper function to handle API errors
const handleApiError = (error: any, operation: string): never => {
  console.error(`API Error in ${operation}:`, error);
  console.error('Error details:', {
    message: error.message,
    code: error.code,
    response: error.response,
    request: error.request,
    config: error.config
  });
  
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    
    // Log specific error details
    console.error('Axios Error Details:', {
      status,
      statusText: error.response?.statusText,
      headers: error.response?.headers,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    });
    
    switch (status) {
      case 400:
        throw new Error(`Invalid request: ${message}`);
      case 401:
        throw new Error('Unauthorized: Please log in again');
      case 403:
        throw new Error('Forbidden: You don\'t have permission to perform this action');
      case 404:
        throw new Error(`${operation}: Resource not found`);
      case 409:
        throw new Error(`Conflict: ${message}`);
      case 422:
        throw new Error(`Validation error: ${message}`);
      case 500:
        throw new Error('Server error: Please try again later');
      default:
        throw new Error(`${operation} failed: ${message || 'Unknown error occurred'}`);
    }
  }
  throw new Error(`${operation} failed: ${error.message || 'Network error occurred'}`);
};

// Generate creative content
export async function generateCreative(payload: GeneratePayload): Promise<GenerateResult> {
  try {
    const response = await api.post<GenerateResult>('/generate', payload);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Generate creative');
  }
}

// List all campaigns
export async function listCampaigns(): Promise<Campaign[]> {
  try {
    console.log('Fetching campaigns from:', `${baseURL}/campaigns`);
    const response = await api.get<Campaign[]>('/campaigns');
    console.log('Campaigns response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return handleApiError(error, 'Fetch campaigns');
  }
}

// Get a specific campaign
export async function getCampaign(id: string): Promise<Campaign> {
  try {
    const response = await api.get<Campaign>(`/campaigns/${id}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Fetch campaign');
  }
}

// Create a new campaign
export async function createCampaign(data: Campaign): Promise<Campaign> {
  try {
    const response = await api.post<Campaign>('/campaigns', data);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Create campaign');
  }
}

// Update an existing campaign
export async function updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign> {
  try {
    const response = await api.put<Campaign>(`/campaigns/${id}`, data);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Update campaign');
  }
}

// Delete a campaign
export async function deleteCampaign(id: string): Promise<{success: boolean}> {
  try {
    await api.delete(`/campaigns/${id}`);
    return { success: true };
  } catch (error) {
    return handleApiError(error, 'Delete campaign');
  }
} 