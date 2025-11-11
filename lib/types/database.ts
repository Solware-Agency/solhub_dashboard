// =====================================================================
// TIPOS DE BASE DE DATOS - Dashboard Administrativo Solhub
// =====================================================================

export interface AdminUser {
  id: string;
  email: string;
  role: 'superadmin' | 'support' | 'analyst';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Laboratory {
  id: string;
  slug: string;
  name: string;
  status: 'active' | 'inactive' | 'trial';
  features: LaboratoryFeatures;
  branding: LaboratoryBranding;
  config: LaboratoryConfig;
  created_at: string;
  updated_at: string;
}

export interface LaboratoryFeatures {
  hasInmunoRequests: boolean;
  hasChangelogModule: boolean;
  hasChatAI: boolean;
  hasMultipleBranches: boolean;
  hasCitologyStatus: boolean;
  hasPatientOriginFilter: boolean;
  hasRobotTracking: boolean;
}

export interface LaboratoryBranding {
  logo?: string | null;
  icon?: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface LaboratoryConfig {
  branches: string[];
  paymentMethods: string[];
  defaultExchangeRate: number;
  timezone: string;
  webhooks?: {
    generateDoc?: string;
    generatePdf?: string;
    sendEmail?: string;
  };
  [key: string]: any;
}

export interface FeatureCatalog {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: 'core' | 'premium' | 'addon';
  required_plan: 'free' | 'basic' | 'pro' | 'enterprise';
  icon: string | null;
  is_active: boolean;
  default_value: boolean;
  component_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface LaboratoryCode {
  id: string;
  laboratory_id: string;
  code: string;
  is_active: boolean;
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  estado: string;
  assigned_branch: string | null;
  laboratory_id: string;
  created_at: string;
  updated_at: string;
}
