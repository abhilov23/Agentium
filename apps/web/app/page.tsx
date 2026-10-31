import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import CodeDemo from "./components/CodeDemo";
import CompareTable from "./components/CompareTable";
import SetupSection from "./components/SetupSection";
import FAQ from "./components/FAQ";
import CTASection from "./components/CTASection";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0c0c0c] text-[#ededed]">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <CodeDemo />
        <CompareTable />
        <SetupSection />
        <FAQ />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
