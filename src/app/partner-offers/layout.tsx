import OffersHeader from './components/offers-header';
import OffersFooter from './components/offers-footer';

export default function PartnerOffersLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <OffersHeader />
            <main className="flex-1">
                {children}
            </main>
            <OffersFooter />
        </div>
    )
}
