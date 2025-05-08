import React from "react";
import { importAnnotations } from "../utils/export";
import { Annotation } from "../types";

interface ImportButtonProps {
    onImport: (annotations: Annotation[]) => void;
}

const ImportButton: React.FC<ImportButtonProps> = ({ onImport }) => {
    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const annotations = await importAnnotations(file);
            onImport(annotations);
        } catch (error) {
            console.error("Error importing annotations:", error);
            alert("Failed to import annotations. Please check the file format.");
        }
    };

    return (
        <div className="flex items-center">
            <input
                type="file"
                accept=".json,.csv"
                onChange={handleImport}
                className="hidden"
                id="import-input"
            />
            <label
                htmlFor="import-input"
                className="btn-secondary cursor-pointer"
            >
                Import Annotations
            </label>
        </div>
    );
};

export default ImportButton; 