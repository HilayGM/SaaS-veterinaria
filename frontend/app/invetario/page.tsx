"use client";


import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InventarioPage() {
  const [productos, setProductos] = useState([
    {
      id: 1,
      nombre: "Amoxicilina",
      cantidad: 20,
      caducidad: "2026-08-15",
    },
    {
      id: 2,
      nombre: "Vacuna Antirrábica",
      cantidad: 15,
      caducidad: "2026-11-10",
    },
    {
      id: 3,
      nombre: "Desparasitante",
      cantidad: 30,
      caducidad: "2027-01-20",
    },
  ]);

  const [nombre, setNombre] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [caducidad, setCaducidad] = useState("");
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);


  const agregarProducto = () => {
    if (!nombre || !cantidad || !caducidad) {
      alert("Completa todos los campos");
      return;
    }

    const nuevoProducto = {
      id: productos.length + 1,
      nombre,
      cantidad: Number(cantidad),
      caducidad,
    };

    setProductos([...productos, nuevoProducto]);

    setNombre("");
    setCantidad("");
    setCaducidad("");
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f1f5f9",
        padding: "40px",
      }}
    >
      {/* BOTÓN HAMBURGUESA */}
    <button
      onClick={() => setMenuOpen(!menuOpen)}
      style={{
        position: "fixed",
        top: "20px",
        left: "20px",
        zIndex: 1001,
        background: "#0f172a",
        color: "white",
        border: "none",
        borderRadius: "8px",
        padding: "10px 15px",
        cursor: "pointer",
        fontSize: "20px",
      }}
     >
      ☰
    </button>

     {/* MENÚ LATERAL */}
    <div
      style={{
        position: "fixed",
        top: 0,
        left: menuOpen ? 0 : "-260px",
        width: "250px",
        height: "100vh",
        background: "#0f172a",
        transition: "0.3s",
        zIndex: 1000,
        paddingTop: "70px",
        boxShadow: "2px 0 10px rgba(0,0,0,0.2)",
      }}
    >
    <button
      onClick={() => router.push("/inventario")}
      style={{
        width: "90%",
        margin: "10px",
        padding: "15px",
        background: "transparent",
        color: "white",
        border: "none",
        textAlign: "left",
        cursor: "pointer",
        fontSize: "18px",
      }}
     >
     📦 Inventario
    </button>
    <button
      onClick={() => router.push("/mascotas")}
      style={{
        width: "90%",
        margin: "10px",
        padding: "15px",
        background: "transparent",
        color: "white",
        border: "none",
        textAlign: "left",
        cursor: "pointer",
        fontSize: "18px",
      }}
     >
     🐕 Mascota
    </button>


    <button
      onClick={() => router.push("/")}
      style={{
        width: "90%",
        margin: "10px",
        padding: "15px",
        background: "transparent",
        color: "white",
        border: "none",
        textAlign: "left",
        cursor: "pointer",
        fontSize: "18px",
      }}
     >
    🏠 Inicio
     </button>
  </div>
      <h1
        style={{
          textAlign: "center",
          marginBottom: "30px",
          color: "#0f172a",
        }}
      >
        Módulo de Inventario
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
        <h2 style={{ marginBottom: "15px" }}>
          Agregar Medicamento
        </h2>

        <input
          type="text"
          placeholder="Nombre del medicamento"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          style={{
            padding: "10px",
            marginRight: "10px",
            marginBottom: "10px",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        />

        <input
          type="number"
          placeholder="Cantidad"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          style={{
            padding: "10px",
            marginRight: "10px",
            marginBottom: "10px",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        />

        <input
          type="date"
          value={caducidad}
          onChange={(e) => setCaducidad(e.target.value)}
          style={{
            padding: "10px",
            marginRight: "10px",
            marginBottom: "10px",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        />

        <button
          onClick={agregarProducto}
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
          Agregar
        </button>
      </div>

      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          overflowX: "auto",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr
              style={{
                background: "#22c1dc",
                color: "white",
              }}
            >
              <th style={{ padding: "12px" }}>ID</th>
              <th style={{ padding: "12px" }}>Medicamento</th>
              <th style={{ padding: "12px" }}>Cantidad</th>
              <th style={{ padding: "12px" }}>Fecha Caducidad</th>
            </tr>
          </thead>

          <tbody>
            {productos.map((producto) => (
              <tr key={producto.id}>
                <td style={{ padding: "12px", textAlign: "center" }}>
                  {producto.id}
                </td>

                <td style={{ padding: "12px", textAlign: "center" }}>
                  {producto.nombre}
                </td>

                <td style={{ padding: "12px", textAlign: "center" }}>
                  {producto.cantidad}
                </td>

                <td style={{ padding: "12px", textAlign: "center" }}>
                  {producto.caducidad}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}