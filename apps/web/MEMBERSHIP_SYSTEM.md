# Sistema de Membresía - Documentación Técnica

## Resumen Ejecutivo

El sistema implementa un **modelo freemium de tres niveles**: free, premium y lifetime. Para desactivarlo completamente y operar de forma gratuita, se necesita agregar un toggle global que bypass las verificaciones de membresía relacionadas con acceso a contenido.

**IMPORTANTE**: Los anuncios NO se desactivan cuando se deshabilita la membresía. Esto permite mantener la monetización mientras se ofrece acceso gratuito al contenido.

---

## 1. Esquema de Base de Datos

### Tabla `profiles` (columnas de membresía)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `membership_type` | varchar | 'free' \| 'premium' \| 'lifetime' |
| `membership_expires_at` | timestamp | Fecha de expiración (NULL para lifetime/free) |
| `stripe_customer_id` | varchar | ID de Stripe (no usado actualmente) |
| `paypal_subscription_id` | varchar | ID de suscripción PayPal |

### Tabla `system_settings` (configuración de membresía)

**Categoría: `membership`**

| Key | Default | Descripción |
|-----|---------|-------------|
| `membership.free_content_percentage` | 60 | % de contenido accesible para free |
| `membership.free_delay_hours` | 24 | Horas de delay para usuarios free |
| `membership.free_favorites_limit` | 5 | Máximo de favoritos para free |
| `membership.show_locked_content` | true | Mostrar contenido bloqueado |
| `membership.locked_content_blur` | true | Aplicar blur a contenido bloqueado |
| `membership.monthly_price` | 4.99 | Precio mensual |
| `membership.annual_price` | 39.99 | Precio anual |
| `membership.paypal_enabled` | false | PayPal habilitado |
| `membership.paypal_client_id` | "" | Client ID de PayPal |
| `membership.paypal_plan_id_monthly` | "" | Plan ID mensual |
| `membership.paypal_plan_id_annual` | "" | Plan ID anual |
| `membership.free_notifications_daily` | 1 | Notificaciones diarias para free |
| `membership.free_email_digest` | "weekly" | Frecuencia de digest para free |

---

## 2. Tipos de Membresía

### Free (Gratuito)
- Acceso al 60% de oportunidades (las más antiguas primero)
- 24 horas de delay en contenido nuevo
- Máximo 5 favoritos guardados
- 1 notificación push diaria
- Digest semanal por email
- **VE ANUNCIOS**

### Premium
- 100% acceso a contenido
- Acceso instantáneo a contenido nuevo
- Favoritos ilimitados
- Notificaciones ilimitadas
- Frecuencia de digest personalizable
- **SIN ANUNCIOS**
- Expira según `membership_expires_at`

### Lifetime
- Todos los beneficios de Premium
- **NUNCA EXPIRA** (`membership_expires_at` = NULL)
- Generalmente otorgado por admin

---

## 3. Archivos Clave del Sistema

### Core Logic
| Archivo | Propósito |
|---------|-----------|
| `lib/utils/membership.ts` | Funciones core de verificación |
| `context/UserContext.tsx` | Context de React + hooks (`useShowAds`, `useMembershipAccess`) |
| `lib/contexts/AdContext.tsx` | Sistema de anuncios (verifica premium) |

### API Endpoints
| Endpoint | Método | Propósito |
|----------|--------|-----------|
| `/api/membership/limits` | GET | Obtiene límites de membresía (cached 5min) |
| `/api/subscription/activate` | POST | Activa suscripción PayPal |
| `/api/subscription/cancel` | POST | Cancela suscripción |
| `/api/pricing` | GET | Configuración de precios pública |
| `/api/user/profile` | GET/PUT | Perfil con info de membresía |
| `/api/admin/settings/membership` | GET/POST | Configuración admin |

### UI Components
| Archivo | Propósito |
|---------|-----------|
| `app/pricing/page.tsx` | Página de precios con PayPal |
| `app/account/membership/page.tsx` | Gestión de membresía del usuario |
| `app/admin/settings/MembershipSettings.tsx` | Panel de configuración admin |
| `app/admin/ManageUsers.tsx` | Gestión de usuarios (filtros por membresía) |
| `app/opportunities/OpportunitiesBrowser.tsx` | Muestra candados en contenido bloqueado |

---

## 4. Funciones de Verificación (`lib/utils/membership.ts`)

```typescript
// Verifica si es premium o lifetime
isPremiumMembership(membershipType): boolean

// Verifica si la membresía está activa (no expirada)
isMembershipActive(membershipType, expiresAt): boolean

// Determina si mostrar anuncios
shouldShowAds(membershipType, expiresAt): boolean

// Acceso completo al contenido
hasFullContentAccess(membershipType, expiresAt): boolean

// Verifica acceso a oportunidad específica (por índice)
isOpportunityAccessible(membershipType, expiresAt, index, total, limits): boolean

// Verifica si está en período de delay
isWithinDelayPeriod(publishedAt, delayHours): boolean

// Puede agregar favorito
canAddFavorite(membershipType, expiresAt, currentCount, limit): boolean
```

---

## 5. Dónde se Verifican las Membresías

### En Contextos/Hooks
```typescript
// UserContext.tsx
const { shouldShowAds, isPremium } = useShowAds();
const { hasFullAccess, limits } = useMembershipAccess();
```

### En Componentes
- **OpportunitiesBrowser**: Agrega candado a oportunidades bloqueadas
- **AdUnit/LazyAdUnit**: Verifica `shouldShowAds` antes de mostrar
- **Account pages**: Muestra estado de membresía
- **Pricing page**: Muestra planes y permite suscripción

### En APIs
- **GET /api/opportunities**: Filtra contenido según membresía
- **POST /api/favorites**: Verifica límite de favoritos
- **GET /api/notifications**: Aplica límites según plan

---

## 6. Sistema de Anuncios

El sistema de anuncios está directamente ligado a la membresía:

```typescript
// AdContext.tsx
const shouldShowAds = !isPremium && config?.enabled === true;
```

**Componentes de anuncios:**
- `AdUnit.tsx`
- `LazyAdUnit.tsx`
- `AdContainer.tsx`
- `ContentWithAds.tsx`
- Sticky banners, interstitials, native ads

### Comportamiento con Membresía Desactivada

**IMPORTANTE**: Cuando se desactiva el sistema de membresía, los anuncios **NO se desactivan**.

La lógica de `shouldShowAds` debe modificarse para que cuando `membershipEnabled = false`:
- Los anuncios se muestren a TODOS los usuarios
- Esto mantiene la monetización mientras se ofrece acceso gratuito

```typescript
// Lógica modificada cuando membership está desactivado:
// shouldShowAds = true (para todos)
// hasFullAccess = true (para todos)
```

---

## 7. Plan de Implementación: Toggle "Desactivar Membresía"

### Paso 1: Agregar Setting en Base de Datos

```sql
-- Migración: 038_membership_system_toggle.sql
INSERT INTO public.system_settings (key, value, description, category)
VALUES (
  'membership.system_enabled',
  'true',
  'Enable/disable entire membership system. When false, all users have full access.',
  'membership'
);
```

### Paso 2: Actualizar `lib/utils/membership.ts`

```typescript
// Agregar función para verificar si el sistema está habilitado
export async function isMembershipSystemEnabled(): Promise<boolean> {
  // Fetch del setting desde cache o API
  const setting = await getSystemSetting('membership.system_enabled');
  return setting !== 'false';
}

// Modificar funciones existentes para aceptar systemEnabled
// NOTA: shouldShowAds NO se modifica - los anuncios siempre se muestran
// para mantener la monetización, independientemente del estado del sistema

export function hasFullContentAccess(
  membershipType: string | undefined,
  expiresAt: string | null | undefined,
  systemEnabled: boolean = true
): boolean {
  // Si el sistema está deshabilitado, todos tienen acceso completo
  if (!systemEnabled) return true;

  // ... lógica existente
}
```

### Paso 3: Actualizar `context/UserContext.tsx`

```typescript
// Agregar estado para saber si el sistema de membresía está habilitado
export function useMembershipAccess() {
  const [membershipEnabled, setMembershipEnabled] = useState(true);

  useEffect(() => {
    // Fetch membership system status
    fetch('/api/system/membership-status')
      .then(res => res.json())
      .then(data => setMembershipEnabled(data.enabled));
  }, []);

  const hasFullAccess = useMemo(() => {
    // Si el sistema está deshabilitado, todos tienen acceso completo
    if (!membershipEnabled) return true;
    // ... existing logic
  }, [membershipEnabled, profile, loading]);

  return { hasFullAccess, membershipEnabled, ... };
}

// NOTA: useShowAds() NO se modifica - los anuncios siempre se muestran
// para mantener monetización independiente del estado del sistema
}
```

### Paso 4: Crear API `/api/system/membership-status`

```typescript
// app/api/system/membership-status/route.ts
export async function GET() {
  const setting = await getSystemSetting('membership.system_enabled');
  return NextResponse.json({
    enabled: setting !== 'false',
    message: setting === 'false' ? 'Membership system is disabled. All features are free.' : null
  });
}
```

### Paso 5: Agregar Toggle en Admin

En `MembershipSettings.tsx`, agregar al inicio:

```tsx
<div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
  <h3 className="font-bold text-lg text-yellow-800 mb-2">System Status</h3>
  <label className="flex items-center gap-3 cursor-pointer">
    <input
      type="checkbox"
      checked={membershipSystemEnabled}
      onChange={(e) => handleToggleSystem(e.target.checked)}
      className="w-5 h-5"
    />
    <div>
      <span className="font-medium">Enable Membership System</span>
      <p className="text-sm text-yellow-700">
        When disabled, all users have full access and no ads are shown.
      </p>
    </div>
  </label>
</div>
```

### Paso 6: Actualizar Componentes que Verifican Membresía

**OpportunitiesBrowser.tsx:**
```typescript
const { hasFullAccess, membershipEnabled } = useMembershipAccess();
// Si membershipEnabled es false, no mostrar candados
```

**Pricing page:**
```typescript
if (!membershipEnabled) {
  return <div>The app is currently free for all users!</div>;
}
```

---

## 8. Comportamiento Cuando se Desactiva

| Feature | Con Membresía | Sin Membresía |
|---------|---------------|---------------|
| **Anuncios** | Free ve ads, Premium no | **TODOS ven ads** (monetización) |
| Contenido | Free 60%, Premium 100% | Todos 100% |
| Delay | Free 24h, Premium 0 | Todos 0 |
| Favoritos | Free 5, Premium ilimitado | Todos ilimitado |
| Notificaciones | Free 1/día, Premium ilimitado | Todos ilimitado |
| Pricing page | Muestra planes | Oculta o muestra "Coming soon" |
| Candados en UI | Sí para Free | No se muestran |

**Nota importante**: Los anuncios se mantienen activos para todos los usuarios cuando se desactiva la membresía. Esto permite monetizar la app mientras se ofrece acceso gratuito al contenido durante el período de prueba.

---

## 9. Archivos a Modificar

### Críticos (deben modificarse)
1. `lib/utils/membership.ts` - Agregar bypass logic
2. `context/UserContext.tsx` - Agregar membershipEnabled state
3. `app/admin/settings/MembershipSettings.tsx` - Agregar toggle
4. `app/api/system/membership-status/route.ts` - Crear endpoint (nuevo)

### Secundarios (actualizar para mejor UX)
5. `app/pricing/page.tsx` - Ocultar o mostrar "Coming soon" cuando está desactivado
6. `app/opportunities/OpportunitiesBrowser.tsx` - No mostrar candados
7. `app/account/membership/page.tsx` - Mostrar estado del sistema

**NO modificar**: `components/AdUnit.tsx` - Los anuncios deben seguir mostrándose para monetización

---

## 10. Migración Requerida

```sql
-- apps/web/migrations/038_membership_system_toggle.sql

-- Add setting to enable/disable entire membership system
INSERT INTO public.system_settings (key, value, description, category)
VALUES (
  'membership.system_enabled',
  'true',
  'Master toggle for membership system. When false, all users have premium access and no ads.',
  'membership'
) ON CONFLICT (key) DO NOTHING;
```

---

## 11. Próximos Pasos

1. **Ejecutar migración** para agregar el setting
2. **Crear API endpoint** `/api/system/membership-status`
3. **Actualizar membership.ts** con funciones modificadas
4. **Actualizar UserContext** con el nuevo estado
5. **Agregar toggle en admin** MembershipSettings
6. **Probar** que todo funcione con el toggle en ambos estados
7. **Actualizar UI** para mostrar mensajes apropiados cuando está desactivado

---

## 12. Estimación de Trabajo

| Tarea | Complejidad |
|-------|-------------|
| Migración DB | Baja |
| API endpoint | Baja |
| Actualizar membership.ts | Media |
| Actualizar UserContext | Media |
| Toggle en admin | Baja |
| Actualizar UI components | Media |
| Testing | Media |

**Total estimado**: Implementación straightforward, principalmente actualizar funciones existentes para aceptar un parámetro adicional.
