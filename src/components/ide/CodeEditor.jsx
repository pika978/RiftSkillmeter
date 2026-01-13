import { useRef, useState, useEffect } from "react";
import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { LanguageSelector } from "./LanguageSelector";
import { Output } from "./Output";
import { CODE_SNIPPETS } from "@/api/piston";
import { Plus, X, FileCode } from "lucide-react";

// Configure Monaco loader to use local instance
// Configure Monaco loader to use local instance
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

self.MonacoEnvironment = {
    getWorker(_, label) {
        if (label === 'json') {
            return new jsonWorker();
        }
        if (label === 'css' || label === 'scss' || label === 'less') {
            return new cssWorker();
        }
        if (label === 'html' || label === 'handlebars' || label === 'razor') {
            return new htmlWorker();
        }
        if (label === 'typescript' || label === 'javascript') {
            return new tsWorker();
        }
        return new editorWorker();
    }
};

loader.config({ monaco });

export function CodeEditor({
    language,
    setLanguage,
    files,
    setFiles
}) {
    // Falls back to default if props not provided (though parent should provide them)
    const [activeFileIndex, setActiveFileIndex] = useState(0);
    const editorRef = useRef(null);

    // Safety check in case files is empty/null during loading
    if (!files || files.length === 0) {
        return <div className="p-4 text-white">Loading files...</div>;
    }

    const activeFile = files[activeFileIndex] || files[0];

    const onMount = (editor) => {
        editorRef.current = editor;
        editor.focus();
    };

    const onSelectLanguage = (lang) => {
        setLanguage(lang);
        // Reset files for the new language
        setFiles([
            {
                name: `main.${getExtension(lang)}`,
                language: lang,
                content: CODE_SNIPPETS[lang] || "// Start coding..."
            }
        ]);
        setActiveFileIndex(0);
    };

    const onChange = (value) => {
        const newFiles = [...files];
        if (newFiles[activeFileIndex]) {
            newFiles[activeFileIndex].content = value || "";
            setFiles(newFiles);
        }
    };

    const addFile = () => {
        const ext = getExtension(language);
        const name = `file${files.length}.${ext}`;
        setFiles([...files, { name, language, content: "" }]);
        setActiveFileIndex(files.length);
    };

    const removeFile = (index, e) => {
        e.stopPropagation();
        if (files.length === 1) return; // Don't delete last file
        const newFiles = files.filter((_, i) => i !== index);
        setFiles(newFiles);
        if (activeFileIndex >= index && activeFileIndex > 0) {
            setActiveFileIndex(activeFileIndex - 1);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-4" style={{ height: "calc(100vh - 200px)", minHeight: "500px" }}>
            {/* Editor Panel */}
            <div className="flex-1 flex flex-col">
                <LanguageSelector language={language} onSelect={onSelectLanguage} />

                {/* File Tabs */}
                <div className="flex items-center gap-1 mb-0 border-b border-[#333] bg-[#1e1e1e] rounded-t-lg overflow-x-auto px-2 pt-2">
                    {files.map((file, index) => (
                        <div
                            key={index}
                            onClick={() => setActiveFileIndex(index)}
                            className={`
                                flex items-center gap-2 px-3 py-2 text-sm cursor-pointer border-t border-l border-r rounded-t-md min-w-[100px] select-none
                                ${index === activeFileIndex
                                    ? "bg-[#1e1e1e] border-[#333] text-white"
                                    : "bg-[#2d2d2d] border-transparent text-gray-400 hover:bg-[#333]"}
                            `}
                            style={{ marginBottom: "-1px", position: "relative", zIndex: index === activeFileIndex ? 10 : 1 }}
                        >
                            <FileCode className="w-3 h-3" />
                            <span className="truncate max-w-[100px]">{file.name}</span>
                            {files.length > 1 && (
                                <button
                                    onClick={(e) => removeFile(index, e)}
                                    className="ml-auto hover:text-red-400 rounded-full p-0.5"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        onClick={addFile}
                        className="p-1 hover:bg-[#333] rounded-md text-gray-400 ml-1 mb-1"
                        title="New File"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 rounded-b-lg overflow-hidden" style={{ border: "1px solid #333", borderTop: "none" }}>
                    <Editor
                        height="100%"
                        theme="vs-dark"
                        language={activeFile.language}
                        value={activeFile.content}
                        onMount={onMount}
                        onChange={onChange}
                        path={activeFile.name || "temp"} // Important for Monaco model switching
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            padding: { top: 16 },
                            lineNumbers: "on",
                            roundedSelection: true,
                        }}
                    />
                </div>
            </div>

            {/* Output Panel - Passing all files now */}
            <Output editorRef={editorRef} language={language} files={files} />
        </div>
    );
}

function getExtension(lang) {
    const map = {
        javascript: "js", typescript: "ts", python: "py", java: "java",
        csharp: "cs", php: "php", c: "c", cpp: "cpp", go: "go",
        rust: "rs", ruby: "rb", kotlin: "kt", html: "html", css: "css"
    };
    return map[lang] || "txt";
}
