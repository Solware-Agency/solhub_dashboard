# Dashboard Administrativo - Solhub

Panel de control centralizado para gestionar el SaaS multi-tenant de laboratorios clínicos Solhub.

## 🎯 Características

- ✅ **Autenticación por código de acceso** (protección de rutas)
- ✅ Dashboard con métricas globales
- ✅ CRUD completo de laboratorios
- ✅ Gestión de features por laboratorio
- ✅ **Generador automático de tipos TypeScript**
- ✅ Sistema de códigos de acceso
- ✅ Vista global de usuarios con filtros

## 🚀 Inicio Rápido

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Configurar variables de entorno

Crear archivo `.env.local` en la raíz del proyecto:

```env
# Código de acceso para el dashboard (OBLIGATORIO)
ADMIN_ACCESS_CODE=TU_CODIGO_SECRETO_AQUI

# Variables de Supabase
NEXT_PUBLIC_SUPABASE_URL=https://sbqepjsxnqtldyvlntqk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicWVwanN4bnF0bGR5dmxudHFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMjU3OTUsImV4cCI6MjA2NTcwMTc5NX0.Pq0Fu-Lv-MrrkrrAQM60TYGgyTIuOwu33tzU31rbDvY
```

**⚠️ IMPORTANTE:** 
- El código `ADMIN_ACCESS_CODE` es **obligatorio** para acceder al dashboard
- Elige un código seguro y guárdalo en un lugar seguro
- El código es case-insensitive (mayúsculas/minúsculas no importan)

### 3. Iniciar servidor de desarrollo

```bash
pnpm dev
```

### 4. Acceder al dashboard

- **URL:** http://localhost:3000
- 🔐 **Autenticación requerida** - Se solicitará el código de acceso
- Ingresa el código configurado en `ADMIN_ACCESS_CODE`
- La sesión es persistente (dura indefinidamente hasta cerrar sesión o pestaña)

## 📚 Estructura del Proyecto

```
dashboard-solhub/
├── app/
│   ├── (auth)/
│   │   ├── login/           # Página de login
│   │   └── unauthorized/    # Página de acceso denegado
│   ├── (dashboard)/         # Rutas protegidas
│   │   ├── page.tsx         # Dashboard principal
│   │   ├── laboratories/    # CRUD de laboratorios
│   │   ├── features/        # Gestión de features
│   │   ├── types-generator/ # Generador de tipos ⭐
│   │   ├── codes/           # Códigos de acceso
│   │   └── users/           # Vista global de usuarios
│   └── layout.tsx
├── lib/
│   ├── supabase/
│   │   └── client.ts        # Cliente de Supabase
│   └── types/
│       └── database.ts      # Tipos TypeScript
├── proxy.ts            # Autenticación y protección
└── .env.local              # Variables de entorno (crear)
```

## 🔑 Funcionalidades Principales

### 1. Dashboard Principal

Métricas globales del sistema:
- Total de laboratorios
- Laboratorios activos
- Total de usuarios
- Total de casos procesados

### 2. Gestión de Laboratorios

- **Listar:** Ver todos los laboratorios con filtros (activo/inactivo/trial)
- **Crear:** Crear nuevos laboratorios con valores por defecto
- **Editar:** Modificar configuración de laboratorios existentes

### 3. Gestión de Features

- Ver todas las features del sistema por laboratorio
- Toggle on/off en tiempo real para habilitar/deshabilitar features
- Sincronización automática de nuevas features

### 4. Generador de Tipos TypeScript ⭐

**El módulo más crítico del dashboard**

1. Click en "Generar Tipos"
2. Sistema lee todas las features del catálogo
3. Genera código TypeScript actualizado
4. Copiar al portapapeles
5. Pegar en `src/shared/types/types.ts` del proyecto principal Solhub

**¿Cuándo usar?**
- Cada vez que agregues una nueva feature al sistema
- Para mantener sincronizados los tipos entre dashboard y SaaS principal

### 5. Códigos de Acceso

- Crear códigos únicos para que usuarios se registren en laboratorios específicos
- Configurar límites de uso y fechas de expiración
- Activar/desactivar códigos
- Generador automático de códigos aleatorios

### 6. Vista Global de Usuarios

- Ver todos los usuarios de todos los laboratorios
- Filtros avanzados: laboratorio, rol, estado, búsqueda
- Estadísticas rápidas: total, aprobados, pendientes

## 🗄️ Base de Datos

### Tablas Creadas

El dashboard utiliza las siguientes tablas en Supabase:

- `admin_users` - Super administradores del dashboard
- `feature_catalog` - Catálogo maestro de features
- `laboratory_codes` - Códigos de acceso para laboratorios
- `laboratories` - Laboratorios del sistema (ya existente)
- `profiles` - Usuarios de laboratorios (ya existente)

### Triggers

- `sync_new_feature_to_laboratories()` - Sincroniza nuevas features a todos los labs automáticamente
- `set_default_laboratory_values()` - Asigna valores por defecto al crear laboratorios

## 🔐 Seguridad

- **Autenticación por código de acceso** configurado en `.env.local`
- Middleware protege todas las rutas del dashboard
- Cookie httpOnly y secure en producción
- Sesión persistente (dura indefinidamente hasta cerrar sesión o pestaña)
- RLS policies activas en todas las tablas de Supabase
- Redirección automática a login si no está autenticado

## 📖 Guía de Uso

### Crear un Nuevo Laboratorio

1. Ir a "Laboratorios" → "Crear Laboratorio"
2. Llenar formulario:
   - Nombre: Nombre completo del laboratorio
   - Slug: Identificador único (ej: labvargas)
   - Estado: active/inactive/trial
3. Click en "Crear Laboratorio"

**Resultado:**
- Laboratorio creado con todas las features en `false`
- Branding por defecto (logo null, colores #0066cc)
- Configuración por defecto (1 sucursal, tasa 36.5)

### Habilitar Features en un Laboratorio

1. Ir a "Features"
2. Seleccionar laboratorio en el sidebar
3. Click en el toggle de la feature deseada
4. Cambio se guarda automáticamente

### Generar Código de Acceso

1. Ir a "Códigos de Acceso"
2. Click en "Crear Código"
3. Seleccionar laboratorio
4. Ingresar código (o usar generador aleatorio 🎲)
5. Configurar límites (opcional)
6. Click en "Crear Código"

**Uso del código:**
Los usuarios lo usarán al registrarse en el SaaS principal para asociarse automáticamente al laboratorio.

## 🛠️ Tecnologías

- **Framework:** Next.js 15
- **Lenguaje:** TypeScript
- **Base de Datos:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth
- **Estilos:** TailwindCSS
- **Validación:** Zod + React Hook Form
- **State Management:** TanStack Query

## 🚧 Próximas Mejoras (Opcionales)

### Fase 3 (Polish)
- Mejorar diseño con shadcn/ui
- Agregar gráficas con Recharts
- Animaciones con Framer Motion
- Responsive design mejorado

### Fase 4 (Advanced)
- Sistema de crear nuevas features desde el dashboard
- Analytics avanzados
- Sistema de tickets de soporte
- Plantillas de email
- Reportes financieros

## 📝 Notas Importantes

### Sincronización de Features

Cuando agregas una nueva feature al catálogo:
1. Se agrega automáticamente a **TODOS** los laboratorios con valor `false`
2. Esto garantiza que todos los labs tengan las mismas keys
3. Permite que TypeScript funcione correctamente en el SaaS principal

### Flujo de Trabajo

```
1. Agregar nueva feature al catálogo
   ↓
2. Trigger SQL actualiza todos los labs (features[newKey] = false)
   ↓
3. Ir a Generador de Tipos
   ↓
4. Generar tipos TypeScript actualizados
   ↓
5. Copiar y pegar en proyecto principal
   ↓
6. Deploy automático
   ↓
7. Habilitar feature manualmente para labs específicos
```

## 🆘 Troubleshooting

### Error: "Código inválido" o no puedo acceder al dashboard

**Causas posibles:**
1. El código en `.env.local` no coincide con el ingresado
2. El archivo `.env.local` no existe o no está en la raíz del proyecto
3. El servidor no se reinició después de crear/modificar `.env.local`

**Solución:**
1. Verificar que el archivo `.env.local` existe en la raíz del proyecto
2. Verificar que `ADMIN_ACCESS_CODE` está configurado correctamente
3. **Reiniciar el servidor** después de modificar `.env.local`:
   ```bash
   # Detener el servidor (Ctrl+C)
   # Iniciar nuevamente
   pnpm dev
   ```
4. El código es case-insensitive, pero verifica que no haya espacios extra
5. Limpiar cookies del navegador si el problema persiste

### Error: "Error de configuración del servidor"

**Causa:** La variable `ADMIN_ACCESS_CODE` no está configurada en `.env.local`

**Solución:**
1. Crear archivo `.env.local` en la raíz del proyecto
2. Agregar: `ADMIN_ACCESS_CODE=tu_codigo_aqui`
3. Reiniciar el servidor

### Error: "Cannot read properties of undefined"

**Solución:** Verificar que el archivo `.env.local` existe y tiene las variables correctas

### Los cambios no se reflejan

**Solución:** 
1. Hacer refresh (F5) en el navegador
2. Verificar que RLS policies estén activas en Supabase

## 📞 Soporte

Para dudas o problemas con el dashboard administrativo, revisar el archivo `.cursorrules` en la raíz del proyecto para ver el estado completo del sistema y detalles de implementación.

---

**Última actualización:** 2025-01-26  
**Versión:** 1.1.0 (Autenticación por código implementada)  
**Estado:** ✅ **DASHBOARD PROTEGIDO Y LISTO PARA USO**
