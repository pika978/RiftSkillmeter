import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { LANGUAGE_VERSIONS } from "@/api/piston";

const languages = Object.entries(LANGUAGE_VERSIONS);

export function LanguageSelector({ language, onSelect }) {
    return (
        <div className="flex items-center gap-3 mb-4">
            <label className="text-sm font-medium">Language:</label>
            <Select value={language} onValueChange={onSelect}>
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent>
                    {languages.map(([lang, version]) => (
                        <SelectItem key={lang} value={lang}>
                            <span className="capitalize">{lang}</span>
                            {version && (
                                <span className="ml-2 text-xs text-muted-foreground">
                                    ({version})
                                </span>
                            )}
                            {version === null && (
                                <span className="ml-2 text-xs text-blue-500">
                                    (Preview)
                                </span>
                            )}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
