# Gellobit RSS Processor Plugin v1.2.0

Un plugin completo para WordPress que procesa feeds RSS con IA, especialmente optimizado para Google Alerts y extracción de información de oportunidades.

**🎉 Versión 1.2.0 - Excerpts Personalizados con IA**

## Características

### 🚀 Procesamiento Inteligente
- **Procesamiento automático de feeds RSS** con cron jobs de WordPress
- **Resolución de URLs de Google Alerts** para obtener contenido real
- **Scraping inteligente de contenido** de páginas web
- **Integración con OpenAI GPT** para análisis y categorización
- **Sistema de duplicados** para evitar contenido repetido

### 📊 Panel de Control Completo
- **Dashboard principal** con estadísticas en tiempo real
- **Gestión de feeds RSS** con interfaz intuitiva
- **Análisis y métricas** de rendimiento
- **Configuración avanzada** para todas las funcionalidades

### 🤖 Inteligencia Artificial
- **Extracción automática** de datos estructurados
- **Categorización inteligente** de oportunidades
- **Control de calidad** con umbrales de confianza
- **Procesamiento de texto** para mejorar contenido

### 🛠️ Gestión Avanzada
- **Base de datos optimizada** para logs y métricas
- **Sistema de configuración** modular
- **AJAX en tiempo real** para interacciones
- **Limpieza automática** de datos antiguos

## Instalación

1. **Descargar el plugin** en la carpeta `/wp-content/plugins/`
2. **Activar el plugin** desde el panel de WordPress
3. **Configurar OpenAI API** en Settings > AI Settings
4. **Agregar feeds RSS** en la sección RSS Feeds

## Configuración

### 1. Configuración de IA
- Obtener API key de OpenAI Platform
- Seleccionar modelo (recomendado: GPT-4o Mini)
- Configurar parámetros de procesamiento
- Probar conexión

### 2. Configuración de Feeds
- Agregar URL del feed RSS
- Configurar tipo de post de destino
- Establecer umbrales de calidad
- Activar/desactivar funcionalidades

### 3. Configuración de Scraping
- Timeout de solicitudes
- Longitud mínima/máxima de contenido
- Manejo de redirecciones
- User agents rotativos

## Uso

### Gestión de Feeds
```php
// Obtener datos de oportunidad procesada
$data = gellobit_get_opportunity_data($post_id);

// Verificar si un post fue procesado por Gellobit
$is_processed = gellobit_is_processed_opportunity($post_id);

// Obtener estadísticas
$stats = gellobit_get_stats();
```

### Campos Meta Disponibles
- `_gellobit_opportunity_type` - Tipo de oportunidad
- `_gellobit_deadline` - Fecha límite
- `_gellobit_prize_value` - Valor del premio
- `_gellobit_requirements` - Requisitos
- `_gellobit_location` - Ubicación
- `_gellobit_source_url` - URL original
- `_gellobit_confidence` - Confianza de IA
- `_gellobit_processed_at` - Fecha de procesamiento

## Estructura de Archivos

```
gellobit-rss-processor/
├── gellobit-rss-processor.php    # Archivo principal del plugin
├── includes/                     # Clases del sistema
│   ├── class-database.php        # Gestión de base de datos
│   ├── class-ai-transformer.php  # Integración con OpenAI
│   ├── class-content-scraper.php # Scraping de contenido
│   ├── class-rss-processor.php   # Procesamiento de RSS
│   ├── class-analytics.php       # Análisis y métricas
│   ├── class-admin.php          # Interfaz de administración
│   ├── class-settings.php       # Configuraciones
│   └── class-dashboard.php      # Dashboard principal
├── assets/                      # Recursos frontend
│   ├── admin.css               # Estilos del admin
│   └── admin.js                # JavaScript del admin
└── README.md                   # Este archivo
```

## Características Técnicas

### Base de Datos
- **Tabla de feeds:** `gellobit_rss_feeds`
- **Tabla de logs:** `gellobit_processing_logs`
- **Tabla de métricas:** `gellobit_analytics`
- **Tabla de duplicados:** `gellobit_duplicate_tracking`

### AJAX Endpoints
- `gellobit_process_all_feeds` - Procesar todos los feeds
- `gellobit_process_feed` - Procesar feed individual
- `gellobit_test_feed` - Probar feed
- `gellobit_delete_feed` - Eliminar feed
- `gellobit_test_ai` - Probar conexión IA
- `gellobit_get_dashboard_data` - Obtener datos del dashboard

### Cron Jobs
- **Procesamiento automático** cada 15/30/60 minutos
- **Limpieza de logs** diaria
- **Generación de estadísticas** diaria

## Configuración Recomendada

### Para Google Alerts
1. **URL del feed:** URL directa del feed de Google Alerts
2. **Scraping activado:** Para obtener contenido completo
3. **IA activada:** Para categorización automática
4. **Umbral de calidad:** 0.6 o superior
5. **Auto-publicar:** Según preferencia

### Para Feeds Generales
1. **Validar estructura** del feed RSS/Atom
2. **Configurar timeout** según velocidad del sitio
3. **Ajustar longitud** mínima de contenido
4. **Probar regularmente** con el botón Test

## Solución de Problemas

### Feed no procesa elementos
- Verificar URL del feed
- Comprobar conectividad
- Revisar logs en Analytics
- Validar estructura XML

### IA no funciona
- Verificar API key de OpenAI
- Comprobar créditos disponibles
- Probar conexión en Settings
- Revisar logs de errores

### Contenido duplicado
- Sistema automático de detección
- Base en hash de contenido
- Limpieza regular de tabla

### Rendimiento lento
- Reducir batch size
- Aumentar timeout
- Revisar logs de procesamiento
- Optimizar umbrales

## Soporte

Para soporte técnico y actualizaciones:
- **Documentación:** Revisar logs en Analytics
- **Debug:** Activar modo debug en Settings
- **Logs:** Tabla `gellobit_processing_logs`

## Licencia

GPL v2 or later

## Créditos

Desarrollado por el equipo de Gellobit para automatizar la captura y procesamiento inteligente de feeds RSS con IA.