# Changelog - Gellobit RSS Processor

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [1.2.0] - 2026-01-10

### ✨ Añadido
- **Sistema de excerpts personalizados generados por IA**: Cada post ahora genera automáticamente un resumen de máximo 20 palabras optimizado para SEO
- **Arquitectura de 3 segmentos en prompts**: Los prompts ahora procesan 3 elementos en lugar de 2:
  - Segmento 0: **Excerpt** (resumen de 20 palabras para meta descriptions)
  - Segmento 1: **Title** (título SEO-friendly)
  - Segmento 2: **Content** (artículo HTML completo)
- Nuevo método `sanitize_generated_excerpt()` en `class-rss-processor.php` que limita a 20 palabras y 160 caracteres
- Prompts actualizados en los 11 tipos de oportunidades con bloque dedicado para excerpts
- Sistema de fallback: si IA no está habilitada, usa la descripción del RSS

### 🔧 Cambiado
- `class-rss-processor.php`: Método `generate_ai_article()` actualizado para capturar 3 segmentos (excerpt, title, content)
- `class-rss-processor.php`: Método `create_wordpress_post()` ahora usa el excerpt generado por IA en `post_excerpt`
- `class-settings.php`: Documentación en pestaña "Prompts" actualizada para explicar estructura de 3 segmentos
- Todos los archivos de prompts (`/prompts/*.txt`) actualizados con nuevo bloque [gpt] para excerpts

### 📊 Mejoras SEO
- Excerpts optimizados para meta descriptions (≤160 caracteres)
- Mejora en indexación de Google con descripciones únicas y relevantes
- Mayor tasa de clicks (CTR) en resultados de búsqueda
- Rich snippets mejorados con descripciones personalizadas
- Preview cards optimizadas para redes sociales

### 📝 Notas Técnicas
- Los excerpts se generan automáticamente en cada procesamiento de feed
- Promedio de palabras en excerpts: ~12 palabras (óptimo para SEO)
- Compatible con sistema de prompts personalizables existente
- Los prompts customizados existentes necesitan actualizarse manualmente o resetear a default

## [1.1.0] - 2026-01-09

### ✨ Añadido
- **Sistema de edición de prompts desde el backend**: Nueva pestaña "Prompts" en Settings que permite editar y personalizar los 11 prompts de IA sin necesidad de acceder a archivos
- Editor de texto completo para cada tipo de oportunidad (Giveaways, Sweepstakes, Contests, Dream Jobs, Get Paid To, Instant Win, Job Fairs, Scholarships, Volunteer, Free Training, Promos)
- Sistema híbrido de almacenamiento: prompts personalizados en base de datos con fallback automático a archivos .txt originales
- Badges visuales de estado "Customized" / "Default" para cada prompt
- Contador de caracteres en tiempo real durante la edición
- Botón "Reset to Default" para restaurar prompts originales instantáneamente
- Panel informativo con variables disponibles para usar en prompts
- Handlers AJAX para guardar y resetear prompts sin recargar página
- Métodos públicos en `Gellobit_RSS_Prompt_Manager`: `get_current_prompt()`, `get_default_prompt()`, `save_custom_prompt()`, `reset_prompt()`, `is_customized()`

### 🔧 Cambiado
- `class-prompt-manager.php`: Modificado `load_template()` para cargar primero desde base de datos (`gellobit_rss_custom_prompts`) y luego desde archivos .txt
- `class-settings.php`: Agregada nueva pestaña "Prompts" con interfaz completa de edición
- Sistema de cache mejorado: se limpia automáticamente al guardar o resetear prompts

### 📝 Notas Técnicas
- Los prompts personalizados se almacenan en la opción `gellobit_rss_custom_prompts` de WordPress
- Cambios en prompts se reflejan inmediatamente en el próximo procesamiento de feed
- Compatible con sistema de exportación/importación de settings existente
- Archivos `.txt` en `/prompts/` permanecen intactos como backup

## [1.0.2] - 2025-11-06

### 🐞 Corregido (CRÍTICO)
- **Auto-publish posts ahora funciona correctamente**: Los posts se publican automáticamente cuando la opción está activada
- La opción `gellobit_rss_auto_publish` no se creaba al instalar/actualizar el plugin
- Lógica reforzada para manejar valores booleanos, strings "1"/"0" e integers
- Nuevo método `ensure_default_options()` que se ejecuta en cada carga del plugin
- Soporte para configuración de auto-publish por feed (prioridad sobre configuración global)
- Cambio de `true/false` a `1/0` para consistencia con checkboxes de WordPress

## [1.0.1] - 2025-11-06

### 🐞 Corregido
- **Sistema de imagen destacada reforzado**: Ahora intenta automáticamente la imagen fallback del feed si la imagen del RSS falla por cualquier motivo (404, timeout, formato inválido, etc.)
- Lógica mejorada con retry automático para garantizar que siempre se use la imagen por defecto cuando está configurada
- Logging detallado de cada intento de imagen para mejor diagnóstico

## [1.0.0] - 2025-11-06 🎉

### 🚀 Primera Versión de Producción Estable

Esta es la primera versión oficial de producción del plugin Gellobit RSS Processor, lista para entornos en vivo.

### ✨ Características Principales (v1.0)
- **Procesamiento automático de feeds RSS/Atom** con cron jobs configurables
- **Integración con múltiples proveedores de IA**: OpenAI, OpenRouter, DeepSeek, Claude, Gemini
- **Scraping inteligente** de contenido completo desde URLs
- **Sistema anti-duplicados robusto** con tracking por hash
- **Prompts especializados** por tipo de oportunidad
- **Control per-feed** de categorías, cron y opciones de republicación
- **Dashboard completo** con analytics y processing log detallado
- **Exportación/Importación** de configuraciones en JSON
- **Featured images** con sistema de fallback configurable

### 🐞 Corregido en v1.0
- Posts con markdown code fences (```html) visible al inicio del contenido
- La IA ocasionalmente devuelve contenido envuelto en bloques de código markdown
- Nueva función `remove_markdown_code_fences()` extrae el HTML limpio automáticamente

### 📝 Notas de Producción
- Plugin testeado y validado en entorno de producción real
- Sistema de logging optimizado (solo errores críticos)
- Rendimiento estable con múltiples feeds concurrentes
- Compatible con WordPress 5.8+ y PHP 7.4+

---

## Versiones Beta (Pre-1.0)

## [0.9.5] - 2025-11-06

### 🐞 Corregido
- Posts con markdown code fences (```html) visible al inicio del contenido
- La IA ocasionalmente devuelve contenido envuelto en bloques de código markdown
- Nueva función `remove_markdown_code_fences()` extrae el HTML limpio automáticamente

## [0.9.4] - 2025-11-05

### ✨ Añadido
- Handlers AJAX para exportar/importar configuraciones del plugin (Settings)
- Logging detallado en consola del navegador para diagnóstico de import/export
- Validación y mensajes de error específicos en import de feeds y settings

### 🔧 Cambiado
- Reducidos logs informativos en `debug.log` (solo errores críticos activos)
- Mejorado manejo de errores en AJAX con logging detallado
- Cambiado sistema de tracking de duplicados a usar `INSERT IGNORE` para evitar errores en logs

### 🐞 Corregido
- Export/Import de Settings ahora funciona correctamente (handlers AJAX faltantes)
- Import de Feeds mejorado con mejor manejo de errores y nonce
- Error de "Duplicate entry" en tabla de tracking ya no aparece en logs de WordPress
- Logs informativos desactivados: "AI success", "Scraping successful", "Item created", "Feed processing summary", etc.
- Solo se loguean errores AI reales (invalid_content ya no genera log, es comportamiento esperado)

## [0.9.3] - 2025-10-26

### ✨ Añadido
- Soporte para múltiples proveedores de IA (OpenAI, OpenRouter, DeepSeek, Claude y Gemini) con prompts especializados por tipo de oportunidad.
- Registro exhaustivo por ítem en la nueva tabla y vista "Processing Log" para auditar publicaciones y rechazos.
- Selector de categoría por feed y asignación automática en los posts creados.
- Exportación/Importación de feeds en formato JSON para migrar configuraciones entre entornos.
- Controles por feed: opción de re-publicar ignorando duplicados (útil para campañas rotativas) y programación de cron individual con intervalos personalizados.

### 🔧 Cambiado
- Todo el contenido se publica como posts estándar y se eliminó la dependencia del post type personalizado.
- Se actualizó la sección de ajustes para configurar claves/modelos por proveedor, cargar modelos vía AJAX y controlar/eliminar el processing log.
- El prompt, la IA y la interfaz del plugin están completamente en inglés para alinearse con gellobit.com.

### 🐞 Corregido
- Se mejoraron los logs (incluyendo `debug.log`) para detectar fallas de scraping o IA, y se eliminó el aviso de traducciones cargadas demasiado pronto.

## [0.9.0] - 2025-01-26

### 🎉 Primera Versión Beta
Primera versión funcional del plugin Gellobit RSS Processor para WordPress.

### ✨ Características Añadidas
- **Procesamiento de Feeds RSS**: Sistema completo para procesar feeds RSS automáticamente
- **Integración con Google Alerts**: Resolución de URLs y extracción de contenido real
- **Scraping Inteligente**: Extracción de contenido de páginas web con sistema de fallback
- **Integración OpenAI GPT**: Análisis y categorización automática de oportunidades
- **Sistema Anti-Duplicados**: Detección y prevención de contenido duplicado basado en hash
- **Dashboard Administrativo**: Panel de control completo con estadísticas en tiempo real
- **Gestión de Feeds**: Interfaz para agregar, editar y eliminar feeds RSS
- **Sistema de Analytics**: Métricas y logs detallados de procesamiento
- **Cron Jobs**: Procesamiento automático configurable (15/30/60 minutos)
- **AJAX en Tiempo Real**: Interacciones dinámicas sin recargar página

### 🔧 Configuraciones Implementadas
- **AI Settings**: Configuración completa de OpenAI (API key, modelo, parámetros)
- **Scraping Settings**: Timeout, longitud de contenido, user agents
- **Processing Settings**: Batch size, umbrales de calidad, auto-publicación
- **General Settings**: Modo debug, limpieza automática de logs

### 🗄️ Base de Datos
- Tabla `gellobit_rss_feeds` para gestión de feeds
- Tabla `gellobit_processing_logs` para logs detallados
- Tabla `gellobit_analytics` para métricas y estadísticas
- Tabla `gellobit_duplicate_tracking` para control de duplicados

### 📊 Campos Meta para Posts
- `_gellobit_opportunity_type` - Tipo de oportunidad
- `_gellobit_deadline` - Fecha límite
- `_gellobit_prize_value` - Valor del premio
- `_gellobit_requirements` - Requisitos
- `_gellobit_location` - Ubicación
- `_gellobit_source_url` - URL original
- `_gellobit_confidence` - Nivel de confianza IA
- `_gellobit_processed_at` - Fecha de procesamiento

### 🛠️ Estructura Técnica
- Arquitectura orientada a objetos con clases modulares
- Separación de responsabilidades (MVC pattern)
- Hooks y filters de WordPress implementados correctamente
- Sanitización y validación de datos completa
- Nonces de seguridad en todos los formularios

### 📝 Notas
- Versión beta estable lista para testing en producción
- Requiere PHP 7.4+ y WordPress 5.8+
- Requiere API key de OpenAI para funcionalidad completa
- Compatible con Google Alerts y feeds RSS/Atom estándar

---

## [Por Hacer] - Roadmap v1.0

### Mejoras Planificadas
- [ ] Sistema de templates personalizables para posts
- [ ] Exportación de datos en CSV/JSON
- [ ] API REST para integraciones externas
- [ ] Sistema de notificaciones por email
- [ ] Soporte multiidioma (i18n)
- [ ] Modo bulk processing mejorado
- [ ] Dashboard widgets para WP Admin
- [ ] Sistema de caché para mejorar rendimiento
- [ ] Integración con más modelos de IA
- [ ] Sistema de etiquetas automáticas

### Correcciones Pendientes
- [ ] Optimización de queries para grandes volúmenes
- [ ] Mejora en detección de contenido duplicado
- [ ] Manejo de errores más robusto
- [ ] Validación adicional de feeds malformados

---

*Este archivo se actualiza automáticamente con cada cambio significativo al plugin.*
