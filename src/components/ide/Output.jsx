import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { executeCode, LANGUAGE_VERSIONS } from "@/api/piston";
import { Loader2, Play, Eye, Terminal as TerminalIcon, Keyboard } from "lucide-react";
import { toast } from "sonner";
import { LivePreview } from "./LivePreview";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import { cn } from "@/lib/utils";

export function Output({ editorRef, language, files }) {
    const [isLoading, setIsLoading] = useState(false);
    const [previewCode, setPreviewCode] = useState("");
    const [stdin, setStdin] = useState("");
    const [activeTab, setActiveTab] = useState("TERMINAL"); // "TERMINAL" | "INPUT"

    // Check if language is preview-only (HTML/CSS)
    const isPreviewLanguage = LANGUAGE_VERSIONS[language] === null;

    const terminalRef = useRef(null);
    const xtermRef = useRef(null);
    const fitAddonRef = useRef(null);

    // Initialize Xterm.js
    useEffect(() => {
        if (isPreviewLanguage || !terminalRef.current) return;

        const term = new Terminal({
            theme: {
                background: '#1e1e1e',
                foreground: '#d4d4d4',
                cursor: '#d4d4d4',
                selectionBackground: '#3a3d41',
                black: '#1e1e1e',
                red: '#f48771',
                green: '#89d185',
                yellow: '#cca700',
                blue: '#44aadd',
                magenta: '#c586c0',
                cyan: '#44aadd',
                white: '#d4d4d4',
                brightBlack: '#808080',
                brightRed: '#f48771',
                brightGreen: '#89d185',
                brightYellow: '#cca700',
                brightBlue: '#44aadd',
                brightMagenta: '#c586c0',
                brightCyan: '#44aadd',
                brightWhite: '#ffffff',
            },
            fontFamily: 'Consolas, "Courier New", monospace',
            fontSize: 14,
            cursorBlink: true,
            rows: 20,
            convertEol: true,
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);

        term.open(terminalRef.current);
        fitAddon.fit();

        term.write('Welcome to Practice Lab Terminal v2.1\r\n');

        // Handle link clicks for error navigation
        term.options.linkHandler = {
            activate: (e, text, range) => {
                handleLinkClick(text);
            }
        };

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        // Cleanup
        return () => {
            term.dispose();
        };
    }, [isPreviewLanguage]);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            fitAddonRef.current?.fit();
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Update preview code for HTML/CSS
    useEffect(() => {
        if (isPreviewLanguage && editorRef.current) {
            const updatePreview = () => {
                setPreviewCode(editorRef.current.getValue() || "");
            };
            updatePreview();
            const interval = setInterval(updatePreview, 500);
            return () => clearInterval(interval);
        }
    }, [language, isPreviewLanguage, editorRef]);

    // Re-fit xterm when tab changes to TERMINAL
    useEffect(() => {
        if (activeTab === "TERMINAL" && fitAddonRef.current) {
            // Small delay to ensure container is rendered
            setTimeout(() => {
                fitAddonRef.current.fit();
            }, 50);
        }
    }, [activeTab]);

    const handleLinkClick = (text) => {
        console.log("Clicked link:", text);
        const pythonMatch = text.match(/File "(.*?)", line (\d+)/);
        const nodeMatch = text.match(/\((.*?):(\d+):(\d+)\)/);

        let line = null;
        if (pythonMatch) {
            line = parseInt(pythonMatch[2]);
        } else if (nodeMatch) {
            line = parseInt(nodeMatch[2]);
        }

        if (line && editorRef.current) {
            editorRef.current.revealLineInCenter(line);
            editorRef.current.setPosition({ lineNumber: line, column: 1 });
            editorRef.current.focus();
            toast.info(`Jumped to line ${line}`);
        }
    };

    const runCode = async () => {
        const sourceCode = editorRef.current?.getValue();

        if (!sourceCode) {
            toast.error("No code to run");
            return;
        }

        setIsLoading(true);
        setActiveTab("TERMINAL"); // Auto-switch to terminal output

        // Wait for tab switch to render terminal if needed
        setTimeout(async () => {
            xtermRef.current?.reset();
            xtermRef.current?.write('\x1b[33mRunning...\x1b[0m\r\n');

            try {
                // Pass stdin here!
                const response = await executeCode(language, sourceCode, stdin);

                console.log("Piston response:", response);

                const result = response.run || response;
                const outputText = result.output || result.stdout || "";
                const errorText = result.stderr || "";

                xtermRef.current?.reset();

                if (errorText && errorText.trim()) {
                    xtermRef.current?.write('\x1b[31m' + errorText.replace(/\n/g, '\r\n') + '\x1b[0m');
                }

                if (outputText && outputText.trim()) {
                    xtermRef.current?.write(outputText.replace(/\n/g, '\r\n'));
                }

                if (!errorText && !outputText) {
                    xtermRef.current?.write('\x1b[32mProgram executed successfully (no output)\x1b[0m\r\n');
                }

            } catch (error) {
                console.error("Execution error:", error);
                xtermRef.current?.write('\x1b[31mError: ' + error.message + '\x1b[0m\r\n');
                toast.error("Execution failed");
            } finally {
                setIsLoading(false);
            }
        }, 100);
    };

    // For HTML/CSS, show live preview
    if (isPreviewLanguage) {
        return (
            <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Eye className="h-5 w-5" /> Live Preview
                    </h2>
                </div>
                <div className="flex-1 rounded-lg overflow-hidden bg-white" style={{ border: "1px solid #333" }}>
                    <LivePreview code={previewCode} language={language} />
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col pl-0 lg:pl-4">
            {/* Header with Run Button and Tabs */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab("TERMINAL")}
                        className={cn(
                            "text-sm font-medium pb-1 border-b-2 hover:text-green-400 transition-colors flex items-center gap-2",
                            activeTab === "TERMINAL" ? "border-green-500 text-green-500" : "border-transparent text-muted-foreground"
                        )}
                    >
                        <TerminalIcon className="w-4 h-4" /> TERMINAL
                    </button>
                    <button
                        onClick={() => setActiveTab("INPUT")}
                        className={cn(
                            "text-sm font-medium pb-1 border-b-2 hover:text-blue-400 transition-colors flex items-center gap-2",
                            activeTab === "INPUT" ? "border-blue-500 text-blue-500" : "border-transparent text-muted-foreground"
                        )}
                    >
                        <Keyboard className="w-4 h-4" /> INPUT
                    </button>
                </div>
                <Button
                    onClick={runCode}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs"
                >
                    {isLoading ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                        <Play className="mr-1 h-3 w-3" />
                    )}
                    Run Code
                </Button>
            </div>

            {/* Panel Content */}
            <div
                className="flex-1 rounded-lg overflow-hidden bg-[#1e1e1e]"
                style={{ border: "1px solid #333", minHeight: "300px", position: "relative" }}
            >
                {/* Terminal Tab */}
                <div
                    className={cn("w-full h-full p-3", activeTab === "TERMINAL" ? "block" : "hidden")}
                >
                    <div ref={terminalRef} className="w-full h-full" />
                </div>

                {/* Input Tab */}
                <div
                    className={cn("w-full h-full", activeTab === "INPUT" ? "block" : "hidden")}
                >
                    <textarea
                        value={stdin}
                        onChange={(e) => setStdin(e.target.value)}
                        placeholder="Enter program input here (stdin)..."
                        className="w-full h-full p-4 bg-[#1e1e1e] text-gray-300 font-mono text-sm resize-none focus:outline-none"
                        spellCheck={false}
                    />
                </div>
            </div>
        </div>
    );
}
