'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  RefreshCw,
  Copy,
  Download,
  FileCode,
  Check,
  Loader2,
} from 'lucide-react';

export default function TypesGeneratorPage() {
  const [types, setTypes] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateTypes = async () => {
    setLoading(true);
    setCopied(false);

    try {
      // Obtener todas las features del catálogo
      const { data: features, error } = await supabase
        .from('feature_catalog')
        .select('key')
        .eq('is_active', true)
        .order('order');

      if (error) throw error;
      if (!features || features.length === 0) {
        throw new Error('No se encontraron features en el catálogo');
      }

      // Generar interface LaboratoryFeatures
      const featuresInterface = `export interface LaboratoryFeatures {
${features.map((f) => `  ${f.key}: boolean`).join('\n')}
}`;

      // Generar interface LaboratoryBranding (ESTRUCTURA FIJA)
      const brandingInterface = `export interface LaboratoryBranding {
  logo?: string | null      // URL del logo o null
  icon?: string             // Nombre del ícono (por defecto: "solhub")
  primaryColor: string      // Color primario (por defecto: "#0066cc")
  secondaryColor: string    // Color secundario (por defecto: "#00cc66")
}`;

      // Generar interface LaboratoryConfig (ESTRUCTURA FLEXIBLE)
      const configInterface = `export interface LaboratoryConfig {
  branches: string[]
  paymentMethods: string[]
  defaultExchangeRate: number
  timezone: string
  webhooks?: {              // OPCIONAL - No todos los labs lo tienen
    generateDoc?: string
    generatePdf?: string
    sendEmail?: string
  }
}`;

      // Combinar todo
      const fullTypes = `// =====================================================================
// TIPOS GENERADOS AUTOMÁTICAMENTE DESDE EL DASHBOARD ADMIN
// Última actualización: ${new Date().toISOString()}
// NO EDITAR MANUALMENTE - Usar dashboard para agregar features
// =====================================================================

${featuresInterface}

${brandingInterface}

${configInterface}

export interface Laboratory {
  id: string
  slug: string
  name: string
  status: 'active' | 'inactive' | 'trial'
  features: LaboratoryFeatures
  branding: LaboratoryBranding
  config: LaboratoryConfig
  created_at: string
  updated_at: string
}`;

      setTypes(fullTypes);
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(types);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      alert('Error al copiar al portapapeles');
    }
  };

  const downloadFile = () => {
    const blob = new Blob([types], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'types.ts';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>
          Generador de Tipos TypeScript
        </h1>
        <p className='text-gray-600 mt-1'>
          Mantén sincronizados los tipos TypeScript del proyecto principal
        </p>
      </div>

      <div className='bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6'>
        <div className='flex'>
          <div className='flex-shrink-0'>
            <span className='text-2xl'>⚠️</span>
          </div>
          <div className='ml-3'>
            <h3 className='text-sm font-semibold text-yellow-800'>
              Importante
            </h3>
            <div className='mt-2 text-sm text-yellow-700'>
              <p className='mb-2'>
                Cada vez que agregues una nueva feature al sistema, debes:
              </p>
              <ol className='list-decimal list-inside space-y-1 ml-2'>
                <li>Generar los tipos actualizados con este generador</li>
                <li>Copiar el código generado</li>
                <li>
                  Pegarlo en{' '}
                  <code className='bg-yellow-100 px-1 py-0.5 rounded'>
                    src/shared/types/types.ts
                  </code>{' '}
                  del proyecto principal de Solhub
                </li>
                <li>Hacer commit y push</li>
                <li>Deploy automático se encargará del resto</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <div className='flex gap-4 mb-6'>
        <button
          onClick={generateTypes}
          disabled={loading}
          className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium'
        >
          {loading ? (
            <>
              <Loader2 className='w-4 h-4 mr-2 animate-spin inline-block' />
              Generando...
            </>
          ) : (
            <>
              <RefreshCw className='w-4 h-4 mr-2 inline-block' />
              Generar Tipos
            </>
          )}
        </button>

        {types && (
          <>
            <button
              onClick={copyToClipboard}
              className='px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium'
            >
              {copied ? (
                <>
                  <Check className='w-4 h-4 mr-2 inline-block' />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className='w-4 h-4 mr-2 inline-block' />
                  Copiar al Portapapeles
                </>
              )}
            </button>
            <button
              onClick={downloadFile}
              className='px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center'
            >
              <Download className='w-4 h-4 mr-2' />
              Descargar types.ts
            </button>
          </>
        )}
      </div>

      {types && (
        <div className='bg-white rounded-lg shadow overflow-hidden'>
          <div className='bg-gray-800 px-4 py-3 flex items-center justify-between'>
            <span className='text-sm font-mono text-green-400'>types.ts</span>
            <span className='text-xs text-gray-400'>
              {types.split('\n').length} líneas •{' '}
              {Math.round(types.length / 1024)} KB
            </span>
          </div>
          <div className='bg-gray-900 p-4 overflow-auto max-h-[600px]'>
            <pre className='text-sm text-green-400 font-mono'>
              <code>{types}</code>
            </pre>
          </div>
        </div>
      )}

      {!types && (
        <div className='bg-white rounded-lg shadow p-12 text-center'>
          <FileCode className='w-16 h-16 mx-auto mb-4 text-gray-400' />
          <p className='text-gray-600'>
            Haz clic en "Generar Tipos" para crear el código TypeScript
            actualizado
          </p>
        </div>
      )}
    </div>
  );
}
