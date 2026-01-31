import { Navbar } from "@/components/layout/LandingNavbar";
import { Footer } from "@/components/layout/LandingFooter";
import { LandingHero } from "@/components/landing/LandingHero";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { WhyNow } from "@/components/landing/WhyNow";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background landing-theme">
      <Navbar showLandingNav />
      <main>
        <LandingHero />
        <ProblemSection />
        <HowItWorks />
        <WhyNow />
        <TestimonialsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Landing;
