# Gellobit RSS Processor - Next.js

> Migración del plugin WordPress "Gellobit RSS Processor" a Next.js 15 con Supabase y AI multi-provider

## 📋 Versión

**v1.0.0-alpha.4** - Admin Dashboard completo (WordPress replicado)

**✅ Admin Panel Completo:** Dashboard, Analytics con view tracking, y Processing Log implementados.

**⚠️ NOTA IMPORTANTE:** Para que Analytics funcione, ejecuta la migración: `migrations/004_add_view_tracking.sql` (ver [ANALYTICS_SETUP.md](ANALYTICS_SETUP.md))

## 🚀 Stack Tecnológico

- **Framework**: Next.js 15.0.0 (App Router)
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **AI Providers**:
  - OpenAI (GPT-4o-mini)
  - Anthropic (Claude 3.5 Sonnet)
  - DeepSeek (DeepSeek-Chat)
  - Google (Gemini 1.5 Flash)
- **RSS**: rss-parser
- **Scraping**: Cheerio
- **Validación**: Zod
- **Styling**: Tailwind CSS

## 🏗️ Arquitectura

```
apps/web/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── admin/             # Panel Admin
│   ├── auth/              # Autenticación
│   └── p/[slug]/          # Páginas de oportunidades
├── lib/
│   ├── ai-providers/      # 4 AI Providers implementados
│   ├── services/          # Servicios de negocio
│   ├── types/             # TypeScript types
│   └── utils/             # Utilidades
├── migrations/            # SQL migrations
└── prompts/              # AI prompts por tipo
```

## 📦 Base de Datos (Supabase)

### Tablas Creadas (10)

1. **profiles** - Roles de usuario (admin/user)
2. **rss_feeds** - Configuración de feeds RSS
3. **opportunities** - Oportunidades generadas
4. **ai_settings** - Configuración de AI providers
5. **processing_logs** - Logs de procesamiento
6. **duplicate_tracking** - Prevención de duplicados
7. **ai_queue** - Cola de procesamiento AI
8. **analytics** - Métricas y estadísticas
9. **processing_history** - Auditoría completa
10. **prompt_templates** - Prompts personalizados

## 🔑 Variables de Entorno

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Vercel Cron
CRON_SECRET=

# AI Providers (opcional - se pueden guardar en BD)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
DEEPSEEK_API_KEY=
GEMINI_API_KEY=
```

## 🛠️ Instalación y Desarrollo

```bash
# Instalar dependencias
npm install

# Ejecutar migraciones SQL en Supabase (en orden)
# 1. migrations/001_initial_schema.sql - Schema completo
# 2. migrations/004_nuclear_fix_rls.sql - Corregir políticas RLS (IMPORTANTE)
# 3. migrations/003_verify_admin_user.sql - Verificar usuario admin
# 4. migrations/004_add_view_tracking.sql - Analytics con view tracking (NECESARIO para Analytics)
# 5. migrations/005_add_ai_provider_column.sql - AI provider tracking (NECESARIO para Processing Log)

# Configurar variables de entorno
# Copiar .env.example a .env.local y completar

# Iniciar servidor de desarrollo
cd apps/web
npm run dev
```

**⚠️ SOLUCIÓN DE PROBLEMAS:**
- Si ves "Access Denied" → Lee [FIX_ACCESS_DENIED.md](FIX_ACCESS_DENIED.md)
- Si ves error RLS → Ejecuta `migrations/004_nuclear_fix_rls.sql`
- Si no eres admin → Ejecuta `migrations/003_verify_admin_user.sql`
- Si Analytics no funciona → Lee [ANALYTICS_SETUP.md](ANALYTICS_SETUP.md)
- Si Processing Log falla → Lee [PROCESSING_LOG_FIX.md](PROCESSING_LOG_FIX.md)

## ✨ Características Implementadas

### ✅ Fase 1: Fundación
- [x] Schema SQL completo con RLS (FIXED - sin recursión)
- [x] Tipos TypeScript para BD y API
- [x] Utilidades: logger, crypto, validation, error-handler
- [x] Parser RSS con normalización

### ✅ Fase 2: AI Service
- [x] Clase base AbstractAIProvider
- [x] 4 Providers: OpenAI, Claude, DeepSeek, Gemini
- [x] AIService unificado (selección automática)
- [x] Generación de contenido en 1 llamada (JSON)
- [x] Test de conexión para cada provider

### ✅ Fase 3: Core Services
- [x] Prompt Service (gestión de prompts con fallback a TypeScript)
- [x] Scraper Service (extracción de contenido + Google FeedProxy resolver)
- [x] Duplicate Checker Service (hash + similarity)
- [x] Opportunity Service (CRUD completo)
- [x] Analytics Service (métricas de procesamiento)
- [x] RSS Processor Service (orquestador principal)

### ✅ Fase 4: API Routes
- [x] `/api/cron/process-feeds` - Vercel Cron endpoint
- [x] `/api/admin/feeds` - CRUD feeds
- [x] `/api/admin/feeds/[id]` - Individual feed operations
- [x] `/api/admin/feeds/[id]/sync` - Manual sync trigger
- [x] `/api/admin/ai-settings` - AI configuration
- [x] `/api/admin/ai-settings/test` - Test AI connection
- [x] `/api/admin/opportunities` - CRUD opportunities
- [x] `/api/admin/logs` - Processing logs
- [x] `/api/admin/analytics` - Statistics

### ✅ Fase 5: Admin UI - Completa (WordPress Replicado)
- [x] **AdminLayout** - Tab navigation system (Dashboard, RSS Feeds, Analytics, Settings, Processing Log)
- [x] **Dashboard** - System status, stats cards, quick actions, feed status, recent activity
- [x] **Analytics** - Feed stats, post stats, processing stats, category performance, top 10 performers, time filters
- [x] **Processing Log** - Status/provider/feed filters, rejection reasons, links to original sources, published posts verification
- [x] **ManageFeeds** - Connected to API, with "Sync Now" button per feed
- [x] **ManageAISettings** - Connected to API, with "Test Connection" for 4 providers
- [x] **CreateOpportunityForm** - Manual opportunity creation
- [x] **Vercel Cron configuration** (vercel.json)

### 🚧 Pendiente
- [ ] Settings page con 5 tabs (General, AI, Prompts, Scraping, Advanced)
- [ ] Migrar prompts personalizados desde WordPress
- [ ] View tracking endpoint (`POST /api/opportunities/[id]/view`)
- [ ] Testing E2E completo del flujo RSS → AI → Opportunity
- [ ] Deploy a Vercel y verificar cron automático

## 📝 Tipos de Oportunidades Soportados

1. **contest** - Concursos
2. **giveaway** - Sorteos
3. **sweepstakes** - Rifas
4. **dream_job** - Trabajos soñados
5. **get_paid_to** - Trabajos pagados
6. **instant_win** - Premios instantáneos
7. **job_fair** - Ferias de trabajo
8. **scholarship** - Becas
9. **volunteer** - Voluntariados
10. **free_training** - Capacitaciones gratuitas
11. **promo** - Promociones

## 🔄 Flujo de Procesamiento (Planeado)

```
RSS Feed URL
    ↓
Fetch & Parse RSS
    ↓
Check Duplicates (hash-based)
    ↓
Scrape Full Content
    ↓
AI Generation (single call → JSON)
    ├─ valid: true  → Create Opportunity
    └─ valid: false → Reject + Log reason
    ↓
Record Analytics
```

## 🤝 Contribución

Este proyecto fue construido con **Claude Code** y replica la funcionalidad del plugin WordPress "Gellobit RSS Processor".

## 📄 Licencia

Privado - Proyecto Gellobit

## 🎯 Próximos Pasos para Testing

### 1. Configurar AI Provider (5 min)
1. Ve a http://localhost:3000/admin
2. En "AI Configuration", elige un provider:
   - **OpenAI**: Necesitas `OPENAI_API_KEY` (sk-...)
   - **Anthropic**: Necesitas `ANTHROPIC_API_KEY` (sk-ant-...)
   - **DeepSeek**: Necesitas `DEEPSEEK_API_KEY` (sk-...)
   - **Gemini**: Necesitas `GEMINI_API_KEY` (AIza...)
3. Click "Test Connection" para verificar
4. Click "Save Settings"

### 2. Agregar un RSS Feed de Prueba (2 min)
1. Crea un Google Alert para algún tema (ej: "giveaways")
2. Copia la URL del RSS feed
3. En "Manage RSS Feeds":
   - Nombre: "Test Giveaways"
   - URL: [tu URL de Google Alerts]
   - Tipo: "Giveaway"
   - ✓ Enable Scraping
   - ✓ Enable AI Processing
   - ⬜ Auto Publish (déjalo sin marcar para revisar primero)
4. Click "Add Feed"

### 3. Probar Sync Manual (2 min)
1. Click el botón ▶️ "Play" (Sync Now) en tu feed
2. Espera a que termine (puede tardar 30-60 seg)
3. Verás un resumen:
   - Items procesados
   - Oportunidades creadas
   - Duplicados omitidos
   - Rechazos de IA

### 4. Ver Oportunidades Creadas
1. Ve a http://localhost:3000
2. Debes ver las nuevas oportunidades en la homepage
3. Click en una para ver el contenido completo generado por IA

### 5. Probar Cron Manualmente (Opcional)
```bash
curl -X POST http://localhost:3000/api/cron/process-feeds \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

### 6. Deploy a Vercel (Cuando esté listo)
```bash
vercel deploy
```
Vercel Cron ejecutará automáticamente cada hora.

---

**Estado**: 🟢 Beta - Admin Dashboard completo, listo para testing end-to-end
**Última actualización**: 2026-01-12
**Versión**: v1.0.0-alpha.4
