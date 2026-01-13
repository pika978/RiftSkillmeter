import { useState, useEffect } from "react";
import { Plus, Trash2, FolderOpen, Save, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { fetchLabs, createLab, deleteLab } from "@/api/labs";

export function LabSidebar({ currentLabId, onSelectLab, onNewLab, onSaveLab }) {
    const [labs, setLabs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newLabName, setNewLabName] = useState("");

    const loadLabs = async () => {
        setIsLoading(true);
        try {
            const data = await fetchLabs();
            setLabs(data);
        } catch (error) {
            toast.error("Failed to load labs");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadLabs();
    }, [currentLabId]); // Reload when current lab changes (e.g. after save)

    const handleCreate = async () => {
        if (!newLabName.trim()) return;

        try {
            // Trigger parent to save current state as new lab
            await onNewLab(newLabName);
            setNewLabName("");
            setIsCreateOpen(false);
            loadLabs();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this lab?")) return;

        try {
            await deleteLab(id);
            toast.success("Lab deleted");
            if (currentLabId === id) {
                // If deleted active lab, reset?
                onSelectLab(null);
            }
            loadLabs();
        } catch (error) {
            toast.error("Failed to delete lab");
        }
    };

    return (
        <div className="w-64 bg-[#1e1e1e] border-r border-[#333] flex flex-col h-full">
            <div className="p-4 border-b border-[#333]">
                <h2 className="text-lg font-semibold text-white mb-2">My Labs</h2>
                <div className="flex gap-2">
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2">
                                <Plus className="w-4 h-4" /> New Lab
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Lab</DialogTitle>
                                <DialogDescription>
                                    Enter a name for your new code lab.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <Label htmlFor="name">Lab Name</Label>
                                <Input
                                    id="name"
                                    value={newLabName}
                                    onChange={(e) => setNewLabName(e.target.value)}
                                    placeholder="e.g., Python Algo Practice"
                                    className="mt-2"
                                />
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreate}>Create</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Button
                        size="sm"
                        variant="outline"
                        className="bg-green-600 hover:bg-green-700 text-white border-0 gap-2 w-full"
                        onClick={onSaveLab}
                        disabled={!currentLabId}
                    >
                        <Save className="w-4 h-4" /> Save
                    </Button>
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {labs.map((lab) => (
                        <div
                            key={lab.id}
                            onClick={() => onSelectLab(lab)}
                            className={`
                                group flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors
                                ${currentLabId === lab.id ? "bg-[#2d2d2d] text-white" : "text-gray-400 hover:bg-[#2d2d2d] hover:text-white"}
                            `}
                        >
                            <div className="flex items-center gap-2 overflow-hidden">
                                <FileCode className="w-4 h-4 shrink-0" />
                                <span className="truncate text-sm">{lab.name}</span>
                            </div>
                            <button
                                onClick={(e) => handleDelete(e, lab.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                    {labs.length === 0 && !isLoading && (
                        <div className="text-center text-gray-500 text-sm mt-4">
                            No saved labs yet.
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
