import Link from 'next/link';
import UserNav from './UserNav';

interface Branding {
    logoUrl: string | null;
    appName: string;
    logoSpinEnabled?: boolean;
    logoSpinDuration?: number;
}

interface AppHeaderProps {
    branding: Branding;
    mobileTitle?: string;
    showUserNav?: boolean;
    hideOpportunities?: boolean;
    children?: React.ReactNode;
}

export default function AppHeader({
    branding,
    mobileTitle,
    showUserNav = true,
    hideOpportunities = false,
    children,
}: AppHeaderProps) {
    const logoClassName = `app-logo h-8 md:h-10 object-contain${branding.logoSpinEnabled ? ' logo-spin' : ''}`;
    const logoStyle = branding.logoSpinEnabled && branding.logoSpinDuration
        ? { '--logo-spin-duration': `${branding.logoSpinDuration}s` } as React.CSSProperties
        : undefined;

    return (
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
            {/* Main nav bar */}
            <div className="max-w-7xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    {branding.logoUrl ? (
                        <img
                            src={branding.logoUrl}
                            alt={branding.appName}
                            className={logoClassName}
                            style={logoStyle}
                        />
                    ) : (
                        <div className="app-logo bg-[#FFDE59] p-1.5 md:p-2 rounded-lg md:rounded-xl font-black text-sm md:text-xl shadow-sm">
                            GB
                        </div>
                    )}
                    <span className="app-name hidden md:inline text-sm font-bold text-[#1a1a1a]">
                        {branding.appName}
                    </span>
                </Link>

                {/* Mobile title (center) */}
                {mobileTitle && (
                    <h1 className="md:hidden font-bold text-lg">{mobileTitle}</h1>
                )}

                {/* Desktop UserNav */}
                {showUserNav && (
                    <div className="hidden md:block">
                        <UserNav hideOpportunities={hideOpportunities} />
                    </div>
                )}

                {/* Mobile spacer when no UserNav shown on mobile */}
                {mobileTitle && <div className="w-8 md:hidden" />}
            </div>

            {/* Optional additional content (search bars, filters, etc.) */}
            {children}
        </header>
    );
}
