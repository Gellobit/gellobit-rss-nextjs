# Gellobit RSS Processor - Next.js

> Migración del plugin WordPress "Gellobit RSS Processor" a Next.js 15 con Supabase y AI multi-provider

## 📋 Versión

**v1.0.0-alpha.1** - Fundación y AI Service completados

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

# Ejecutar migración SQL en Supabase
# Copiar contenido de migrations/001_initial_schema.sql

# Crear usuario admin en Supabase
# Ver instrucciones en migrations/

# Iniciar servidor de desarrollo
cd apps/web
npm run dev
```

## ✨ Características Implementadas (v1.0.0-alpha.1)

### ✅ Fase 1: Fundación
- [x] Schema SQL completo con RLS
- [x] Tipos TypeScript para BD y API
- [x] Utilidades: logger, crypto, validation, error-handler
- [x] Parser RSS con normalización

### ✅ Fase 2: AI Service
- [x] Clase base AbstractAIProvider
- [x] 4 Providers: OpenAI, Claude, DeepSeek, Gemini
- [x] AIService unificado (selección automática)
- [x] Generación de contenido en 1 llamada (JSON)
- [x] Test de conexión para cada provider

### 🚧 En Progreso
- [ ] Prompt Service (gestión de prompts)
- [ ] Scraper Service (extracción de contenido)
- [ ] Duplicate Checker Service
- [ ] Opportunity Service (CRUD)
- [ ] Analytics Service
- [ ] RSS Processor Service (orquestador principal)
- [ ] API Routes (admin + cron)
- [ ] Vercel Cron configuration
- [ ] UI Components actualizados

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

## 🎯 Próximos Pasos

1. Implementar servicios restantes (Scraper, Duplicate Checker, etc.)
2. Crear API routes para admin y cron
3. Migrar prompts de WordPress a TypeScript
4. Configurar Vercel Cron para procesamiento automático
5. Actualizar componentes UI para conectar con backend
6. Testing E2E completo

---

**Estado**: 🟡 Alpha - Fundación completada, servicios core en desarrollo
**Última actualización**: 2026-01-12
