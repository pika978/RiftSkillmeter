import { useState, useEffect } from "react";
import { Plus, Trash2, FolderOpen, Save, FileCode } from "lucide-react";
import { cn } from "@/lib/utils";
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
        <div className="w-64 bg-sidebar-background border-r border-sidebar-border flex flex-col h-full shrink-0">
            <div className="p-4 border-b border-sidebar-border">
                <h2 className="text-lg font-bold text-sidebar-foreground mb-2">My Labs</h2>
                <div className="flex gap-2">
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="w-full bg-primary text-white hover:bg-primary/90 gap-2 border-2 border-black rounded-none shadow-brutal-sm hover:translate-y-[-1px] transition-all">
                                <Plus className="w-4 h-4" /> New Lab
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-none border-border">
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
                                    className="mt-2 rounded-none border-sidebar-border focus:ring-0 focus:border-sidebar-foreground"
                                />
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreate} className="rounded-none">Create</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Button
                        size="sm"
                        variant="outline"
                        className="bg-white text-black border-2 border-black hover:bg-secondary hover:text-black gap-2 w-full rounded-none shadow-brutal-sm disabled:opacity-50 disabled:shadow-none"
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
                            className={cn(
                                "group flex items-center justify-between p-2 cursor-pointer transition-all border-2 mb-1 select-none",
                                currentLabId === lab.id
                                    ? "bg-primary text-white border-black shadow-brutal-sm -translate-y-[1px]" // Active: Blue BG, White Text, Shadow
                                    : "text-muted-foreground border-transparent hover:text-black hover:border-black hover:bg-white" // Hover: Black Text, Black Border
                            )}
                        >
                            <div className="flex items-center gap-2 overflow-hidden">
                                <FileCode className="w-4 h-4 shrink-0" />
                                <span className="truncate text-sm font-medium">{lab.name}</span>
                            </div>
                            <button
                                onClick={(e) => handleDelete(e, lab.id)}
                                className={cn(
                                    "p-1 transition-opacity",
                                    currentLabId === lab.id ? "hover:text-red-400" : "opacity-0 group-hover:opacity-100 hover:text-red-600"
                                )}
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                    {labs.length === 0 && !isLoading && (
                        <div className="text-center text-muted-foreground text-sm mt-4 italic">
                            No saved labs yet.
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
