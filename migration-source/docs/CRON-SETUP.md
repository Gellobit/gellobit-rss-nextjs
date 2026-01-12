# Gellobit RSS Processor - Cron Setup Guide

## cPanel Cron Job Configuration

Este plugin permite que cada feed RSS tenga su propio intervalo de procesamiento individual. A diferencia de WP Automatic que usa el cron de WordPress, este plugin funciona perfectamente con el cron de cPanel en hosting compartido.

---

## 📋 Método 1: Usando PHP CLI (Recomendado)

### Paso 1: Obtén la Ruta de PHP

En cPanel, ve a **Terminal** y ejecuta:
```bash
which php
```

Esto debería devolver algo como:
```
/usr/bin/php
/opt/cpanel/ea-php81/root/usr/bin/php
```

### Paso 2: Obtén la Ruta del Plugin

La ruta completa del archivo cron.php es:
```
/home/TU_USUARIO/public_html/wp-content/plugins/gellobit-rss-processor/cron.php
```

Reemplaza `TU_USUARIO` con tu usuario de cPanel.

### Paso 3: Configurar Cron Job en cPanel

1. Ve a **cPanel > Cron Jobs**
2. En "Add New Cron Job":
   - **Minute**: `*/5` (cada 5 minutos)
   - **Hour**: `*`
   - **Day**: `*`
   - **Month**: `*`
   - **Weekday**: `*`
   - **Command**:
     ```bash
     /usr/bin/php /home/TU_USUARIO/public_html/wp-content/plugins/gellobit-rss-processor/cron.php
     ```

3. Click "Add New Cron Job"

### Recomendación de Frecuencia:
- **Cada 5 minutos**: `*/5 * * * *` - Para feeds muy activos
- **Cada 15 minutos**: `*/15 * * * *` - Recomendado
- **Cada 30 minutos**: `*/30 * * * *` - Para feeds menos activos
- **Cada hora**: `0 * * * *` - Para feeds lentos

---

## 📋 Método 2: Usando wget/curl (Alternativo)

### Paso 1: Generar Secret Key

La primera vez que accedas al cron vía HTTP, se generará una clave secreta automáticamente.

Accede a:
```
https://tudominio.com/wp-content/plugins/gellobit-rss-processor/cron.php
```

Verás un mensaje como:
```
Secret key generated. Please update your cron job with: ?key=abc123xyz789...
```

### Paso 2: Configurar Cron con wget

En cPanel > Cron Jobs:
```bash
wget -q -O- "https://tudominio.com/wp-content/plugins/gellobit-rss-processor/cron.php?key=TU_SECRET_KEY" > /dev/null 2>&1
```

### Paso 3: O Configurar con curl

```bash
curl -s "https://tudominio.com/wp-content/plugins/gellobit-rss-processor/cron.php?key=TU_SECRET_KEY" > /dev/null 2>&1
```

---

## 🔄 Cómo Funciona el Sistema de Cron Individual

### Intervalos por Feed

Cada feed tiene su propio intervalo configurable:

1. **Every 15 Minutes** - Feeds muy activos (ej: Google Alerts populares)
2. **Every 30 Minutes** - Feeds moderadamente activos
3. **Hourly** - Predeterminado para la mayoría de feeds
4. **Twice Daily** - Feeds lentos (cada 12 horas)
5. **Daily** - Feeds muy lentos (cada 24 horas)

### Funcionamiento Inteligente

El cron job se ejecuta cada 5-15 minutos, pero **NO procesa todos los feeds cada vez**.

El sistema verifica:
1. ¿Cuánto tiempo pasó desde el último procesamiento del feed?
2. ¿El intervalo configurado ya se cumplió?
3. Si NO, salta el feed (no lo procesa)
4. Si SÍ, procesa el feed

### Ejemplo:

```
Feed A: Intervalo = Every 15 Minutes, Último proceso = hace 10 minutos
    → Se SALTA (falta 5 minutos)

Feed B: Intervalo = Hourly, Último proceso = hace 65 minutos
    → Se PROCESA (ya pasó 1 hora)

Feed C: Intervalo = Every 30 Minutes, Último proceso = hace 35 minutos
    → Se PROCESA (ya pasaron 30 minutos)
```

---

## ⚙️ Configurar Intervalos por Feed

En el admin de WordPress:

1. Ve a **Gellobit RSS > RSS Feeds**
2. Edita o crea un feed
3. En la sección **Cron Interval**, selecciona:
   - Every 15 Minutes
   - Every 30 Minutes
   - Hourly (Default)
   - Twice Daily
   - Daily

4. Guarda el feed

---

## 📊 Monitorear el Cron

### Ver Logs en Tiempo Real

SSH al servidor y ejecuta:
```bash
tail -f /var/log/apache2/error.log | grep "Gellobit RSS Cron"
```

O si tienes acceso al error_log de PHP:
```bash
tail -f ~/public_html/error_log | grep "Gellobit RSS Cron"
```

### Ejemplo de Output del Cron:

```
[05-Nov-2025 10:15:00 UTC] [Gellobit RSS Cron] Starting cron job at 2025-11-05 10:15:00
[05-Nov-2025 10:15:01 UTC] [Gellobit RSS Cron] Skipping feed 1 - not due yet (interval: hourly)
[05-Nov-2025 10:15:02 UTC] [Gellobit RSS Cron] Processing feed 2: Google Alerts - Contests
[05-Nov-2025 10:15:15 UTC] [Gellobit RSS Cron] ✓ Feed 2 processed successfully. Created 3 posts
[05-Nov-2025 10:15:16 UTC] [Gellobit RSS Cron] Cron job completed. Processed: 1, Errors: 0
```

---

## 🚨 Solución de Problemas

### El cron no se ejecuta

1. **Verifica la ruta de PHP**:
   ```bash
   which php
   ```

2. **Verifica la ruta del archivo**:
   ```bash
   ls -la /home/TU_USUARIO/public_html/wp-content/plugins/gellobit-rss-processor/cron.php
   ```

3. **Prueba manualmente**:
   ```bash
   /usr/bin/php /ruta/completa/al/cron.php
   ```

### Feeds no se procesan

1. Ve a **Gellobit RSS > Analytics** y revisa los logs
2. Verifica que los feeds estén marcados como **Active**
3. Revisa que el intervalo sea apropiado
4. Chequea los error logs

### "Secret key invalid" (Método wget/curl)

1. Vuelve a generar la key accediendo a:
   ```
   https://tudominio.com/wp-content/plugins/gellobit-rss-processor/cron.php
   ```
2. Copia la nueva key del mensaje
3. Actualiza tu cron job con la nueva key

---

## 🎯 Ventajas sobre WP-Cron

| Característica | WP-Cron | Gellobit Cron |
|----------------|---------|---------------|
| Requiere visitas al sitio | ✅ Sí | ❌ No |
| Hosting compartido | ⚠️ Problemático | ✅ Perfecto |
| Intervalos por feed | ❌ No | ✅ Sí |
| Precisión de tiempo | ⚠️ Imprecisa | ✅ Precisa |
| Control total | ❌ Limitado | ✅ Completo |

---

## 📝 Notas Importantes

1. **Frecuencia del Cron**: No necesitas que el cron se ejecute tan frecuentemente como el intervalo más corto. Puedes ejecutar el cron cada 15 minutos y aun así tener feeds que se procesen cada hora.

2. **Exportar/Importar**: Los intervalos de cron se exportan e importan junto con los feeds.

3. **Recursos del Servidor**: Feeds con intervalos cortos (15 min) consumen más recursos. Úsalos solo cuando sea necesario.

4. **Google Alerts**: Para Google Alerts muy activos, usa "Every 30 Minutes". Para alertas normales, "Hourly" es suficiente.

---

## 💡 Mejores Prácticas

1. **Empieza con Hourly**: Para nuevos feeds, empieza con el intervalo "Hourly" y ajusta según necesidad.

2. **Monitorea el primer día**: Revisa los logs el primer día para ver si hay suficiente contenido nuevo.

3. **Ajusta según actividad**: Si un feed genera muchos posts, reduce el intervalo. Si genera pocos, auméntalo.

4. **Usa cron cada 5-15 minutos**: Esto permite flexibilidad para procesar diferentes feeds en diferentes momentos.

---

¿Preguntas? Revisa los logs en **Gellobit RSS > Analytics** o contacta soporte.
