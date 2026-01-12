# 🔧 Fix: Access Denied Error

## 🚨 Problema Identificado

Hay **2 errores** causando el problema de "Access Denied":

1. **Recursión infinita en políticas RLS** de la tabla `profiles`
2. **Tu usuario no tiene rol 'admin'** en la tabla `profiles`

---

## ✅ Solución Paso a Paso

### **Paso 1: Accede a Supabase SQL Editor**

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto: **gellobit-rss-nextjs**
3. En el menú izquierdo, haz clic en **SQL Editor**

---

### **Paso 2: Ejecuta el Script de Corrección de RLS (NUEVA VERSIÓN)**

**⚠️ IMPORTANTE: Usa el nuevo script `004_nuclear_fix_rls.sql` que arregla el problema completamente**

1. En SQL Editor, copia y pega todo el contenido del archivo:
   ```
   apps/web/migrations/004_nuclear_fix_rls.sql
   ```

2. Haz clic en **Run** o presiona `Ctrl+Enter`

3. Al final del script verás una tabla mostrando tus usuarios y sus roles

**¿Qué hace este script?**
- Desactiva RLS temporalmente en todas las tablas
- Elimina TODAS las políticas existentes (sin importar su nombre)
- Crea políticas super simples que NO causan recursión:
  - Acceso público para lectura de opportunities publicadas
  - Service role (API routes) tiene acceso completo
  - No verifica rol admin dentro de políticas (evita recursión)
- Reactiva RLS
- Muestra tus usuarios para verificar el perfil admin

---

### **Paso 3: Verifica tu Usuario y Crea Perfil Admin**

#### **3.1 - Encuentra tu User ID**

Ejecuta esta query:

```sql
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;
```

**Copia el `id`** de tu usuario (debe ser un UUID como `123e4567-e89b-12d3-a456-426614174000`)

---

#### **3.2 - Verifica si tienes perfil**

Reemplaza `<tu-user-id>` con el ID que copiaste y ejecuta:

```sql
SELECT * FROM profiles WHERE id = '<tu-user-id>';
```

**Posibles resultados:**
- **No devuelve nada**: No tienes perfil, necesitas crearlo
- **Devuelve una fila con `role = 'user'`**: Tienes perfil pero no eres admin
- **Devuelve una fila con `role = 'admin'`**: ¡Ya eres admin! Salta al Paso 4

---

#### **3.3 - Crea o actualiza tu perfil como admin**

**Opción A - Si conoces tu User ID exacto:**

Reemplaza `<tu-user-id>` con tu ID real:

```sql
INSERT INTO profiles (id, role, created_at, updated_at)
VALUES ('<tu-user-id>', 'admin', NOW(), NOW())
ON CONFLICT (id)
DO UPDATE SET role = 'admin', updated_at = NOW();
```

**Opción B - Hacer admin al primer usuario registrado (más fácil):**

```sql
WITH first_user AS (
  SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
)
INSERT INTO profiles (id, role, created_at, updated_at)
SELECT id, 'admin', NOW(), NOW() FROM first_user
ON CONFLICT (id)
DO UPDATE SET role = 'admin', updated_at = NOW();
```

---

#### **3.4 - Verifica que funcionó**

Ejecuta esta query final:

```sql
SELECT
  u.id,
  u.email,
  p.role,
  p.created_at as profile_created
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 5;
```

**Resultado esperado:**
Tu email debe aparecer con `role = 'admin'`

---

### **Paso 4: Reinicia el Servidor de Desarrollo**

1. En tu terminal WSL, presiona `Ctrl+C` para detener el servidor
2. Ejecuta de nuevo:
   ```bash
   cd /home/huskerunix/gellobit-rss-nextjs/apps/web
   npm run dev
   ```

---

### **Paso 5: Prueba el Acceso**

1. Ve a [http://localhost:3000](http://localhost:3000)
   - **Debe cargar sin errores** (las oportunidades ahora se leen correctamente)

2. Haz login con tu usuario

3. Ve a [http://localhost:3000/admin](http://localhost:3000/admin)
   - **Debes ver el Admin Dashboard** sin "Access Denied"

---

## ✅ Verificación Final

Si todo funcionó correctamente, deberías ver:

✅ **Homepage (`/`)**: Carga sin errores de consola
✅ **Admin Dashboard (`/admin`)**: Acceso completo al panel
✅ **Console**: Sin errores de RLS o recursión infinita

---

## 🔍 Si Aún Tienes Problemas

### **Error: "Access Denied" persiste**

**Causa:** Tu perfil no se creó correctamente o no tiene rol 'admin'

**Solución:**
```sql
-- Busca tu user_id en auth.users
SELECT id, email FROM auth.users WHERE email = 'tu-email@ejemplo.com';

-- Actualiza tu perfil a admin
UPDATE profiles SET role = 'admin' WHERE id = '<tu-user-id>';

-- O borra y crea nuevo
DELETE FROM profiles WHERE id = '<tu-user-id>';
INSERT INTO profiles (id, role) VALUES ('<tu-user-id>', 'admin');
```

---

### **Error: "infinite recursion detected"**

**Causa:** Las políticas RLS no se eliminaron correctamente

**Solución:**
```sql
-- Desactiva RLS temporalmente
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities DISABLE ROW LEVEL SECURITY;
ALTER TABLE rss_feeds DISABLE ROW LEVEL SECURITY;

-- Ejecuta de nuevo el script 002_fix_rls_policies.sql

-- Reactiva RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE rss_feeds ENABLE ROW LEVEL SECURITY;
```

---

### **Error: "Error fetching opportunities: {}"**

**Causa:** Las políticas de `opportunities` no permiten lectura pública

**Solución:**
```sql
-- Permitir lectura de opportunities publicadas a todos
CREATE POLICY "Public can view published opportunities"
ON opportunities FOR SELECT
TO anon, authenticated
USING (status = 'published');
```

---

## 📝 Resumen de Cambios

### **Antes (Con Error):**
- Políticas RLS con recursión infinita
- Usuario sin perfil o sin rol 'admin'
- Homepage no podía cargar opportunities
- Admin panel bloqueado

### **Después (Corregido):**
- Políticas RLS simplificadas sin recursión
- Usuario con perfil y rol 'admin'
- Homepage carga opportunities publicadas
- Admin panel accesible completamente

---

## 🎯 Próximos Pasos

Una vez que el acceso esté funcionando:

1. **Configurar AI Provider** en `/admin`
   - Agregar API key de OpenAI, Claude, DeepSeek o Gemini
   - Probar conexión con botón "Test"

2. **Crear RSS Feed** en `/admin`
   - Agregar URL de Google Alerts
   - Seleccionar tipo de oportunidad
   - Activar procesamiento automático

3. **Probar Cron Job** manualmente:
   ```bash
   curl -X POST http://localhost:3000/api/cron/process-feeds \
     -H "Authorization: Bearer ${CRON_SECRET}"
   ```

¡El sistema estará completamente funcional! 🚀
