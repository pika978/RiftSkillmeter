import { useState, useEffect } from "react";

export function LivePreview({ code, language }) {
    const [srcDoc, setSrcDoc] = useState("");

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (language === "html") {
                setSrcDoc(code);
            } else if (language === "css") {
                // Wrap CSS in a basic HTML template with sample elements
                setSrcDoc(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>${code}</style>
                    </head>
                    <body>
                        <div style="padding: 20px;">
                            <h1>CSS Preview</h1>
                            <p>This is a paragraph to preview your styles.</p>
                            <button class="btn btn-primary">Primary Button</button>
                            <button class="btn btn-secondary">Secondary Button</button>
                            <div class="card" style="margin-top: 20px; padding: 16px; border: 1px solid #ddd; border-radius: 8px;">
                                <h3>Card Component</h3>
                                <p>Sample card content for testing CSS.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `);
            }
        }, 250); // Debounce for performance

        return () => clearTimeout(timeout);
    }, [code, language]);

    return (
        <div className="w-full h-full bg-white rounded-md overflow-hidden">
            <iframe
                srcDoc={srcDoc}
                title="Live Preview"
                sandbox="allow-scripts"
                className="w-full h-full border-0"
                style={{ minHeight: "400px" }}
            />
        </div>
    );
}
