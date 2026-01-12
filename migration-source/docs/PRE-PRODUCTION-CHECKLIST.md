# Gellobit RSS Processor - Pre-Production Checklist

**Versión**: v0.9.3
**Fecha**: Noviembre 2025

---

## ⚠️ IMPORTANTE: Ejecutar Antes de Usar

### 1. Migración de Base de Datos

El plugin ha agregado nuevos campos que necesitan ser creados en la base de datos:
- `allow_republish` - Permitir re-publicación
- `feed_interval` - Intervalo de cron por feed
- `fallback_featured_image` - Imagen destacada por defecto

**Cómo ejecutar la migración**:

#### Opción A: Via WordPress Admin (Recomendado)
```
1. Ir a: Gellobit RSS > RSS Feeds
2. La migración se ejecutará automáticamente al cargar la página
3. Verificar que no haya errores
```

#### Opción B: Via Navegador (Manual)
```
1. Acceder a: http://localhost/gellobit/wp-content/plugins/gellobit-rss-processor/migrate-db.php
2. Verificar que todos los campos se agreguen correctamente
3. Eliminar el archivo migrate-db.php por seguridad (opcional)
```

#### Opción C: Via WP-CLI
```bash
wp eval-file /path/to/wp-content/plugins/gellobit-rss-processor/migrate-db.php
```

---

## ✅ Checklist Pre-Producción

### Configuración Inicial

- [ ] **Migración de BD ejecutada** - Verificar que los 3 nuevos campos existan
- [ ] **Providers de IA configurados** - Al menos 1 provider con API key válida
- [ ] **Categorías creadas** - Categorías de WordPress para los feeds
- [ ] **Imagen fallback subida** - Subir 1+ imágenes a Media Library para usar como fallback

### Configuración de Feeds

- [ ] **Feeds importados o creados** - Importar feeds existentes o crear nuevos
- [ ] **Auto-publish configurado** - Decisión tomada: auto-publish ON/OFF por feed
- [ ] **Intervalos de cron** - Cada feed tiene su intervalo (15min, 30min, hourly, etc.)
- [ ] **Imágenes fallback** - Cada feed tiene imagen por defecto configurada
- [ ] **Categorías asignadas** - Cada feed tiene categoría de WordPress asignada

### Configuración de Cron

- [ ] **Cron de cPanel configurado** - Ver CRON-SETUP.md
- [ ] **Secret key generada** - Si usas wget/curl method
- [ ] **Primera ejecución manual** - Probar que cron funcione correctamente

### Pruebas

- [ ] **Procesar 1 feed manualmente** - Dashboard > Process
- [ ] **Verificar post creado** - Ver en Posts > All Posts o Drafts
- [ ] **Verificar imagen destacada** - Post tiene featured image
- [ ] **Verificar contenido** - No hay H1 duplicados, enlaces correctos
- [ ] **Verificar logs** - No hay errores en error_log

### Optimizaciones

- [ ] **Prompts revisados** - Prompts en /prompts/ están optimizados
- [ ] **Scraping habilitado** - Solo en feeds que lo necesiten
- [ ] **Quality threshold** - Ajustar si es necesario (default: 0.6)
- [ ] **Max posts per run** - Configurar límite global

---

## 🐛 Problemas Comunes y Soluciones

### 1. "Media uploader no funciona"

**Problema**: El botón "Choose from Library" no abre la librería de medios.

**Solución**: Ya arreglado en v0.9.3
- `wp_enqueue_media()` agregado al plugin
- Limpiar caché del navegador: Ctrl+F5

**Verificar**:
```javascript
// En consola del navegador:
console.log(typeof wp.media); // Debe decir "function"
```

### 2. "Export/Import no funciona"

**Problema**: Botones no hacen nada o dan error.

**Causa**: Campos nuevos no existen en BD.

**Solución**:
1. Ejecutar migración de BD (ver arriba)
2. Limpiar caché del navegador
3. Probar export nuevamente

**Verificar tabla**:
```sql
SHOW COLUMNS FROM wp_gellobit_rss_feeds;
-- Debe mostrar: allow_republish, feed_interval, fallback_featured_image
```

### 3. "No se guarda la imagen fallback"

**Problema**: Seleccionas imagen pero no se guarda.

**Solución**:
1. Ejecutar migración de BD
2. Verificar que el campo `fallback_featured_image` exista
3. Guardar el feed nuevamente

### 4. "Featured image no aparece en posts"

**Problema**: Posts no tienen imagen destacada.

**Posibles causas**:
- Scraping deshabilitado Y feed no tiene imágenes
- Imagen fallback no configurada
- URL de imagen fallback inválida

**Solución**:
1. Habilitar scraping en el feed
2. O configurar imagen fallback
3. Re-procesar el feed

### 5. "Cron no ejecuta"

**Problema**: Cron de cPanel no procesa feeds.

**Verificar**:
```bash
# Ver logs del cron
tail -f /var/log/apache2/error.log | grep "Gellobit RSS Cron"
```

**Soluciones**:
- Verificar ruta de PHP en cPanel cron
- Verificar secret key si usas método wget/curl
- Verificar que feeds estén marcados como "active"
- Verificar intervalos - puede que no sea tiempo de procesar

---

## 📊 Configuración Recomendada por Tipo de Sitio

### Sitio de Alta Calidad (Curación Manual)
```
Auto-publish: OFF (unchecked)
Feed interval: Hourly o Daily
Scraping: ON
AI Processing: ON
Quality threshold: 0.7

Workflow:
1. Cron captura a draft
2. Editor revisa en Posts > Drafts
3. Editor publica manualmente los mejores
```

### Sitio de Alto Volumen (Automático)
```
Auto-publish: ON (checked)
Feed interval: Every 30 Minutes
Scraping: ON
AI Processing: ON
Quality threshold: 0.8

Workflow:
1. Cron procesa y publica automáticamente
2. Editor revisa posts publicados periódicamente
3. Editor elimina los malos
```

### Sitio Mixto (Recomendado)
```
Auto-publish: OFF por defecto
  - ON para feeds confiables (ej: Job Fairs)
  - OFF para feeds riesgosos (ej: Get Paid To)
Feed interval: Hourly para la mayoría
Scraping: ON
AI Processing: ON
Quality threshold: 0.7

Workflow:
1. Feeds buenos → auto-publish
2. Feeds dudosos → draft para revisión
3. Editor revisa drafts diariamente
```

---

## 🚀 Primeros Pasos en Producción

### Día 1: Setup
1. Ejecutar migración de BD
2. Configurar 1-2 feeds de prueba
3. Configurar cron de cPanel
4. Procesar manualmente para probar

### Día 2-7: Monitoreo
1. Revisar logs diarios
2. Verificar calidad de posts generados
3. Ajustar prompts si es necesario
4. Ajustar intervalos de cron

### Semana 2: Escalar
1. Agregar más feeds
2. Optimizar configuración por feed
3. Configurar imágenes fallback específicas
4. Ajustar quality threshold

### Mes 1: Optimizar
1. Analizar qué feeds generan mejor contenido
2. Eliminar feeds de baja calidad
3. Duplicar feeds buenos
4. Considerar implementar Fase 1 del Roadmap (Draft Queue)

---

## 📝 Comandos Útiles

### Ver Posts Generados
```sql
SELECT
    p.ID,
    p.post_title,
    p.post_status,
    p.post_date,
    pm.meta_value as feed_id
FROM wp_posts p
LEFT JOIN wp_postmeta pm ON p.ID = pm.post_id AND pm.meta_key = '_gellobit_feed_id'
WHERE pm.meta_value IS NOT NULL
ORDER BY p.post_date DESC
LIMIT 20;
```

### Ver Feeds Activos
```sql
SELECT id, name, status, feed_interval, last_processed
FROM wp_gellobit_rss_feeds
WHERE status = 'active';
```

### Ver Processing Log (últimos 50)
```sql
SELECT * FROM wp_gellobit_processing_logs
ORDER BY created_at DESC
LIMIT 50;
```

### Limpiar Posts de Prueba
```sql
-- CUIDADO: Esto elimina TODOS los posts del plugin
DELETE p, pm, tr
FROM wp_posts p
LEFT JOIN wp_postmeta pm ON p.ID = pm.post_id
LEFT JOIN wp_term_relationships tr ON p.ID = tr.object_id
WHERE p.ID IN (
    SELECT post_id FROM wp_postmeta
    WHERE meta_key = '_gellobit_feed_id'
);
```

---

## 🔐 Seguridad Post-Producción

### Archivos a Eliminar (Opcional)
```bash
# Después de ejecutar la migración:
rm /path/to/wp-content/plugins/gellobit-rss-processor/migrate-db.php
```

### Permisos Recomendados
```bash
# Plugin directory
chmod 755 /path/to/wp-content/plugins/gellobit-rss-processor
chmod 644 /path/to/wp-content/plugins/gellobit-rss-processor/*.php

# Cron file
chmod 644 /path/to/wp-content/plugins/gellobit-rss-processor/cron.php
```

### API Keys
- ✅ Nunca hacer commit de API keys a Git
- ✅ Usar variables de entorno si es posible
- ✅ Regenerar keys si se filtran
- ✅ Usar keys diferentes para dev y producción

---

## 📞 Soporte

### Si algo falla:

1. **Revisar logs**:
   ```bash
   tail -100 /var/log/apache2/error.log | grep "Gellobit"
   ```

2. **Verificar BD**:
   ```sql
   SHOW COLUMNS FROM wp_gellobit_rss_feeds;
   ```

3. **Verificar feeds**:
   - Dashboard > RSS Feeds
   - Ver status de cada feed
   - Ver último procesamiento

4. **Contacto**:
   - Issues: GitHub
   - Docs: Ver CHANGELOG.md y README.md

---

## ✅ Checklist Final

Antes de considerar que estás en producción:

- [ ] Migración de BD completada sin errores
- [ ] Al menos 3 feeds configurados y procesados exitosamente
- [ ] Cron de cPanel ejecutándose cada 15 minutos
- [ ] Al menos 10 posts generados (draft o published)
- [ ] Featured images funcionando correctamente
- [ ] No hay errores en error_log
- [ ] Media uploader funciona (probado)
- [ ] Export/Import funciona (probado)
- [ ] Backup de BD hecho

**Si todos los items están ✅ → Listo para producción! 🚀**

---

**Última actualización**: Noviembre 2025
**Versión del plugin**: v0.9.3
