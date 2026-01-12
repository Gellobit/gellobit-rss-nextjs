# Gellobit RSS Processor - Next.js

> Migración del plugin WordPress "Gellobit RSS Processor" a Next.js 15 con Supabase y AI multi-provider

## 📋 Versión

**v1.0.0-alpha.3** - Backend completo + Admin UI conectado

**✅ Backend Funcional:** Todos los servicios, API routes y admin UI están conectados y listos para usar.

**⚠️ NOTA:** Si ves error "infinite recursion detected" o "Access Denied", ya está RESUELTO. El script `004_nuclear_fix_rls.sql` elimina completamente la recursión en RLS policies.

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
# 2. migrations/002_fix_rls_policies.sql - Corregir políticas RLS
# 3. migrations/003_verify_admin_user.sql - Verificar usuario admin

# Configurar variables de entorno
# Copiar .env.example a .env.local y completar

# Iniciar servidor de desarrollo
cd apps/web
npm run dev
```

**⚠️ SOLUCIÓN DE PROBLEMAS:**
- Si ves "Access Denied" → Lee [FIX_ACCESS_DENIED.md](FIX_ACCESS_DENIED.md)
- Si ves error RLS → Ejecuta `migrations/002_fix_rls_policies.sql`
- Si no eres admin → Ejecuta `migrations/003_verify_admin_user.sql`

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

### ✅ Fase 5: Admin UI
- [x] ManageFeeds - Connected to API, with "Sync Now" button
- [x] ManageAISettings - Connected to API, with "Test Connection"
- [x] CreateOpportunityForm - Manual opportunity creation
- [x] Vercel Cron configuration (vercel.json)

### 🚧 Pendiente
- [ ] Migrar prompts personalizados desde WordPress
- [ ] Dashboard de analytics visuales
- [ ] Viewer de logs en UI
- [ ] Testing E2E completo
- [ ] Deploy a Vercel

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

**Estado**: 🟢 Beta - Backend completo, listo para testing end-to-end
**Última actualización**: 2026-01-12
**Versión**: v1.0.0-alpha.3
