# 🔧 Processing Log - Fix Error

## ⚠️ Error Encontrado

Al acceder a la pestaña "Processing Log" ves este error:
```
Error fetching logs: "Failed to fetch logs"
column opportunities.ai_provider does not exist
```

## 🔧 Solución

Ejecuta esta migración SQL en Supabase para agregar la columna faltante.

### 1. Ve a Supabase SQL Editor

1. Abre: https://supabase.com/dashboard
2. Selecciona tu proyecto: **gellobit-rss-nextjs**
3. Click en **SQL Editor** (menú izquierdo)

### 2. Ejecuta Esta Migración

Copia y pega este SQL:

```sql
-- Add AI Provider Tracking to Opportunities
ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS ai_provider VARCHAR(50) DEFAULT 'default';

-- Create index for filtering by AI provider
CREATE INDEX IF NOT EXISTS idx_opportunities_ai_provider ON opportunities(ai_provider);

COMMIT;
```

Click **Run** o presiona `Ctrl+Enter`

### 3. Verifica la Migración

Ejecuta esto para verificar:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'opportunities'
AND column_name = 'ai_provider';
```

Debes ver:
```
column_name  | data_type        | column_default
-------------+------------------+----------------
ai_provider  | character varying| 'default'::character varying
```

### 4. Refresca el Admin Dashboard

1. Ve a: http://localhost:3000/admin?section=logs
2. La página de Processing Log debe cargar sin errores
3. Verás los logs de procesamiento con filtros funcionando

---

## 📊 ¿Para Qué Sirve Esta Columna?

La columna `ai_provider` registra qué proveedor de IA (OpenAI, Claude, DeepSeek, Gemini) se usó para generar cada oportunidad.

**Beneficios:**
- Filtrar logs por proveedor de IA
- Comparar rendimiento entre proveedores
- Auditar qué contenido fue generado por cuál IA
- Identificar si algún proveedor rechaza más contenido

---

**Archivo de migración:** `migrations/005_add_ai_provider_column.sql`
**Fecha:** 2026-01-12
