import React, { useEffect } from "react";

interface ToastProps {
    message: string;
    type?: "success" | "error" | "info" | "warning";
    duration?: number;
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({
    message,
    type = "info",
    duration = 3000,
    onClose,
}) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const bgColor = {
        success: "bg-green-500",
        error: "bg-red-500",
        info: "bg-blue-500",
        warning: "bg-yellow-500",
    };

    return (
        <div
            className={`fixed bottom-4 right-4 ${bgColor[type]} text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out`}
            role="alert"
        >
            <div className="flex items-center">
                <span>{message}</span>
                <button
                    onClick={onClose}
                    className="ml-4 text-white hover:text-gray-200 focus:outline-none"
                >
                    ×
                </button>
            </div>
        </div>
    );
};

export default Toast; 