import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CodeEditor } from "@/components/ide/CodeEditor";
import { LabSidebar } from "@/components/ide/LabSidebar";
import { CODE_SNIPPETS } from "@/api/piston";
import { createLab, updateLab } from "@/api/labs";
import { toast } from "sonner";

export default function PracticeLab() {
    const [currentLabId, setCurrentLabId] = useState(null);
    const [labName, setLabName] = useState("Untitled Lab");
    const [language, setLanguage] = useState("javascript");
    const [files, setFiles] = useState([
        { name: "main.js", language: "javascript", content: CODE_SNIPPETS["javascript"] }
    ]);

    const handleSelectLab = (lab) => {
        if (!lab) {
            // Reset to default
            setCurrentLabId(null);
            setLabName("Untitled Lab");
            setLanguage("javascript");
            setFiles([{ name: "main.js", language: "javascript", content: CODE_SNIPPETS["javascript"] }]);
        } else {
            // Load lab
            setCurrentLabId(lab.id);
            setLabName(lab.name);
            setLanguage(lab.language);
            setFiles(lab.files);
        }
    };

    const handleNewLab = async (name) => {
        try {
            // Create a fresh lab with default JS state
            const defaultLanguage = "javascript";
            const defaultFiles = [{ name: "main.js", language: "javascript", content: CODE_SNIPPETS["javascript"] }];

            const newLab = await createLab(name, defaultLanguage, defaultFiles);
            toast.success(`Created lab: ${name}`);

            // Switch to it
            handleSelectLab(newLab);
        } catch (error) {
            toast.error("Failed to create lab");
            throw error;
        }
    };

    const handleSaveLab = async () => {
        if (!currentLabId) return;

        try {
            await updateLab(currentLabId, labName, language, files);
            toast.success("Lab saved successfully");
            // Force sidebar update logic if needed, but sidebar reloads on currentLabId change
            // Actually sidebar might need a signal to reload if name changed, but here name doesn't change on save
        } catch (error) {
            toast.error("Failed to save lab");
        }
    };

    return (
        <DashboardLayout>
            <div className="flex h-[calc(100vh-100px)] gap-4 -m-4 p-4">
                {/* Sidebar */}
                <div className="hidden lg:block h-full">
                    <div className="h-full rounded-xl overflow-hidden border border-border bg-card">
                        <LabSidebar
                            currentLabId={currentLabId}
                            onSelectLab={handleSelectLab}
                            onNewLab={handleNewLab}
                            onSaveLab={handleSaveLab}
                        />
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-heading font-bold">{labName}</h1>
                            <p className="text-muted-foreground text-sm">
                                {currentLabId ? "Autosave enabled" : "Unsaved Playground"}
                            </p>
                        </div>
                    </div>

                    <div className="flex-1 bg-card border border-border rounded-xl p-4 overflow-hidden flex flex-col">
                        <CodeEditor
                            language={language}
                            setLanguage={setLanguage}
                            files={files}
                            setFiles={setFiles}
                        />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
