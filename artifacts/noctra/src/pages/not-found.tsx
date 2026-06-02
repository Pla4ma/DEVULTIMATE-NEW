import { StarfieldCanvas } from "@/components/StarfieldCanvas";
import { VoidButton } from "@/components/VoidButton";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-void-0 flex items-center justify-center relative">
      <StarfieldCanvas opacity={0.5} />
      <div className="text-center relative z-10">
        <h1
          className="font-bold tracking-tight mb-4"
          style={{
            color: "var(--text-primary)",
            fontSize: "clamp(4rem, 15vw, 12rem)",
          }}
        >
          404
        </h1>
        <p className="text-lg mb-8" style={{ color: "var(--text-secondary)" }}>
          This signal has been lost to the void.
        </p>
        <VoidButton variant="primary" onClick={() => navigate("/")}>
          Return to base
        </VoidButton>
      </div>
    </div>
  );
}
