import React, { useState, useCallback } from "react";
import Toast from "./Toast";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastMessage {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContainerProps {
    children: React.ReactNode;
}

export const ToastContext = React.createContext<{
    showToast: (message: string, type: ToastType) => void;
}>({
    showToast: () => { },
});

export const useToast = () => {
    const context = React.useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastContainer");
    }
    return context;
};

const ToastContainer: React.FC<ToastContainerProps> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const showToast = useCallback((message: string, type: ToastType) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 space-y-2">
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export default ToastContainer; 