import { Annotation } from "../types";

export function exportAnnotations(annotations: Annotation[], type: "json" | "csv"): void {
    let data = "";
    let mimeType = "";
    let extension = "";

    if (type === "json") {
        data = JSON.stringify(annotations, null, 2);
        mimeType = "application/json";
        extension = "json";
    } else {
        const headers = ["id", "timestamp", "text", "author", "drawing"];
        const rows = annotations.map((a) => [
            a.id,
            a.timestamp,
            a.text,
            a.author || "",
            a.drawing || "",
        ]);
        data = [headers, ...rows].map((row) => row.join(",")).join("\n");
        mimeType = "text/csv";
        extension = "csv";
    }

    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `annotations.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function importAnnotations(file: File): Promise<Annotation[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                if (file.name.endsWith(".json")) {
                    resolve(JSON.parse(content));
                } else if (file.name.endsWith(".csv")) {
                    const rows = content.split("\n").map((row) => row.split(","));
                    const headers = rows[0];
                    const annotations = rows.slice(1).map((row) => {
                        const annotation: any = {};
                        headers.forEach((header, i) => {
                            annotation[header] = row[i];
                        });
                        return annotation as Annotation;
                    });
                    resolve(annotations);
                } else {
                    reject(new Error("Unsupported file format"));
                }
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsText(file);
    });
} 