'use client';

import { useState } from 'react';
import {
  RefreshCw,
  Copy,
  Download,
  FileCode,
  Check,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

function TypesGeneratorPage() {
  const [types, setTypes] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateTypes = async () => {
    setLoading(true);
    setCopied(false);

    try {
      const res = await fetch('/api/features');
      if (!res.ok) throw new Error('Error al cargar features');
      const json = await res.json();
      type FeatureRow = { key: string; is_active?: boolean };
      const features = (json.data ?? []).filter((f: FeatureRow) => f.is_active !== false) as FeatureRow[];
      if (!features.length) {
        throw new Error('No se encontraron features en el catálogo');
      }

      // Generar interface LaboratoryFeatures
      const featuresInterface = `export interface LaboratoryFeatures {
${features.map((f: FeatureRow) => `  ${f.key}: boolean`).join('\n')}
}`;

      // Generar interface LaboratoryBranding (ESTRUCTURA FIJA)
      const brandingInterface = `export interface LaboratoryBranding {
  logo?: string | null      // URL del logo o null
  icon?: string             // Nombre del ícono (por defecto: "solhub")
  favicon?: string | null   // URL del favicon o null
  primaryColor: string      // Color primario (por defecto: "#0066cc")
  secondaryColor: string    // Color secundario (por defecto: "#00cc66")
}`;

      // Generar interface LaboratoryConfig (ESTRUCTURA FLEXIBLE)
      const configInterface = `export interface LaboratoryConfig {
  branches: string[]
  paymentMethods: string[]
  defaultExchangeRate: number
  timezone: string  phoneNumber?: string      // OPCIONAL - Número de teléfono del laboratorio  webhooks?: {              // OPCIONAL - No todos los labs lo tienen
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
    <div className='min-w-0'>
      <div className='mb-6 sm:mb-8'>
        <div className='flex items-center gap-3 mb-2'>
          <FileCode className='w-7 h-7 sm:w-8 sm:h-8 text-white shrink-0' />
          <h1 className='text-2xl sm:text-3xl font-bold text-white drop-shadow-lg'>
            Generador de Tipos TypeScript
          </h1>
        </div>
        <p className='text-gray-200 mt-1 text-sm sm:text-base drop-shadow-md'>
          Mantén sincronizados los tipos TypeScript del proyecto principal
        </p>
      </div>

      <div className='bg-[#4c87ff]/10 border-l-4 border-[#4c87ff] p-4 mb-6 backdrop-blur-sm border border-[#4c87ff]/30 rounded'>
        <div className='flex'>
          <div className='flex-shrink-0'>
            <AlertTriangle className='w-6 h-6 text-[#4c87ff]' />
          </div>
          <div className='ml-3'>
            <h3 className='text-sm font-semibold text-white'>
              Importante
            </h3>
            <div className='mt-2 text-sm text-gray-200'>
              <p className='mb-2'>
                Cada vez que agregues una nueva feature al sistema, debes:
              </p>
              <ol className='list-decimal list-inside space-y-1 ml-2'>
                <li>Generar los tipos actualizados con este generador</li>
                <li>Copiar el código generado</li>
                <li>
                  Pegarlo en{' '}
                  <code className='bg-black/30 px-1 py-0.5 rounded text-[#4c87ff] border border-[#4c87ff]/30'>
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

      <div className='flex flex-wrap gap-3 sm:gap-4 mb-6'>
        <button
          onClick={generateTypes}
          disabled={loading}
          className='px-6 py-3 bg-[#4c87ff] text-white rounded-lg hover:bg-[#3d6fe6] focus:outline-none focus:ring-2 focus:ring-[#4c87ff]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2 shadow-lg shadow-[#4c87ff]/30'
        >
          {loading ? (
            <>
              <Loader2 className='w-4 h-4 animate-spin' />
              Generando...
            </>
          ) : (
            <>
              <RefreshCw className='w-4 h-4' />
              Generar Tipos
            </>
          )}
        </button>

        {types && (
          <>
            <button
              onClick={copyToClipboard}
              className='px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2'
            >
              {copied ? (
                <>
                  <Check className='w-4 h-4' />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className='w-4 h-4' />
                  Copiar al Portapapeles
                </>
              )}
            </button>
            <button
              onClick={downloadFile}
              className='px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center gap-2'
            >
              <Download className='w-4 h-4' />
              Descargar types.ts
            </button>
          </>
        )}
      </div>

      {types && (
        <div className='bg-black/30 backdrop-blur-md rounded-lg shadow-lg overflow-hidden border border-white/10 max-w-full'>
          <div className='bg-gray-800 px-4 py-3 flex items-center justify-between min-w-0'>
            <span className='text-sm font-mono text-green-400 truncate'>types.ts</span>
            <span className='text-xs text-gray-400 shrink-0'>
              {types.split('\n').length} líneas •{' '}
              {Math.round(types.length / 1024)} KB
            </span>
          </div>
          <div className='bg-gray-900 p-4 overflow-auto max-h-[600px] max-w-full'>
            <pre className='text-sm text-green-400 font-mono min-w-0 whitespace-pre-wrap break-words'>
              <code>{types}</code>
            </pre>
          </div>
        </div>
      )}

      {!types && (
        <div className='bg-black/30 backdrop-blur-md rounded-lg shadow-lg p-12 text-center border border-white/10'>
          <FileCode className='w-16 h-16 mx-auto mb-4 text-gray-400' />
          <p className='text-gray-300'>
            Haz clic en "Generar Tipos" para crear el código TypeScript
            actualizado
          </p>
        </div>
      )}
    </div>
  );
}

export default TypesGeneratorPage;
