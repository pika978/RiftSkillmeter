import axios from 'axios';

const API_URL = 'https://emkc.org/api/v2/piston';

export const LANGUAGE_VERSIONS = {
    javascript: '18.15.0',
    typescript: '5.0.3',
    python: '3.10.0',
    java: '15.0.2',
    csharp: '6.12.0',
    php: '8.2.3',
    c: '10.2.0',
    cpp: '10.2.0',
    go: '1.16.2',
    rust: '1.68.2',
    ruby: '3.0.1',
    kotlin: '1.8.20',
    html: null, // Preview only
    css: null,  // Preview only
};

export const CODE_SNIPPETS = {
    javascript: `function greet(name) {\n  console.log("Hello, " + name + "!");\n}\n\ngreet("Alex");`,
    typescript: `type Params = {\n  name: string;\n}\n\nfunction greet(data: Params) {\n  console.log("Hello, " + data.name + "!");\n}\n\ngreet({ name: "Alex" });`,
    python: `def greet(name):\n    print("Hello, " + name + "!")\n\ngreet("Alex")`,
    java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}`,
    csharp: `using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello World");\n    }\n}`,
    php: `<?php\n\n$name = "Alex";\necho "Hello, " . $name . "!";`,
    c: `#include <stdio.h>\n\nint main() {\n    printf("Hello World\\n");\n    return 0;\n}`,
    cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello World" << endl;\n    return 0;\n}`,
    go: `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello World")\n}`,
    rust: `fn main() {\n    println!("Hello World");\n}`,
    ruby: `def greet(name)\n  puts "Hello, #{name}!"\nend\n\ngreet("Alex")`,
    kotlin: `fun main() {\n    println("Hello World")\n}`,
    html: `<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <title>Hello World</title>\n    <style>\n        body {\n            font-family: Arial, sans-serif;\n            display: flex;\n            justify-content: center;\n            align-items: center;\n            height: 100vh;\n            margin: 0;\n            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n        }\n        h1 {\n            color: white;\n            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);\n        }\n    </style>\n</head>\n<body>\n    <h1>Hello, World!</h1>\n</body>\n</html>`,
    css: `/* Modern Button Styles */\n.btn {\n    padding: 12px 24px;\n    border: none;\n    border-radius: 8px;\n    font-size: 16px;\n    cursor: pointer;\n    transition: all 0.3s ease;\n}\n\n.btn-primary {\n    background: linear-gradient(135deg, #667eea, #764ba2);\n    color: white;\n}\n\n.btn-primary:hover {\n    transform: translateY(-2px);\n    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);\n}`,
};


export const executeCode = async (language, sourceCode, stdin = "") => {
    const response = await axios.post(`${API_URL}/execute`, {
        language: language,
        version: LANGUAGE_VERSIONS[language],
        files: [
            {
                content: sourceCode,
            },
        ],
        stdin: stdin,
    });
    return response.data;
};
