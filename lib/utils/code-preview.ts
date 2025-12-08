/**
 * Utilidad para generar preview de códigos desde plantillas
 * Compatible con el sistema de generación de códigos en Supabase
 */

interface CodePreviewOptions {
  template: string;
  codeMappings?: Record<string, string>;
  examType?: string;
  examCode?: string;
  type?: number;
  counter?: number;
  date?: Date;
}

/**
 * Genera un preview de código basado en una plantilla
 *
 * @param options - Opciones para generar el código
 * @returns Código generado o null si hay error
 */
export function generateCodePreview(
  options: CodePreviewOptions,
): string | null {
  const {
    template,
    codeMappings = {},
    examType,
    examCode,
    type = 1,
    counter = 1,
    date = new Date(),
  } = options;

  if (!template) {
    return null;
  }

  try {
    let result = template;
    const now = date;

    // Obtener examCode desde codeMappings si no se proporciona directamente
    let finalExamCode = examCode;
    if (!finalExamCode && examType && codeMappings[examType]) {
      finalExamCode = codeMappings[examType];
    }

    // Reemplazar {examCode}
    if (finalExamCode) {
      result = result.replace(/{examCode}/g, finalExamCode);
    } else {
      // Si no hay examCode y la plantilla lo requiere, retornar null
      if (result.includes('{examCode}')) {
        return null;
      }
    }

    // Reemplazar {type}
    result = result.replace(/{type}/g, type.toString());

    // Reemplazar {counter:N}
    result = result.replace(/{counter:(\d+)}/g, (match, padding) => {
      const pad = parseInt(padding, 10);
      return counter.toString().padStart(pad, '0');
    });

    // Reemplazar {month} - Letra del mes (A-L)
    const monthLetter = String.fromCharCode(65 + now.getMonth()); // A=enero, L=diciembre
    result = result.replace(/{month}/g, monthLetter);

    // Reemplazar {year:2} - Año con 2 dígitos desde 2000
    const year2 = (now.getFullYear() - 2000).toString();
    result = result.replace(/{year:2}/g, year2);

    // Reemplazar {year:4} - Año completo
    const year4 = now.getFullYear().toString();
    result = result.replace(/{year:4}/g, year4);

    // Reemplazar {day:2} - Día con 2 dígitos
    const day2 = now.getDate().toString().padStart(2, '0');
    result = result.replace(/{day:2}/g, day2);

    // Verificar si quedan placeholders sin reemplazar
    if (result.includes('{')) {
      // Hay placeholders sin reemplazar
      return null;
    }

    return result;
  } catch (error) {
    console.error('Error generando preview de código:', error);
    return null;
  }
}

/**
 * Valida una plantilla de código
 *
 * @param template - Plantilla a validar
 * @returns Objeto con isValid y errorMessage
 */
export function validateCodeTemplate(template: string): {
  isValid: boolean;
  errorMessage?: string;
} {
  if (!template || template.trim() === '') {
    return {
      isValid: false,
      errorMessage: 'La plantilla no puede estar vacía',
    };
  }

  // Verificar que los placeholders estén bien formados
  const placeholderRegex = /\{[^}]+\}/g;
  const placeholders = template.match(placeholderRegex) || [];

  for (const placeholder of placeholders) {
    // Placeholders válidos
    const validPlaceholders = ['{examCode}', '{type}', '{month}', '{day:2}'];

    // Placeholders con formato específico
    if (placeholder.startsWith('{counter:') && placeholder.endsWith('}')) {
      const padding = placeholder.slice(9, -1);
      if (!/^\d+$/.test(padding)) {
        return {
          isValid: false,
          errorMessage: `Placeholder inválido: ${placeholder}. El padding debe ser un número.`,
        };
      }
      continue;
    }

    if (placeholder.startsWith('{year:') && placeholder.endsWith('}')) {
      const yearFormat = placeholder.slice(6, -1);
      if (yearFormat !== '2' && yearFormat !== '4') {
        return {
          isValid: false,
          errorMessage: `Placeholder inválido: ${placeholder}. El formato de año debe ser 2 o 4.`,
        };
      }
      continue;
    }

    if (!validPlaceholders.includes(placeholder)) {
      return {
        isValid: false,
        errorMessage: `Placeholder desconocido: ${placeholder}`,
      };
    }
  }

  return { isValid: true };
}

/**
 * Obtiene ejemplos de plantillas para diferentes formatos
 */
export function getTemplateExamples(): Array<{
  name: string;
  template: string;
  example: string;
  description: string;
}> {
  return [
    {
      name: 'Conspat',
      template: '{type}{year:2}{counter:3}{month}',
      example: '125001K',
      description: 'Formato: tipo + año(2) + contador(3) + mes',
    },
    {
      name: 'SPT',
      template: '{examCode}{counter:4}{month}{year:2}',
      example: 'CI0001K25',
      description: 'Formato: código examen + contador(4) + mes + año(2)',
    },
    {
      name: 'Solo números',
      template: '{type}{year:4}{counter:5}',
      example: '1202500001',
      description: 'Formato: tipo + año(4) + contador(5)',
    },
    {
      name: 'Sin año',
      template: '{examCode}{counter:6}',
      example: 'CI000001',
      description: 'Formato: código examen + contador(6)',
    },
  ];
}
