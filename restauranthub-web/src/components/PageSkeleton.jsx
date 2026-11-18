import { useEffect, useState } from "react";
import "./PageSkeleton.css";

/**
 * Reusable loading placeholder for all restaurant screens.
 * Variants preserve the shape of the content users are waiting for.
 */
export default function PageSkeleton({ variant = "cards", publicPage = false }) {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const timeout = setTimeout(() => setVisible(true), 220);
        return () => clearTimeout(timeout);
    }, []);
    if (!visible) return null;

    const table = variant === "table";
    const dashboard = variant === "dashboard";
    return (
        <div className={`sf-skeleton-page ${publicPage ? "sf-skeleton-public" : ""}`}
             role="status" aria-live="polite" aria-label="Cargando contenido">
            <span className="visually-hidden">Cargando contenido...</span>
            <div className="sf-skeleton sf-skeleton-heading" />
            <div className="sf-skeleton sf-skeleton-subheading" />
            <div className="sf-skeleton sf-skeleton-toolbar" />
            {dashboard && <div className="sf-skeleton-stats">
                {Array.from({ length: 4 }, (_, i) => <div className="sf-skeleton sf-skeleton-stat" key={i} />)}
            </div>}
            {table ? (
                <div className="sf-skeleton-table">
                    <div className="sf-skeleton sf-skeleton-table-head" />
                    {Array.from({ length: 6 }, (_, i) => <div className="sf-skeleton sf-skeleton-table-row" key={i} />)}
                </div>
            ) : (
                <div className="sf-skeleton-grid">
                    {Array.from({ length: dashboard ? 3 : 6 }, (_, i) => (
                        <div className="sf-skeleton-card" key={i}>
                            <div className="sf-skeleton sf-skeleton-image" />
                            <div className="sf-skeleton sf-skeleton-line" />
                            <div className="sf-skeleton sf-skeleton-line short" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
