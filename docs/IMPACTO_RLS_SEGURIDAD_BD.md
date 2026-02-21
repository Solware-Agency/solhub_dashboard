# Impacto de cambios de seguridad RLS en dashboard-solhub

Este documento resume el análisis del proyecto **dashboard-solhub** ante los cambios de seguridad en la base de datos Supabase compartida, y las modificaciones aplicadas para que todo siga funcionando.

---

## 1. Resumen de cambios en la BD (contexto)

- **feature_catalog:** Se activará RLS con políticas (SELECT/INSERT/UPDATE/DELETE restringidos).
- **aseguradoras_code_counters:** RLS con políticas.
- **audit_logs:** Política INSERT endurecida (menos permisiva).
- **immuno_requests:** Políticas INSERT/UPDATE restringidas por `laboratory_id` del usuario.
- **laboratories:** Política UPDATE restringida (solo owner/admin del lab o superadmin).
- **module_catalog:** Política ALL restringida (solo quien deba gestionar el catálogo).
- **laboratory_stats:** Vista pasa de SECURITY DEFINER a SECURITY INVOKER.

---

## 2. Cómo funciona hoy el dashboard

- **Autenticación:** El dashboard **no** usa Supabase Auth. Usa un código OTP en `.env` (`ADMIN_ACCESS_CODE`) y una cookie `admin_authenticated`. No hay JWT de Supabase en el navegador.
- **Cliente Supabase en el navegador:** `lib/supabase/client.ts` usa **anon key**. Todas las lecturas desde páginas (SELECT) se ejecutan con ese cliente → **sujetas a RLS** y sin `auth.uid()` (o anónimo).
- **API Routes:** Usan `SUPABASE_SERVICE_ROLE_KEY` → **bypasean RLS**. Las escrituras (INSERT/UPDATE/DELETE) ya van por API y no se ven afectadas por el endurecimiento de políticas.

**Conclusión:** Las **lecturas** que hoy se hacen desde el cliente (`.from('laboratories')`, `.from('feature_catalog')`, etc.) fallarían si RLS permite solo a ciertos roles o a `auth.uid()` definido, porque el cliente del dashboard no tiene sesión Supabase. La solución aplicada es **mover todas esas lecturas a API Routes que usen service_role**, de modo que la protección quede en la cookie del dashboard y la BD pueda endurecer RLS sin romper el panel.

---

## 3. Referencias por tabla/vista

### 3.1 feature_catalog

| Ubicación | Operación | laboratory_id | Riesgo tras RLS |
|-----------|-----------|---------------|------------------|
| `app/(dashboard)/modules/page.tsx` (32-33) | SELECT * | N/A | Con RLS estricto, anon sin JWT no vería filas. |
| `app/(dashboard)/features/page.tsx` (38-39) | SELECT * | N/A | Igual. |
| `app/(dashboard)/types-generator/page.tsx` (27-28) | SELECT key | N/A | Igual. |
| `app/api/features/route.ts` (30) | INSERT | N/A | Usa service_role → no afectado. |
| `app/api/features/[id]/route.ts` (27, 69, 83, 92, 100) | UPDATE, SELECT, laboratories SELECT/UPDATE, DELETE | N/A | Usa service_role → no afectado. |

**Acción:** Lecturas del cliente sustituidas por llamadas a `GET /api/features`. Las escrituras ya van por API con service_role.

---

### 3.2 module_catalog

| Ubicación | Operación | laboratory_id | Riesgo tras RLS |
|-----------|-----------|---------------|------------------|
| `app/(dashboard)/modules/page.tsx` (32) | SELECT * | N/A | Con RLS estricto, anon no vería filas. |
| `app/(dashboard)/laboratories/[id]/edit/page.tsx` (75-76) | SELECT * | N/A | Igual. |
| `app/api/modules/route.ts` (22) | INSERT | N/A | Usa service_role → no afectado. |
| `app/api/modules/[id]/route.ts` (27, 69, 83, 93, 102) | UPDATE, SELECT, laboratories SELECT/UPDATE, DELETE | N/A | Usa service_role → no afectado. |

**Acción:** Lecturas del cliente sustituidas por `GET /api/modules` (y en edit por ese mismo endpoint). Escrituras ya por API.

---

### 3.3 laboratories

| Ubicación | Operación | laboratory_id | Riesgo tras RLS |
|-----------|-----------|---------------|------------------|
| `app/(dashboard)/page.tsx` (40-44) | SELECT count (x2) | N/A | Si se restringe SELECT, anon no vería conteos. |
| `app/(dashboard)/laboratories/page.tsx` (29-30, 52-58) | SELECT *, Realtime (postgres_changes) | N/A | Mismo riesgo en listado y en tiempo real. |
| `app/(dashboard)/laboratories/[id]/page.tsx` (26-27) | SELECT * by id | N/A | Detalle de un lab podría no verse. |
| `app/(dashboard)/laboratories/[id]/edit/page.tsx` (90-91) | SELECT * by id | N/A | Formulario de edición no cargaría. |
| `app/(dashboard)/features/page.tsx` (36) | SELECT * | N/A | Selector de laboratorios vacío. |
| `app/(dashboard)/codes/page.tsx` (30-31) | SELECT (lab en join), SELECT labs | N/A | Códigos y selector de labs afectados. |
| `app/api/users/route.ts` (23) | SELECT (join laboratories) | N/A | Usa service_role → no afectado. |
| `app/api/users/[id]/route.ts` (29) | SELECT (join laboratories) | N/A | Usa service_role → no afectado. |
| `app/api/laboratories/route.ts` (30) | INSERT | N/A | Usa service_role → no afectado. |
| `app/api/laboratories/[id]/route.ts` (27, 68) | UPDATE, DELETE | N/A | Usa service_role → no afectado. |
| `app/api/laboratories/[id]/features/route.ts` (33) | UPDATE | N/A | Usa service_role → no afectado. |
| `app/api/features/[id]/route.ts` (83, 92) | SELECT, UPDATE laboratories | N/A | Usa service_role → no afectado. |
| `app/api/modules/[id]/route.ts` (83, 93) | SELECT, UPDATE laboratories | N/A | Usa service_role → no afectado. |

**Acción:** Todas las lecturas desde el cliente pasan a `GET /api/laboratories` y `GET /api/laboratories/[id]`. Estadísticas del home a `GET /api/dashboard/stats`. Realtime se mantiene; si en el futuro la política de SELECT en `laboratories` restringe por rol, el canal podría dejar de recibir filas (entonces habría que alimentar la lista solo vía polling a la API). Escrituras ya por API con service_role.

---

### 3.4 audit_logs

- **En este proyecto:** No hay referencias en código (solo documentación en `.cursorrules` si aplica).
- **Acción:** Nada que cambiar en dashboard-solhub.

---

### 3.5 immuno_requests

- **En este proyecto:** No hay referencias en código (solo en `.cursorrules`).
- **Acción:** Nada que cambiar en dashboard-solhub.

---

### 3.6 laboratory_stats

- **En este proyecto:** No se usa la vista `laboratory_stats` en ningún archivo.
- **Acción:** Nada que cambiar. Si en el futuro se usa, habrá que hacerlo con un cliente que tenga permisos (p. ej. service_role vía API), porque con SECURITY INVOKER se evalúa con el usuario que consulta.

---

### 3.7 aseguradoras_code_counters

- **En este proyecto:** No hay referencias.
- **Acción:** Nada que cambiar en dashboard-solhub.

---

## 4. Qué revisar / cambiar en ESTE proyecto (checklist)

- [x] **Lecturas desde el cliente (anon):** Sustituir por API Routes que usen `supabaseAdmin` (service_role) para: `feature_catalog`, `module_catalog`, `laboratories`, `laboratory_codes`, y conteos de dashboard (profiles, medical_records_clean).
- [x] **GET /api/laboratories:** Implementado (lista y conteos opcionales).
- [x] **GET /api/laboratories/[id]:** Implementado (detalle de un lab).
- [x] **GET /api/features:** Implementado (lista para catálogo y types-generator).
- [x] **GET /api/modules:** Implementado (lista para módulos y edit lab).
- [x] **GET /api/codes:** Implementado (lista de códigos con lab).
- [x] **GET /api/dashboard/stats:** Implementado (totalLabs, activeLabs, totalUsers, totalCases).
- [x] **Páginas:** Dashboard home, laboratories (lista, detalle, edit), features, modules, codes, types-generator actualizadas para usar estas APIs en lugar de `supabase.from(...)` desde el cliente.
- [ ] **Realtime laboratories:** Si en producción la política SELECT de `laboratories` se restringe tanto que el anon ya no ve filas, el canal `laboratories-changes` podría no recibir datos; en ese caso conviene alimentar la lista solo con polling a `GET /api/laboratories` o asegurar una política que permita al dashboard leer (p. ej. con un rol específico vía JWT si algún día el dashboard usa Supabase Auth).

---

## 5. Resolución solo por BD (sin cambios aquí)

- **Políticas exactas** de `feature_catalog`, `module_catalog`, `laboratories`, `audit_logs`, `immuno_requests`, `aseguradoras_code_counters` se definen en migraciones en la BD; este repo no las modifica.
- **laboratory_stats (SECURITY INVOKER):** Quién puede consultar la vista depende de los permisos del usuario que ejecuta la query; si el dashboard llegara a usarla, debería hacerlo vía API con service_role.
- **Extensiones unaccent/pg_trgm en schema `extensions`:** Este proyecto no ejecuta SQL ni llama a esas funciones directamente; no requiere cambios.

---

## 6. Resumen de archivos tocados en este repo

- **Nuevas rutas API (GET):**  
  `app/api/laboratories/route.ts` (GET), `app/api/laboratories/[id]/route.ts` (GET),  
  `app/api/features/route.ts` (GET), `app/api/modules/route.ts` (GET),  
  `app/api/codes/route.ts` (GET), `app/api/dashboard/stats/route.ts` (nuevo).
- **Páginas que ahora usan fetch a API en lugar de supabase.from(...):**  
  `app/(dashboard)/page.tsx`, `app/(dashboard)/laboratories/page.tsx`,  
  `app/(dashboard)/laboratories/[id]/page.tsx`, `app/(dashboard)/laboratories/[id]/edit/page.tsx`,  
  `app/(dashboard)/features/page.tsx`, `app/(dashboard)/modules/page.tsx`,  
  `app/(dashboard)/codes/page.tsx`, `app/(dashboard)/types-generator/page.tsx`.
