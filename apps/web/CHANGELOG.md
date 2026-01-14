# Changelog - GelloBit Web App

Todos los cambios notables de esta aplicación serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [1.0.0-alpha.4] - 2026-01-13

### Agregado
- **Sistema de Páginas Estáticas**
  - Nueva tabla `pages` para contenido estático (About, Terms, Privacy, etc.)
  - Admin UI completo con editor WYSIWYG para crear/editar páginas
  - Opciones de visibilidad: mostrar en footer y/o menú móvil
  - Orden personalizable con sort_order
  - Imágenes destacadas y campos SEO (meta title, description)

- **URLs SEO-Friendly**
  - Posts del blog ahora accesibles en `/[slug]` (antes `/blog/[slug]`)
  - Páginas estáticas accesibles en `/[slug]` (antes `/page/[slug]`)
  - Ruta unificada que detecta automáticamente si es post o página

- **Analytics & Publicidad**
  - Nueva pestaña "Analytics & Ads" en Settings del admin
  - Soporte para Google Analytics (GA4) - aplicado globalmente
  - Soporte para Google AdSense - en oportunidades y posts
  - Soporte para Google AdMob (preparado para apps nativas)
  - Componente `GoogleAnalytics` integrado en root layout
  - Componente `AdUnit` actualizado para usar configuración de BD

- **Mejoras en Menú Móvil**
  - Sección "Information" colapsable en menú de cuenta
  - Muestra páginas dinámicas al expandir
  - Icono animado de expansión/colapso

### APIs Nuevas
- `GET/POST /api/admin/pages` - Listar y crear páginas
- `GET/PUT/DELETE /api/admin/pages/[id]` - CRUD de páginas
- `POST /api/admin/pages/upload` - Upload de imágenes para páginas
- `GET /api/pages` - Páginas públicas (filtros: footer, menu)
- `GET /api/pages/[slug]` - Página pública por slug
- `GET/POST /api/admin/settings/analytics` - Configuración de analytics
- `GET /api/analytics` - Configuración pública de ads

### Base de Datos
- Nueva migración `014_pages_table.sql`:
  - Tabla `pages` con campos para contenido, SEO y display options
  - Índices optimizados para consultas frecuentes
  - Políticas RLS para lectura pública y gestión admin

---

## [1.0.0-alpha.3] - 2026-01-13

### Agregado
- **Sistema completo de gestión de usuarios**
  - Registro e inicio de sesión con redirección automática a `/account`
  - Dashboard de cuenta con información de perfil y membresía
  - Cambio de avatar con upload a Supabase Storage
  - Cambio de contraseña
  - Sistema de favoritos para guardar oportunidades
  - Configuración de notificaciones (email, push, in-app)
  - Navegación dinámica según estado de autenticación

- **Experiencia móvil nativa (Mobile-First)**
  - Componente `BottomSheet`: Modal deslizante desde abajo con soporte para gestos táctiles
  - Componente `MobileNavBar`: Barra de navegación inferior estilo app nativa
  - Página `/opportunities` con diseño mobile-first
  - Filtros por tipo de oportunidad (12 tipos disponibles)
  - Búsqueda en tiempo real
  - Grid responsivo (1/2/3/4 columnas según viewport)
  - Botón de favoritos en cada tarjeta

- **Nuevas APIs de usuario**
  - `GET/PUT /api/user/profile` - Gestión de perfil
  - `POST /api/user/avatar` - Upload de avatar
  - `PUT /api/user/password` - Cambio de contraseña
  - `GET/POST/DELETE /api/user/favorites` - Sistema de favoritos
  - `GET/PUT /api/user/notifications` - Configuración de notificaciones
  - `POST /api/auth/logout` - Cierre de sesión

- **Nuevas páginas de cuenta**
  - `/account` - Dashboard principal con perfil y configuración
  - `/account/favorites` - Lista de oportunidades guardadas
  - `/account/notifications` - Configuración de notificaciones

- **Componentes reutilizables**
  - `FavoriteButton` - Botón de corazón para favoritos
  - `UserNav` - Navegación de usuario en header
  - `AccountSidebar` - Sidebar de navegación en cuenta
  - `BottomSheet` - Modal deslizante para móvil
  - `MobileNavBar` - Navegación inferior móvil
  - `OpportunitiesBrowser` - Explorador de oportunidades con filtros

### Corregido
- Error de hidratación en `UserNav` por diferencia servidor/cliente
- Error de cookies asíncronas en Next.js 15 (`await cookies()`)
- Perfil no encontrado (404) - ahora se auto-crea al primer acceso
- Redirección post-login ahora va a `/account` en lugar de `/`

### Base de Datos
- Nueva migración `013_user_features.sql`:
  - Campos adicionales en `profiles`: display_name, avatar_url, membership_type, etc.
  - Tabla `user_favorites` para oportunidades guardadas
  - Tabla `user_notification_settings` para preferencias
  - Tabla `user_read_history` para historial de lectura
  - Políticas RLS para seguridad a nivel de fila

---

## [1.0.0-alpha.2] - 2026-01-12

### Agregado
- Sistema de AI Multi-Provider (OpenAI, Claude, DeepSeek, Gemini)
- Sistema de Prompts personalizable con 11 tipos de oportunidades
- Gestión de Feeds mejorada con edición, eliminación y ejecución manual
- Export/Import de feeds en JSON
- Sistema de imágenes con upload a Supabase Storage
- Páginas públicas de oportunidades (`/opportunities`, `/p/[slug]`)
- Sistema de branding personalizable (logo, nombre de app)
- Editor WYSIWYG TipTap para contenido

### Corregido
- Input focus loss en formulario de feeds
- AI provider no se guardaba al crear feeds
- Validación incorrecta en PATCH feeds

---

## [1.0.0-alpha.1] - 2026-01-10

### Agregado
- Configuración inicial del proyecto Next.js 15
- Integración con Supabase para autenticación y base de datos
- Panel de administración básico
- Procesamiento de feeds RSS
- Sistema de categorías y tipos de oportunidades

---

*Este archivo se actualiza con cada versión del proyecto.*
