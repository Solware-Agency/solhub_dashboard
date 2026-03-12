-- =====================================================================
-- FUNCIONES RPC PARA SISTEMA DE CÓDIGOS DE ACCESO
-- =====================================================================
-- Ejecutar este script en Supabase SQL Editor
-- Versión: 1.0
-- Fecha: 2026-03-12
-- =====================================================================

-- =====================================================================
-- FUNCIÓN 1: validate_and_use_code
-- =====================================================================
-- Propósito: Validar un código de acceso e incrementar current_uses atómicamente
-- Uso: Llamar desde el SaaS principal al registrar un usuario
-- Retorna: JSON con success, laboratory_id o error
-- =====================================================================

CREATE OR REPLACE FUNCTION validate_and_use_code(code_text TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  code_record RECORD;
  result JSON;
BEGIN
  -- Normalizar código (uppercase, trim)
  code_text := UPPER(TRIM(code_text));
  
  -- Buscar código
  SELECT * INTO code_record
  FROM laboratory_codes
  WHERE code = code_text;
  
  -- Validación 1: ¿Existe?
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Código no encontrado',
      'error_code', 'NOT_FOUND'
    );
  END IF;
  
  -- Validación 2: ¿Está activo?
  IF NOT code_record.is_active THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Código inactivo',
      'error_code', 'INACTIVE'
    );
  END IF;
  
  -- Validación 3: ¿Está expirado?
  IF code_record.expires_at IS NOT NULL AND code_record.expires_at < NOW() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Código expirado',
      'error_code', 'EXPIRED',
      'expired_at', code_record.expires_at
    );
  END IF;
  
  -- Validación 4: ¿Está agotado?
  IF code_record.max_uses IS NOT NULL AND code_record.current_uses >= code_record.max_uses THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Código agotado',
      'error_code', 'EXHAUSTED',
      'max_uses', code_record.max_uses,
      'current_uses', code_record.current_uses
    );
  END IF;
  
  -- TODO VÁLIDO: Incrementar current_uses atómicamente
  UPDATE laboratory_codes
  SET 
    current_uses = current_uses + 1,
    updated_at = NOW()
  WHERE id = code_record.id;
  
  -- Retornar éxito con laboratory_id
  RETURN json_build_object(
    'success', true,
    'laboratory_id', code_record.laboratory_id,
    'code_id', code_record.id,
    'remaining_uses', CASE 
      WHEN code_record.max_uses IS NULL THEN NULL
      ELSE code_record.max_uses - (code_record.current_uses + 1)
    END
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Error interno al validar código',
      'error_code', 'INTERNAL_ERROR',
      'details', SQLERRM
    );
END;
$$;

-- Permitir ejecución pública (importante para que anon_key pueda llamarla)
GRANT EXECUTE ON FUNCTION validate_and_use_code(TEXT) TO anon, authenticated;

-- Comentario
COMMENT ON FUNCTION validate_and_use_code IS 'Valida un código de acceso e incrementa current_uses atómicamente. Retorna laboratory_id si es válido.';


-- =====================================================================
-- FUNCIÓN 2: check_code_validity
-- =====================================================================
-- Propósito: Verificar validez de un código SIN incrementar usos
-- Uso: Preview antes de registrarse (mostrar info del laboratorio, usos restantes)
-- Retorna: JSON con valid, información del código y laboratorio
-- =====================================================================

CREATE OR REPLACE FUNCTION check_code_validity(code_text TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  code_record RECORD;
  is_expired BOOLEAN;
  is_exhausted BOOLEAN;
  remaining_uses INTEGER;
BEGIN
  -- Normalizar código
  code_text := UPPER(TRIM(code_text));
  
  -- Buscar código con laboratorio
  SELECT 
    lc.*,
    l.name as laboratory_name,
    l.slug as laboratory_slug
  INTO code_record
  FROM laboratory_codes lc
  LEFT JOIN laboratories l ON lc.laboratory_id = l.id
  WHERE lc.code = code_text;
  
  -- ¿Existe?
  IF NOT FOUND THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'Código no encontrado',
      'error_code', 'NOT_FOUND'
    );
  END IF;
  
  -- Calcular estado
  is_expired := code_record.expires_at IS NOT NULL AND code_record.expires_at < NOW();
  is_exhausted := code_record.max_uses IS NOT NULL AND code_record.current_uses >= code_record.max_uses;
  
  -- Calcular usos restantes
  IF code_record.max_uses IS NULL THEN
    remaining_uses := NULL; -- Ilimitado
  ELSE
    remaining_uses := code_record.max_uses - code_record.current_uses;
  END IF;
  
  -- Retornar información completa
  RETURN json_build_object(
    'valid', code_record.is_active AND NOT is_expired AND NOT is_exhausted,
    'code', code_record.code,
    'laboratory_name', code_record.laboratory_name,
    'laboratory_slug', code_record.laboratory_slug,
    'is_active', code_record.is_active,
    'is_expired', is_expired,
    'is_exhausted', is_exhausted,
    'expires_at', code_record.expires_at,
    'current_uses', code_record.current_uses,
    'max_uses', code_record.max_uses,
    'remaining_uses', remaining_uses,
    'error', CASE
      WHEN NOT code_record.is_active THEN 'Código inactivo'
      WHEN is_expired THEN 'Código expirado'
      WHEN is_exhausted THEN 'Código agotado'
      ELSE NULL
    END,
    'error_code', CASE
      WHEN NOT code_record.is_active THEN 'INACTIVE'
      WHEN is_expired THEN 'EXPIRED'
      WHEN is_exhausted THEN 'EXHAUSTED'
      ELSE NULL
    END
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'Error interno al verificar código',
      'error_code', 'INTERNAL_ERROR',
      'details', SQLERRM
    );
END;
$$;

-- Permitir ejecución pública
GRANT EXECUTE ON FUNCTION check_code_validity(TEXT) TO anon, authenticated;

-- Comentario
COMMENT ON FUNCTION check_code_validity IS 'Verifica validez de un código sin incrementar usos. Para preview antes de registro.';


-- =====================================================================
-- EJEMPLOS DE USO
-- =====================================================================

-- Ejemplo 1: Validar y usar código (incrementa current_uses)
-- SELECT validate_and_use_code('CONSPAT-ABC123');
-- Respuesta exitosa: {"success": true, "laboratory_id": "uuid...", "code_id": "uuid...", "remaining_uses": 4}
-- Respuesta error: {"success": false, "error": "Código agotado", "error_code": "EXHAUSTED"}

-- Ejemplo 2: Solo verificar validez (NO incrementa)
-- SELECT check_code_validity('CONSPAT-ABC123');
-- Respuesta: {"valid": true, "code": "CONSPAT-ABC123", "laboratory_name": "Conspat", ...}

-- =====================================================================
-- TESTING
-- =====================================================================

-- Test 1: Crear código de prueba
-- INSERT INTO laboratory_codes (laboratory_id, code, max_uses, is_active, current_uses)
-- VALUES ('tu-laboratory-id-aqui', 'TEST-CODE-001', 5, true, 0);

-- Test 2: Verificar código válido
-- SELECT check_code_validity('TEST-CODE-001');

-- Test 3: Usar código 5 veces
-- SELECT validate_and_use_code('TEST-CODE-001'); -- current_uses = 1
-- SELECT validate_and_use_code('TEST-CODE-001'); -- current_uses = 2
-- SELECT validate_and_use_code('TEST-CODE-001'); -- current_uses = 3
-- SELECT validate_and_use_code('TEST-CODE-001'); -- current_uses = 4
-- SELECT validate_and_use_code('TEST-CODE-001'); -- current_uses = 5

-- Test 4: Intentar usar código agotado (debe fallar)
-- SELECT validate_and_use_code('TEST-CODE-001'); -- Error: "Código agotado"

-- Test 5: Verificar estado después de agotarse
-- SELECT check_code_validity('TEST-CODE-001'); 
-- Debe retornar: {"valid": false, "is_exhausted": true, ...}

-- =====================================================================
-- FIN DEL SCRIPT
-- =====================================================================
