import "./App.css";
import "./CabinetPage.css";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { WaveDivider } from "./components/WaveDivider";
import { CabinetProvider } from "./cabinet/context";
import { CabinetApp } from "./cabinet/CabinetApp";
import type { PageKey } from "./types/navigation";

interface CabinetPageProps {
  onBack: () => void;
  onNavigate: (page: PageKey) => void;
}

export default function CabinetPage({ onBack, onNavigate }: CabinetPageProps) {
  return (
    <div className="app">
      <Header currentPage="cabinet" onHome={onBack} onNavigate={onNavigate} />

      <main className="cabinet-page">
        <div className="container cabinet-page__inner">
          <CabinetProvider>
            <CabinetApp />
          </CabinetProvider>
        </div>
      </main>

      <WaveDivider variant="footer" />
      <Footer onHome={onBack} onNavigate={onNavigate} />
    </div>
  );
}
