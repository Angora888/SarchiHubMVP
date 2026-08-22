import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import api from "../services/api";

import AppToast from "../components/AppToast";
import useToast from "../hooks/useToast";

function Reportes() {

    const navigate = useNavigate();

    const {
        toast,
        showToast,
        hideToast
    } = useToast();

    // ==========================================
    // MODO REPORTE
    // ==========================================

    const [modo, setModo] =
        useState("diario");

    // ==========================================
    // FECHA DIARIA
    // ==========================================

    const obtenerFechaHoy = () => {

        const hoy = new Date();

        const year =
            hoy.getFullYear();

        const month =
            String(
                hoy.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                hoy.getDate()
            ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    const [fecha, setFecha] =
        useState(
            obtenerFechaHoy()
        );

    // ==========================================
    // MES
    // ==========================================

    const obtenerMesActual = () => {

        const hoy =
            new Date();

        const year =
            hoy.getFullYear();

        const month =
            String(
                hoy.getMonth() + 1
            ).padStart(2, "0");

        return `${year}-${month}`;
    };

    const [mesSeleccionado, setMesSeleccionado] =
        useState(
            obtenerMesActual()
        );

    // ==========================================
    // ESTADOS
    // ==========================================

    const [reporte, setReporte] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    // ==========================================
    // CARGAR REPORTE
    // ==========================================

    useEffect(() => {

        cargarReporte();

    }, [
        fecha,
        mesSeleccionado,
        modo
    ]);

    const cargarReporte = async () => {

        try {

            setLoading(true);

            let respuesta;

            if (modo === "diario") {

                respuesta =
                    await api.get(
                        `/Pedidos/reporte-diario?fecha=${fecha}`
                    );

            }
            else {

                const [
                    anio,
                    mes
                ] =
                    mesSeleccionado
                        .split("-");

                respuesta =
                    await api.get(
                        `/Pedidos/reporte-mensual?anio=${anio}&mes=${mes}`
                    );
            }

            setReporte(
                respuesta.data
            );

        }
        catch (error) {

            console.error(
                error
            );

            showToast(
                error.response?.data ||
                "No fue posible cargar el reporte.",
                "error"
            );

            setReporte(null);
        }
        finally {

            setLoading(false);
        }
    };

    // ==========================================
    // FORMATO MONEDA
    // ==========================================

    const formatoMoneda = (
        valor
    ) => {

        return `₡ ${Number(
            valor ?? 0
        ).toLocaleString(
            "es-CR"
        )}`;
    };

    // ==========================================
    // FORMATO FECHA
    // ==========================================

    const formatoFecha = (
        fechaValor
    ) => {

        if (!fechaValor)
            return "";

        const fechaDate =
            new Date(fechaValor);

        return fechaDate
            .toLocaleDateString(
                "es-CR",
                {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                }
            );
    };

    // ==========================================
    // FORMATO HORA
    // ==========================================

    const formatoHora = (
        fechaUtc
    ) => {

        if (!fechaUtc)
            return "";

        const fechaDate =
            new Date(fechaUtc);

        return fechaDate
            .toLocaleTimeString(
                "es-CR",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );
    };

    // ==========================================
    // TIPO DE PEDIDO
    // ==========================================

    const mostrarTipoPedido = (
        pedido
    ) => {

        if (
            pedido.tipoPedido === "Mesa"
        ) {

            return (
                <span className="badge bg-primary">
                    🪑 Mesa #{pedido.mesa}
                </span>
            );
        }

        if (
            pedido.tipoPedido === "Xpress"
        ) {

            return (
                <span className="badge bg-success">
                    🛵 Xpress
                </span>
            );
        }

        if (
            pedido.tipoPedido === "Llevar"
        ) {

            return (
                <span className="badge bg-warning text-dark">
                    🥡 Pasa a llevar
                </span>
            );
        }

        return (
            <span className="badge bg-secondary">
                {pedido.tipoPedido}
            </span>
        );
    };

    // ==========================================
    // NOMBRE DEL MES
    // ==========================================

    const obtenerNombreMes = () => {

        const [
            anio,
            mes
        ] =
            mesSeleccionado
                .split("-");

        const fechaMes =
            new Date(
                Number(anio),
                Number(mes) - 1,
                1
            );

        return fechaMes
            .toLocaleDateString(
                "es-CR",
                {
                    month: "long",
                    year: "numeric"
                }
            );
    };

    // ==========================================
    // PDF
    // ==========================================

    const generarPDF = () => {

        if (!reporte) {

            showToast(
                "No hay información para generar el reporte.",
                "error"
            );

            return;
        }

        if (modo === "mensual") {

            generarPDFMensual();

            return;
        }

        generarPDFDiario();
    };

    // ==========================================
    // PDF DIARIO
    // ==========================================

    const generarPDFDiario = () => {

        const doc =
            new jsPDF();

        const moneda =
            valor =>
                `CRC ${Number(
                    valor ?? 0
                ).toLocaleString(
                    "es-CR"
                )}`;

        doc.setFontSize(20);

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.text(
            "Reporte Diario de Ventas",
            14,
            20
        );

        doc.setFontSize(11);

        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.text(
            `Fecha: ${fecha}`,
            14,
            28
        );

        doc.line(
            14,
            33,
            196,
            33
        );

        autoTable(doc, {

            startY: 40,

            head: [[
                "Ventas",
                "Pedidos",
                "Ticket promedio"
            ]],

            body: [[

                moneda(
                    reporte.totalVentas
                ),

                reporte.cantidadPedidos,

                moneda(
                    Math.round(
                        reporte.ticketPromedio
                    )
                )

            ]],

            theme: "grid"
        });

        autoTable(doc, {

            startY:
                doc.lastAutoTable.finalY + 10,

            head: [[
                "Tipo",
                "Pedidos",
                "Participacion",
                "Total"
            ]],

            body: [

                [
                    "Mesa",
                    reporte
                        .tiposPedido
                        ?.mesa
                        ?.cantidad ?? 0,

                    `${
                        reporte
                            .tiposPedido
                            ?.mesa
                            ?.porcentaje ?? 0
                    }%`,

                    moneda(
                        reporte
                            .tiposPedido
                            ?.mesa
                            ?.total
                    )
                ],

                [
                    "Xpress",
                    reporte
                        .tiposPedido
                        ?.xpress
                        ?.cantidad ?? 0,

                    `${
                        reporte
                            .tiposPedido
                            ?.xpress
                            ?.porcentaje ?? 0
                    }%`,

                    moneda(
                        reporte
                            .tiposPedido
                            ?.xpress
                            ?.total
                    )
                ],

                [
                    "Pasa a llevar",
                    reporte
                        .tiposPedido
                        ?.llevar
                        ?.cantidad ?? 0,

                    `${
                        reporte
                            .tiposPedido
                            ?.llevar
                            ?.porcentaje ?? 0
                    }%`,

                    moneda(
                        reporte
                            .tiposPedido
                            ?.llevar
                            ?.total
                    )
                ]
            ]
        });

        doc.save(
            `Reporte-Ventas-${fecha}.pdf`
        );
    };

    // ==========================================
    // PDF MENSUAL
    // ==========================================

    const generarPDFMensual = () => {

    if (!reporte) {
        showToast(
            "No hay información para generar el reporte.",
            "error"
        );
        return;
    }

    const doc = new jsPDF();

    const moneda = (valor) =>
        `CRC ${Number(
            valor ?? 0
        ).toLocaleString(
            "es-CR"
        )}`;

    // ==========================================
    // TÍTULO
    // ==========================================

    doc.setFontSize(20);

    doc.setFont(
        "helvetica",
        "bold"
    );

    doc.text(
        "Reporte Mensual de Ventas",
        14,
        20
    );

    doc.setFontSize(11);

    doc.setFont(
        "helvetica",
        "normal"
    );

    doc.text(
        `Periodo: ${obtenerNombreMes()}`,
        14,
        28
    );

    doc.setDrawColor(200);

    doc.line(
        14,
        33,
        196,
        33
    );

    // ==========================================
    // RESUMEN GENERAL
    // ==========================================

    doc.setFontSize(14);

    doc.setFont(
        "helvetica",
        "bold"
    );

    doc.text(
        "Resumen General",
        14,
        43
    );

    autoTable(doc, {

        startY: 48,

        head: [[
            "Ventas del mes",
            "Pedidos",
            "Ticket promedio"
        ]],

        body: [[

            moneda(
                reporte.totalVentas
            ),

            reporte.cantidadPedidos,

            moneda(
                Math.round(
                    reporte.ticketPromedio
                )
            )
        ]],

        theme: "grid",

        styles: {
            halign: "center"
        },

        headStyles: {
            fontStyle: "bold"
        }
    });

    // ==========================================
    // LECTURA RÁPIDA
    // ==========================================

    let posicionY =
        doc.lastAutoTable.finalY + 12;

    doc.setFontSize(14);

    doc.setFont(
        "helvetica",
        "bold"
    );

    doc.text(
        "Lectura rapida del mes",
        14,
        posicionY
    );

    doc.setFontSize(10);

    doc.setFont(
        "helvetica",
        "normal"
    );

    posicionY += 7;

    const lineasLectura = [
        `Se realizaron ${reporte.cantidadPedidos} pedidos por un total de ${moneda(reporte.totalVentas)}.`,

        `El ticket promedio fue de ${moneda(
            Math.round(
                reporte.ticketPromedio
            )
        )}.`
    ];

    if (reporte.mejorDia) {

        lineasLectura.push(
            `El mejor dia fue ${formatoFecha(
                reporte.mejorDia.fecha
            )} con ${moneda(
                reporte.mejorDia.total
            )}.`
        );
    }

    if (
        reporte.productos &&
        reporte.productos.length > 0
    ) {

        lineasLectura.push(
            `El producto mas vendido fue ${reporte.productos[0].nombre} con ${reporte.productos[0].unidades} unidades.`
        );
    }

    if (
        reporte.clientes
    ) {

        lineasLectura.push(
            `Se registraron ${reporte.clientes.unicos ?? 0} clientes unicos y ${reporte.clientes.recurrentes ?? 0} clientes recurrentes.`
        );
    }

    lineasLectura.forEach(
        texto => {

            const lineas =
                doc.splitTextToSize(
                    `- ${texto}`,
                    175
                );

            doc.text(
                lineas,
                14,
                posicionY
            );

            posicionY +=
                lineas.length * 5;
        }
    );

    // ==========================================
    // VENTAS POR TIPO DE PEDIDO
    // ==========================================

    posicionY += 5;

    doc.setFontSize(14);

    doc.setFont(
        "helvetica",
        "bold"
    );

    doc.text(
        "Ventas por tipo de pedido",
        14,
        posicionY
    );

    autoTable(doc, {

        startY:
            posicionY + 5,

        head: [[
            "Tipo",
            "Pedidos",
            "Participacion",
            "Total"
        ]],

        body: [

            [
                "Mesa",

                reporte
                    .tiposPedido
                    ?.mesa
                    ?.cantidad ?? 0,

                `${
                    reporte
                        .tiposPedido
                        ?.mesa
                        ?.porcentaje ?? 0
                }%`,

                moneda(
                    reporte
                        .tiposPedido
                        ?.mesa
                        ?.total
                )
            ],

            [
                "Xpress",

                reporte
                    .tiposPedido
                    ?.xpress
                    ?.cantidad ?? 0,

                `${
                    reporte
                        .tiposPedido
                        ?.xpress
                        ?.porcentaje ?? 0
                }%`,

                moneda(
                    reporte
                        .tiposPedido
                        ?.xpress
                        ?.total
                )
            ],

            [
                "Pasa a llevar",

                reporte
                    .tiposPedido
                    ?.llevar
                    ?.cantidad ?? 0,

                `${
                    reporte
                        .tiposPedido
                        ?.llevar
                        ?.porcentaje ?? 0
                }%`,

                moneda(
                    reporte
                        .tiposPedido
                        ?.llevar
                        ?.total
                )
            ]
        ],

        theme: "striped"
    });

    // ==========================================
    // MEJOR DÍA
    // ==========================================

    posicionY =
        doc.lastAutoTable.finalY + 12;

    doc.setFontSize(14);

    doc.setFont(
        "helvetica",
        "bold"
    );

    doc.text(
        "Mejor dia del mes",
        14,
        posicionY
    );

    if (
        reporte.mejorDia
    ) {

        autoTable(doc, {

            startY:
                posicionY + 5,

            head: [[
                "Fecha",
                "Pedidos",
                "Ventas"
            ]],

            body: [[

                formatoFecha(
                    reporte.mejorDia.fecha
                ),

                reporte.mejorDia.pedidos,

                moneda(
                    reporte.mejorDia.total
                )
            ]],

            theme: "grid"
        });
    }

    // ==========================================
    // CLIENTES
    // ==========================================

    posicionY =
        doc.lastAutoTable.finalY + 12;

    doc.setFontSize(14);

    doc.setFont(
        "helvetica",
        "bold"
    );

    doc.text(
        "Clientes",
        14,
        posicionY
    );

    autoTable(doc, {

        startY:
            posicionY + 5,

        head: [[
            "Clientes unicos",
            "Clientes recurrentes"
        ]],

        body: [[

            reporte
                .clientes
                ?.unicos ?? 0,

            reporte
                .clientes
                ?.recurrentes ?? 0
        ]],

        theme: "grid",

        styles: {
            halign: "center"
        }
    });

    // ==========================================
    // TOP 3 PRODUCTOS
    // ==========================================

    posicionY =
        doc.lastAutoTable.finalY + 12;

    doc.setFontSize(14);

    doc.setFont(
        "helvetica",
        "bold"
    );

    doc.text(
        "Top 3 productos mas vendidos",
        14,
        posicionY
    );

    const top3 =
        reporte.productos
            ?.slice(0, 3)
            ?? [];

    const filasProductos =
        top3.map(
            (producto, index) => [

                `#${index + 1}`,

                producto.nombre,

                producto.unidades,

                moneda(
                    producto.monto
                )
            ]
        );

    autoTable(doc, {

        startY:
            posicionY + 5,

        head: [[
            "Posicion",
            "Producto",
            "Unidades",
            "Monto"
        ]],

        body:
            filasProductos,

        theme: "striped",

        styles: {
            fontSize: 9
        },

        columnStyles: {

            0: {
                halign: "center"
            },

            2: {
                halign: "center"
            },

            3: {
                halign: "right"
            }
        }
    });

    // ==========================================
    // VENTAS POR DÍA
    // ==========================================

    posicionY =
        doc.lastAutoTable.finalY + 12;

    doc.setFontSize(14);

    doc.setFont(
        "helvetica",
        "bold"
    );

    doc.text(
        "Ventas por dia",
        14,
        posicionY
    );

    const filasDias =
        reporte
            .ventasPorDia
            ?.map(
                dia => [

                    formatoFecha(
                        dia.fecha
                    ),

                    dia.pedidos,

                    moneda(
                        dia.total
                    )
                ]
            )
            ?? [];

    autoTable(doc, {

        startY:
            posicionY + 5,

        head: [[
            "Fecha",
            "Pedidos",
            "Ventas"
        ]],

        body:
            filasDias,

        theme: "striped",

        styles: {
            fontSize: 9
        },

        columnStyles: {

            1: {
                halign: "center"
            },

            2: {
                halign: "right"
            }
        }
    });

    // ==========================================
    // PIE DE PÁGINA
    // ==========================================

    const cantidadPaginas =
        doc.getNumberOfPages();

    for (
        let pagina = 1;
        pagina <= cantidadPaginas;
        pagina++
    ) {

        doc.setPage(
            pagina
        );

        doc.setFontSize(8);

        doc.setTextColor(120);

        doc.text(
            `Sin Filas - Reporte mensual | Pagina ${pagina} de ${cantidadPaginas}`,
            105,
            290,
            {
                align: "center"
            }
        );
    }

    // ==========================================
    // GUARDAR
    // ==========================================

    doc.save(
        `Reporte-Mensual-${mesSeleccionado}.pdf`
    );
};

    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {

        return (

            <div className="container py-5 text-center">

                <div className="spinner-border text-success"></div>

                <h4 className="mt-3">
                    Cargando reporte...
                </h4>

            </div>
        );
    }

    return (

        <div className="container py-4">

            {/* ====================================== */}
            {/* HEADER */}
            {/* ====================================== */}

            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">

                <div>

                    <h2 className="fw-bold mb-1">
                        📊 Reportes
                    </h2>

                    <p className="text-muted mb-0">

                        {modo === "diario"
                            ? "Resumen diario de ventas"
                            : "Resumen mensual del negocio"
                        }

                    </p>

                </div>

                <div className="d-flex gap-2">

                    <button
                        type="button"
                        className="btn btn-success"
                        onClick={generarPDF}
                        disabled={
                            !reporte ||
                            reporte.cantidadPedidos === 0
                        }
                    >
                        📄 Generar PDF
                    </button>

                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() =>
                            navigate("/dashboard")
                        }
                    >
                        ← Dashboard
                    </button>

                </div>

            </div>

            {/* ====================================== */}
            {/* DIARIO / MENSUAL */}
            {/* ====================================== */}

            <div className="btn-group mb-4">

                <button
                    type="button"
                    className={
                        modo === "diario"
                            ? "btn btn-success"
                            : "btn btn-outline-success"
                    }
                    onClick={() =>
                        setModo("diario")
                    }
                >
                    📅 Diario
                </button>

                <button
                    type="button"
                    className={
                        modo === "mensual"
                            ? "btn btn-success"
                            : "btn btn-outline-success"
                    }
                    onClick={() =>
                        setModo("mensual")
                    }
                >
                    📊 Mensual
                </button>

            </div>

            {/* ====================================== */}
            {/* FILTRO */}
            {/* ====================================== */}

            <div className="card shadow-sm border-0 rounded-4 mb-4">

                <div className="card-body">

                    <div className="row align-items-end">

                        <div className="col-md-5">

                            {modo === "diario" ? (

                                <>

                                    <label className="form-label fw-semibold">
                                        📅 Fecha del reporte
                                    </label>

                                    <input
                                        type="date"
                                        className="form-control"
                                        value={fecha}
                                        onChange={
                                            e =>
                                                setFecha(
                                                    e.target.value
                                                )
                                        }
                                    />

                                </>

                            ) : (

                                <>

                                    <label className="form-label fw-semibold">
                                        📅 Mes del reporte
                                    </label>

                                    <input
                                        type="month"
                                        className="form-control"
                                        value={mesSeleccionado}
                                        onChange={
                                            e =>
                                                setMesSeleccionado(
                                                    e.target.value
                                                )
                                        }
                                    />

                                </>

                            )}

                        </div>

                    </div>

                </div>

            </div>

            {!reporte ? (

                <div className="alert alert-warning text-center">
                    No fue posible cargar información.
                </div>

            ) : (

                <>

                    {/* ====================================== */}
                    {/* RESUMEN */}
                    {/* ====================================== */}

                    <div className="row g-3 mb-4">

                        <div className="col-md-4">

                            <div className="card shadow border-0 rounded-4 h-100">

                                <div className="card-body text-center py-4">

                                    <div className="text-muted mb-2">
                                        💰 Ventas
                                    </div>

                                    <h2 className="fw-bold text-success mb-0">

                                        {formatoMoneda(
                                            reporte.totalVentas
                                        )}

                                    </h2>

                                </div>

                            </div>

                        </div>

                        <div className="col-md-4">

                            <div className="card shadow border-0 rounded-4 h-100">

                                <div className="card-body text-center py-4">

                                    <div className="text-muted mb-2">
                                        🧾 Pedidos
                                    </div>

                                    <h2 className="fw-bold mb-0">
                                        {reporte.cantidadPedidos}
                                    </h2>

                                </div>

                            </div>

                        </div>

                        <div className="col-md-4">

                            <div className="card shadow border-0 rounded-4 h-100">

                                <div className="card-body text-center py-4">

                                    <div className="text-muted mb-2">
                                        🎟 Ticket promedio
                                    </div>

                                    <h2 className="fw-bold mb-0">

                                        {formatoMoneda(
                                            Math.round(
                                                reporte.ticketPromedio
                                            )
                                        )}

                                    </h2>

                                </div>

                            </div>

                        </div>

                    </div>

                    {/* ====================================== */}
                    {/* LECTURA RÁPIDA MENSUAL */}
                    {/* ====================================== */}

                    {modo === "mensual" && (

                        <div className="card shadow-sm border-0 rounded-4 mb-4">

                            <div className="card-body">

                                <h4 className="fw-bold">
                                    💡 Lectura rápida del mes
                                </h4>

                                <ul className="mb-0">

                                    <li>
                                        Se realizaron{" "}
                                        <strong>
                                            {reporte.cantidadPedidos} pedidos
                                        </strong>{" "}
                                        por un total de{" "}
                                        <strong>
                                            {formatoMoneda(
                                                reporte.totalVentas
                                            )}
                                        </strong>.
                                    </li>

                                    <li>

                                        El ticket promedio fue de{" "}

                                        <strong>
                                            {formatoMoneda(
                                                Math.round(
                                                    reporte.ticketPromedio
                                                )
                                            )}
                                        </strong>.

                                    </li>

                                    {reporte.mejorDia && (

                                        <li>

                                            El mejor día fue{" "}

                                            <strong>
                                                {formatoFecha(
                                                    reporte.mejorDia.fecha
                                                )}
                                            </strong>{" "}

                                            con{" "}

                                            <strong>
                                                {formatoMoneda(
                                                    reporte.mejorDia.total
                                                )}
                                            </strong>.

                                        </li>

                                    )}

                                    {reporte.productos?.length > 0 && (

                                        <li>

                                            El producto más vendido fue{" "}

                                            <strong>
                                                {
                                                    reporte.productos[0]
                                                        .nombre
                                                }
                                            </strong>{" "}

                                            con{" "}

                                            <strong>
                                                {
                                                    reporte.productos[0]
                                                        .unidades
                                                } unidades
                                            </strong>.

                                        </li>

                                    )}

                                    <li>

                                        <strong>
                                            {
                                                reporte
                                                    .clientes
                                                    ?.recurrentes ?? 0
                                            }
                                        </strong>{" "}

                                        clientes compraron más de una vez durante el mes.

                                    </li>

                                </ul>

                            </div>

                        </div>

                    )}

                    {/* ====================================== */}
                    {/* TIPOS DE PEDIDO */}
                    {/* ====================================== */}

                    <div className="card shadow border-0 rounded-4 mb-4">

                        <div className="card-header bg-dark text-white">

                            <h5 className="mb-0">
                                📊 Ventas por tipo de pedido
                            </h5>

                        </div>

                        <div className="card-body">

                            <div className="row g-3">

                                {[
                                    {
                                        nombre: "Mesa",
                                        icono: "🪑",
                                        datos:
                                            reporte
                                                .tiposPedido
                                                ?.mesa
                                    },

                                    {
                                        nombre: "Xpress",
                                        icono: "🛵",
                                        datos:
                                            reporte
                                                .tiposPedido
                                                ?.xpress
                                    },

                                    {
                                        nombre: "Pasa a llevar",
                                        icono: "🥡",
                                        datos:
                                            reporte
                                                .tiposPedido
                                                ?.llevar
                                    }

                                ].map(
                                    tipo => (

                                        <div
                                            className="col-md-4"
                                            key={tipo.nombre}
                                        >

                                            <div className="border rounded-4 p-4 h-100">

                                                <h5>
                                                    {tipo.icono} {tipo.nombre}
                                                </h5>

                                                <div className="text-muted">
                                                    Pedidos
                                                </div>

                                                <h3>
                                                    {
                                                        tipo
                                                            .datos
                                                            ?.cantidad ?? 0
                                                    }
                                                </h3>

                                                <div className="text-muted">
                                                    Participación
                                                </div>

                                                <div className="fw-semibold mb-3">

                                                    {
                                                        tipo
                                                            .datos
                                                            ?.porcentaje ?? 0
                                                    }%

                                                </div>

                                                <div className="text-muted">
                                                    Total
                                                </div>

                                                <h4 className="text-success">

                                                    {formatoMoneda(
                                                        tipo
                                                            .datos
                                                            ?.total
                                                    )}

                                                </h4>

                                            </div>

                                        </div>

                                    )
                                )}

                            </div>

                        </div>

                    </div>

                    {/* ====================================== */}
                    {/* SOLO MENSUAL */}
                    {/* ====================================== */}

                    {modo === "mensual" && (

                        <>

                            {/* CLIENTES */}

                            <div className="row g-3 mb-4">

                                <div className="col-md-6">

                                    <div className="card shadow border-0 rounded-4 h-100">

                                        <div className="card-body text-center">

                                            <div className="text-muted">
                                                👥 Clientes únicos
                                            </div>

                                            <h2 className="fw-bold">
                                                {
                                                    reporte
                                                        .clientes
                                                        ?.unicos ?? 0
                                                }
                                            </h2>

                                        </div>

                                    </div>

                                </div>

                                <div className="col-md-6">

                                    <div className="card shadow border-0 rounded-4 h-100">

                                        <div className="card-body text-center">

                                            <div className="text-muted">
                                                💚 Clientes recurrentes
                                            </div>

                                            <h2 className="fw-bold text-success">
                                                {
                                                    reporte
                                                        .clientes
                                                        ?.recurrentes ?? 0
                                                }
                                            </h2>

                                        </div>

                                    </div>

                                </div>

                            </div>

                            {/* TOP PRODUCTOS */}

                            <div className="card shadow border-0 rounded-4 mb-4">

                                <div className="card-header bg-dark text-white">

                                    <h5 className="mb-0">
                                        🏆 Productos más vendidos
                                    </h5>

                                </div>

                                <div className="table-responsive">

                                    <table className="table mb-0 align-middle">

                                        <thead>

                                            <tr>

                                                <th>
                                                    Producto
                                                </th>

                                                <th className="text-center">
                                                    Unidades
                                                </th>

                                                <th className="text-end">
                                                    Ventas
                                                </th>

                                            </tr>

                                        </thead>

                                        <tbody>

                                            {reporte.productos
                                                ?.map(
                                                    producto => (

                                                        <tr
                                                            key={
                                                                producto.productoId
                                                            }
                                                        >

                                                            <td className="fw-semibold">
                                                                {producto.nombre}
                                                            </td>

                                                            <td className="text-center">

                                                                <span className="badge bg-secondary">
                                                                    {
                                                                        producto.unidades
                                                                    }
                                                                </span>

                                                            </td>

                                                            <td className="text-end text-success fw-bold">

                                                                {formatoMoneda(
                                                                    producto.monto
                                                                )}

                                                            </td>

                                                        </tr>

                                                    )
                                                )}

                                        </tbody>

                                    </table>

                                </div>

                            </div>

                            {/* VENTAS POR DÍA */}

                            <div className="card shadow border-0 rounded-4 mb-4">

                                <div className="card-header bg-dark text-white">

                                    <h5 className="mb-0">
                                        📅 Ventas por día
                                    </h5>

                                </div>

                                <div className="table-responsive">

                                    <table className="table table-striped mb-0">

                                        <thead>

                                            <tr>

                                                <th>
                                                    Fecha
                                                </th>

                                                <th className="text-center">
                                                    Pedidos
                                                </th>

                                                <th className="text-end">
                                                    Ventas
                                                </th>

                                            </tr>

                                        </thead>

                                        <tbody>

                                            {reporte
                                                .ventasPorDia
                                                ?.map(
                                                    dia => (

                                                        <tr
                                                            key={
                                                                dia.fecha
                                                            }
                                                        >

                                                            <td>
                                                                {
                                                                    formatoFecha(
                                                                        dia.fecha
                                                                    )
                                                                }
                                                            </td>

                                                            <td className="text-center">
                                                                {dia.pedidos}
                                                            </td>

                                                            <td className="text-end fw-bold">
                                                                {
                                                                    formatoMoneda(
                                                                        dia.total
                                                                    )
                                                                }
                                                            </td>

                                                        </tr>

                                                    )
                                                )}

                                        </tbody>

                                    </table>

                                </div>

                            </div>

                        </>

                    )}

                    {/* ====================================== */}
                    {/* DETALLE DIARIO */}
                    {/* ====================================== */}

                    {modo === "diario" && (

                        <>

                            <div className="card shadow border-0 rounded-4 mb-4">

                                <div className="card-header bg-dark text-white">

                                    <h5 className="mb-0">
                                        📋 Detalle de pedidos
                                    </h5>

                                </div>

                                <div className="table-responsive">

                                    <table className="table table-striped mb-0">

                                        <thead>

                                            <tr>

                                                <th>
                                                    Pedido
                                                </th>

                                                <th>
                                                    Hora
                                                </th>

                                                <th>
                                                    Tipo
                                                </th>

                                                <th className="text-center">
                                                    Productos
                                                </th>

                                                <th className="text-center">
                                                    Extras
                                                </th>

                                                <th className="text-end">
                                                    Total
                                                </th>

                                            </tr>

                                        </thead>

                                        <tbody>

                                            {reporte.pedidos
                                                ?.map(
                                                    pedido => (

                                                        <tr
                                                            key={
                                                                pedido.id
                                                            }
                                                        >

                                                            <td className="fw-bold">

                                                                #{pedido.numeroPedido
                                                                    .toString()
                                                                    .padStart(
                                                                        3,
                                                                        "0"
                                                                    )}

                                                            </td>

                                                            <td>
                                                                {
                                                                    formatoHora(
                                                                        pedido.fecha
                                                                    )
                                                                }
                                                            </td>

                                                            <td>
                                                                {
                                                                    mostrarTipoPedido(
                                                                        pedido
                                                                    )
                                                                }
                                                            </td>

                                                            <td className="text-center">
                                                                {
                                                                    pedido.cantidadProductos
                                                                }
                                                            </td>

                                                            <td className="text-center">
                                                                {
                                                                    pedido.cantidadExtras
                                                                }
                                                            </td>

                                                            <td className="text-end fw-bold">
                                                                {
                                                                    formatoMoneda(
                                                                        pedido.total
                                                                    )
                                                                }
                                                            </td>

                                                        </tr>

                                                    )
                                                )}

                                        </tbody>

                                    </table>

                                </div>

                            </div>

                        </>

                    )}

                </>

            )}

            <AppToast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={hideToast}
            />

        </div>
    );
}

export default Reportes;