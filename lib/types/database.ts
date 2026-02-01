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

export interface LaboratoryFeatures {
  hasChatAI: boolean;
  hasStats: boolean;
  hasForm: boolean;
  hasCaseGenerator: boolean;
  hasCases: boolean;
  hasPatients: boolean;
  hasPayment: boolean;
  hasUsers: boolean;
  hasChangeHistory: boolean;
  hasReports: boolean;
  hasSampleTypeCosts: boolean;
}

export interface LaboratoryBranding {
  logo?: string | null; // URL del logo o null
  icon?: string; // Nombre del ícono (por defecto: "solhub")
  favicon?: string | null; // URL del favicon o null
  primaryColor: string; // Color primario (por defecto: "#0066cc")
  secondaryColor: string; // Color secundario (por defecto: "#00cc66")
}

export interface LaboratoryConfig {
  branches: string[];
  paymentMethods: string[];
  defaultExchangeRate: number;
  timezone: string;
  phoneNumber?: string; // Número de teléfono del laboratorio
  webhooks?: {
    // OPCIONAL - No todos los labs lo tienen
    generateDoc?: string;
    generatePdf?: string;
    sendEmail?: string;
  };
  // Configuración de códigos personalizados
  codeTemplate?: string; // Plantilla de código (ej: "{examCode}{counter:4}{month}{year:2}")
  codeMappings?: {
    [examType: string]: string; // Mapeo de tipo de examen a código (ej: "Citología" -> "CI")
  };
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

// Sistema de Configuración Granular de Módulos
export interface ModuleCatalog {
  id: string;
  feature_key: string; // 'hasForm' (relación con feature_catalog)
  module_name: string; // 'registrationForm' (nombre del módulo en config)
  structure: ModuleStructure; // Estructura completa del módulo
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ModuleStructure {
  fields?: {
    [fieldName: string]: {
      label: string;
      defaultEnabled: boolean; // true = habilitado por defecto
      defaultRequired: boolean; // true = requerido por defecto
    };
  };
  actions?: {
    [actionName: string]: {
      label: string;
      defaultEnabled: boolean; // true = habilitado por defecto
    };
  };
  settings?: {
    [settingName: string]: any; // Valores por defecto (ej: model, maxTokens, etc.)
  };
}

// Configuración de módulo en laboratories.config.modules
export interface ModuleConfig {
  fields?: {
    [fieldName: string]: {
      enabled: boolean; // true = habilitado, false = deshabilitado
      required: boolean; // true = requerido, false = opcional
    };
  };
  actions?: {
    [actionName: string]: boolean; // true = habilitado, false = deshabilitado
  };
  settings?: {
    [settingName: string]: any;
  };
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
