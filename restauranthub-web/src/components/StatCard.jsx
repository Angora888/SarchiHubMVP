import { useNavigate } from "react-router-dom";

function StatCard({ titulo, valor, icono, color, ruta }) {
    const navigate = useNavigate();

    return (
        <div className="col-12 col-sm-6 col-xl-3 mb-3">
            <button
                type="button"
                className="stat-card w-100 text-start"
                onClick={() => ruta && navigate(ruta)}
                disabled={!ruta}
            >
                <div className="stat-card-content">
                    <div className="stat-card-copy">
                        <div className="stat-card-title">
                            {titulo}
                        </div>

                        {valor !== undefined && valor !== null && (
                            <div className="stat-card-value">
                                {valor}
                            </div>
                        )}

                        <div className="stat-card-link">
                            Abrir
                            <i className="bi bi-arrow-right-short"></i>
                        </div>
                    </div>

                    <div className={`stat-card-icon ${color || "bg-light text-dark"}`}>
                        <i className={icono}></i>
                    </div>
                </div>
            </button>
        </div>
    );
}

export default StatCard;
