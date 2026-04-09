import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  authAPI, 
  urlsAPI, 
  domainsAPI, 
  analyticsAPI, 
  qrCodeAPI,
  rolesAPI,
  userManagementAPI,
  adminAPI,
  googleAnalyticsAPI,
  countryCodesAPI
} from '@/services/api';
import { useToast } from '@/hooks/use-toast';

// Auth Hooks
export const useLogin = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: authAPI.login,
    onError: (error: Error) => {
      toast({
        title: 'Login Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useRegister = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: authAPI.register,
    onError: (error: Error) => {
      toast({
        title: 'Registration Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: authAPI.getProfile,
    retry: false,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: authAPI.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// URL Hooks
export const useUrls = (params?: any) => {
  return useQuery({
    queryKey: ['urls', params],
    queryFn: () => urlsAPI.list(params),
  });
};

export const useUrl = (id: string) => {
  return useQuery({
    queryKey: ['url', id],
    queryFn: () => urlsAPI.get(id),
    enabled: !!id,
  });
};

export const useCreateUrl = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: urlsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['urls'] });
      toast({
        title: 'Success',
        description: 'Short link created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateUrl = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => urlsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['urls'] });
      toast({
        title: 'Success',
        description: 'Link updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteUrl = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: urlsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['urls'] });
      toast({
        title: 'Success',
        description: 'Link deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useUrlStats = () => {
  return useQuery({
    queryKey: ['url-stats'],
    queryFn: urlsAPI.getStats,
  });
};

export const useAvailableDomains = () => {
  return useQuery({
    queryKey: ['available-domains'],
    queryFn: urlsAPI.getAvailableDomains,
  });
};

// Domain Hooks
export const useDomains = (params?: any) => {
  return useQuery({
    queryKey: ['domains', params],
    queryFn: () => domainsAPI.getDomains(params),
  });
};

export const useAddDomain = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: domainsAPI.createDomain,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      queryClient.invalidateQueries({ queryKey: ['available-domains'] });
      toast({
        title: 'Success',
        description: 'Domain added successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useCreateDomain = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: domainsAPI.createDomain,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      toast({
        title: 'Success',
        description: 'Domain added successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useVerifyDomain = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: domainsAPI.verifyDomain,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      toast({
        title: 'Success',
        description: 'Domain verified successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Verification Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteDomain = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: domainsAPI.deleteDomain,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      toast({
        title: 'Success',
        description: 'Domain deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Analytics Hooks
export const useAnalyticsDashboard = (params?: any) => {
  return useQuery({
    queryKey: ['analytics-dashboard', params],
    queryFn: () => analyticsAPI.getDashboard(params),
  });
};

export const useUrlAnalytics = (id: string, params?: any) => {
  return useQuery({
    queryKey: ['url-analytics', id, params],
    queryFn: () => analyticsAPI.getUrlAnalytics(id, params),
    enabled: !!id,
  });
};

// QR Code Hooks
export const useGenerateQRCode = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ urlId, options }: { urlId: string; options: any }) => 
      qrCodeAPI.generate(urlId, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-codes'] });
      toast({
        title: 'Success',
        description: 'QR code generated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useQRCodeStats = () => {
  return useQuery({
    queryKey: ['qr-code-stats'],
    queryFn: qrCodeAPI.getStats,
  });
};

// User Management Hooks
export const useUsers = (params?: any) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => userManagementAPI.getAllUsers(params),
  });
};

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: any }) => 
      userManagementAPI.updateUserStatus(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Success',
        description: 'User status updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Admin Hooks
export const useAdminUrls = (params?: any) => {
  return useQuery({
    queryKey: ['admin-urls', params],
    queryFn: () => adminAPI.getAllUrls(params),
  });
};

export const useSystemStats = () => {
  return useQuery({
    queryKey: ['system-stats'],
    queryFn: adminAPI.getSystemStats,
  });
};

// Country Codes Hook
export const useCountryCodes = () => {
  return useQuery({
    queryKey: ['country-codes'],
    queryFn: countryCodesAPI.getAll,
    staleTime: Infinity, // Country codes don't change often
  });
};

// Google Analytics Hooks
export const useGoogleAnalyticsDashboard = (params?: any) => {
  return useQuery({
    queryKey: ['google-analytics-dashboard', params],
    queryFn: () => googleAnalyticsAPI.getDashboard(params),
  });
};

export const useGoogleAnalyticsStatus = () => {
  return useQuery({
    queryKey: ['google-analytics-status'],
    queryFn: googleAnalyticsAPI.checkStatus,
  });
};
