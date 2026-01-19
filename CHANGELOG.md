# Changelog - Gellobit RSS Processor (Next.js)

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [1.0.0-alpha.26] - 2026-01-19

### ✨ Añadido

**Sistema de Categorías para Blog Posts**
- Nueva tabla `categories` con soporte para categorías por defecto
- UI completa de gestión de categorías en admin (Settings > Categories)
- Selector de categoría en el editor de posts
- Selector de categoría en feeds cuando `output_type` es `blog_post`
- URLs SEO-friendly para categorías: `gellobit.com/category-slug/`
- Páginas de categoría con listado de posts y JSON-LD schema

**Sistema de Scraping de Imágenes para Blog Posts**
- Nuevo procesador de imágenes en `imageService`:
  - `processPostImages()` - Procesa featured image y contenido
  - `processContentImages()` - Extrae y sube imágenes del HTML
  - `processFeaturedImage()` - Maneja imagen destacada con fallback
- Almacenamiento en Supabase Storage (`posts/featured/`, `posts/content/`)
- Filtrado automático de tracking pixels, avatars, iconos
- Soporte para lazy-loaded images (`data-src`)
- Reemplazo automático de URLs externas por URLs locales

**Respuestas HTTP 410 Gone**
- Middleware actualizado para retornar 410 en URLs que no existen
- Verificación en tablas `categories`, `pages`, `posts` antes de retornar 410
- Mejora SEO para migración desde WordPress

**Soporte de Prompts para Blog Posts**
- Añadido `blog_post` a `PromptType` en tipos de base de datos
- Prompt de Blog Post editable en admin (Settings > Prompts)
- Corregido error de columnas incorrectas en `promptService`

### 🔧 Cambiado
- `rss-processor.service.ts`: Diferencia entre opportunities (solo fallback) y blog posts (scraping de imágenes)
- `image.service.ts`: Añadido soporte para entity type `post`
- `prompt.service.ts`: Corregido uso de `unified_prompt` y `is_customized` (antes usaba columnas inexistentes)
- `validation.ts`: Añadido `blog_category_id` al schema de feeds

### 🗄️ Migraciones
- `029_blog_categories.sql` - Tabla de categorías y category_id en posts
- `030_category_default_and_feed_category.sql` - Categoría por defecto y blog_category_id en feeds
- `031_blog_post_prompt.sql` - Entrada blog_post en prompt_templates
- `032_add_post_entity_type.sql` - Añade 'post' al constraint de media_files
- `033_post_media_cleanup.sql` - Trigger para limpiar media al eliminar posts

---

## [1.0.0-alpha.25] - 2026-01-18

### ✨ Añadido
- Sistema dual de anuncios (AdSense + AdMob)
- Posiciones específicas de AdSense
- Animación de spin en logo

---

## [1.0.0-alpha.24] - 2026-01-17

### ✨ Añadido
- Sistema avanzado de anuncios con layouts por categoría

---

## [1.0.0-alpha.23] - 2026-01-16

### ✨ Añadido
- Mejoras en scraper
- Sistema de limpieza
- Mejoras SEO

---

## [1.0.0-alpha.22] - 2026-01-15

### ✨ Añadido
- Publicación de RSS a Blog Post
- Mejoras en editor

---

## [1.0.0-alpha.21] - 2026-01-14

### ✨ Añadido
- Soporte para app móvil con Capacitor
- Mejoras varias

---

*Este archivo se actualiza con cada versión del proyecto.*
