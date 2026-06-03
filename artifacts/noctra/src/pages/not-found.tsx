import { ObsidianButton } from "@/components/ObsidianButton";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-void-0 bg-texture flex items-center justify-center">
      <div className="text-center">
        <h1
          className="font-bold tracking-tight mb-4 text-text-primary"
          style={{ fontSize: "clamp(4rem, 15vw, 12rem)" }}
        >
          404
        </h1>
        <p className="text-lg mb-8 text-text-secondary">
          This page doesn't exist.
        </p>
        <ObsidianButton variant="secondary" onClick={() => navigate("/")}>
          Go back home
        </ObsidianButton>
      </div>
    </div>
  );
}
