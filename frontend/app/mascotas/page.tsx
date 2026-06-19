"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";




type Mascota = {
  id_mascota: number;
  nombre: string;
  especie: string;
  raza: string | null;
  fecha_nacimiento: string | null;
};

export default function MascotasPage() {
  const supabase = createBrowserClient();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const [mascotas, setMascotas] = useState<Mascota[]>([]);

  const [nombre, setNombre] = useState("");
  const [especie, setEspecie] = useState("");
  const [raza, setRaza] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");

  useEffect(() => {
    const cargarMascotas = async () => {
      const { data, error } = await supabase
        .from("mascotas")
        .select("*")
        .order("id_mascota", { ascending: true });

      if (error) {
        console.error(error);
        return;
      }

      setMascotas((data as Mascota[]) || []);
    };

    cargarMascotas();
  }, [supabase]);

  const registrarMascota = async () => {
    if (!nombre || !especie || !raza || !fechaNacimiento) {
      alert("Completa todos los campos");
      return;
    }

    const { error } = await supabase
      .from("mascotas")
      .insert([
        {
          nombre,
          especie,
          raza,
          fecha_nacimiento: fechaNacimiento,
        },
      ]);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    alert("Mascota registrada correctamente");

    const { data } = await supabase
      .from("mascotas")
      .select("*")
      .order("id_mascota", { ascending: true });

    setMascotas((data as Mascota[]) || []);

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
              <tr key={mascota.id_mascota}>
                <td style={{ padding: "12px", textAlign: "center" }}>
                  {mascota.id_mascota}
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
                  {mascota.fecha_nacimiento}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}