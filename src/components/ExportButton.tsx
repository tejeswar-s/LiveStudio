import React from "react";
import { exportAnnotations } from "../utils/export";
import { Annotation } from "../types";

interface ExportButtonProps {
    annotations: Annotation[];
}

const ExportButton: React.FC<ExportButtonProps> = ({ annotations }) => {
    const handleExport = (type: "json" | "csv") => {
        exportAnnotations(annotations, type);
    };

    return (
        <div className="flex gap-2">
            <button
                onClick={() => handleExport("json")}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                Export JSON
            </button>
            <button
                onClick={() => handleExport("csv")}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
                Export CSV
            </button>
        </div>
    );
};

export default ExportButton; 