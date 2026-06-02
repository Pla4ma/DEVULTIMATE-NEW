import { Stethoscope } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ToolScene } from "@/components/ToolScene";
import { DoctorInputPanel } from "@/components/doctor/DoctorInputPanel";
import { DoctorOutputPanel } from "@/components/doctor/DoctorOutputPanel";
import { useDoctorScan } from "@/hooks/use-doctor-scan";
import { TOOL_BY_KEY } from "@/lib/noctra-tools";

const TOOL = TOOL_BY_KEY["doctor"]!;

export default function DoctorPage() {
  const {
    phase, error, zipFile, scanResult, aiResult, savedReportId,
    dragOver, scanFallbackMode, fileRef,
    handleFileSelect, reset, setDragOver,
  } = useDoctorScan();

  return (
    <AppShell>
      <ToolScene
        icon={Stethoscope}
        label={TOOL.label}
        accent={TOOL.accent}
        phase={phase === "done" ? "done" : phase === "error" ? "error" : "running"}
        description="Upload your repo ZIP. Get launch readiness, blockers, fix queue, and build prompt."
        stage={phase === "scanning" ? "Deep scanning codebase…" : phase === "diagnosing" ? "AI diagnosing launch blockers…" : phase === "generating" ? "Generating fix tasks and build prompt…" : undefined}
        inputPanel={
          <DoctorInputPanel
            phase={phase} scanResult={scanResult} zipFile={zipFile} error={error}
            dragOver={dragOver} accent={TOOL.accent} fileRef={fileRef}
            handleFileSelect={handleFileSelect} reset={reset} setDragOver={setDragOver}
          />
        }
        outputPanel={
          <DoctorOutputPanel
            phase={phase} error={error} aiResult={aiResult} scanResult={scanResult}
            scanFallbackMode={scanFallbackMode} savedReportId={savedReportId}
          />
        }
        errorMessage={phase === "error" ? error : undefined}
      />
    </AppShell>
  );
}
