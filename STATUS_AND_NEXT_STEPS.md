# Gellobit RSS Next.js - Estado Actual y Próximos Pasos

**Fecha:** 2026-01-13
**Versión:** 1.0.0-alpha.3
**Última actualización:** Sesión actual

---

## ✅ Funcionalidades Completadas

### 1. Sistema de AI Multi-Provider (100% Completo)
- ✅ Soporte para 4 proveedores: OpenAI, Anthropic (Claude), DeepSeek, Gemini
- ✅ Configuración individual por proveedor
- ✅ Solo un proveedor activo a la vez (constraint en DB)
- ✅ Un solo config por tipo de proveedor (constraint en DB)
- ✅ Test de conexión con mensajes detallados de error
- ✅ Botón Delete para eliminar proveedores
- ✅ Toggle Active/Inactive
- ✅ Modelos actualizados:
  - OpenAI: `gpt-4o-mini`
  - Claude: `claude-3-7-sonnet-20250219`
  - DeepSeek: `deepseek-chat`
  - Gemini: `gemini-2.0-flash-exp`

**Archivos:**
- `/apps/web/app/admin/ManageAISettings.tsx`
- `/apps/web/app/api/admin/ai-settings/route.ts`
- `/apps/web/lib/ai-providers/*.provider.ts`
- `/apps/web/migrations/008_unique_ai_provider.sql`

### 2. Sistema de Prompts (100% Completo)
- ✅ Vista de lista de todos los 11 tipos de prompts
- ✅ Edición inline por prompt
- ✅ Guardar prompts personalizados
- ✅ Reset a default TypeScript
- ✅ Badges Custom/Default
- ✅ Preview de 300 caracteres
- ✅ Solo un prompt personalizado por tipo (constraint en DB)
- ✅ Variables documentadas: `[matched_content]`, `[original_title]`
- ✅ Next.js 15 async params fix

**Archivos:**
- `/apps/web/app/admin/settings/PromptsSettings.tsx`
- `/apps/web/app/api/admin/prompts/[type]/route.ts`
- `/apps/web/lib/services/prompt.service.ts`
- `/apps/web/migrations/009_unique_prompt_per_type.sql`

### 3. Settings Persistence (100% Completo)
- ✅ Tabla `system_settings` con JSONB
- ✅ SettingsService con singleton pattern
- ✅ Caché de 1 minuto
- ✅ Integración con RSS Processor y Scraper
- ✅ UI funcional en Settings tab

**Archivos:**
- `/apps/web/lib/services/settings.service.ts`
- `/apps/web/migrations/006_create_system_settings.sql`

### 4. AI por Feed (100% Completo)
- ✅ Cada feed puede especificar su propio proveedor de IA
- ✅ Campos en `rss_feeds`: `ai_provider`, `ai_model`
- ✅ Si no se especifica, usa el proveedor global activo
- ✅ AIService actualizado para soportar override por feed
- ✅ **FIX:** Ahora el proveedor AI se guarda correctamente al crear/editar feeds

**Archivos:**
- `/apps/web/migrations/007_add_ai_per_feed.sql`
- `/apps/web/lib/services/ai.service.ts`
- `/apps/web/app/api/admin/feeds/route.ts` (corregido)
- `/apps/web/app/api/admin/feeds/[id]/route.ts` (corregido)

### 5. Gestión de Feeds Mejorada (100% Completo) - NUEVO
- ✅ Formulario completo con todos los campos
- ✅ Editar feeds existentes (modal)
- ✅ Eliminar feeds
- ✅ Ejecutar feed manualmente (Run)
- ✅ Campos nuevos: Quality Threshold, Priority, Cron Interval
- ✅ Fallback Featured Image con upload
- ✅ Allow Republishing (ignorar duplicados)
- ✅ **FIX:** Input focus issue resuelto (FeedForm como componente separado)

**Archivos:**
- `/apps/web/app/admin/ManageFeeds.tsx` (reescrito)
- `/apps/web/lib/utils/validation.ts` (actualizado)
- `/apps/web/migrations/010_feed_improvements.sql` (nuevo)

### 6. Export/Import de Feeds (100% Completo) - NUEVO
- ✅ Exportar todos los feeds a JSON
- ✅ Importar feeds desde JSON
- ✅ Tab en Settings

**Archivos:**
- `/apps/web/app/admin/settings/FeedsSettings.tsx` (nuevo)
- `/apps/web/app/api/admin/feeds/export/route.ts` (nuevo)
- `/apps/web/app/api/admin/feeds/import/route.ts` (nuevo)
- `/apps/web/app/admin/Settings.tsx` (actualizado)

### 7. Sistema de Imágenes (100% Completo) - NUEVO
- ✅ Upload de imágenes a Supabase Storage
- ✅ Componente ImageUpload reutilizable
- ✅ Scraper extrae featured images (og:image, twitter:image, contenido)
- ✅ Fallback a imagen por defecto del feed
- ✅ Tracking de imágenes en tabla `media_files`
- ✅ Limpieza automática al eliminar opportunities

**Archivos:**
- `/apps/web/components/ImageUpload.tsx` (nuevo)
- `/apps/web/lib/services/image.service.ts` (nuevo)
- `/apps/web/app/api/admin/upload/route.ts` (nuevo)
- `/apps/web/lib/services/scraper.service.ts` (actualizado)
- `/apps/web/migrations/011_image_storage.sql` (nuevo)

### 8. Páginas Públicas de Oportunidades (100% Completo)
- ✅ Lista de oportunidades publicadas `/opportunities`
- ✅ Detalle de oportunidad `/opportunities/[slug]`
- ✅ Página 404 personalizada

**Archivos:**
- `/apps/web/app/opportunities/page.tsx`
- `/apps/web/app/opportunities/[slug]/page.tsx`
- `/apps/web/app/opportunities/[slug]/not-found.tsx`
- `/apps/web/app/api/opportunities/route.ts`

### 9. Sistema de Gestión de Usuarios (100% Completo) - NUEVO
- ✅ Registro e inicio de sesión con Supabase Auth
- ✅ Redirección automática a `/account` después de login
- ✅ Dashboard de cuenta con información de perfil y membresía
- ✅ Upload de avatar a Supabase Storage
- ✅ Cambio de contraseña
- ✅ Sistema de favoritos para guardar oportunidades
- ✅ Configuración de notificaciones (email, push, in-app)
- ✅ Navegación dinámica según estado de autenticación
- ✅ Auto-creación de perfil si no existe

**Archivos:**
- `/apps/web/app/account/page.tsx` - Dashboard principal
- `/apps/web/app/account/favorites/page.tsx` - Lista de favoritos
- `/apps/web/app/account/notifications/page.tsx` - Configuración notificaciones
- `/apps/web/app/api/user/profile/route.ts` - API perfil
- `/apps/web/app/api/user/avatar/route.ts` - API avatar
- `/apps/web/app/api/user/password/route.ts` - API password
- `/apps/web/app/api/user/favorites/route.ts` - API favoritos
- `/apps/web/app/api/user/notifications/route.ts` - API notificaciones
- `/apps/web/components/UserNav.tsx` - Navegación usuario
- `/apps/web/components/FavoriteButton.tsx` - Botón favoritos
- `/apps/web/migrations/013_user_features.sql` - Migración DB

### 10. Experiencia Móvil Nativa (100% Completo) - NUEVO
- ✅ Componente `BottomSheet` con gestos táctiles (slide up/down)
- ✅ Componente `MobileNavBar` estilo app nativa (4 items)
- ✅ Página `/opportunities` con diseño mobile-first
- ✅ Filtros por tipo de oportunidad (12 tipos)
- ✅ Búsqueda en tiempo real
- ✅ Grid responsivo (1/2/3/4 columnas)
- ✅ Botón de favoritos en cada tarjeta
- ✅ Funciona en desktop cuando se reduce el viewport

**Archivos:**
- `/apps/web/components/BottomSheet.tsx` - Modal deslizante
- `/apps/web/components/MobileNavBar.tsx` - Navegación inferior
- `/apps/web/app/opportunities/OpportunitiesBrowser.tsx` - Explorador con filtros

---

## ⚠️ Migraciones Pendientes por Ejecutar

Ejecutar en Supabase SQL Editor en este orden:

### 1. `010_feed_improvements.sql`
```sql
-- Agrega: quality_threshold, priority, cron_interval,
-- fallback_featured_image_url, allow_republishing
```

### 2. `011_image_storage.sql`
```sql
-- Crea: tabla media_files
-- Trigger: limpieza automática de imágenes
```

### 3. Crear bucket en Supabase Storage
1. Ir a Supabase Dashboard → Storage
2. Crear bucket llamado `images`
3. Configurar como **público**

---

## 🗂️ Resumen de Cambios Esta Sesión

### Archivos Modificados:
| Archivo | Cambio |
|---------|--------|
| `ManageFeeds.tsx` | Reescrito: FeedForm separado, campos nuevos, edit modal |
| `Settings.tsx` | Agregado tab "Feeds" para export/import |
| `feeds/route.ts` | Fix: ahora guarda ai_provider y ai_model |
| `feeds/[id]/route.ts` | Fix: validación corregida, guarda AI fields |
| `scraper.service.ts` | Nuevo: extracción de featured images |
| `opportunity.service.ts` | Nuevo: soporte para featured_image_url |
| `rss-processor.service.ts` | Nuevo: pasa featured image al crear opportunity |
| `validation.ts` | Nuevos campos de feed |
| `prompts/index.ts` | Agregado featuredImage a ScrapedContent |

### Archivos Nuevos:
| Archivo | Descripción |
|---------|-------------|
| `settings/FeedsSettings.tsx` | UI para export/import feeds |
| `feeds/export/route.ts` | API export feeds JSON |
| `feeds/import/route.ts` | API import feeds JSON |
| `upload/route.ts` | API upload imágenes |
| `ImageUpload.tsx` | Componente upload imágenes |
| `image.service.ts` | Servicio gestión imágenes |
| `opportunities/page.tsx` | Lista pública de oportunidades |
| `opportunities/[slug]/page.tsx` | Detalle de oportunidad |
| `010_feed_improvements.sql` | Migración campos feed |
| `011_image_storage.sql` | Migración tracking imágenes |

### Bugs Corregidos:
1. ✅ Input focus loss en formulario de feeds
2. ✅ AI provider no se guardaba al crear feeds
3. ✅ Validación incorrecta en PATCH feeds

---

## 🚧 Funcionalidades Pendientes (Roadmap)

### Fase 1: Sistema de Visibilidad de Contenido (CMS)
- ❌ Columna `visibility` en opportunities (public, private, premium, evergreen)
- ❌ Tabla `user_subscriptions`
- ❌ Row Level Security policies
- ❌ Middleware de protección de rutas

### Fase 2: Auto-Borrado de Oportunidades Expiradas
- ❌ Columna `auto_delete_at` generada
- ❌ CleanupService
- ❌ Endpoint cron para limpieza diaria

### Fase 3: Mejora de Títulos en Prompts
- ❌ Instrucciones específicas para títulos clickbait/SEO
- ❌ Actualizar los 11 prompts

---

## 📝 Comandos Útiles

### Desarrollo
```bash
# Iniciar dev server
cd apps/web && npm run dev

# Ver logs en tiempo real
tail -f /tmp/claude/-home-huskerunix-gellobit-rss-nextjs/tasks/*.output
```

### Git
```bash
git status
git add -A
git commit -m "descripción"
git log --oneline -10
```

---

## 📞 Estado del Proyecto

**Última sesión:** 2026-01-13
**Branch actual:** `main`
**Versión:** 1.0.0-alpha.3

**Progreso general:** ~90% completado
- ✅ Core AI y Prompts: 100%
- ✅ Settings y Feeds: 100%
- ✅ Featured Images: 100%
- ✅ Export/Import: 100%
- ✅ Páginas Públicas: 100%
- ✅ Gestión de Usuarios: 100%
- ✅ Experiencia Móvil: 100%
- ⚠️ CMS y Visibilidad: 0%
- ⚠️ Auto-borrado: 0%

---

**Fin del documento**
Última actualización: 2026-01-13 por Claude Opus 4.5
