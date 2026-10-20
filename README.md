# Ceramic Dent D&O — Arquitectura del Software · Procesos E2E

**Repositorio de exposición académica:** diagramas, trazabilidad y fragmentos verificables del código de Ceramic Dent D&O. No se incluye el código completo ni datos personales de pacientes.

**Ver exposición visual:** [Sitio de los cinco procesos](docs/index.html) (en GitHub Pages la misma página se publica como sitio).

**Demostración del sistema:** https://ceramicdent.com/

## Procesos E2E del equipo

| Integrante | Proceso | Evento inicial → resultado | Diagrama | Evidencia |
|---|---|---|---|---|
| Gomez Coaquira Jeymi Johan | Alta y habilitación de odontólogo | El administrador necesita incorporar a un odontólogo con acceso al sistema. → Odontólogo creado en Keycloak y registrado en tperson, con rol DOCTOR y cuenta habilitada. | [Diagrama](docs/diagramas/01_Anderson_Registro_Odontologo.png) | [Código y pasos](docs/procesos/01_Anderson_Registro_Odontologo.md) |
| Magallan Rojas Frank Antoni | Bloqueo de agenda y exclusión de turnos | El doctor o administrador necesita impedir reservas durante un periodo de ausencia o descanso. → Rango persistido como BLOCKED en tavailability y considerado al calcular turnos disponibles. | [Diagrama](docs/diagramas/02_Frank_Bloqueo_Agenda.png) | [Código y pasos](docs/procesos/02_Frank_Bloqueo_Agenda.md) |
| Rios Ccarapa Jhon Antony | Reserva pública y confirmación de cita | Un paciente solicita una cita odontológica desde la página pública. → Cita registrada PENDING y luego CONFIRMED con un doctor asignado al aceptarla. | [Diagrama](docs/diagramas/03_Jhon_Reserva_Confirmacion.png) | [Código y pasos](docs/procesos/03_Jhon_Reserva_Confirmacion.md) |
| Huamani Alarcon Anderson | Atención odontológica y actualización clínica | Un odontólogo inicia la atención de una cita confirmada y registra el procedimiento realizado. → Cita COMPLETED, historial ATTENDED, diagnóstico/tratamiento y recomendaciones persistidos. | [Diagrama](docs/diagramas/04_Jeymi_Atencion_Clinica.png) | [Código y pasos](docs/procesos/04_Jeymi_Atencion_Clinica.md) |
| Paniagua Ferrel Jhosep Emilio | Solicitud y aprobación de cambio de teléfono | Un paciente necesita cambiar el número registrado y el odontólogo solicita aprobación administrativa. → Solicitud APPROVED y teléfono actualizado en tperson, con auditoría y aviso al doctor. | [Diagrama](docs/diagramas/05_Jhosep_Cambio_Telefono.png) | [Código y pasos](docs/procesos/05_Jhosep_Cambio_Telefono.md) |

## Arquitectura técnica

- Frontend Angular, Nginx y servicios HTTP.
- Backend Java 25 + Spring Boot 4.1 con Controllers, Business y Repositories.
- MariaDB para personas, citas, agenda, historial y auditoría.
- Keycloak para identidad y permisos por rol.
- Integración externa de consulta DNI (token gestionado únicamente en servidor).

## Alcance de este repositorio

Este es un **repositorio de revisión académica**: las vistas muestran diagramas y extractos reales de código, pero **no** contienen todo el software ni archivos de despliegue, credenciales o información de pacientes. El código integral se conserva de manera privada.

> GitHub **no permite bloquear la descarga o clonación** a quien tiene acceso de lectura. La vista web no incluye botones propios de descarga, pero sí puede guardarse o copiarse usando el navegador.

## Exposición visual con GitHub Pages

1. Sube estos archivos descomprimidos a un repositorio nuevo (no subas solo el ZIP).
2. En **Settings → Pages**, selecciona **Deploy from a branch**.
3. Elige rama **main** y carpeta **/docs**; guarda.
4. La página estará disponible en `https://TU-USUARIO.github.io/NOMBRE-REPO/`.

**Nota:** si el docente exige consultar todo el código fuente, será necesario compartir un **repositorio privado** e invitarlo. Eso permite limitar quién entra, pero no impedir descargas a los invitados.

## Autoría y uso académico

Proyecto Ceramic Dent D&O. Equipo de Arquitectura del Software. Documentación preparada para la exposición grupal; no se concede una licencia de reutilización del software por el simple hecho de publicar estas evidencias.
