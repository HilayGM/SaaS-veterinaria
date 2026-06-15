"use client";

import { useState } from "react";

export default function MascotasPage() {
  const [mascotas, setMascotas] = useState([
    {
      id: 1,
      nombre: "Max",
      especie: "Perro",
      raza: "Labrador",
      fechaNacimiento: "2022-05-10",
    },
  ]);

  const [nombre, setNombre] = useState("");
  const [especie, setEspecie] = useState("");
  const [raza, setRaza] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");

  const registrarMascota = () => {
    if (!nombre || !especie || !raza || !fechaNacimiento) {
      alert("Completa todos los campos");
      return;
    }

    const nuevaMascota = {
      id: mascotas.length + 1,
      nombre,
      especie,
      raza,
      fechaNacimiento,
    };

    setMascotas([...mascotas, nuevaMascota]);

    setNombre("");
    setEspecie("");
    setRaza("");
    setFechaNacimiento("");
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
        Registro de Mascotas
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
          Registrar Mascota
        </h2>

        <input
          type="text"
          placeholder="Nombre de la mascota"
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
          type="text"
          placeholder="Especie"
          value={especie}
          onChange={(e) => setEspecie(e.target.value)}
          style={{
            padding: "10px",
            marginRight: "10px",
            marginBottom: "10px",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        />

        <input
          type="text"
          placeholder="Raza"
          value={raza}
          onChange={(e) => setRaza(e.target.value)}
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
          value={fechaNacimiento}
          onChange={(e) => setFechaNacimiento(e.target.value)}
          style={{
            padding: "10px",
            marginRight: "10px",
            marginBottom: "10px",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        />

        <button
          onClick={registrarMascota}
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
          Registrar
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
              <th style={{ padding: "12px" }}>Nombre</th>
              <th style={{ padding: "12px" }}>Especie</th>
              <th style={{ padding: "12px" }}>Raza</th>
              <th style={{ padding: "12px" }}>Fecha Nacimiento</th>
            </tr>
          </thead>

          <tbody>
            {mascotas.map((mascota) => (
              <tr key={mascota.id}>
                <td style={{ padding: "12px", textAlign: "center" }}>
                  {mascota.id}
                </td>

                <td style={{ padding: "12px", textAlign: "center" }}>
                  {mascota.nombre}
                </td>

                <td style={{ padding: "12px", textAlign: "center" }}>
                  {mascota.especie}
                </td>

                <td style={{ padding: "12px", textAlign: "center" }}>
                  {mascota.raza}
                </td>

                <td style={{ padding: "12px", textAlign: "center" }}>
                  {mascota.fechaNacimiento}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
