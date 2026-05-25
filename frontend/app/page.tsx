export default function Home() {
  return (
    <main>

      {/* NAVBAR */}

      <nav>

        <div className="logo">
          <i className="fa-solid fa-heart-pulse"></i>
          PetCare <span>Intelligence</span>
        </div>

        <ul>
          <li><a href="#problema">Problema</a></li>
          <li><a href="#solucion">Solución</a></li>
          <li><a href="#beneficios">Beneficios</a></li>
          <li><a href="#contacto">Contacto</a></li>
        </ul>

        <a href="#" className="nav-btn">
          Solicitar Demo
        </a>

      </nav>

      {/* HERO */}

      <section className="hero">

        <div className="hero-content">

          <h1>
            La plataforma inteligente
            para veterinarias
            <span> más eficientes</span>
          </h1>

          <p>
            Automatiza citas, historiales médicos e inventario
            para ahorrar tiempo, evitar pérdidas y brindar
            una atención excepcional.
          </p>

          <div className="hero-buttons">

            <a href="#" className="btn btn-primary">
              <i className="fa-regular fa-calendar"></i>
              Solicitar Demo
            </a>

            <a href="#solucion" className="btn btn-secondary">
              <i className="fa-solid fa-play"></i>
              Conocer Más
            </a>

          </div>

        </div>

        <div className="hero-image">

          <img
            src="https://thumbs.dreamstime.com/b/perro-veterinario-18384165.jpg"
            alt="Perro"
          />

        </div>

        <svg
          className="wave"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 320"
        >
          <path
            fill="#f4f7fb"
            fillOpacity="1"
            d="M0,256L80,250.7C160,245,320,235,480,224C640,213,800,203,960,208C1120,213,1280,235,1360,245.3L1440,256L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"
          ></path>
        </svg>

      </section>

      {/* PROBLEMA */}

      <section id="problema">

        <div className="section-title">

          <h2>El Problema</h2>

          <div className="section-line"></div>

          <p>
            Las veterinarias pierden tiempo y dinero debido a procesos manuales.
          </p>

        </div>

        <div className="grid">

          <div className="card problem">

            <i className="fa-regular fa-file-lines"></i>

            <h3>Caos Administrativo</h3>

            <p>
              El uso excesivo de papel provoca expedientes desorganizados,
              pérdida de información y tiempo buscando historiales médicos.
            </p>

          </div>

          <div className="card problem">

            <i className="fa-solid fa-pills"></i>

            <h3>Inventario Ineficiente</h3>

            <p>
              Los medicamentos pueden caducar sin que el personal lo note,
              generando pérdidas económicas importantes.
            </p>

          </div>

          <div className="card problem">

            <i className="fa-regular fa-calendar-xmark"></i>

            <h3>Falta de Seguimiento</h3>

            <p>
              Los clientes olvidan citas y vacunas causando ausencias
              y espacios muertos en la agenda.
            </p>

          </div>

        </div>

      </section>

      {/* SOLUCION */}

      <section id="solucion">

        <div className="section-title">

          <h2>La Solución</h2>

          <div className="section-line"></div>

          <p>
            Una plataforma digital que automatiza las tareas más tediosas.
          </p>

        </div>

        <div className="grid">

          <div className="card solution">

            <i className="fa-solid fa-mobile-screen-button"></i>

            <h3>Digitalización Centralizada</h3>

            <p>
              Consulta historiales médicos y organiza citas desde cualquier
              dispositivo sin depender de archivos físicos.
            </p>

          </div>

          <div className="card solution">

            <i className="fa-solid fa-box-open"></i>

            <h3>Inventario Inteligente</h3>

            <p>
              Alertas automáticas de caducidad y control preciso
              de medicamentos en tiempo real.
            </p>

          </div>

          <div className="card solution">

            <i className="fa-regular fa-comments"></i>

            <h3>Recordatorios Automáticos</h3>

            <p>
              Envía mensajes por WhatsApp para recordar citas y vacunas
              automáticamente.
            </p>

          </div>

        </div>

      </section>

      {/* BENEFICIOS */}

      <section id="beneficios">

        <div className="section-title">

          <h2>Beneficios</h2>

          <div className="section-line"></div>

          <p>
            Resultados reales para clínicas veterinarias.
          </p>

        </div>

        <div className="grid">

          <div className="card benefit">

           <i className="fa-solid fa-sack-dollar"></i>

            <h3>Protección de Ingresos</h3>

            <p>
              Reduce pérdidas por medicamentos caducados
              y disminuye las inasistencias.
            </p>

          </div>

          <div className="card benefit">

            <i className="fa-regular fa-clock"></i>

            <h3>Ahorro de Tiempo</h3>

            <p>
              Elimina tareas repetitivas y dedica más tiempo
              a la atención de pacientes.
            </p>

          </div>

          <div className="card benefit">

            <i className="fa-solid fa-users"></i>

            <h3>Fidelización de Clientes</h3>

            <p>
              Brinda una experiencia moderna y mejora
              el seguimiento de las mascotas.
            </p>

          </div>

        </div>

      </section>

      {/* CTA */}

      <section className="cta">

        <div className="cta-box">

          <div className="cta-text">

            <h2>
              Transforma tu veterinaria hoy
            </h2>

            <p>
              Descubre cómo PetCare Intelligence puede ayudarte
              a automatizar y optimizar tu clínica.
            </p>

          </div>

          <a href="#" className="cta-btn">
            Empezar Ahora
          </a>

          <div className="cta-dog">


          </div>

        </div>

      </section>

      {/* FOOTER */}

      <footer id="contacto">

        <div className="footer-logo">

          <i className="fa-solid fa-heart-pulse"></i>
          PetCare Intelligence

        </div>

        <div className="socials">

          <a href="#"><i className="fa-brands fa-whatsapp"></i></a>
          <a href="#"><i className="fa-brands fa-facebook-f"></i></a>
          <a href="#"><i className="fa-brands fa-instagram"></i></a>

        </div>

      </footer>

    </main>
  );
}