import React from "react";
import { HeroSection } from "@/components/home/hero-section";
import { PortalCards } from "@/components/home/portal-cards";
import { WorkflowVisualizer } from "@/components/home/workflow-visualizer";
import { NoticesQuickLinks } from "@/components/home/notices-quicklinks";

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col bg-[#fcfcfd]">
      <HeroSection />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <PortalCards />
        <WorkflowVisualizer />
        <NoticesQuickLinks />
      </div>
    </div>
  );
}
