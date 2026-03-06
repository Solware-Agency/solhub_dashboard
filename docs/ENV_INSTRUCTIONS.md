# Instrucciones: Crear archivo .env.local

## ⚠️ IMPORTANTE: Debes crear este archivo manualmente

El archivo `.env.local` no pudo ser creado automáticamente porque está en el `.gitignore`. 

## 📝 Pasos:

1. **Crear el archivo** `.env.local` en la raíz del proyecto `C:\Users\Windows\Dev\dashboard-solhub\`

2. **Copiar el siguiente contenido** dentro del archivo:

```env
NEXT_PUBLIC_SUPABASE_URL=https://sbqepjsxnqtldyvlntqk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicWVwanN4bnF0bGR5dmxudHFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMjU3OTUsImV4cCI6MjA2NTcwMTc5NX0.Pq0Fu-Lv-MrrkrrAQM60TYGgyTIuOwu33tzU31rbDvY
```

3. **Guardar el archivo**

4. **Reiniciar el servidor de desarrollo** (si está corriendo):
   ```bash
   # Presiona Ctrl+C para detener el servidor
   pnpm dev
   ```

## ✅ Verificar que funciona

Después de crear el archivo, inicia el servidor:

```bash
pnpm dev
```

Deberías ver algo como:
```
▲ Next.js 15.1.3
- Local:        http://localhost:3000
```

Accede a http://localhost:3000 y deberías ver la página de login.

---

**Nota:** Este archivo contiene las credenciales de Supabase. NO lo subas a Git (ya está en .gitignore).

