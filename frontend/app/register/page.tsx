"use client";

import { useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("");
  const [clinica, setClinica] = useState("");

  const registrarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();

    const supabase = createBrowserClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre,
          rol,
          clinica,
        },
      },
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Usuario registrado correctamente");
    console.log(data);

    setNombre("");
    setEmail("");
    setPassword("");
    setRol("");
    setClinica("");
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f1f5f9",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "30px",
          borderRadius: "12px",
          width: "450px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            marginBottom: "20px",
            fontSize: "2.5rem",
            fontWeight: "bold",
          }}
        >
          Crear Cuenta
        </h1>

        <form onSubmit={registrarUsuario}>
          <div style={{ marginBottom: "15px" }}>
            <input
              type="text"
              placeholder="Nombre completo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ccc",
                borderRadius: "8px",
              }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ccc",
                borderRadius: "8px",
              }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ccc",
                borderRadius: "8px",
              }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ccc",
                borderRadius: "8px",
              }}
            >
              <option value="">Selecciona un rol</option>
              <option value="Administrador">Administrador</option>
              <option value="Veterinario">Veterinario</option>
              <option value="Recepcionista">Recepcionista</option>
            </select>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <input
              type="text"
              placeholder="Nombre de la clínica"
              value={clinica}
              onChange={(e) => setClinica(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ccc",
                borderRadius: "8px",
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "12px",
              border: "none",
              borderRadius: "8px",
              background: "#22c1dc",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Registrarse
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: "20px",
            fontSize: "18px",
          }}
        >
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            style={{
              color: "#22c1dc",
              fontWeight: "bold",
              textDecoration: "none",
            }}
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
