# Gellobit RSS Next.js - Estado Actual y Próximos Pasos

**Fecha:** 2026-01-12
**Última actualización:** Commit 83fedf3

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
- ✅ Campos en `rss_feeds`: `ai_provider`, `ai_model`, `ai_api_key`
- ✅ Si no se especifica, usa el proveedor global activo
- ✅ AIService actualizado para soportar override por feed

**Archivos:**
- `/apps/web/migrations/007_add_ai_per_feed.sql`
- `/apps/web/lib/services/ai.service.ts`

---

## ⚠️ Problemas Identificados (Requieren Atención)

### 1. Error al Agregar Feed (CRÍTICO)
**Error:** "Internal server error" al intentar agregar un feed

**Diagnóstico:**
- El log muestra: `[ERROR] Error creating feed { error: 'Unknown error' }`
- No se está logrando el error real de Supabase
- El schema de validación `createFeedSchema` espera campos que no se envían desde el frontend:
  - `keywords` (array) - ❌ No enviado
  - `exclude_keywords` (array) - ❌ No enviado
  - `quality_threshold` (number) - ❌ No enviado
  - `feed_interval` (string) - ❌ No enviado

**Archivos afectados:**
- `/apps/web/app/api/admin/feeds/route.ts` (líneas 125-128)
- `/apps/web/lib/utils/validation.ts` (líneas 35-38)
- `/apps/web/app/admin/ManageFeeds.tsx` (líneas 27-38)

**Solución propuesta:**
1. Mejorar error logging en el API route:
   ```typescript
   catch (error) {
       console.error('Feed creation error:', error);
       await logger.error('Error creating feed', {
           error: error instanceof Error ? error.message : 'Unknown error',
           stack: error instanceof Error ? error.stack : undefined,
           details: JSON.stringify(error)
       });
   }
   ```

2. Hacer opcionales los campos en el schema o agregarlos al frontend

### 2. Column `opportunities.ai_provider` No Existe
**Error:** `column opportunities.ai_provider does not exist`

**Ubicación:** Logs tab - `/api/admin/logs`

**Causa:** Falta migración para agregar la columna `ai_provider` a la tabla `opportunities` (para tracking de qué IA generó cada oportunidad)

**Solución:** Crear migración para agregar columnas de tracking de IA a `opportunities`

### 3. Featured Images - No Implementado
**Problema:** No hay extracción de imágenes destacadas del scraping

**Requerimientos del plugin original:**
- Extraer featured image del contenido scrapeado
- Si no se encuentra, usar imagen por defecto configurada en el feed
- Almacenar en `opportunities.featured_image_url`

**Archivos a modificar:**
- `/apps/web/lib/services/scraper.service.ts` - Agregar extracción de imágenes
- Tabla `rss_feeds` - Agregar columna `default_featured_image_url`
- Tabla `opportunities` - Columna `featured_image_url` ya existe

### 4. Opciones Faltantes en Feeds
**Opciones del plugin original que faltan:**

| Opción | Estado | Tabla/Columna |
|--------|--------|---------------|
| Allow re-publishing (ignore duplicates) | ❌ Falta | `rss_feeds.allow_republishing` |
| Cron Interval | ✅ Existe | `rss_feeds.feed_interval` |
| Quality Threshold | ✅ Existe | `rss_feeds.quality_threshold` |
| Auto-publish posts | ✅ Existe | `rss_feeds.auto_publish` |
| Status | ✅ Existe | `rss_feeds.status` |
| Default Featured Image | ❌ Falta | `rss_feeds.default_featured_image_url` |

**Solución:** Agregar campos faltantes a ManageFeeds.tsx y actualizar migración

---

## 🚧 Funcionalidades Pendientes (Roadmap)

### 5. Sistema de Visibilidad de Contenido (CMS)
**Requerimiento:** Sistema de publicación con control de acceso

**Niveles de visibilidad necesarios:**
1. **Público** - Accesible sin login
2. **Privado** - Solo usuarios registrados
3. **Premium** - Requiere suscripción/pago
4. **Evergreen** - Contenido permanente público

**Implementación sugerida:**
- Agregar columna `visibility` a tabla `opportunities`:
  ```sql
  ALTER TABLE opportunities
  ADD COLUMN visibility VARCHAR(20) DEFAULT 'private'
  CHECK (visibility IN ('public', 'private', 'premium', 'evergreen'));
  ```

- Crear tabla `user_subscriptions`:
  ```sql
  CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan VARCHAR(50) NOT NULL, -- 'free', 'basic', 'premium'
    status VARCHAR(20) NOT NULL, -- 'active', 'cancelled', 'expired'
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

- Implementar Row Level Security (RLS) en Supabase:
  ```sql
  -- Policy para contenido público
  CREATE POLICY "Public content visible to all"
  ON opportunities FOR SELECT
  USING (visibility = 'public' OR visibility = 'evergreen');

  -- Policy para contenido privado
  CREATE POLICY "Private content for logged users"
  ON opportunities FOR SELECT
  USING (
    visibility = 'private'
    AND auth.uid() IS NOT NULL
  );

  -- Policy para contenido premium
  CREATE POLICY "Premium content for subscribers"
  ON opportunities FOR SELECT
  USING (
    visibility = 'premium'
    AND EXISTS (
      SELECT 1 FROM user_subscriptions
      WHERE user_id = auth.uid()
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > NOW())
    )
  );
  ```

**Archivos a crear:**
- `/apps/web/migrations/010_content_visibility_system.sql`
- `/apps/web/lib/services/subscription.service.ts`
- `/apps/web/app/opportunities/[slug]/page.tsx` - Frontend de oportunidades
- `/apps/web/middleware.ts` - Protección de rutas

### 6. Auto-Borrado de Oportunidades Expiradas
**Requerimiento:** Eliminar automáticamente oportunidades vencidas

**Comportamiento esperado:**
- Si `deadline` está en el pasado → eliminar automáticamente
- Si no tiene `deadline` → usar tiempo por defecto (ej: 30 días desde publicación)
- Ejecutar daily via Vercel Cron

**Implementación sugerida:**

1. **Agregar columna de expiración por defecto:**
   ```sql
   ALTER TABLE opportunities
   ADD COLUMN auto_delete_at TIMESTAMPTZ
   GENERATED ALWAYS AS (
     COALESCE(
       deadline,
       created_at + INTERVAL '30 days'
     )
   ) STORED;

   CREATE INDEX idx_opportunities_auto_delete
   ON opportunities(auto_delete_at)
   WHERE status = 'published';
   ```

2. **Crear servicio de limpieza:**
   ```typescript
   // /apps/web/lib/services/cleanup.service.ts
   export class CleanupService {
     async deleteExpiredOpportunities() {
       const { data, error } = await supabase
         .from('opportunities')
         .delete()
         .lt('auto_delete_at', new Date().toISOString())
         .eq('status', 'published');

       return { deleted: data?.length || 0, error };
     }
   }
   ```

3. **Endpoint de cron:**
   ```typescript
   // /apps/web/app/api/cron/cleanup/route.ts
   export async function GET(request: NextRequest) {
     // Verificar CRON_SECRET
     const authHeader = request.headers.get('authorization');
     if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     }

     const result = await cleanupService.deleteExpiredOpportunities();
     return NextResponse.json(result);
   }
   ```

4. **Agregar a vercel.json:**
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/process-feeds",
         "schedule": "0 * * * *"
       },
       {
         "path": "/api/cron/cleanup",
         "schedule": "0 0 * * *"
       }
     ]
   }
   ```

**Archivos a crear:**
- `/apps/web/migrations/011_auto_delete_expired.sql`
- `/apps/web/lib/services/cleanup.service.ts`
- `/apps/web/app/api/cron/cleanup/route.ts`

### 7. Mejora de Títulos en Prompts
**Problema:** Los títulos no están siendo procesados de forma atractiva

**Situación actual:**
- Los prompts actuales generan `title` en el JSON de respuesta
- Pero no hay instrucciones específicas para hacer títulos clickbait/atractivos
- El título original del RSS no siempre es SEO-friendly

**Mejora sugerida:**

Actualizar todos los prompts para incluir sección específica de título:

```typescript
// Ejemplo de mejora en /apps/web/prompts/giveaway.prompt.ts
export const giveawayPrompt = (content: ScrapedContent) => `
You are an expert content writer specializing in giveaways and contests.

**CRITICAL TITLE REQUIREMENTS:**
- Create an attention-grabbing, SEO-optimized title (50-60 characters max)
- Use power words: "Win", "Free", "Ultimate", "Exclusive", "Limited"
- Include the prize value if mentioned
- Make it clickable and shareable
- Examples:
  * "Win $5,000 Cash in This Exclusive Summer Giveaway"
  * "Enter to Win a Free MacBook Pro - Ends Soon!"
  * "Ultimate Gaming Setup Giveaway - $10K Value"

Original title for reference: ${content.title}

**CONTENT TO ANALYZE:**
${content.content}

Return JSON with these fields:
- valid: boolean (true if legitimate giveaway)
- title: string (NEW attention-grabbing title, NOT the original)
- excerpt: string (20 words max, compelling hook)
- content: string (HTML formatted)
- deadline: ISO date or null
- prize_value: string (e.g., "$1,000" or "MacBook Pro")
- requirements: string (eligibility)
- location: string (e.g., "US only", "Worldwide")
- confidence_score: number (0-1)
`;
```

**Acción:** Actualizar los 11 archivos de prompts en `/apps/web/prompts/`

### 8. Extracción de Featured Images
**Implementación detallada:**

```typescript
// Actualizar /apps/web/lib/services/scraper.service.ts

interface ScrapedContent {
  title: string;
  content: string;
  url: string;
  featuredImage?: string | null; // NUEVO
}

async scrapeUrl(url: string, feedConfig?: { default_featured_image_url?: string }): Promise<ScrapedContent> {
  // ... código existente ...

  // NUEVO: Extraer featured image
  let featuredImage: string | null = null;

  // 1. Buscar meta tags de Open Graph
  const ogImage = $('meta[property="og:image"]').attr('content');
  if (ogImage && this.isValidImageUrl(ogImage)) {
    featuredImage = ogImage;
  }

  // 2. Si no hay OG image, buscar primera imagen en contenido
  if (!featuredImage) {
    const firstImg = $('article img, .content img, .post-content img').first().attr('src');
    if (firstImg && this.isValidImageUrl(firstImg)) {
      featuredImage = this.resolveUrl(firstImg, url);
    }
  }

  // 3. Si no hay imagen, usar default del feed
  if (!featuredImage && feedConfig?.default_featured_image_url) {
    featuredImage = feedConfig.default_featured_image_url;
  }

  return {
    title,
    content: cleanContent,
    url,
    featuredImage
  };
}

private isValidImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
}

private resolveUrl(imageUrl: string, baseUrl: string): string {
  if (imageUrl.startsWith('http')) return imageUrl;
  const base = new URL(baseUrl);
  return new URL(imageUrl, base.origin).href;
}
```

---

## 📋 Orden de Implementación Sugerido

### Fase 1: Arreglar Errores Críticos (1-2 días)
1. ✅ **Fix feed creation error** - Mejorar logging y arreglar validación
2. ✅ **Fix opportunities.ai_provider column error** - Crear migración
3. ✅ **Add missing feed options** - Actualizar ManageFeeds UI y migration

### Fase 2: Featured Images (1 día)
4. ✅ Implementar extracción de imágenes en scraper
5. ✅ Agregar `default_featured_image_url` a feeds
6. ✅ Actualizar UI de ManageFeeds para upload de imagen por defecto

### Fase 3: Mejorar Títulos (0.5 días)
7. ✅ Actualizar los 11 archivos de prompts con instrucciones específicas de título
8. ✅ Testear generación de títulos atractivos

### Fase 4: Sistema de Visibilidad (2-3 días)
9. ✅ Crear migración para `visibility` y `user_subscriptions`
10. ✅ Implementar RLS policies en Supabase
11. ✅ Crear SubscriptionService
12. ✅ Frontend de oportunidades con control de acceso
13. ✅ Middleware de protección de rutas

### Fase 5: Auto-Borrado (1 día)
14. ✅ Crear migración para `auto_delete_at`
15. ✅ Crear CleanupService
16. ✅ Endpoint de cron para limpieza
17. ✅ Actualizar vercel.json

---

## 🗂️ Migraciones Pendientes por Ejecutar

### Ya Creadas (Ejecutar en Supabase):
1. ✅ `006_create_system_settings.sql` - **EJECUTADA**
2. ✅ `007_add_ai_per_feed.sql` - **EJECUTADA**
3. ✅ `008_unique_ai_provider.sql` - **EJECUTADA**
4. ✅ `009_unique_prompt_per_type.sql` - **PENDIENTE DE EJECUTAR**

### Por Crear:
5. ❌ `010_feed_improvements.sql` - Allow republishing, default featured image
6. ❌ `011_opportunities_tracking.sql` - ai_provider column en opportunities
7. ❌ `012_content_visibility.sql` - Sistema de visibilidad y suscripciones
8. ❌ `013_auto_delete_expired.sql` - Auto-borrado de contenido antiguo

---

## 🔧 Variables de Entorno Necesarias

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Vercel Cron
CRON_SECRET=tu-secret-aleatorio-aqui

# AI Providers (opcional - se pueden guardar en BD)
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
DEEPSEEK_API_KEY=sk-xxx
GEMINI_API_KEY=AIzaSyxxx
```

---

## 📝 Comandos Útiles

### Desarrollo
```bash
# Iniciar dev server
cd apps/web && npm run dev

# Ver logs en tiempo real
tail -f /tmp/claude/-home-huskerunix-gellobit-rss-nextjs/tasks/*.output

# Ejecutar migración en Supabase
# 1. Copiar contenido del archivo .sql
# 2. Ir a Supabase Dashboard > SQL Editor
# 3. Pegar y ejecutar
```

### Git
```bash
# Ver estado actual
git status

# Crear commit
git add -A
git commit -m "descripción del cambio"

# Ver últimos commits
git log --oneline -10
```

---

## 🎯 Próxima Sesión - Pasos Inmediatos

### 1. Al Retomar el Trabajo:

**A. Ejecutar migración pendiente:**
```sql
-- En Supabase SQL Editor
-- Ejecutar: migrations/009_unique_prompt_per_type.sql
```

**B. Fix feed creation error:**
1. Abrir `/apps/web/app/api/admin/feeds/route.ts`
2. Mejorar logging en catch block (línea 125-128)
3. Actualizar validation schema o frontend para que coincidan

**C. Test prompts:**
1. Ir a Admin > Settings > Prompts
2. Editar un prompt (ej: Giveaway)
3. Guardar y verificar que funciona sin "Unknown error"

### 2. Preguntas para Decidir Prioridades:

**Sobre CMS y Visibilidad:**
- ¿Qué modelo de negocio prefieren?
  - Freemium (algunos gratis, otros premium)
  - Todo privado (requiere registro)
  - Mixto (público + premium)
- ¿Usarán Stripe/PayPal para pagos?
- ¿Necesitan diferentes niveles de suscripción?

**Sobre Auto-Borrado:**
- ¿Cuántos días por defecto para oportunidades sin deadline? (sugerencia: 30 días)
- ¿Borrar permanentemente o solo archivar?
- ¿Notificar a usuarios antes de borrar?

**Sobre Featured Images:**
- ¿Tienen un servidor/CDN para almacenar imágenes por defecto?
- ¿O usar URLs externas directamente?
- ¿Necesitan resize/optimización de imágenes?

---

## 📞 Contacto de Continuación

**Última sesión:** 2026-01-12
**Branch actual:** `main`
**Último commit:** `83fedf3` - "feat: Complete prompts management refactor with list view"

**Estado del proyecto:** 70% completado
- ✅ Core AI y Prompts: 100%
- ✅ Settings y Feeds: 80%
- ⚠️ CMS y Visibilidad: 0%
- ⚠️ Auto-borrado: 0%
- ⚠️ Featured Images: 0%

---

## 📚 Documentación de Referencia

- **Next.js 15 Docs:** https://nextjs.org/docs
- **Supabase Docs:** https://supabase.com/docs
- **Vercel Cron:** https://vercel.com/docs/cron-jobs
- **OpenAI API:** https://platform.openai.com/docs
- **Anthropic API:** https://docs.anthropic.com/
- **DeepSeek API:** https://platform.deepseek.com/docs
- **Google AI:** https://ai.google.dev/docs

---

**Fin del documento**
Última actualización: 2026-01-12 por Claude Sonnet 4.5
