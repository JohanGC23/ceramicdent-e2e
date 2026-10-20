# Ceramic Dent D&O — Arquitectura del Software · Procesos E2E

**Repositorio de exposición académica:** diagramas, trazabilidad y fragmentos verificables del código de Ceramic Dent D&O. No se incluye el código completo ni datos personales de pacientes.

**Ver exposición visual:** [Sitio de los cinco procesos](docs/index.html)

**Demostración del sistema:** https://ceramicdent.com/

## Procesos E2E del equipo

| Integrante | Proceso | Evento inicial → resultado | Diagrama | Evidencia |
|---|---|---|---|---|
| Gomez Coaquira Jeymi Johan | Alta y habilitación de odontólogo | El administrador necesita incorporar a un odontólogo con acceso al sistema. → Odontólogo creado en Keycloak y registrado en tperson, con rol DOCTOR y cuenta habilitada. | [Diagrama](docs/diagramas/01_Jeymi_Registro_Odontologo.png) | [Código y pasos](docs/procesos/01_Jeymi_Registro_Odontologo.md) |
| Magallan Rojas Frank Antoni | Bloqueo de agenda y exclusión de turnos | El doctor o administrador necesita impedir reservas durante un periodo de ausencia o descanso. → Rango persistido como BLOCKED en tavailability y considerado al calcular turnos disponibles. | [Diagrama](docs/diagramas/02_Frank_Bloqueo_Agenda.png) | [Código y pasos](docs/procesos/02_Frank_Bloqueo_Agenda.md) |
| Rios Ccarapa Jhon Antony | Reserva pública y confirmación de cita | Un paciente solicita una cita odontológica desde la página pública. → Cita registrada PENDING y luego CONFIRMED con un doctor asignado al aceptarla. | [Diagrama](docs/diagramas/03_Jhon_Reserva_Confirmacion.png) | [Código y pasos](docs/procesos/03_Jhon_Reserva_Confirmacion.md) |
| Huamani Alarcon Anderson | Atención odontológica y actualización clínica | Un odontólogo inicia la atención de una cita confirmada y registra el procedimiento realizado. → Cita COMPLETED, historial ATTENDED, diagnóstico/tratamiento y recomendaciones persistidos. | [Diagrama](docs/diagramas/04_Anderson_Atencion_Clinica.png) | [Código y pasos](docs/procesos/04_Anderson_Atencion_Clinica.md) |
| Paniagua Ferrel Jhosep Emilio | Solicitud y aprobación de cambio de teléfono | Un paciente necesita cambiar el número registrado y el odontólogo solicita aprobación administrativa. → Solicitud APPROVED y teléfono actualizado en tperson, con auditoría y aviso al doctor. | [Diagrama](docs/diagramas/05_Jhosep_Cambio_Telefono.png) | [Código y pasos](docs/procesos/05_Jhosep_Cambio_Telefono.md) |

## Arquitectura técnica

- Frontend Angular, Nginx y servicios HTTP.
- Backend Java 25 + Spring Boot 4.1 con Controllers, Business y Repositories.
- MariaDB para personas, citas, agenda, historial y auditoría.
- Keycloak para identidad y permisos por rol.
- Integración externa de consulta DNI (token gestionado únicamente en servidor).
