# 📊 Analytics Setup - IMPORTANTE

## ⚠️ Migración Requerida

Para que la página de **Analytics** funcione correctamente, necesitas ejecutar una migración SQL en Supabase.

## 🔧 Pasos para Activar Analytics

### 1. Ve a Supabase SQL Editor

1. Abre: https://supabase.com/dashboard
2. Selecciona tu proyecto: **gellobit-rss-nextjs**
3. Click en **SQL Editor** (menú izquierdo)

### 2. Ejecuta Esta Migración

Copia y pega este SQL:

```sql
-- Add view tracking to opportunities
ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_opportunities_view_count
ON opportunities(view_count DESC);

CREATE INDEX IF NOT EXISTS idx_opportunities_created_at_type
ON opportunities(created_at, opportunity_type);

COMMIT;
```

Click **Run** o presiona `Ctrl+Enter`

### 3. Verifica la Migración

Ejecuta esto para verificar:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'opportunities'
AND column_name = 'view_count';
```

Debes ver:
```
column_name  | data_type | column_default
-------------+-----------+----------------
view_count   | integer   | 0
```

### 4. Refresca el Admin Dashboard

1. Ve a: http://localhost:3000/admin?section=analytics
2. Verás la página completa de Analytics funcionando

---

## 📈 Características de Analytics

Una vez completada la migración, tendrás acceso a:

### 1. **Feed Statistics**
- Total de feeds configurados
- Feeds activos
- Feeds con errores

### 2. **Post Statistics**
- Total de posts creados
- Posts hoy / esta semana
- Posts publicados vs drafts vs rechazados

### 3. **Processing Statistics**
- Errores en últimas 24h
- Tasa de éxito del procesamiento
- Último procesamiento
- Total procesado en 24h

### 4. **Performance por Categoría**
Tabla completa mostrando para cada tipo (giveaway, sweepstakes, etc.):
- Total de posts creados
- Cuántos fueron publicados
- Cuántos rechazó la IA
- **Total de vistas** (métricas de popularidad)
- Tasa de éxito (% publicados)

### 5. **Top 10 Oportunidades Más Vistas**
- Ranking de contenido más popular
- Título, categoría, fecha
- Contador de vistas

### 6. **Filtro de Tiempo**
- Últimas 24 horas
- Últimos 7 días
- Últimos 30 días
- Todo el tiempo

---

## 🔍 Tracking de Vistas

### ¿Cómo se Trackean las Vistas?

El campo `view_count` se incrementará automáticamente cuando:
- Un usuario abra una oportunidad específica
- Se llame al endpoint: `POST /api/opportunities/[id]/view`

### Implementación Futura

Para trackear vistas en el frontend, agrega esto en la página de detalle de oportunidad:

```typescript
// En app/p/[slug]/page.tsx
useEffect(() => {
  // Increment view count
  fetch(`/api/opportunities/${opportunityId}/view`, {
    method: 'POST'
  });
}, [opportunityId]);
```

---

## ✅ Estado Actual

**✅ Implementado:**
- Página de Analytics completa
- API endpoint con todas las métricas
- Filtros de tiempo (24h, 7d, 30d, all)
- Agrupación por categorías
- Top performers ranking

**⚠️ Requiere:**
- Ejecutar migración SQL (arriba)
- Implementar endpoint de tracking de vistas (futuro)

---

## 🎯 Beneficios

Con esta página de Analytics podrás:

1. **Identificar categorías populares** - Saber qué tipo de oportunidades interesan más
2. **Medir eficiencia de IA** - Ver tasa de aceptación vs rechazo por categoría
3. **Optimizar contenido** - Enfocar esfuerzos en categorías con más vistas
4. **Monitorear salud del sistema** - Track errores y tasa de éxito
5. **Tomar decisiones data-driven** - Basar estrategia en números reales

---

**Última actualización:** 2026-01-12
**Versión:** v1.0.0-alpha.3
