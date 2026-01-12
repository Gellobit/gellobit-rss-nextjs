# Gellobit RSS Processor - Content Curation System Roadmap

**Versión Actual**: v0.9.3
**Objetivo**: Evolucionar de RSS Processor a Content Curation Platform
**Fecha**: Noviembre 2025

---

## 📋 Índice

1. [Visión General](#visión-general)
2. [Fase 0: Estado Actual (v0.9.3)](#fase-0-estado-actual-v093)
3. [Fase 1: Draft Queue Dashboard (v1.0)](#fase-1-draft-queue-dashboard-v10)
4. [Fase 2: Re-Processing & Quality Tools (v1.1)](#fase-2-re-processing--quality-tools-v11)
5. [Fase 3: Quality Scoring System (v1.2)](#fase-3-quality-scoring-system-v12)
6. [Fase 4: Scheduled Publishing (v1.3)](#fase-4-scheduled-publishing-v13)
7. [Fase 5: AI-Assisted Curation (v1.4+)](#fase-5-ai-assisted-curation-v14)
8. [Arquitectura Técnica](#arquitectura-técnica)
9. [Métricas de Éxito](#métricas-de-éxito)

---

## Visión General

### Problema Actual
Los sistemas de RSS automation (como WP Automatic) publican contenido automáticamente sin revisión humana, resultando en:
- Publicación de contenido inválido
- Títulos no optimizados
- Imágenes de baja calidad
- Enlaces incorrectos
- Sin control editorial

### Solución Propuesta
Sistema de curación en 2 etapas:
1. **CAPTURA**: Automatizada, rápida, 24/7 → Drafts
2. **CURACIÓN**: Manual/Semi-auto, cuando el editor tenga tiempo → Published

### Ventajas Competitivas
- ✅ Calidad sobre cantidad
- ✅ Control editorial completo
- ✅ Sin publicaciones automáticas de contenido malo
- ✅ Workflow escalable (permite equipo editorial)
- ✅ Re-procesamiento sin perder datos originales
- ✅ Analytics de curación

---

## Fase 0: Estado Actual (v0.9.3)

### ✅ Funcionalidad Existente

**Sistema de Drafts Básico**:
- Checkbox "Auto-publish posts" en cada feed
- Si está desmarcado, posts van a `draft` status
- Editor puede revisarlos manualmente en Posts > Drafts
- Publicación manual desde el editor de WordPress

**Captura de Datos**:
- Parse RSS/Atom feeds
- Scraping de contenido web
- Procesamiento con múltiples IAs
- Detección de contenido inválido
- Sistema anti-duplicados
- Featured image con fallback

**Limitaciones Actuales**:
- No hay interfaz especializada para drafts
- No hay herramientas de re-procesamiento
- No hay indicadores de calidad
- Curación debe hacerse en el editor estándar de WP
- No hay filtros por feed/categoría
- No hay bulk actions

### Workflow Actual (Manual)
```
1. Cron captura feeds → drafts
2. Editor abre Posts > Drafts en WordPress
3. Editor abre cada post individualmente
4. Editor revisa/edita en el editor de WP
5. Editor cambia status a "Publish"
6. Repite para cada post
```

**Tiempo promedio**: 5-10 minutos por post

---

## Fase 1: Draft Queue Dashboard (v1.0)

**Objetivo**: Interfaz dedicada para curación rápida y eficiente

**ETA**: 1-2 semanas de desarrollo
**Prioridad**: ALTA
**Dependencias**: Ninguna

### Features

#### 1.1 Nueva Página: "Draft Queue"

**Ubicación**: `Gellobit RSS > Draft Queue`

**Layout**:
```
┌─────────────────────────────────────────────────────────────────┐
│  📝 Draft Queue                                    [23 pending]  │
├─────────────────────────────────────────────────────────────────┤
│  Filters: [All Feeds ▼] [All Categories ▼] [All Status ▼]      │
│  Sort by: [Newest First ▼]                    🔍 [Search...]    │
├─────────────────────────────────────────────────────────────────┤
│  ☐ [Select All]    Bulk Actions: [Publish ▼] [Apply]           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ☐ [IMG]  Goodwill Veterans Day Career Fair - Columbus GA       │
│           Feed: Job Fairs | Category: Events                    │
│           Captured: 2 hours ago | Words: 456                    │
│           Status: ✓ Scraped | ✓ AI | ✓ Image                   │
│           [👁️ Preview] [✏️ Edit] [✅ Publish] [🗑️ Delete]          │
│                                                                  │
│  ☐ [IMG]  $5000 College Scholarship - Apply by Nov 15           │
│           Feed: Scholarships | Category: Education              │
│           Captured: 5 hours ago | Words: 234                    │
│           Status: ✗ No Image | ✓ AI | ⚠️ Short content         │
│           [👁️ Preview] [✏️ Edit] [🔄 Re-process] [🗑️ Delete]      │
│                                                                  │
│  ☐ [?]    Mystery Shopping Jobs - Earn $200/Day                 │
│           Feed: Get Paid To | Category: Side Hustles            │
│           Captured: 1 day ago | Words: 123                      │
│           Status: ✗ No Image | ✗ Scrape Failed | ⚠️ Suspicious │
│           [👁️ Preview] [🗑️ Delete]                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 1.2 Indicadores de Calidad Visuales

**Badges de Status**:
- ✓ Scraped: Verde si scraping exitoso
- ✓ AI: Verde si AI procesó exitosamente
- ✓ Image: Verde si tiene featured image
- ⚠️ Warnings: Amarillo para problemas menores
- ✗ Errors: Rojo para problemas graves

**Colores de Fila**:
- Verde claro: Alta calidad, listo para publicar
- Amarillo claro: Necesita revisión
- Rojo claro: Baja calidad, considerar eliminar

**Iconos de Contenido**:
- 📝 Artículo largo (>400 palabras)
- 📄 Artículo medio (200-400 palabras)
- 📃 Artículo corto (<200 palabras)

#### 1.3 Preview Modal

Click en "👁️ Preview" abre modal:
```
┌─────────────────────────────────────────────────────┐
│  Preview: Goodwill Veterans Day Career Fair    [×]  │
├─────────────────────────────────────────────────────┤
│  [Featured Image]                                   │
│                                                     │
│  Title: Goodwill Veterans Day Career Fair -        │
│         Columbus GA Job Fair                        │
│                                                     │
│  Category: Events | Feed: Job Fairs                │
│  Created: 2 hours ago                               │
│                                                     │
│  Content:                                           │
│  This special hiring event honors military          │
│  veterans, their families, and community members... │
│                                                     │
│  [View Full Post] [Edit] [Publish] [Delete]        │
└─────────────────────────────────────────────────────┘
```

#### 1.4 Filtros y Búsqueda

**Filtros Disponibles**:
- Por Feed: Dropdown con todos los feeds
- Por Categoría: Dropdown con todas las categorías
- Por Status: All, Has Image, No Image, Scrape Failed, etc.
- Por Fecha: Today, Last 3 days, Last Week, Last Month

**Búsqueda**:
- Buscar en título
- Buscar en contenido
- Buscar en feed name

**Ordenamiento**:
- Newest First (default)
- Oldest First
- By Feed
- By Category
- By Word Count

#### 1.5 Bulk Actions

**Acciones en Masa**:
- Publish Selected
- Delete Selected
- Move to Category
- Change Feed (re-assign)
- Mark as Reviewed

**Ejemplo de Uso**:
```
1. Filtrar por Feed: "Job Fairs"
2. Seleccionar todos (23 posts)
3. Revisar thumbnails rápidamente
4. Deseleccionar los 5 que no se ven bien
5. Bulk Action: "Publish Selected"
6. Publicar 18 posts en 1 click
```

#### 1.6 Quick Edit

Hover sobre un item → aparece panel de quick edit:
```
┌─────────────────────────────────────────────────┐
│  Quick Edit                                     │
├─────────────────────────────────────────────────┤
│  Title: [Goodwill Veterans Day Career Fair...] │
│  Category: [Events ▼]                           │
│  Status: [Draft ▼]                              │
│  Featured Image: [Change]                       │
│                                                 │
│  [Update] [Cancel]                              │
└─────────────────────────────────────────────────┘
```

### Archivos a Crear

**PHP**:
- `/includes/class-draft-queue.php` - Lógica del dashboard
- `/includes/class-draft-actions.php` - Acciones (publish, delete, etc.)

**Templates**:
- `/templates/draft-queue-page.php` - Layout principal
- `/templates/draft-queue-item.php` - Item individual
- `/templates/draft-preview-modal.php` - Modal de preview

**CSS**:
- `/assets/css/draft-queue.css` - Estilos del dashboard

**JavaScript**:
- `/assets/js/draft-queue.js` - Interactividad (modals, bulk actions, AJAX)

### Base de Datos

**Nueva Tabla**: `wp_gellobit_draft_metadata`
```sql
CREATE TABLE wp_gellobit_draft_metadata (
    id BIGINT(20) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT(20) UNSIGNED NOT NULL,
    feed_id MEDIUMINT(9) NOT NULL,
    quality_score INT(3) DEFAULT 0,
    has_image TINYINT(1) DEFAULT 0,
    scrape_success TINYINT(1) DEFAULT 0,
    ai_success TINYINT(1) DEFAULT 0,
    word_count INT(11) DEFAULT 0,
    external_links_count INT(11) DEFAULT 0,
    reviewed TINYINT(1) DEFAULT 0,
    review_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY post_id (post_id),
    KEY feed_id (feed_id),
    KEY quality_score (quality_score),
    KEY reviewed (reviewed)
);
```

### Métricas de Éxito

**Antes (v0.9.3)**:
- Tiempo de curación: 5-10 min/post
- Posts revisados por hora: 6-12
- Capacidad diaria: ~100 posts (8 horas trabajo)

**Después (v1.0)**:
- Tiempo de curación: 1-2 min/post
- Posts revisados por hora: 30-60
- Capacidad diaria: ~400 posts (8 horas trabajo)

**ROI**: 4x más productividad

---

## Fase 2: Re-Processing & Quality Tools (v1.1)

**Objetivo**: Herramientas para mejorar posts sin perder datos originales

**ETA**: 2-3 semanas de desarrollo
**Prioridad**: MEDIA
**Dependencias**: Fase 1 completada

### Features

#### 2.1 Re-Scraping Tool

**Botón**: "🔄 Re-scrape" en cada draft

**Funcionalidad**:
1. Guarda el contenido actual como backup
2. Vuelve a scrapear la URL original
3. Compara nuevo contenido vs. anterior
4. Muestra diferencias en modal
5. Editor decide: Keep Old, Use New, o Merge

**Modal de Comparación**:
```
┌─────────────────────────────────────────────────────────┐
│  Re-scrape Comparison                              [×]  │
├─────────────────────────────────────────────────────────┤
│  Original (2 hours ago)     │  New (just now)           │
│  ──────────────────────────│──────────────────────────  │
│  Words: 234                │  Words: 456 ✓             │
│  Image: No                 │  Image: Yes ✓             │
│  External Links: 0         │  External Links: 2 ✓      │
│                            │                            │
│  Content Preview:          │  Content Preview:          │
│  This event...             │  This event is a special   │
│                            │  hiring opportunity...     │
│                            │                            │
│  [Keep Original] [Use New] [View Side-by-Side]         │
└─────────────────────────────────────────────────────────┘
```

**Casos de Uso**:
- Scraping inicial falló → Re-intentar
- Sitio agregó más info después → Capturar actualización
- Imagen no se encontró inicialmente → Buscar de nuevo

#### 2.2 AI Re-Generation Tool

**Botón**: "🤖 Regenerate with AI" en cada draft

**Opciones**:
```
┌─────────────────────────────────────────────────┐
│  AI Re-Generation Options                  [×] │
├─────────────────────────────────────────────────┤
│  What to regenerate:                            │
│  ☑ Title                                        │
│  ☑ Content                                      │
│  ☐ Keep original as backup                     │
│                                                 │
│  AI Provider:                                   │
│  ○ Use same as original (DeepSeek)             │
│  ● Try different provider: [Claude ▼]          │
│                                                 │
│  Prompt Adjustments (optional):                │
│  [Make title more click-worthy...]             │
│                                                 │
│  [Regenerate] [Cancel]                          │
└─────────────────────────────────────────────────┘
```

**Version History**:
Cada regeneración se guarda como versión:
```
Version 1 (Original - DeepSeek):
  Title: "Goodwill Veterans Day Career Fair"
  [View Full] [Restore]

Version 2 (Regenerated - Claude):
  Title: "Columbus Veterans: Free Job Fair Nov 6"
  [View Full] [Restore] ← Currently Active

Version 3 (Manual Edit):
  Title: "Veterans Day Hiring Event - 50+ Employers"
  [View Full] [Restore]
```

#### 2.3 Title Optimizer

**Botón**: "✨ Optimize Title" - solo regenera el título

**Opciones de Optimización**:
- SEO-optimized (incluir keywords)
- Click-worthy (más engaging)
- Shorter (para social media)
- Longer (más descriptivo)
- With numbers (incluir fechas, cantidades)

**Ejemplo**:
```
Original: "Career Fair in Columbus"

SEO: "Columbus Job Fair - November 6, 2025 | Veterans Welcome"
Click: "50+ Employers Hiring Veterans at Columbus Career Fair"
Short: "Columbus Veterans Job Fair Nov 6"
With Numbers: "Columbus Career Fair: 50+ Companies, 200+ Positions"
```

#### 2.4 Image Finder Tool

**Botón**: "🖼️ Find Better Image"

**Sources**:
1. Re-scrape original URL for images
2. Search related images in WordPress Media Library
3. Suggest free stock images from APIs (Unsplash, Pexels)
4. Extract images from scraped content

**UI**:
```
┌─────────────────────────────────────────────────┐
│  Find Better Featured Image                [×] │
├─────────────────────────────────────────────────┤
│  Current Image:                                 │
│  [Current featured image preview]               │
│                                                 │
│  Suggestions from source:                       │
│  [img1] [img2] [img3]                          │
│                                                 │
│  From Media Library:                            │
│  [img4] [img5] [img6]                          │
│                                                 │
│  Stock Images (Unsplash):                       │
│  [img7] [img8] [img9]                          │
│                                                 │
│  [Upload New] [Use Fallback]                    │
└─────────────────────────────────────────────────┘
```

#### 2.5 Content Enhancement Tool

**Botón**: "📝 Enhance Content"

**Enhancements Automáticos**:
- Fix broken links
- Add target="_blank" to external links
- Format phone numbers
- Format dates consistently
- Add structured data markup
- Add related internal links
- Add call-to-action at end

**Preview de Cambios**:
```
Original:
  Visit website for more info.

Enhanced:
  Visit the official website for complete details and
  registration information.

  [Apply Now →]
```

#### 2.6 Duplicate Content Checker

**Alerta Automática**:
Si detecta contenido similar a posts ya publicados:
```
⚠️ Warning: Similar Content Detected

This draft appears similar to:
  - "Columbus Job Fair - Oct 15" (Published)
  - "Veterans Hiring Event" (Draft)

Similarity: 78%

Actions:
[View Similar Posts] [Mark as Duplicate] [Continue Anyway]
```

### Archivos a Crear

**PHP**:
- `/includes/class-reprocessor.php` - Re-scraping y regeneración
- `/includes/class-version-manager.php` - Manejo de versiones
- `/includes/class-content-enhancer.php` - Mejoras automáticas
- `/includes/class-duplicate-detector.php` - Detección de duplicados

**JavaScript**:
- `/assets/js/reprocessing-tools.js` - UI para herramientas

### Base de Datos

**Nueva Tabla**: `wp_gellobit_content_versions`
```sql
CREATE TABLE wp_gellobit_content_versions (
    id BIGINT(20) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT(20) UNSIGNED NOT NULL,
    version_number INT(11) NOT NULL,
    title TEXT,
    content LONGTEXT,
    ai_provider VARCHAR(50),
    created_by VARCHAR(20) DEFAULT 'system',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    KEY post_id (post_id),
    KEY version_number (version_number)
);
```

### Métricas de Éxito

- 30% de drafts mejoran con re-procesamiento
- 50% menos tiempo editando manualmente
- 20% más contenido de alta calidad publicado

---

## Fase 3: Quality Scoring System (v1.2)

**Objetivo**: Sistema automático de scoring para priorizar curación

**ETA**: 1-2 semanas de desarrollo
**Prioridad**: MEDIA
**Dependencias**: Fase 1 completada

### Features

#### 3.1 Quality Score Algorithm

**Score de 0-100 basado en**:

```php
Quality Score = sum([
    has_featured_image      ? 20 : 0,
    word_count > 300        ? 20 : 0,
    external_links > 0      ? 15 : 0,
    scraping_success        ? 15 : 0,
    title_length_optimal    ? 10 : 0,  // 40-70 chars
    has_dates_or_deadlines  ? 10 : 0,
    has_contact_info        ? 5  : 0,
    no_spam_keywords        ? 5  : 0
]);
```

**Categorías de Score**:
- 🟢 90-100: "Excellent" - Auto-publish candidate
- 🟢 75-89: "Good" - Ready to publish
- 🟡 50-74: "Fair" - Needs minor edits
- 🟠 25-49: "Poor" - Needs major work
- 🔴 0-24: "Very Poor" - Consider deleting

#### 3.2 Visual Score Indicators

**En Draft Queue**:
```
☐ [IMG]  🟢 95  Columbus Veterans Job Fair
         Excellent quality - Ready to publish
         [Quick Publish →]
```

**Score Badge con Tooltip**:
```
Hover sobre "🟢 95":
┌─────────────────────────────┐
│ Quality Score: 95/100       │
├─────────────────────────────┤
│ ✓ Featured Image    (+20)   │
│ ✓ Word Count: 456   (+20)   │
│ ✓ External Links: 2 (+15)   │
│ ✓ Scraped Success  (+15)    │
│ ✓ Optimal Title    (+10)    │
│ ✓ Has Deadline     (+10)    │
│ ✓ Contact Info     (+5)     │
│ ✗ Spam Keywords    (+0)     │
└─────────────────────────────┘
```

#### 3.3 Smart Sorting

**Sort by Quality Score** (default):
- Muestra los mejores primero
- Editor puede publicar rápidamente los top 10
- Ahorra tiempo identificando contenido de calidad

**Filtro por Score**:
```
Show only:
☑ Excellent (90-100)
☑ Good (75-89)
☐ Fair (50-74)
☐ Poor (25-49)
☐ Very Poor (0-24)
```

#### 3.4 Auto-Actions basadas en Score

**Configuración Global**:
```
Auto-Actions Settings:

Score ≥ 95:
  ○ Do nothing
  ● Auto-publish immediately
  ○ Schedule for review

Score ≥ 85:
  ○ Do nothing
  ● Move to "Priority Review" folder
  ○ Send notification to editor

Score < 30:
  ○ Do nothing
  ● Auto-delete after 7 days
  ○ Move to "Low Quality" folder
```

#### 3.5 Improvement Suggestions

Para scores bajos, mostrar sugerencias:
```
Score: 45/100 - Poor Quality

Missing points:
  ✗ No featured image (-20)
    → Click "Find Better Image" to add one

  ✗ Content too short: 123 words (-20)
    → Try "Re-scrape" to get more content
    → Or "Regenerate with AI" for expansion

  ✗ No external links (-15)
    → Content may not have actionable information
    → Consider adding source links manually
```

#### 3.6 Trending Quality Report

**Dashboard Widget**:
```
📊 Quality Trends (Last 7 Days)

Average Score: 67/100 (↑ 5 points)

Distribution:
🟢 Excellent: 23 posts (15%)
🟢 Good: 45 posts (30%)
🟡 Fair: 52 posts (35%)
🟠 Poor: 25 posts (17%)
🔴 Very Poor: 5 posts (3%)

Best Performing Feed: "Job Fairs" (avg 82)
Worst Performing Feed: "Get Paid To" (avg 41)
```

### Archivos a Crear

**PHP**:
- `/includes/class-quality-scorer.php` - Algoritmo de scoring
- `/includes/class-quality-analytics.php` - Reports y analytics

**JavaScript**:
- `/assets/js/quality-indicators.js` - UI de scores

### Configuración de Base de Datos

Agregar campos a `wp_gellobit_draft_metadata`:
```sql
ALTER TABLE wp_gellobit_draft_metadata
ADD COLUMN quality_score INT(3) DEFAULT 0,
ADD COLUMN quality_factors JSON,
ADD COLUMN last_scored_at DATETIME;
```

### Métricas de Éxito

- Publicación de contenido "Excellent": >30%
- Publicación de contenido "Poor": <5%
- Tiempo de curación reducido 40%
- Editor revisa 2x más posts por hora

---

## Fase 4: Scheduled Publishing (v1.3)

**Objetivo**: Control total sobre cuándo se publica el contenido

**ETA**: 1 semana de desarrollo
**Prioridad**: BAJA
**Dependencias**: Fase 1 completada

### Features

#### 4.1 Schedule Individual Posts

**UI en Draft Queue**:
```
[✅ Publish ▼]
  ├─ Publish Now
  ├─ Schedule for Later...
  └─ Add to Publishing Queue
```

**Schedule Modal**:
```
┌─────────────────────────────────────────────┐
│  Schedule Post                         [×] │
├─────────────────────────────────────────────┤
│  Publish Date:                              │
│  [Nov 7, 2025 ▼]                           │
│                                             │
│  Publish Time:                              │
│  [10:00 AM ▼]                              │
│                                             │
│  Timezone: EST (America/New_York)           │
│                                             │
│  Repeat: [One-time ▼]                      │
│    Options: One-time, Daily, Weekly         │
│                                             │
│  [Schedule Post] [Cancel]                   │
└─────────────────────────────────────────────┘
```

#### 4.2 Publishing Queue

**Nueva Página**: `Gellobit RSS > Publishing Queue`

**Vista de Calendar**:
```
November 2025
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │ Sun │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│  3  │  4  │  5  │  6  │  7  │  8  │  9  │
│     │     │     │ 2   │ 5   │ 1   │ 0   │
│     │     │     │posts│posts│post │     │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┘

Selected: Nov 6, 2025
┌────────────────────────────────────────────┐
│ 8:00 AM - Job Fair Columbus (Scheduled)   │
│ 10:00 AM - Scholarship Deadline (Draft)   │
│ 2:00 PM - Edit slot (Available)           │
│ 4:00 PM - Edit slot (Available)           │
└────────────────────────────────────────────┘
```

#### 4.3 Smart Scheduling

**Auto-Schedule Feature**:
```
Bulk Actions > Auto-Schedule Selected

Options:
  Distribution: [Even spread ▼]
    - Even spread (1 every X hours)
    - Morning burst (8AM-12PM)
    - Afternoon burst (1PM-5PM)
    - Peak traffic times

  Start Date: [Nov 7, 2025]
  End Date: [Nov 14, 2025]

  Posts per day: [3]

  Preview:
    Nov 7: 3 posts at 9AM, 1PM, 5PM
    Nov 8: 3 posts at 9AM, 1PM, 5PM
    ...

  [Apply Schedule] [Cancel]
```

#### 4.4 Publishing Rules

**Configuración Global**:
```
Publishing Rules:

Maximum posts per day: [5]
Minimum hours between posts: [2]

Preferred publishing times:
  Monday-Friday: 8AM, 12PM, 4PM
  Saturday-Sunday: 10AM, 2PM

Blackout periods:
  + Add Period (e.g., holidays, maintenance)

Auto-reschedule if conflicts: ☑ Yes
```

#### 4.5 Scheduled Post Management

**Status en Queue**:
- 🟢 Ready to publish (date/time reached)
- 🟡 Scheduled (waiting for date/time)
- 🔵 In queue (auto-schedule applied)
- 🔴 Failed (error during publishing)

**Actions**:
- Reschedule
- Publish Now
- Move to Draft
- Delete

### Archivos a Crear

**PHP**:
- `/includes/class-post-scheduler.php` - Lógica de scheduling
- `/includes/class-publishing-queue.php` - Manejo de cola
- `/includes/class-scheduler-cron.php` - Cron para publicar

**JavaScript**:
- `/assets/js/calendar-view.js` - Vista de calendario
- `/assets/js/scheduler.js` - UI de scheduling

### Base de Datos

**Nueva Tabla**: `wp_gellobit_publishing_queue`
```sql
CREATE TABLE wp_gellobit_publishing_queue (
    id BIGINT(20) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT(20) UNSIGNED NOT NULL,
    scheduled_date DATETIME NOT NULL,
    status ENUM('pending','published','failed','cancelled') DEFAULT 'pending',
    retry_count INT(3) DEFAULT 0,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    published_at DATETIME,
    KEY post_id (post_id),
    KEY scheduled_date (scheduled_date),
    KEY status (status)
);
```

### Cron Setup

**Nuevo Cron Job**:
```php
add_action('gellobit_check_scheduled_posts', 'check_and_publish_scheduled_posts');

// Runs every 5 minutes
wp_schedule_event(time(), 'gellobit_5min', 'gellobit_check_scheduled_posts');
```

### Métricas de Éxito

- Distribución uniforme de publicaciones
- Publicar en horarios de pico de tráfico
- Reducir "content dumps" (publicar todo a la vez)
- Mejor engagement por post individual

---

## Fase 5: AI-Assisted Curation (v1.4+)

**Objetivo**: IA ayuda al editor a curar más rápido

**ETA**: 3-4 semanas de desarrollo
**Prioridad**: BAJA
**Dependencias**: Fases 1-3 completadas

### Features

#### 5.1 AI Curation Assistant

**Sidebar en Draft Queue**:
```
┌────────────────────────────────────┐
│  🤖 AI Assistant                   │
├────────────────────────────────────┤
│  Analyzing 23 drafts...            │
│                                    │
│  Recommendations:                  │
│                                    │
│  🟢 High Priority (8)              │
│  "Columbus Job Fair" (Score: 95)   │
│  Reason: Excellent quality, high   │
│  engagement potential              │
│  [Quick Publish]                   │
│                                    │
│  🟡 Needs Work (10)                │
│  "Mystery Shopping" (Score: 45)    │
│  Suggestion: Re-scrape for better  │
│  content, add featured image       │
│  [Auto-Fix]                        │
│                                    │
│  🔴 Low Priority (5)               │
│  Recommendation: Review manually   │
│  or delete                         │
│  [Bulk Delete]                     │
└────────────────────────────────────┘
```

#### 5.2 Smart Suggestions

**Per-Post Suggestions**:
```
💡 AI Suggestions for "Columbus Job Fair"

Content Improvements:
  • Title could include deadline:
    → "Columbus Job Fair - Register by Nov 5"

  • Add call-to-action at end:
    → "[Register Now] [View Job List]"

  • Missing contact information
    → Found in source: (555) 123-4567
    → [Add to post]

SEO Improvements:
  • Missing meta description
    → Suggested: "Free job fair for veterans..."
    → [Apply]

  • Add structured data
    → Event schema detected
    → [Add Schema Markup]

Similar Posts:
  • "Veterans Hiring Event" (80% similar)
    → Consider merging or deleting duplicate
```

#### 5.3 Auto-Enhancement

**One-Click Improvements**:
```
[✨ Auto-Enhance]

Applies:
  ✓ Optimizes title for SEO
  ✓ Adds meta description
  ✓ Formats dates consistently
  ✓ Adds call-to-action
  ✓ Fixes broken links
  ✓ Adds structured data
  ✓ Finds better featured image

Preview changes before applying: ☑
```

#### 5.4 Predictive Analytics

**Engagement Prediction**:
```
📊 Predicted Performance

Based on similar posts:
  Estimated Views: 250-350 (7 days)
  Estimated Clicks: 15-25
  Estimated Conversions: 2-4

Confidence: 78%

Best publish time: Wednesday 10AM EST
Recommended categories: Events, Job Fairs
```

#### 5.5 Content Clustering

**AI Groups Similar Drafts**:
```
📁 Detected Content Clusters

Cluster: "Veterans Job Fairs" (5 posts)
  • Columbus Job Fair
  • Atlanta Veterans Hiring
  • VA Career Event Phoenix
  • Military Spouse Jobs Dallas
  • Veterans Day Job Fair Tampa

Actions:
  [Create Roundup Post] [Publish Best Only]
  [Schedule Series]
```

#### 5.6 Automated Workflows

**Rule Builder**:
```
If: Score ≥ 90 AND Has Image
Then: Auto-publish to category "Featured"

If: Score < 40 AND Age > 3 days
Then: Delete automatically

If: Contains "scholarship" AND Has Deadline
Then: Move to top of queue

If: Feed = "Job Fairs" AND Score > 75
Then: Schedule for next weekday 9AM
```

### Archivos a Crear

**PHP**:
- `/includes/class-ai-curator.php` - IA de curación
- `/includes/class-predictive-analytics.php` - Predicciones
- `/includes/class-content-clusterer.php` - Agrupación
- `/includes/class-workflow-engine.php` - Automatización

**JavaScript**:
- `/assets/js/ai-assistant.js` - UI del asistente

### Integraciones de IA

**Nuevos Prompts para Claude/OpenAI**:
```
System: You are a content curation assistant for a news website.

Task: Analyze this draft post and suggest improvements.

Post Data:
  Title: {title}
  Content: {content}
  Score: {quality_score}
  Feed: {feed_name}

Provide:
1. Content quality assessment (1-10)
2. Engagement potential (1-10)
3. 3-5 specific improvements
4. Optimal publish time
5. SEO recommendations
```

### Métricas de Éxito

- Reducción 60% en tiempo de curación
- Aumento 30% en engagement promedio
- Publicación automática de 50% de contenido excelente
- Editor se enfoca solo en contenido que necesita trabajo

---

## Arquitectura Técnica

### Estructura de Archivos Propuesta

```
gellobit-rss-processor/
│
├── includes/
│   ├── class-rss-processor.php (existente)
│   ├── class-draft-queue.php (Fase 1)
│   ├── class-draft-actions.php (Fase 1)
│   ├── class-reprocessor.php (Fase 2)
│   ├── class-version-manager.php (Fase 2)
│   ├── class-content-enhancer.php (Fase 2)
│   ├── class-quality-scorer.php (Fase 3)
│   ├── class-quality-analytics.php (Fase 3)
│   ├── class-post-scheduler.php (Fase 4)
│   ├── class-publishing-queue.php (Fase 4)
│   ├── class-ai-curator.php (Fase 5)
│   └── class-workflow-engine.php (Fase 5)
│
├── templates/
│   ├── draft-queue-page.php (Fase 1)
│   ├── draft-queue-item.php (Fase 1)
│   ├── draft-preview-modal.php (Fase 1)
│   ├── reprocessing-tools.php (Fase 2)
│   ├── quality-dashboard.php (Fase 3)
│   ├── publishing-calendar.php (Fase 4)
│   └── ai-assistant-panel.php (Fase 5)
│
├── assets/
│   ├── css/
│   │   ├── draft-queue.css (Fase 1)
│   │   ├── quality-indicators.css (Fase 3)
│   │   └── calendar-view.css (Fase 4)
│   │
│   └── js/
│       ├── draft-queue.js (Fase 1)
│       ├── reprocessing-tools.js (Fase 2)
│       ├── quality-indicators.js (Fase 3)
│       ├── scheduler.js (Fase 4)
│       └── ai-assistant.js (Fase 5)
│
└── docs/
    ├── ROADMAP-CURATION-SYSTEM.md (este documento)
    ├── API-DOCUMENTATION.md (futuro)
    └── USER-GUIDE-CURATION.md (futuro)
```

### Base de Datos Completa

**Tablas Nuevas**:
```sql
-- Fase 1
wp_gellobit_draft_metadata
  - Metadatos de drafts

-- Fase 2
wp_gellobit_content_versions
  - Historial de versiones

-- Fase 4
wp_gellobit_publishing_queue
  - Cola de publicación programada
```

### API Endpoints (para futuro)

```php
// Fase 1
POST /wp-json/gellobit/v1/drafts/publish
POST /wp-json/gellobit/v1/drafts/delete
POST /wp-json/gellobit/v1/drafts/bulk-action

// Fase 2
POST /wp-json/gellobit/v1/reprocess/scrape
POST /wp-json/gellobit/v1/reprocess/ai
POST /wp-json/gellobit/v1/reprocess/title

// Fase 3
GET  /wp-json/gellobit/v1/quality/score/{post_id}
POST /wp-json/gellobit/v1/quality/rescore

// Fase 4
POST /wp-json/gellobit/v1/schedule/add
GET  /wp-json/gellobit/v1/schedule/queue
DELETE /wp-json/gellobit/v1/schedule/cancel/{id}

// Fase 5
POST /wp-json/gellobit/v1/ai/suggest
POST /wp-json/gellobit/v1/ai/auto-enhance
GET  /wp-json/gellobit/v1/ai/predictions/{post_id}
```

---

## Métricas de Éxito

### KPIs por Fase

**Fase 1: Draft Queue Dashboard**
- ✅ Tiempo de curación: -75% (de 5 min a 1.5 min por post)
- ✅ Posts revisados/hora: +400% (de 12 a 48)
- ✅ Satisfacción del usuario: >90%

**Fase 2: Re-Processing Tools**
- ✅ Posts mejorados: 30% usan re-processing
- ✅ Tiempo de edición manual: -50%
- ✅ Calidad promedio: +20 puntos en score

**Fase 3: Quality Scoring**
- ✅ Publicación de contenido excelente: >30%
- ✅ Publicación de contenido pobre: <5%
- ✅ Identificación automática de top posts: 95% accuracy

**Fase 4: Scheduled Publishing**
- ✅ Distribución uniforme de posts: +80%
- ✅ Publicación en horas pico: >75%
- ✅ Engagement promedio: +25%

**Fase 5: AI-Assisted Curation**
- ✅ Automatización de decisiones: 60%
- ✅ Tiempo total de curación: -70% vs. baseline
- ✅ ROI de editor: 10x más productivo

### Comparación vs. Competencia

| Métrica | WP Automatic | Gellobit v0.9 | Gellobit v1.4 |
|---------|--------------|---------------|---------------|
| Tiempo de setup | 30 min | 15 min | 15 min |
| Control de calidad | ❌ No | ✅ Manual | ✅✅ Auto + Manual |
| Draft mode | ✅ Básico | ✅ Básico | ✅✅ Avanzado |
| Re-processing | ❌ No | ❌ No | ✅ Sí |
| Quality scoring | ❌ No | ❌ No | ✅ Sí |
| Scheduling | ✅ Básico | ❌ No | ✅ Avanzado |
| AI assistance | ❌ No | ❌ No | ✅ Sí |
| Team workflow | ❌ No | ⚠️ Limitado | ✅ Completo |
| Precio | $47/año | Gratis | Gratis |

---

## Cronograma Estimado

```
┌────────────────────────────────────────────────────────┐
│  Mes 1         │  Mes 2         │  Mes 3         │ Mes 4+        │
├────────────────┼────────────────┼────────────────┼───────────────┤
│                │                │                │               │
│  Fase 1        │  Fase 2        │  Fase 3        │  Fase 4       │
│  Draft Queue   │  Re-Processing │  Quality Score │  Scheduling   │
│                │                │                │               │
│  Semana 1-2    │  Semana 5-7    │  Semana 9-10   │  Semana 11    │
│  - UI básico   │  - Re-scrape   │  - Algorithm   │  - Calendar   │
│  - Filtros     │  - AI regen    │  - Indicators  │  - Rules      │
│  - Preview     │  - Versions    │  - Analytics   │  - Cron       │
│                │                │                │               │
│  Semana 3-4    │  Semana 8      │                │  Mes 4-6      │
│  - Bulk actions│  - Enhancer    │                │  Fase 5       │
│  - Quick edit  │  - Image finder│                │  AI Curator   │
│  - Testing     │  - Testing     │                │               │
│                │                │                │               │
└────────────────┴────────────────┴────────────────┴───────────────┘
```

**Total**: 3-6 meses para implementación completa

---

## Modelo de Negocio (Opcional)

### Versión Free vs. Pro

**Free (v1.0-1.1)**:
- ✅ Draft Queue básico
- ✅ Filtros y búsqueda
- ✅ Preview modal
- ✅ Bulk publish/delete
- ✅ Re-scraping (5 por día)

**Pro ($29/mes o $199/año)**:
- ✅ Todo de Free +
- ✅ Quality scoring ilimitado
- ✅ Re-processing ilimitado
- ✅ Version history ilimitada
- ✅ Scheduled publishing
- ✅ Advanced analytics
- ✅ AI-assisted curation
- ✅ Priority support
- ✅ Multi-site license

**Enterprise ($99/mes)**:
- ✅ Todo de Pro +
- ✅ Unlimited sites
- ✅ Team management (roles)
- ✅ API access
- ✅ Custom workflows
- ✅ White label
- ✅ Dedicated support

---

## Conclusiones

### Por Qué Esta es la Dirección Correcta

1. **Diferenciación**: Nadie más tiene este nivel de curación
2. **Calidad**: Resuelve el problema #1 de RSS automation
3. **Escalabilidad**: Permite crecer sin sacrificar calidad
4. **Monetización**: Claro path de free → pro
5. **Feedback Loop**: Cada fase mejora la anterior

### Próximos Pasos Inmediatos

1. ✅ **Ahora**: Llevar v0.9.3 a producción
2. ✅ **Semana 1-2**: Validar que auto-publish=off funciona bien
3. 📅 **Mes 1**: Comenzar Fase 1 (Draft Queue Dashboard)
4. 📅 **Mes 2**: Release v1.0 con Draft Queue
5. 📅 **Mes 2-3**: Feedback y ajustes
6. 📅 **Mes 3+**: Continuar con Fases 2-5

### Validación de Hipótesis

Antes de invertir mucho tiempo:
1. Usar v0.9.3 con auto-publish=off por 1 semana
2. Medir tiempo real de curación
3. Identificar pain points específicos
4. Priorizar features de Fase 1 según dolor real

### Contacto y Actualizaciones

Para discutir esta roadmap o sugerir cambios:
- Crear issues en GitHub
- Email: [tu-email]
- Docs: Ver CHANGELOG.md para progreso

---

**Última Actualización**: Noviembre 2025
**Versión del Documento**: 1.0
**Próxima Revisión**: Después de implementar Fase 1
