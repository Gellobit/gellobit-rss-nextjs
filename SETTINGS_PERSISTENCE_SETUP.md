# ⚙️ Settings Persistence - Setup Instructions

## ⚠️ Migration Required

Los settings ahora son persistentes y tienen efecto real en el código. Necesitas ejecutar una migración SQL para crear la tabla `system_settings`.

## 🔧 Pasos para Activar Settings Persistentes

### 1. Ve a Supabase SQL Editor

1. Abre: https://supabase.com/dashboard
2. Selecciona tu proyecto: **gellobit-rss-nextjs**
3. Click en **SQL Editor** (menú izquierdo)

### 2. Ejecuta Esta Migración

Copia y pega este SQL:

```sql
-- Create System Settings Table
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('general', 'ai', 'prompts', 'scraping', 'advanced')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON public.system_settings(category);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write system settings
CREATE POLICY "system_settings_admin_all" ON public.system_settings
FOR ALL TO service_role USING (true);

-- Insert default settings
INSERT INTO public.system_settings (key, value, description, category) VALUES
    ('general.automatic_processing', 'true', 'Enable automatic RSS feed processing', 'general'),
    ('general.processing_interval', '60', 'Processing interval in minutes', 'general'),
    ('general.auto_publish', 'false', 'Automatically publish opportunities that pass threshold', 'general'),
    ('general.quality_threshold', '0.7', 'Minimum AI confidence score to accept', 'general'),
    ('general.max_posts_per_run', '10', 'Maximum posts to process in one run', 'general'),
    ('scraping.request_timeout', '10000', 'HTTP request timeout in milliseconds', 'scraping'),
    ('scraping.max_redirects', '5', 'Maximum number of redirects to follow', 'scraping'),
    ('scraping.min_content_length', '100', 'Minimum content length to accept', 'scraping'),
    ('scraping.max_content_length', '50000', 'Maximum content length to process', 'scraping'),
    ('scraping.user_agent', '"Gellobit RSS Bot/1.0"', 'User agent string for HTTP requests', 'scraping'),
    ('scraping.follow_google_feedproxy', 'true', 'Resolve Google FeedProxy URLs', 'scraping'),
    ('advanced.log_retention_days', '30', 'Days to keep processing logs', 'advanced'),
    ('advanced.debug_mode', 'false', 'Enable debug logging', 'advanced')
ON CONFLICT (key) DO NOTHING;

COMMIT;
```

Click **Run** o presiona `Ctrl+Enter`

### 3. Verifica la Migración

Ejecuta esto para verificar:

```sql
SELECT * FROM system_settings ORDER BY category, key;
```

Debes ver 13 registros con las configuraciones por defecto.

### ⚠️ Troubleshooting

**Si ves error "column category does not exist":**

Esto significa que la tabla se creó parcialmente. La migración actualizada hace `DROP TABLE` primero para limpiar cualquier tabla existente. Solo ejecuta la migración completa de nuevo y funcionará correctamente.

### 4. Refresca el Admin Dashboard

1. Ve a: http://localhost:3000/admin?section=settings
2. Los settings ahora se guardarán en la base de datos
3. Cualquier cambio persistirá entre sesiones

---

## 📊 Settings con Efecto Real

Los settings ahora controlan activamente el comportamiento del sistema:

### ✅ General Settings

| Setting | Efecto en el Código |
|---------|---------------------|
| **max_posts_per_run** | Limita cuántos items de RSS se procesan en cada ejecución. Si un feed tiene 100 items pero max=10, solo procesa los primeros 10. |
| **quality_threshold** | Filtra oportunidades por AI confidence score. Si threshold=0.7 y AI score=0.65, rechaza el contenido. |
| **auto_publish** | Controla si las oportunidades aprobadas se publican automáticamente o quedan como draft. Global override sobre configuración de feed. |

### ✅ Scraping Settings

| Setting | Efecto en el Código |
|---------|---------------------|
| **request_timeout** | Tiempo máximo de espera para cargar una página web (en ms). Default: 10000 (10 segundos). |
| **max_redirects** | Número máximo de redirecciones HTTP a seguir. |
| **min_content_length** | Rechaza páginas con menos contenido que este mínimo (en caracteres). |
| **max_content_length** | Trunca contenido que excede este máximo para ahorrar tokens de IA. |
| **user_agent** | User-Agent string enviado en HTTP requests. |
| **follow_google_feedproxy** | Si detecta feedproxy.google.com, resuelve el redirect al destino final. |

### ✅ Advanced Settings

| Setting | Efecto en el Código |
|---------|---------------------|
| **log_retention_days** | (Futuro) Días para mantener logs antes de auto-eliminar. |
| **debug_mode** | (Futuro) Activa logging detallado adicional. |

---

## 🎯 Ejemplos de Uso

### Ejemplo 1: Limitar Procesamiento

Si tienes un feed con 200 items pero solo quieres procesar 5 por run:

1. Ve a Settings > General
2. Cambia "Maximum Posts Per Processing Run" a `5`
3. Click "Save Settings"
4. Próxima ejecución: solo procesará 5 items

### Ejemplo 2: Aumentar Quality Threshold

Si recibes mucho contenido de baja calidad:

1. Ve a Settings > General
2. Aumenta "Quality Threshold" a `80%`
3. Click "Save Settings"
4. Solo contenido con 80%+ confidence será aceptado

### Ejemplo 3: Ajustar Timeout de Scraping

Si páginas tardan mucho en cargar:

1. Ve a Settings > Scraping
2. Aumenta "Request Timeout" a `20000` (20 segundos)
3. Click "Save Settings"
4. Scraper esperará hasta 20 seg por página

---

## 🔍 Caching

El sistema implementa caching de 1 minuto para optimizar performance:
- Los settings se cargan desde DB solo la primera vez
- Cambios se reflejan en máximo 1 minuto
- Cache se limpia automáticamente al guardar

---

## ✅ Estado Actual

**✅ Implementado:**
- Tabla system_settings con JSONB
- SettingsService con caching
- API endpoints para GET/POST
- Integración en RSS Processor
- Integración en Scraper Service
- Type-safe settings interface

**⏳ Por implementar (futuro):**
- Log retention automation
- Debug mode logging detail
- Settings import/export functionality

---

**Archivo de migración:** `migrations/006_create_system_settings.sql`
**Fecha:** 2026-01-12
**Versión:** v1.0.0-alpha.5
