"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthSession } from "@/app/components/AuthSessionProvider";
import { createBrowserClient } from "@/lib/supabase/client";
import { getFriendlyError } from "@/lib/supabase/errors";
import type { Database } from "@/lib/supabase/types";

type Mascota = Database["public"]["Tables"]["mascotas"]["Row"];
type Expediente = Database["public"]["Tables"]["expedientes"]["Row"];
type Producto = Database["public"]["Tables"]["inventario"]["Row"];

export default function ExpedientesPage() {
  const { authSession, loading } = useAuthSession();
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [mascotaSeleccionada, setMascotaSeleccionada] = useState("");
  const [expedienteSeleccionado, setExpedienteSeleccionado] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [cantidadUsada, setCantidadUsada] = useState("");
  const clinicId = authSession?.clinicId;

  const cargarDatosClinica = useCallback(async () => {
    if (!clinicId) {
      setMascotas([]);
      setProductos([]);
      return;
    }

    const supabase = createBrowserClient();
    const [mascotasResult, productosResult] = await Promise.all([
      supabase
        .from("mascotas")
        .select("*")
        .eq("id_clinica", clinicId)
        .order("nombre"),
      supabase
        .from("inventario")
        .select("*")
        .eq("id_clinica", clinicId)
        .order("nombre"),
    ]);

    if (mascotasResult.error || productosResult.error) {
      alert(
        getFriendlyError(
          mascotasResult.error ?? productosResult.error,
          "No fue posible cargar la información de la clínica."
        )
      );
      return;
    }

    setMascotas(mascotasResult.data);
    setProductos(productosResult.data);
    setMascotaSeleccionada((actual) =>
      mascotasResult.data.some(
        (mascota) => String(mascota.id_mascota) === actual
      )
        ? actual
        : String(mascotasResult.data[0]?.id_mascota ?? "")
    );
    setProductoSeleccionado((actual) =>
      productosResult.data.some(
        (producto) => String(producto.id_producto) === actual
      )
        ? actual
        : String(productosResult.data[0]?.id_producto ?? "")
    );
  }, [clinicId]);

  const cargarExpedientes = useCallback(async () => {
    if (!mascotaSeleccionada) {
      setExpedientes([]);
      setExpedienteSeleccionado("");
      return;
    }

    const supabase = createBrowserClient();
    const { data, error } = await supabase
      .from("expedientes")
      .select("*")
      .eq("id_mascota", Number(mascotaSeleccionada))
      .order("fecha_consulta", { ascending: false });

    if (error) {
      alert(getFriendlyError(error, "No fue posible cargar los expedientes."));
      return;
    }

    setExpedientes(data);
    setExpedienteSeleccionado((actual) =>
      data.some((expediente) => String(expediente.id_expediente) === actual)
        ? actual
        : String(data[0]?.id_expediente ?? "")
    );
  }, [mascotaSeleccionada]);

  useEffect(() => {
    const clinicTimer = window.setTimeout(() => {
      if (!loading) void cargarDatosClinica();
    }, 0);

    return () => window.clearTimeout(clinicTimer);
  }, [cargarDatosClinica, loading]);

  useEffect(() => {
    const recordsTimer = window.setTimeout(() => {
      void cargarExpedientes();
    }, 0);

    return () => window.clearTimeout(recordsTimer);
  }, [cargarExpedientes]);

  const registrarTratamiento = async () => {
    const cantidad = Number(cantidadUsada);

    if (
      !expedienteSeleccionado ||
      !productoSeleccionado ||
      !Number.isInteger(cantidad) ||
      cantidad <= 0
    ) {
      alert("Completa el expediente, producto y una cantidad válida.");
      return;
    }

    const producto = productos.find(
      (item) => item.id_producto === Number(productoSeleccionado)
    );

    if (!producto || cantidad > producto.cantidad) {
      alert("No hay suficiente stock.");
      return;
    }

    const supabase = createBrowserClient();
    const { error } = await supabase.rpc("registrar_tratamiento", {
      p_id_expediente: Number(expedienteSeleccionado),
      p_id_producto: Number(productoSeleccionado),
      p_cantidad_usada: cantidad,
    });

    if (error) {
      alert(
        getFriendlyError(error, "No fue posible registrar el tratamiento.")
      );
      return;
    }

    alert("Tratamiento registrado correctamente.");
    setCantidadUsada("");
    await cargarDatosClinica();
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f1f5f9",
        padding: "40px",
      }}
    >
      <h1
        style={{
          textAlign: "center",
          marginBottom: "30px",
          color: "#0f172a",
        }}
      >
        Expedientes
      </h1>

      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ marginBottom: "15px" }}>Consultar Expedientes</h2>

        <select
          value={mascotaSeleccionada}
          onChange={(e) => setMascotaSeleccionada(e.target.value)}
          style={{
            padding: "10px",
            marginRight: "10px",
            marginBottom: "10px",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        >
          <option value="">Selecciona una mascota</option>
          {mascotas.map((mascota) => (
            <option key={mascota.id_mascota} value={mascota.id_mascota}>
              {mascota.nombre}
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          marginBottom: "20px",
          overflowX: "auto",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#22c1dc", color: "white" }}>
              <th style={{ padding: "12px" }}>ID</th>
              <th style={{ padding: "12px" }}>Diagnóstico</th>
              <th style={{ padding: "12px" }}>Tratamiento</th>
              <th style={{ padding: "12px" }}>Fecha Consulta</th>
            </tr>
          </thead>
          <tbody>
            {expedientes.map((expediente) => (
              <tr key={expediente.id_expediente}>
                <td style={{ padding: "12px", textAlign: "center" }}>
                  {expediente.id_expediente}
                </td>
                <td style={{ padding: "12px", textAlign: "center" }}>
                  {expediente.diagnostico}
                </td>
                <td style={{ padding: "12px", textAlign: "center" }}>
                  {expediente.tratamiento ?? ""}
                </td>
                <td style={{ padding: "12px", textAlign: "center" }}>
                  {expediente.fecha_consulta}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ marginBottom: "15px" }}>Registrar Tratamiento</h2>

        <select
          value={expedienteSeleccionado}
          onChange={(e) => setExpedienteSeleccionado(e.target.value)}
          style={{
            padding: "10px",
            marginRight: "10px",
            marginBottom: "10px",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        >
          <option value="">Selecciona un expediente</option>
          {expedientes.map((expediente) => (
            <option
              key={expediente.id_expediente}
              value={expediente.id_expediente}
            >
              Expediente {expediente.id_expediente}
            </option>
          ))}
        </select>

        <select
          value={productoSeleccionado}
          onChange={(e) => setProductoSeleccionado(e.target.value)}
          style={{
            padding: "10px",
            marginRight: "10px",
            marginBottom: "10px",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        >
          <option value="">Selecciona un producto</option>
          {productos.map((producto) => (
            <option key={producto.id_producto} value={producto.id_producto}>
              {producto.nombre} ({producto.cantidad} disponibles)
            </option>
          ))}
        </select>

        <input
          type="number"
          min="1"
          placeholder="Cantidad utilizada"
          value={cantidadUsada}
          onChange={(e) => setCantidadUsada(e.target.value)}
          style={{
            padding: "10px",
            marginRight: "10px",
            marginBottom: "10px",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        />

        <button
          onClick={registrarTratamiento}
          style={{
            padding: "10px 20px",
            background: "#22c1dc",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Registrar Tratamiento
        </button>
      </div>
    </main>
  );
}
