# 🔐 Configuración de RLS para Dashboard Admin

## 📊 Estado Actual

- ✅ **RLS DESHABILITADO** en tabla `laboratories`
- ⚠️ **4 políticas RLS definidas** (no aplican porque RLS está deshabilitado)
- ⚠️ **Dashboard usa `anon_key`** (sin autenticación)

## 🎯 Opciones Disponibles

### **OPCIÓN 1: Mantener RLS Deshabilitado** (Actual)

**Estado:** RLS deshabilitado, dashboard funciona sin restricciones

**Pros:**
- ✅ Funciona sin cambios
- ✅ No requiere configuración adicional
- ✅ Acceso directo desde el dashboard

**Contras:**
- ❌ Sin protección a nivel de base de datos
- ❌ Cualquiera con `anon_key` puede modificar `laboratories`
- ❌ No hay auditoría de acceso

**Cuándo usar:**
- Desarrollo local
- Testing
- Prototipos rápidos

---

### **OPCIÓN 2: Habilitar RLS + Usar service_role** ⭐ **RECOMENDADO**

**Estado:** RLS habilitado, dashboard usa `service_role` (bypassea RLS)

**Pros:**
- ✅ **Seguridad máxima**: RLS protege la base de datos
- ✅ **Dashboard funciona**: `service_role` bypassea RLS
- ✅ **Auditoría**: RLS registra todos los accesos
- ✅ **Producción-ready**: Listo para producción

**Contras:**
- ⚠️ Requiere configurar `SUPABASE_SERVICE_ROLE_KEY`
- ⚠️ `service_role` solo debe usarse en servidor (nunca en cliente)

**Cuándo usar:**
- Producción
- Cuando necesites seguridad real
- Cuando quieras proteger datos sensibles

**Implementación:**

1. **Obtener `service_role` key:**
   - Ve a Supabase Dashboard → Settings → API
   - Copia `service_role` key (⚠️ NUNCA exponer en cliente)

2. **Agregar a `.env.local`:**
   ```env
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
   ```

3. **Habilitar RLS en `laboratories`:**
   ```sql
   ALTER TABLE public.laboratories ENABLE ROW LEVEL SECURITY;
   ```

4. **Actualizar políticas RLS:**
   ```sql
   -- Eliminar políticas antiguas que dependen de auth.uid()
   DROP POLICY IF EXISTS "Only owners can insert laboratories" ON laboratories;
   DROP POLICY IF EXISTS "Only owners can update laboratories" ON laboratories;
   DROP POLICY IF EXISTS "Only owners can delete laboratories" ON laboratories;
   
   -- Crear políticas que permitan acceso desde service_role
   -- (service_role bypassea RLS automáticamente, pero estas políticas
   --  protegen contra acceso con anon_key)
   
   -- SELECT: Solo laboratorios activos (público puede ver)
   DROP POLICY IF EXISTS "Anyone can view active laboratories" ON laboratories;
   CREATE POLICY "Anyone can view active laboratories"
   ON laboratories FOR SELECT
   USING (status = 'active');
   
   -- INSERT/UPDATE/DELETE: Solo desde service_role (dashboard admin)
   -- Como service_role bypassea RLS, estas políticas solo afectan anon_key
   CREATE POLICY "Only service_role can modify laboratories"
   ON laboratories FOR ALL
   USING (false)  -- Bloquea todo acceso con anon_key
   WITH CHECK (false);
   ```

5. **El dashboard seguirá funcionando** porque usa `service_role` que bypassea RLS

---

### **OPCIÓN 3: Habilitar RLS con Políticas Permisivas**

**Estado:** RLS habilitado, políticas permiten acceso sin autenticación

**Pros:**
- ✅ RLS activo (protección básica)
- ✅ Dashboard funciona con `anon_key`

**Contras:**
- ❌ Menos seguro (cualquiera con `anon_key` puede modificar)
- ❌ No hay control de acceso real

**Cuándo usar:**
- Desarrollo con RLS habilitado
- Testing de políticas RLS
- Cuando no tengas `service_role` disponible

**Implementación:**

```sql
-- Habilitar RLS
ALTER TABLE public.laboratories ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas (solo para desarrollo)
DROP POLICY IF EXISTS "Anyone can view active laboratories" ON laboratories;
CREATE POLICY "Anyone can view active laboratories"
ON laboratories FOR SELECT
USING (status = 'active');

-- Permitir INSERT/UPDATE/DELETE sin autenticación (⚠️ SOLO DESARROLLO)
CREATE POLICY "Allow all modifications for development"
ON laboratories FOR ALL
USING (true)
WITH CHECK (true);
```

---

## 🚀 Recomendación Final

### **Para Desarrollo Local:**
- ✅ Mantener RLS deshabilitado (Opción 1)
- ✅ Dashboard funciona sin configuración adicional

### **Para Producción:**
- ✅ Habilitar RLS + usar `service_role` (Opción 2)
- ✅ Máxima seguridad
- ✅ Dashboard protegido

---

## 📋 Checklist de Implementación (Opción 2)

- [ ] Obtener `service_role` key de Supabase Dashboard
- [ ] Agregar `SUPABASE_SERVICE_ROLE_KEY` a `.env.local`
- [ ] Verificar que `lib/supabase/client.ts` usa `service_role`
- [ ] Habilitar RLS: `ALTER TABLE laboratories ENABLE ROW LEVEL SECURITY;`
- [ ] Actualizar políticas RLS (ver SQL arriba)
- [ ] Probar dashboard (debe seguir funcionando)
- [ ] Verificar que `anon_key` NO puede modificar (seguridad)

---

## 🔍 Verificar Estado Actual

```sql
-- Ver si RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'laboratories';

-- Ver políticas actuales
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'laboratories';
```

---

## ⚠️ IMPORTANTE

- **NUNCA** exponer `service_role` key en código del cliente
- **NUNCA** usar `service_role` en componentes `'use client'`
- **SIEMPRE** usar `service_role` solo en Server Components o API Routes
- **SIEMPRE** mantener `anon_key` para el frontend principal (Solhub)

---

**Última actualización:** 2025-01-26

