import Link from 'next/link';
import { Button } from '@/components/ui';
import { Header } from '@/components/layout';
import { Hero } from "@/components/hero";
import WhyChoose  from "@/components/WhyChoose";
import ExamCategories  from "@/components/ExamCategories";
import PlatformFeatures  from "@/components/PlatformFeatures";
import RewardsSection  from "@/components/RewardsSection";
import PricingPreview  from "@/components/PricingPreview";
import StudentJourney  from "@/components/StudentJourney";
import Testimonials  from "@/components/Testimonials";
import FAQSection from "@/components/FAQSection";









import { Values } from "@/components/values";




export default function HomePage() {


  return (
    <div className="flex flex-col">
      <Header />
      <Hero />
    

      <Values />
      <WhyChoose />
      <ExamCategories />
      <PlatformFeatures />
      <RewardsSection />
      <PricingPreview />
      <StudentJourney />
      <Testimonials />
      <FAQSection />










    </div>
  );
}