import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getToken, decodeToken } from './tokenManager';

const API_BASE_URL = 'http://localhost:6789/api';
// const API_KEY = import.meta.env.VITE_API_KEY;

// Đặt withCredentials thành true cho tất cả các yêu cầu Axios
// axios.defaults.withCredentials = true;

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-KEY': import.meta.env.VITE_API_KEY,
  },
});

// Interceptor để thêm token vào header của mọi request trừ login
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (!config.url?.includes('/sessions')) {
      const token = getToken();
      if (token) {
        const decodedToken = decodeToken(token);
        if (decodedToken) {
          config.headers['OAUTH-TOKEN'] = decodedToken;
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const login = async (email: string, password: string) => {
  try {
    const response = await api.post('/sessions', {
      session: { email, password },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchPipelines = async () => {
  try {
    const response = await api.get('/pipelines');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchPipelineSchedules = async (pipelineId: string) => {
  try {
    const response = await api.get(`/pipelines/${pipelineId}/pipeline_schedules`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchPipelineRuns = async (scheduleId: string) => {
  try {
    const response = await api.get(`/pipeline_schedules/${scheduleId}/pipeline_runs`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const togglePipelineSchedule = async (scheduleId: string, currentStatus: string) => {
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  try {
    const response = await api.put(`/pipeline_schedules/${scheduleId}`, 
      {
        pipeline_schedule: {
          id: scheduleId,
          status: newStatus
        }
      },
      {
        params: { api_key: import.meta.env.VITE_API_KEY }
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const runPipelineOnce = async (scheduleId: string, token: string) => {
  try {
    const response = await api.post(`/pipeline_schedules/${scheduleId}/pipeline_runs/${token}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createPipelineSchedule = async (pipelineId: string, name: string) => {
  try {
    const response = await api.post(`/pipelines/${pipelineId}/pipeline_schedules`, {
      pipeline_schedule: { name },
      api_key: import.meta.env.VITE_API_KEY
    });
    return response.data.pipeline_schedule.id || null; // Giả sử API trả về ID trong trường này
  } catch (error) {
    throw error;
  }
};

export const updatePipelineSchedule = async (scheduleId: string, scheduleData: any) => {
  try {
    const response = await api.put(`/pipeline_schedules/${scheduleId}`, {
      pipeline_schedule: scheduleData,
      api_key: import.meta.env.VITE_API_KEY
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Thêm các hàm gọi API khác ở đây trong tơng lai

export default api;

// Thêm hàm mới này vào file api.ts
export const fetchPipelineVariables = async (pipelineId: string) => {
  try {
    const response = await api.get(`/pipelines/${pipelineId}/variables`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Thêm hàm này vào cuối file src/services/api.ts
export const deletePipelineSchedule = async (scheduleId: string) => {
  try {
    const response = await api.delete(`/pipeline_schedules/${scheduleId}`, {
      params: { api_key: import.meta.env.VITE_API_KEY }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};



// Thêm hàm này vào cuối file src/services/api.ts
export const getPipelineSchedule = async (scheduleId: string) => {
  try {
    const response = await api.get(`/pipeline_schedules/${scheduleId}`, {
      params: { api_key: import.meta.env.VITE_API_KEY }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};


// Thêm hàm này vào file src/services/api.ts
export const fetchPipeline = async (pipelineId: string) => {
  try {
    const response = await api.get(`/pipelines/${pipelineId}`);
    return response.data.pipeline;
  } catch (error) {
    throw error;
  }
};

// Thêm hàm này vào cuối file src/services/api.ts
export const fetchPipelineRunLog = async (runId: string) => {
  try {
    const response = await api.get(`/pipeline_runs/${runId}/log`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Thêm hàm mới này vào cuối file
export const fetchPipelineLogs = async (pipelineUuid: string, runId: string) => {
  try {
    const response = await api.get(`/pipelines/${pipelineUuid}/logs?pipeline_run_id[]=${runId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchMonitorStats = async (date: string) => {
  try {
    const response = await api.get(`/monitor_stats/pipeline_run_count`, {
      params: {
        group_by_pipeline_type: 1,
        start_time: `${date}T00:00:00.000Z`
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
