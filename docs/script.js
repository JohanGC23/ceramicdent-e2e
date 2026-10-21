/* Datos de los cinco procesos E2E, extraídos de las guías técnicas del proyecto. */
const PROCESSES = [
  {
    "key": "anderson",
    "index": 1,
    "member": "Gómez Coaquira Jeymi Johan",
    "short": "Jeymi",
    "title": "Registro de odontólogo",
    "start": "El administrador necesita incorporar a un odontólogo con acceso al sistema.",
    "end": "Odontólogo creado en Keycloak y registrado en tperson, con rol DOCTOR y cuenta habilitada.",
    "steps": [
      {
        "name": "Solicitud",
        "description": "ADMIN abre Personas y completa la ficha de nuevo odontólogo.",
        "data": "Formulario: DNI, teléfono, correo, especialidad, usuario y clave temporal."
      },
      {
        "name": "Formulario",
        "description": "person-list.ts construye RequestPersonUpsert.",
        "data": "role=DOCTOR; createAccessAccount=true."
      },
      {
        "name": "HTTP",
        "description": "ApiService envía POST person/insert.",
        "data": "JSON con datos sin información de otro paciente."
      },
      {
        "name": "Seguridad",
        "description": "SecurityConfig requiere rol ADMIN para /person/**.",
        "data": "JWT y authorities de Keycloak."
      },
      {
        "name": "Controlador",
        "description": "PersonController.actionInsert recibe @Valid RequestPersonInsert.",
        "data": "DTO validado de persona."
      },
      {
        "name": "Negocio",
        "description": "BusinessPerson.insert verifica formatos, duplicidad y consulta DNI.",
        "data": "DNI y datos de RENIEC/Decolecta."
      },
      {
        "name": "Identidad",
        "description": "KeycloakAdminClient.createUser crea la cuenta si procede.",
        "data": "username, email, password temporal, rol DOCTOR."
      },
      {
        "name": "Persistencia",
        "description": "BusinessPerson guarda EntityPerson mediante repositoryPerson.saveAndFlush.",
        "data": "tperson: keycloakUserId, fullName, dni, role, active."
      },
      {
        "name": "Trazabilidad",
        "description": "BusinessAuditLog y BusinessNotification registran el alta.",
        "data": "evento REGISTRAR_PERSONA y notificación."
      },
      {
        "name": "Resultado",
        "description": "Backend devuelve éxito y frontend refresca lista.",
        "data": "Cuenta de odontólogo creada y registro verificable."
      }
    ],
    "kinds": [
      "actor",
      "frontend",
      "frontend",
      "security",
      "backend",
      "logic",
      "external",
      "identity",
      "database",
      "result"
    ],
    "nodeNames": [
      "Administrador",
      "Formulario Angular",
      "API HTTP",
      "Roles JWT",
      "PersonController",
      "BusinessPerson",
      "Decolecta",
      "Keycloak",
      "MariaDB",
      "Alta completa"
    ],
    "evidence": [
      {
        "file": "frontend/src/app/page/person/person-list/person-list.ts",
        "lines": "líneas 270–297",
        "code": "  protected save(): void {\n    if (!this.validateBusinessRules()) {\n      return;\n    }\n\n    const raw = this.form.getRawValue();\n    const payload: RequestPersonUpsert = {\n      dni: raw.dni,\n      phone: this.nullIfEmpty(raw.phone),\n      email: this.nullIfEmpty(raw.email),\n      birthDate: this.nullIfEmpty(raw.birthDate),\n      gender: raw.gender,\n      role: raw.role,\n      userLogin: this.nullIfEmpty(normalizeUsername(raw.userLogin)),\n      specialty: this.nullIfEmpty(raw.specialty),\n      createAccessAccount: raw.role === 'ADMIN' || raw.role === 'DOCTOR',\n      temporaryPassword: raw.role === 'ADMIN' || raw.role === 'DOCTOR'\n        ? this.nullIfEmpty(raw.temporaryPassword)\n        : null\n    };\n\n    const request$ = this.selectedPerson\n      ? this.apiService.put<ResponseGeneric>(\n          `person/update/${this.selectedPerson.idPerson}`,\n          this.toUpdatePayload(payload)\n        )\n      : this.apiService.post<ResponseGeneric>('person/insert', payload);\n"
      },
      {
        "file": "backend/src/main/java/com/ceramic/apiceramic/controller/PersonController.java",
        "lines": "líneas 63–76",
        "code": "    @PostMapping(path = \"insert\")\n    public ResponseEntity<ResponsePersonInsert> actionInsert(\n        @Valid @RequestBody RequestPersonInsert request\n    ) {\n        try {\n            return ResponseEntity.ok(businessPerson.insert(request));\n        } catch (Exception exception) {\n            LOGGER.error(LOG_ERROR_MESSAGE, exception);\n            ResponsePersonInsert response = new ResponsePersonInsert();\n            response.exception();\n            response.listMessage.add(\"Ocurrió un error al registrar la persona.\");\n            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);\n        }\n    }"
      },
      {
        "file": "backend/src/main/java/com/ceramic/apiceramic/business/BusinessPerson.java",
        "lines": "líneas 170–190",
        "code": "            Map<String, Object> personMap = toPersonMap(entity);\n            businessAuditLog.register(\n                \"PERSONAS\",\n                \"REGISTRAR_PERSONA\",\n                \"Person\",\n                entity.getIdPerson(),\n                \"Se registró una persona con rol \" + entity.getRole() + \".\",\n                null,\n                personMap\n            );\n            if (entity.getRole() == EnumPersonRole.DOCTOR) {\n                businessNotification.createForRole(\n                    \"ADMIN\",\n                    \"Doctor registrado\",\n                    \"Se registró el doctor \" + entity.getFullName() + \".\",\n                    \"PERSONAS\",\n                    entity.getIdPerson()\n                );\n            }\n            response.setPerson(personMap);\n            response.success();"
      }
    ],
    "endpoints": [
      "GET /api/person/reniec/{dni}",
      "POST /api/person/insert"
    ],
    "tables": "tperson"
  },
  {
    "key": "frank",
    "index": 2,
    "member": "Magallan Rojas Frank Antoni",
    "short": "Frank",
    "title": "Bloqueo de agenda",
    "start": "El doctor o administrador necesita impedir reservas durante un periodo de ausencia o descanso.",
    "end": "Rango persistido como BLOCKED en tavailability y considerado al calcular turnos disponibles.",
    "steps": [
      {
        "name": "Evento",
        "description": "Doctor necesita bloquear un horario futuro.",
        "data": "Identidad del odontólogo y motivo."
      },
      {
        "name": "Pantalla",
        "description": "availability-list.ts valida el formulario de bloqueo.",
        "data": "idPersonDoctor, startDateTime, endDateTime, reason."
      },
      {
        "name": "Petición",
        "description": "ApiService hace POST availability/insert.",
        "data": "status BLOCKED en JSON."
      },
      {
        "name": "Permisos",
        "description": "Spring Security exige ADMIN o DOCTOR; acceso del doctor queda acotado.",
        "data": "Token JWT / usuario actual."
      },
      {
        "name": "Controller",
        "description": "AvailabilityController.actionInsert delega al negocio.",
        "data": "RequestAvailabilityInsert."
      },
      {
        "name": "Reglas",
        "description": "BusinessAvailability exige fecha futura, intervalos de 15 min, máximo 24 h y motivo.",
        "data": "Inicio/fin/motivo."
      },
      {
        "name": "Cruce bloqueos",
        "description": "RepositoryAvailability comprueba que no se superponga otro bloqueo.",
        "data": "idDoctor + rango."
      },
      {
        "name": "Cruce citas",
        "description": "RepositoryAppointment comprueba citas CONFIRMED o IN_PROGRESS en el rango.",
        "data": "Citas activas superpuestas."
      },
      {
        "name": "Persistencia",
        "description": "BusinessAvailability guarda registro BLOCKED.",
        "data": "tavailability."
      },
      {
        "name": "Resultado",
        "description": "BusinessAppointment consulta bloqueos al calcular cupos.",
        "data": "Turnos no disponibles para el doctor durante el rango."
      }
    ],
    "kinds": [
      "actor",
      "frontend",
      "frontend",
      "security",
      "backend",
      "logic",
      "database",
      "database",
      "database",
      "result"
    ],
    "nodeNames": [
      "Odontólogo",
      "Agenda Angular",
      "API HTTP",
      "Roles JWT",
      "AvailabilityController",
      "Reglas de bloqueo",
      "Bloqueos existentes",
      "Citas ocupadas",
      "MariaDB",
      "Cupos actualizados"
    ],
    "evidence": [
      {
        "file": "frontend/src/app/page/availability/availability-list/availability-list.ts",
        "lines": "líneas 207–230",
        "code": "  protected save(): void {\n    if (!this.validateForm()) {\n      return;\n    }\n\n    const raw = this.form.getRawValue();\n    const payload = { ...raw, reason: normalizeText(raw.reason) || null } as AvailabilityPayload;\n    const request$ = this.selectedAvailability\n      ? this.apiService.put<ResponseGeneric>(`availability/update/${this.selectedAvailability.idAvailability}`, payload)\n      : this.apiService.post<ResponseGeneric>('availability/insert', payload);\n\n    this.saving = true;\n    request$\n      .pipe(finalize(() => (this.saving = false)))\n      .subscribe({\n        next: (response) => {\n          if (response.type !== 'success') {\n            this.showError(response.listMessage?.join(' ') || 'No se pudo guardar el bloqueo.');\n            return;\n          }\n\n          this.dialogVisible = false;\n          this.messageService.add({\n            severity: 'success',"
      },
      {
        "file": "backend/src/main/java/com/ceramic/apiceramic/controller/AvailabilityController.java",
        "lines": "líneas 48–60",
        "code": "    @PostMapping(path = \"insert\")\n    public ResponseEntity<ResponseAvailabilityInsert> actionInsert(\n        @Valid @RequestBody RequestAvailabilityInsert request\n    ) {\n        try {\n            return ResponseEntity.ok(businessAvailability.insert(request));\n        } catch (Exception exception) {\n            LOGGER.error(LOG_ERROR_MESSAGE, exception);\n            ResponseAvailabilityInsert response = new ResponseAvailabilityInsert();\n            response.exception();\n            response.listMessage.add(\"Ocurrió un error al registrar la disponibilidad.\");\n            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);\n        }"
      },
      {
        "file": "backend/src/main/java/com/ceramic/apiceramic/business/BusinessAppointment.java",
        "lines": "líneas 702–723",
        "code": "    private List<Map<String, Object>> buildClinicSlotList(LocalDateTime from, LocalDateTime to, int duration) {\n        List<EntityPerson> doctors = repositoryPerson\n            .findAllByRoleAndActiveTrueOrderByFullNameAsc(EnumPersonRole.DOCTOR);\n        List<EntityAvailability> availability = repositoryAvailability\n            .findBlockingBetween(from, to, DOCTOR_BLOCK_STATUS_LIST);\n        List<EntityAppointment> appointments = repositoryAppointment\n            .findBlockingBetween(from, to, BLOCKING_STATUS_LIST);\n        return slotCalculator.calculateClinicSlots(doctors, availability, appointments, from, to, duration);\n    }\n\n    private List<Map<String, Object>> buildDoctorSlotList(\n        EntityPerson doctor,\n        LocalDateTime from,\n        LocalDateTime to,\n        int duration\n    ) {\n        List<EntityAvailability> availability = repositoryAvailability\n            .findBlockingBetween(from, to, DOCTOR_BLOCK_STATUS_LIST);\n        List<EntityAppointment> appointments = repositoryAppointment\n            .findBlockingBetween(from, to, BLOCKING_STATUS_LIST);\n        return slotCalculator.calculateDoctorSlots(doctor, availability, appointments, from, to, duration);\n    }"
      }
    ],
    "endpoints": [
      "POST /api/availability/insert",
      "GET /api/appointment/public/available-slots"
    ],
    "tables": "tavailability"
  },
  {
    "key": "jhon",
    "index": 3,
    "member": "Rios Ccarapa Jhon Antony",
    "short": "Jhon",
    "title": "Reserva y confirmación",
    "start": "Un paciente solicita una cita odontológica desde la página pública.",
    "end": "Cita registrada PENDING y luego CONFIRMED con un doctor asignado al aceptarla.",
    "steps": [
      {
        "name": "Evento",
        "description": "Paciente llena DNI, teléfono, servicio y selecciona horario.",
        "data": "Identidad y preferencia de atención."
      },
      {
        "name": "Consulta DNI",
        "description": "Angular consulta /person/reniec/{dni} para autocompletar nombres.",
        "data": "Respuesta RENIEC o advertencia."
      },
      {
        "name": "Disponibilidad",
        "description": "Frontend pide appointment/public/available-slots.",
        "data": "idService + from + to."
      },
      {
        "name": "Motor turnos",
        "description": "BusinessAppointment calcula capacidad con citas y bloqueos.",
        "data": "Rangos BLOCKED y citas activas."
      },
      {
        "name": "Solicitud HTTP",
        "description": "Angular ejecuta POST appointment/public/insert.",
        "data": "DNI, teléfono, servicio, fecha."
      },
      {
        "name": "Controller",
        "description": "AppointmentController.actionInsertPublic valida el DTO.",
        "data": "RequestAppointmentPublicInsert."
      },
      {
        "name": "Negocio",
        "description": "BusinessAppointment.insertPublic busca/crea paciente y valida horario/capacidad.",
        "data": "Patient + Service + intervalo."
      },
      {
        "name": "Persistencia",
        "description": "Inserta tappointment PENDING sin doctor y emite notificaciones.",
        "data": "idAppointment, status=PENDING."
      },
      {
        "name": "Aceptación",
        "description": "Doctor autenticado llama PATCH appointment/claim/{id}.",
        "data": "Token DOCTOR + idAppointment."
      },
      {
        "name": "Resultado",
        "description": "claim bloquea la fila, valida disponibilidad, asigna doctor, CONFIRMED y asegura historial.",
        "data": "Doctor asignado y confirmación registrada."
      }
    ],
    "kinds": [
      "actor",
      "external",
      "frontend",
      "logic",
      "frontend",
      "backend",
      "logic",
      "database",
      "identity",
      "result"
    ],
    "nodeNames": [
      "Paciente",
      "Consulta DNI",
      "Disponibilidad",
      "Motor de turnos",
      "Reserva Angular",
      "AppointmentController",
      "BusinessAppointment",
      "MariaDB · PENDING",
      "Doctor · claim",
      "Cita CONFIRMED"
    ],
    "evidence": [
      {
        "file": "frontend/src/app/page/public/appointment-public/appointment-public.ts",
        "lines": "líneas 229–251",
        "code": "  protected submit(): void {\n    if (this.form.invalid || !this.reniec) {\n      this.form.markAllAsTouched();\n      this.messageService.add({ severity: 'warn', summary: 'Formulario incompleto', detail: 'Complete sus datos, valide el DNI y seleccione un horario.' });\n      return;\n    }\n\n    const raw = this.form.getRawValue();\n    const body = {\n      dni: raw.dni,\n      phone: raw.phone,\n      email: null,\n      birthDate: null,\n      gender: 'NOT_SPECIFIED',\n      idService: raw.idService,\n      appointmentDateTime: this.normalizeDateTime(raw.appointmentDateTime),\n      patientComment: raw.patientComment || null\n    };\n\n    this.saving = true;\n    this.apiService.post<ResponseGeneric>('appointment/public/insert', body)\n      .pipe(finalize(() => (this.saving = false)))\n      .subscribe({"
      },
      {
        "file": "backend/src/main/java/com/ceramic/apiceramic/controller/AppointmentController.java",
        "lines": "líneas 69–82",
        "code": "    @PostMapping(path = \"public/insert\")\n    public ResponseEntity<ResponseAppointmentPublicInsert> actionInsertPublic(\n        @Valid @RequestBody RequestAppointmentPublicInsert request\n    ) {\n        try {\n            return ResponseEntity.ok(businessAppointment.insertPublic(request));\n        } catch (Exception exception) {\n            LOGGER.error(LOG_ERROR_MESSAGE, exception);\n            ResponseAppointmentPublicInsert response = new ResponseAppointmentPublicInsert();\n            response.exception();\n            response.listMessage.add(\"Ocurrió un error al registrar la solicitud de cita.\");\n            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);\n        }\n    }"
      },
      {
        "file": "backend/src/main/java/com/ceramic/apiceramic/business/BusinessAppointment.java",
        "lines": "líneas 197–232",
        "code": "    public ResponseAppointmentStatus claim(String idAppointment) {\n        ResponseAppointmentStatus response = new ResponseAppointmentStatus();\n        Optional<EntityPerson> doctorOptional = accessControl.currentDoctor(response.listMessage);\n        Optional<EntityAppointment> appointmentOptional = repositoryAppointment.findByIdForUpdate(normalizeId(idAppointment));\n        if (doctorOptional.isEmpty() || appointmentOptional.isEmpty()) {\n            if (appointmentOptional.isEmpty()) {\n                response.listMessage.add(\"No se encontró la solicitud de cita.\");\n            }\n            response.warning();\n            return response;\n        }\n\n        EntityAppointment entity = appointmentOptional.get();\n        EntityPerson doctor = repositoryPerson.findByIdForUpdate(doctorOptional.get().getIdPerson())\n            .orElse(doctorOptional.get());\n        if (entity.getStatus() != EnumAppointmentStatus.PENDING || entity.getParentDoctor() != null) {\n            response.warning();\n            response.listMessage.add(\"La cita ya fue tomada por otro doctor o dejó de estar pendiente.\");\n            return response;\n        }\n        if (!Boolean.TRUE.equals(doctor.getActive())) {\n            response.warning();\n            response.listMessage.add(\"El doctor se encuentra inactivo.\");\n            return response;\n        }\n        LocalDateTime start = entity.getAppointmentDateTime();\n        LocalDateTime end = calculateEndDateTime(entity);\n        if (start.isBefore(LocalDateTime.now())) {\n            response.warning();\n            response.listMessage.add(\"No se puede confirmar una solicitud cuyo horario ya pasó.\");\n            return response;\n        }\n        if (!isDoctorFree(doctor, start, end, entity.getIdAppointment(), response.listMessage)) {\n            response.warning();\n            return response;\n        }"
      }
    ],
    "endpoints": [
      "GET /api/person/reniec/{dni}",
      "GET /api/appointment/public/available-slots",
      "POST /api/appointment/public/insert",
      "PATCH /api/appointment/claim/{idAppointment}"
    ],
    "tables": "tperson"
  },
  {
    "key": "jeymi",
    "index": 4,
    "member": "Huamani Alarcon Anderson",
    "short": "Anderson",
    "title": "Atención clínica",
    "start": "Un odontólogo inicia la atención de una cita confirmada y registra el procedimiento realizado.",
    "end": "Cita COMPLETED, historial ATTENDED, diagnóstico/tratamiento y recomendaciones persistidos.",
    "steps": [
      {
        "name": "Inicio",
        "description": "Doctor selecciona una cita CONFIRMED que le corresponde.",
        "data": "idAppointment."
      },
      {
        "name": "Estado",
        "description": "Angular llama changestatus con IN_PROGRESS.",
        "data": "Estado y JWT."
      },
      {
        "name": "Controller",
        "description": "AppointmentController.actionChangeStatus delega al negocio.",
        "data": "RequestAppointmentStatus."
      },
      {
        "name": "Reglas",
        "description": "BusinessAppointment valida transición, acceso y hora de inicio.",
        "data": "Estado previo, hora programada."
      },
      {
        "name": "Persistencia 1",
        "description": "Actualiza tappointment a IN_PROGRESS y sincroniza historial.",
        "data": "idAppointment, status=IN_PROGRESS."
      },
      {
        "name": "Clínica",
        "description": "Doctor escribe diagnóstico, tratamiento, notas y recomendaciones.",
        "data": "Texto clínico."
      },
      {
        "name": "Solicitud final",
        "description": "Angular envía PATCH appointment/finalize/{id}.",
        "data": "RequestAppointmentFinalize."
      },
      {
        "name": "Validación",
        "description": "BusinessAppointment.finalizeAppointment exige estado IN_PROGRESS y datos obligatorios.",
        "data": "Diagnóstico y tratamiento."
      },
      {
        "name": "Persistencia 2",
        "description": "Guarda cita COMPLETED, tmedicalhistory ATTENDED y trecommendation.",
        "data": "Datos de atención, momento final y recomendaciones."
      },
      {
        "name": "Resultado",
        "description": "Genera auditoría/aviso y respuesta con historial.",
        "data": "Servicio realizado e historial actualizado."
      }
    ],
    "kinds": [
      "actor",
      "frontend",
      "backend",
      "security",
      "database",
      "frontend",
      "backend",
      "logic",
      "database",
      "result"
    ],
    "nodeNames": [
      "Odontólogo",
      "Iniciar atención",
      "AppointmentController",
      "Validación / Roles",
      "Cita IN_PROGRESS",
      "Formulario clínico",
      "Finalizar atención",
      "Reglas clínicas",
      "Historial MariaDB",
      "Cita COMPLETED"
    ],
    "evidence": [
      {
        "file": "backend/src/main/java/com/ceramic/apiceramic/business/BusinessAppointment.java",
        "lines": "líneas 448–480",
        "code": "    public ResponseAppointmentStatus changeStatus(String idAppointment, RequestAppointmentStatus request) {\n        ResponseAppointmentStatus response = new ResponseAppointmentStatus();\n        Optional<EntityAppointment> optional = repositoryAppointment.findByIdForUpdate(normalizeId(idAppointment));\n        if (optional.isEmpty()) { response.warning(); response.listMessage.add(\"No se encontró la cita.\"); return response; }\n        EntityAppointment entity = optional.get();\n        EnumAppointmentStatus target = request.getStatus();\n        if (target == null) { response.warning(); response.listMessage.add(\"El estado es obligatorio.\"); return response; }\n        if (target == EnumAppointmentStatus.CONFIRMED && entity.getParentDoctor() == null) {\n            response.warning(); response.listMessage.add(\"Use Confirmar y tomar cita para asignarla al doctor autenticado.\"); return response;\n        }\n        if (target == EnumAppointmentStatus.COMPLETED) {\n            response.warning(); response.listMessage.add(\"Use Finalizar atención para registrar el contenido clínico.\"); return response;\n        }\n        if (!accessControl.canModifyAppointment(entity, response.listMessage)) { response.warning(); return response; }\n        if (!isValidStatusTransition(entity.getStatus(), target)) {\n            response.warning(); response.listMessage.add(\"El cambio de estado no es válido.\"); return response;\n        }\n        LocalDateTime now = LocalDateTime.now();\n        if (target == EnumAppointmentStatus.IN_PROGRESS && now.isBefore(entity.getAppointmentDateTime().minusMinutes(EARLY_START_MINUTES))) {\n            response.warning(); response.listMessage.add(\"La atención solo puede iniciarse hasta 10 minutos antes del horario programado.\"); return response;\n        }\n        if (target == EnumAppointmentStatus.NO_SHOW && now.isBefore(calculateEndDateTime(entity))) {\n            response.warning(); response.listMessage.add(\"No se puede marcar inasistencia antes de finalizar el horario de la cita.\"); return response;\n        }\n\n        Map<String, Object> before = toAppointmentMap(entity);\n        entity.setStatus(target);\n        repositoryAppointment.saveAndFlush(entity);\n        if (target == EnumAppointmentStatus.CANCELLED || target == EnumAppointmentStatus.NO_SHOW) {\n            syncClosedMedicalHistory(entity, toAttendanceStatus(target));\n        } else {\n            ensureScheduledMedicalHistory(entity);\n        }"
      },
      {
        "file": "frontend/src/app/page/appointment/appointment-list/appointment-list.ts",
        "lines": "líneas 342–365",
        "code": "  protected finalizeAttention(): void {\n    if (!this.finishAppointment) {\n      return;\n    }\n\n    if (this.finishForm.invalid) {\n      this.finishForm.markAllAsTouched();\n      this.showError('Registra diagnóstico y tratamiento realizado para finalizar la atención.');\n      return;\n    }\n\n    const raw = this.finishForm.getRawValue();\n    const payload: AppointmentFinalizePayload = {\n      diagnosis: normalizeText(raw.diagnosis),\n      treatment: normalizeText(raw.treatment),\n      notes: normalizeText(raw.notes) || null,\n      doctorNotes: normalizeText(raw.doctorNotes) || null,\n      recommendationList: this.parseRecommendations(raw.recommendations ?? '')\n    };\n\n    this.finishing = true;\n    this.apiService\n      .patch<ResponseGeneric>(`appointment/finalize/${this.finishAppointment.idAppointment}`, payload)\n      .pipe(finalize(() => (this.finishing = false)))"
      },
      {
        "file": "backend/src/main/java/com/ceramic/apiceramic/business/BusinessAppointment.java",
        "lines": "líneas 511–545",
        "code": "        Map<String, Object> before = toAppointmentMap(entity);\n        entity.setDoctorNotes(normalizeText(request.getDoctorNotes()));\n        entity.setStatus(EnumAppointmentStatus.COMPLETED);\n        repositoryAppointment.saveAndFlush(entity);\n\n        EntityMedicalHistory history = ensureMedicalHistory(entity);\n        syncMedicalHistoryBase(history, entity);\n        history.setAttendanceStatus(EnumClinicalAttendanceStatus.ATTENDED);\n        history.setDiagnosis(diagnosis);\n        history.setTreatment(treatment);\n        history.setNotes(normalizeText(request.getNotes()));\n        history.setDoctorNotes(entity.getDoctorNotes());\n        history.setCompletedAt(LocalDateTime.now());\n        repositoryMedicalHistory.saveAndFlush(history);\n\n        for (String item : normalizeRecommendationList(request.getRecommendationList())) {\n            EntityRecommendation recommendation = new EntityRecommendation();\n            recommendation.setIdRecommendation(GenericHelper.generateUuid());\n            recommendation.setParentPatient(entity.getParentPatient());\n            recommendation.setParentDoctor(entity.getParentDoctor());\n            recommendation.setParentAppointment(entity);\n            recommendation.setDescription(item);\n            repositoryRecommendation.saveAndFlush(recommendation);\n            response.getListRecommendation().add(toRecommendationMap(recommendation));\n        }\n        Map<String, Object> after = toAppointmentMap(entity);\n        Map<String, Object> historyMap = toMedicalHistoryMap(history);\n        businessAuditLog.register(\"ATENCION_CLINICA\", \"FINALIZAR_ATENCION\", \"Appointment\", entity.getIdAppointment(),\n            \"Se finalizó la atención y se actualizó automáticamente el historial clínico.\", before,\n            Map.of(\"appointment\", after, \"medicalHistory\", historyMap));\n        businessNotification.createForRole(\"ADMIN\", \"Atención finalizada\",\n            \"Finalizó la atención de \" + entity.getParentPatient().getFullName() + \".\", \"ATENCION_CLINICA\", entity.getIdAppointment());\n        response.setAppointment(after); response.setMedicalHistory(historyMap); response.success();\n        response.listMessage.add(\"La atención finalizó y el historial clínico se actualizó automáticamente.\");\n        return response;"
      }
    ],
    "endpoints": [
      "PATCH /api/appointment/changestatus/{idAppointment}",
      "PATCH /api/appointment/finalize/{idAppointment}"
    ],
    "tables": "tappointment"
  },
  {
    "key": "jhosep",
    "index": 5,
    "member": "Paniagua Ferrel Jhosep Emilio",
    "short": "Jhosep",
    "title": "Cambio de teléfono",
    "start": "Un paciente necesita cambiar el número registrado y el odontólogo solicita aprobación administrativa.",
    "end": "Solicitud APPROVED y teléfono actualizado en tperson, con auditoría y aviso al doctor.",
    "steps": [
      {
        "name": "Evento",
        "description": "Paciente solicita corregir teléfono ante un doctor.",
        "data": "id paciente, nuevo número, motivo."
      },
      {
        "name": "Formulario",
        "description": "patient-data-change-list.ts valida solicitud.",
        "data": "idPersonPatient, requestedPhone, reason."
      },
      {
        "name": "Seguridad",
        "description": "POST phone requiere rol DOCTOR y JWT.",
        "data": "Usuario autenticado."
      },
      {
        "name": "Negocio",
        "description": "BusinessPatientDataChangeRequest valida existencia, rol PATIENT y teléfono peruano.",
        "data": "idPerson, valor nuevo."
      },
      {
        "name": "Unicidad",
        "description": "Repository comprueba ausencia de solicitud PHONE PENDING para el mismo paciente.",
        "data": "Identificador del paciente."
      },
      {
        "name": "Persistencia 1",
        "description": "Inserta tpatientdatachangerequest en PENDING sin cambiar aún tperson.",
        "data": "Valor anterior, nuevo y motivo."
      },
      {
        "name": "Alerta",
        "description": "Auditoría y notificación avisan al ADMIN.",
        "data": "idRequest y autor."
      },
      {
        "name": "Revisión",
        "description": "Administrador abre la lista y decide aprobar/rechazar.",
        "data": "idRequest, approved, observation."
      },
      {
        "name": "Seguridad de revisión",
        "description": "PATCH review requiere rol ADMIN; backend bloquea solicitud y verifica estado.",
        "data": "JWT ADMIN, decisión."
      },
      {
        "name": "Resultado",
        "description": "Al aprobar, actualiza teléfono en tperson, marca APPROVED, registra auditoría y notifica al doctor.",
        "data": "Número actualizado y trazabilidad."
      }
    ],
    "kinds": [
      "actor",
      "frontend",
      "security",
      "logic",
      "database",
      "database",
      "result",
      "actor",
      "security",
      "database"
    ],
    "nodeNames": [
      "Paciente → Doctor",
      "Solicitud Angular",
      "JWT · DOCTOR",
      "Validación",
      "Revisión de duplicados",
      "Solicitud PENDING",
      "Notificación",
      "Administrador",
      "JWT · ADMIN",
      "Teléfono actualizado"
    ],
    "evidence": [
      {
        "file": "frontend/src/app/page/patient-data-change/patient-data-change-list/patient-data-change-list.ts",
        "lines": "líneas 165–189",
        "code": "  protected createRequest(): void {\n    if (this.createForm.invalid) {\n      this.createForm.markAllAsTouched();\n      this.showError('Complete correctamente los datos de la solicitud.');\n      return;\n    }\n\n    this.saving = true;\n    this.apiService\n      .post<ResponseGeneric>('patient-data-change/phone', { ...this.createForm.getRawValue(), reason: normalizeText(this.createForm.controls.reason.value) })\n      .pipe(finalize(() => (this.saving = false)))\n      .subscribe({\n        next: (response) => {\n          if (response.type !== 'success') {\n            this.showError(response.listMessage?.join(' ') || 'No se pudo registrar la solicitud.');\n            return;\n          }\n          this.createDialogVisible = false;\n          this.messageService.add({\n            severity: 'success',\n            summary: 'Solicitud enviada',\n            detail: 'El administrador podrá revisar el cambio de teléfono.'\n          });\n          this.loadRequests();\n        },"
      },
      {
        "file": "backend/src/main/java/com/ceramic/apiceramic/controller/PatientDataChangeRequestController.java",
        "lines": "líneas 38–52",
        "code": "    @PostMapping(path = \"phone\")\n    @PreAuthorize(\"hasRole('DOCTOR')\")\n    public ResponseEntity<ResponsePatientDataChangeAction> createPhoneRequest(\n        @AuthenticationPrincipal Jwt jwt,\n        @Valid @RequestBody RequestPatientPhoneChangeInsert request\n    ) {\n        try {\n            return ResponseEntity.ok(business.createPhoneRequest(jwt.getSubject(), request));\n        } catch (Exception exception) {\n            LOGGER.error(\"Error registrando solicitud de cambio de teléfono.\", exception);\n            ResponsePatientDataChangeAction response = new ResponsePatientDataChangeAction();\n            response.exception();\n            response.listMessage.add(\"Ocurrió un error al registrar la solicitud.\");\n            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);\n        }"
      },
      {
        "file": "backend/src/main/java/com/ceramic/apiceramic/business/BusinessPatientDataChangeRequest.java",
        "lines": "líneas 161–196",
        "code": "    public ResponsePatientDataChangeAction review(\n        String idRequest,\n        String keycloakUserId,\n        String username,\n        RequestPatientDataChangeReview request\n    ) {\n        ResponsePatientDataChangeAction response = new ResponsePatientDataChangeAction();\n        Optional<EntityPerson> adminOptional = repositoryPerson.findByKeycloakUserId(keycloakUserId);\n        if (adminOptional.isEmpty() || adminOptional.get().getRole() != EnumPersonRole.ADMIN\n            || !Boolean.TRUE.equals(adminOptional.get().getActive())) {\n            response.warning();\n            response.listMessage.add(\"La cuenta administrativa no está vinculada, está inactiva o no tiene rol ADMIN.\");\n            return response;\n        }\n\n        Optional<EntityPatientDataChangeRequest> entityOptional = repositoryRequest.findByIdForUpdate(normalize(idRequest));\n        if (entityOptional.isEmpty()) {\n            response.warning();\n            response.listMessage.add(\"No se encontró la solicitud que se desea revisar.\");\n            return response;\n        }\n\n        EntityPatientDataChangeRequest entity = entityOptional.get();\n        if (entity.getStatus() != EnumPatientDataChangeRequestStatus.PENDING) {\n            response.warning();\n            response.listMessage.add(\"La solicitud ya fue revisada anteriormente.\");\n            return response;\n        }\n\n        if (!Boolean.TRUE.equals(request.getApproved())\n            && !StringUtils.hasText(request.getObservation())) {\n            response.warning();\n            response.listMessage.add(\"La observación es obligatoria cuando se rechaza una solicitud.\");\n            return response;\n        }\n"
      }
    ],
    "endpoints": [
      "POST /api/patient-data-change/phone",
      "GET /api/patient-data-change/getall",
      "PATCH /api/patient-data-change/review/{idRequest}"
    ],
    "tables": "tpatientdatachangerequest"
  }
];

/* Ceramic Dent D&O · Architecture Studio
   Visualizador 3D proyectado en canvas: sin bibliotecas externas, compatible con GitHub Pages.
   Los procesos y fragmentos del código provienen de las guías E2E del proyecto. */
const $ = (selector) => document.querySelector(selector);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const pad = n => String(n).padStart(2,'0');
const kindNames = {actor:'ACTOR',frontend:'ANGULAR',security:'SEGURIDAD',backend:'SPRING',logic:'SERVICIO',external:'API EXTERNA',identity:'KEYCLOAK',database:'MARIA DB',result:'RESULTADO'};
const categories = {actor:'INTERACCIÓN',frontend:'INTERFAZ',security:'SEGURIDAD',backend:'API',logic:'LÓGICA',external:'EXTERNO',identity:'IDENTIDAD',database:'DATOS',result:'SALIDA'};
// Recorrido en dos hileras. Orden visual 01-05 y después 06-10 de derecha a izquierda.
const positions = [
  [-450,-270],[-225,-270],[0,-270],[225,-270],[450,-270],
  [450,270],[225,270],[0,270],[-225,270],[-450,270]
];
const mobilePositions = [
  [-165,-1100],[165,-1100],[165,-550],[-165,-550],[-165,0],
  [165,0],[165,550],[-165,550],[-165,1100],[165,1100]
];
const yByKind = {actor:95,frontend:95,security:95,backend:95,logic:95,external:95,identity:95,database:95,result:95};
const LINE_SEGMENTS = 22;
const state = {process:0, step:0, showAll:true, snippet:0, playing:false, interval:null, pointer:null, moved:false, lastDragTime:0, viewFlat:false};
const camera={yaw:-.10,targetYaw:-.10,pitch:.68,targetPitch:.68,zoom:1,targetZoom:1,offsetY:0,targetOffsetY:0};
const canvas = $('#scene'), sceneArea = $('#sceneArea'), sceneLabels = $('#sceneLabels'), ctx = canvas.getContext('2d',{alpha:false});
let w=800,h=500,dpr=1;
let nodes=[]; let labels=[]; let currentProjected=[];
// Paleta corporativa: blancos neutros, azul pizarra y acentos desaturados.
// Graphite-blue material. Colour distinguishes architecture roles, not entire blocks.
const palette = {text:'#22384b',accent:'#2e7f8b',edge:'rgba(119,141,156,.28)',bgTop:'#fbfdfe',bgMid:'#f5f8fa',bgBot:'#eef3f6'};
const kindTheme = {
  actor:{base:'#c19a58', light:'#e7d4a8'},
  frontend:{base:'#6f96c7', light:'#d1e0f3'},
  security:{base:'#9c85bb', light:'#ded3ee'},
  backend:{base:'#5b97b1', light:'#d1e8ef'},
  logic:{base:'#6ea7a2', light:'#d7ebe7'},
  external:{base:'#c78a99', light:'#efd4dc'},
  identity:{base:'#8471a5', light:'#ddd4ec'},
  database:{base:'#b59b61', light:'#eedfbb'},
  result:{base:'#71a37e', light:'#d9ebdd'}
};


const kindGeometry = {
  actor:{w:126,d:92,foot:[[-.48,-.30],[-.34,-.48],[.34,-.48],[.48,-.30],[.48,.30],[.34,.48],[-.34,.48],[-.48,.30]]},
  frontend:{w:122,d:92,foot:[[-.46,-.42],[.34,-.42],[.46,.42],[-.34,.42]]},
  security:{w:120,d:98,foot:[[-.34,-.50],[.34,-.50],[.50,0],[.34,.50],[-.34,.50],[-.50,0]]},
  backend:{w:122,d:90,foot:[[-.50,-.38],[.42,-.48],[.50,.34],[-.42,.46]]},
  logic:{w:122,d:90,foot:[[-.42,-.50],[.18,-.50],[.50,-.12],[.50,.50],[-.18,.50],[-.50,.12]]},
  external:{w:118,d:98,foot:[[-.50,-.18],[-.28,-.50],[.28,-.50],[.50,-.18],[.50,.18],[.28,.50],[-.28,.50],[-.50,.18]]},
  identity:{w:106,d:106,foot:[[0,-.54],[.50,0],[0,.54],[-.50,0]]},
  database:{w:122,d:92,foot:[[-.42,-.42],[.42,-.42],[.56,0],[.42,.42],[-.42,.42],[-.56,0]]},
  result:{w:132,d:96,foot:[[-.46,-.48],[.18,-.48],[.50,-.10],[.40,.48],[-.32,.48],[-.50,.08]]}
};

function init(){
  renderMembers();
  resize();
  if(w<560){camera.yaw=camera.targetYaw=0;}
  camera.zoom = camera.targetZoom = defaultSceneZoom();
  renderProcess(true);
  fitCameraToScene(true);
  setupControls();
  new ResizeObserver(resize).observe(sceneArea);
  requestAnimationFrame(frame);
}

function renderMembers(){
  $('#memberNav').innerHTML = PROCESSES.map((p,i) => `<button class="member-btn ${i===state.process?'active':''}" data-member="${i}" aria-pressed="${i===state.process}"><span class="member-index">${pad(i+1)}</span><span class="member-text"><strong>${esc(p.short)}</strong><small>${esc(p.title)}</small></span><span class="member-mark"></span></button>`).join('');
  document.querySelectorAll('[data-member]').forEach(btn=>btn.addEventListener('click',()=>switchProcess(+btn.dataset.member)));
}
function switchProcess(i){
  if (i<0 || i>=PROCESSES.length) return;
  stopPlay();
  state.process=i;state.step=0;state.showAll=true;state.snippet=0;
  camera.targetYaw=w<560?0:-.10;camera.targetPitch=.68;camera.targetZoom=defaultSceneZoom();
  renderMembers();renderProcess(true);
  fitCameraToScene();
}
function makeNodes(){
  const p=PROCESSES[state.process];
  nodes=p.steps.map((step,i)=>({
    i,id:`${state.process}-${i}`,
    name:p.nodeNames[i],kind:p.kinds[i],pos:{x:(w<560?mobilePositions:positions)[i][0],y:yByKind[p.kinds[i]],z:(w<560?mobilePositions:positions)[i][1]}
  }));
  sceneLabels.innerHTML='';labels=[];
  for(const n of nodes){
    const btn=document.createElement('button');
    btn.type='button';btn.className=`node-label kind-${n.kind}`;btn.dataset.kind=n.kind;btn.setAttribute('aria-label',`Etapa ${n.i+1}: ${n.name}`);
    btn.innerHTML=`<span class="node-id">${pad(n.i+1)}</span><span class="node-name">${esc(n.name)}<span class="node-kind">${kindNames[n.kind]}</span></span>`;
    btn.addEventListener('click',()=>{if(Date.now()-state.lastDragTime>190)selectStep(n.i)});
    sceneLabels.appendChild(btn);labels.push(btn);
  }
}
function renderProcess(resetCode=false){
  const p=PROCESSES[state.process];
  $('#processNumber').textContent=`${pad(p.index)} / 05`;
  $('#processOwner').textContent=p.member.toUpperCase();
  $('#processTitle').textContent=p.title;
  $('#processSubtitle').textContent=p.start;
  $('#processResult').textContent=p.end;
  $('#startEnd').textContent='INICIO  →  '+p.end.toUpperCase();
  $('#flowState').textContent='01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10';
  makeNodes();
  $('#stepper').innerHTML=p.steps.map((step,i)=>`<button title="${esc(step.name)}" class="step-item" data-step="${i}"><span>${pad(i+1)}</span><small>${esc(step.name)}</small></button>`).join('');
  document.querySelectorAll('[data-step]').forEach(btn=>btn.addEventListener('click',()=>selectStep(+btn.dataset.step)));
  if(resetCode)renderCodeTabs();
  renderSelected();
}
function selectStep(index){
  const max=PROCESSES[state.process].steps.length-1;
  state.step=Math.max(0,Math.min(max,index));state.showAll=false;
  state.snippet=state.step<3?0:state.step<7?1:2;
  renderSelected();
  renderCodeTabs();
}
function showAll(){state.showAll=true;renderSelected();}
function renderSelected(){
  const p=PROCESSES[state.process],s=p.steps[state.step];
  $('#panelIndex').textContent=`${pad(state.step+1)} / 10`;
  $('#stepCounter').textContent=`ETAPA ${pad(state.step+1)} / 10`;
  $('#detailName').textContent=s.name;
  $('#detailDescription').textContent=s.description;
  $('#detailData').textContent=s.data;
  $('#btnPrev').disabled=state.step===0;
  $('#btnNext').disabled=state.step===9;
  document.querySelectorAll('.step-item').forEach((b,i)=>{b.classList.toggle('active',i===state.step);b.classList.toggle('passed',i<state.step)});
  for(let i=0;i<labels.length;i++){
    labels[i].classList.toggle('active',i===state.step);
    labels[i].classList.toggle('dim',!state.showAll && i!==state.step && i!==state.step-1);
    labels[i].setAttribute('aria-pressed',String(i===state.step));
  }
  $('#btnShowAll').textContent=state.showAll?'Enfocar etapa actual ↗':'Mostrar flujo completo ↗';
  renderCode();
}
function renderCodeTabs(){
  const p=PROCESSES[state.process];
  $('#snippetTabs').innerHTML=p.evidence.map((item,i)=>{
    const file=item.file.toLowerCase();
    let label=file.endsWith('.ts')?'Angular':file.includes('/controller/')?'Controller':file.includes('/business/')?'Business':'Código';
    return `<button class="snippet-tab" title="${esc(item.file)}" data-snippet="${i}">${pad(i+1)} · ${label}</button>`;
  }).join('');
  document.querySelectorAll('[data-snippet]').forEach(b=>b.addEventListener('click',()=>{state.snippet=+b.dataset.snippet;renderCode()}));
  renderCode();
}
// Escape any source code before inserting spans for highlighting.
function escapeCodeHTML(text){return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function syntaxHTML(line){
  const token=/(\/\/.*|\/\*.*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:public|private|protected|static|final|class|interface|return|new|const|let|var|if|else|try|catch|throw|this|void|true|false|null|extends|implements|import|package|boolean|int|String|Optional|ResponseEntity|Override|Transactional)\b|@[A-Za-z_]+|\b\d+\b)/g;
  let html='',last=0;
  for(const match of line.matchAll(token)){
    html+=escapeCodeHTML(line.slice(last,match.index));
    const text=match[0];
    const type=text.startsWith('//')||text.startsWith('/*')?'syntax-comment':text.startsWith('"')||text.startsWith("'")||text.startsWith('`')?'syntax-string':/^\d/.test(text)?'syntax-number':'syntax-keyword';
    html+=`<span class="${type}">${escapeCodeHTML(text)}</span>`;
    last=match.index+text.length;
  }
  return html+escapeCodeHTML(line.slice(last));
}
function numberedHTML(e){
  const start=Number((e.lines||'').match(/\d+/)?.[0]||1);
  return e.code.split('\n').map((text,index)=>`<span class="code-line"><span class="code-ln" aria-hidden="true">${start+index}</span><span class="code-src">${syntaxHTML(text)||' '}</span></span>`).join('');
}
function codeData(){const p=PROCESSES[state.process];return p.evidence[Math.min(state.snippet,p.evidence.length-1)];}
let codeWrap=true;
function syncCodeWrap(){
  $('#codePreview').classList.toggle('no-wrap',!codeWrap);
  $('#expandedPreview').classList.toggle('no-wrap',!codeWrap);
  $('#toggleWrap').setAttribute('aria-pressed',String(codeWrap));
  $('#expandedWrap').setAttribute('aria-pressed',String(codeWrap));
  $('#toggleWrap').title=codeWrap?'Desactivar ajuste de línea':'Ajustar líneas largas';
}
function renderCode(){
  const p=PROCESSES[state.process];
  const i=Math.min(state.snippet,p.evidence.length-1);
  const e=p.evidence[i];
  if(!e)return;
  $('#snippetCounter').textContent=`${pad(i+1)} / ${pad(p.evidence.length)}`;
  $('#snippetFile').textContent=e.file.split('/').slice(-1)[0];
  $('#snippetFile').title=e.file;
  $('#codeCaption').textContent=`${e.lines} · ${e.file}`;
  $('#codeView').innerHTML=numberedHTML(e);
  $('#codePreview').scrollTop=0;$('#codePreview').scrollLeft=0;
  document.querySelectorAll('.snippet-tab').forEach((b,j)=>b.classList.toggle('active',j===i));
  if(!$('#codeModal').hidden)renderExpandedCode();
}
function renderExpandedCode(){
  const e=codeData();if(!e)return;
  $('#expandedTitle').textContent=e.file.split('/').pop();
  $('#expandedPath').textContent=e.file;
  $('#expandedLines').textContent=e.lines;
  $('#expandedCode').innerHTML=numberedHTML(e);
  $('#expandedPreview').scrollTop=0;$('#expandedPreview').scrollLeft=0;
  syncCodeWrap();
}
function openCodeModal(){renderExpandedCode();$('#codeModal').hidden=false;document.body.classList.add('code-dialog-open');$('#closeCode').focus();}
function closeCodeModal(){$('#codeModal').hidden=true;document.body.classList.remove('code-dialog-open');$('#expandCode').focus();}
async function copyCurrentCode(){
  const e=codeData();if(!e)return;
  try{await navigator.clipboard.writeText(e.code);notify('Código copiado');}
  catch{notify('Selecciona el código y usa Ctrl+C');}
}
function setupControls(){
  $('#btnPrev').addEventListener('click',()=>selectStep(state.step-1));
  $('#btnNext').addEventListener('click',()=>selectStep(state.step+1));
  $('#btnShowAll').addEventListener('click',()=>state.showAll?selectStep(state.step):showAll());
  $('#btnReset').addEventListener('click',resetCamera);
  $('#btnZoomIn').addEventListener('click',()=>camera.targetZoom=clamp(camera.targetZoom*1.18,.58,1.6));
  $('#btnZoomOut').addEventListener('click',()=>camera.targetZoom=clamp(camera.targetZoom/1.18,.58,1.6));
  $('#btnFlat').addEventListener('click',()=>{state.viewFlat=!state.viewFlat;camera.targetPitch=state.viewFlat?1.54:.77;camera.targetYaw=state.viewFlat?0:-.08;$('#cameraCaption').textContent=state.viewFlat?'VISTA SUPERIOR · 2D':'PERSPECTIVA · 3D'});
  $('#btnPlay').addEventListener('click',togglePlay);
  $('#copyCode').addEventListener('click',copyCurrentCode);
  $('#expandedCopy').addEventListener('click',copyCurrentCode);
  $('#expandCode').addEventListener('click',openCodeModal);
  $('#closeCode').addEventListener('click',closeCodeModal);
  $('#codeModal').addEventListener('click',e=>{if(e.target===$('#codeModal'))closeCodeModal();});
  for(const id of ['toggleWrap','expandedWrap']) $('#'+id).addEventListener('click',()=>{codeWrap=!codeWrap;syncCodeWrap();});
  syncCodeWrap();
  $('#btnInfo').addEventListener('click',()=>$('#helpModal').hidden=false);
  $('#closeHelp').addEventListener('click',closeHelp);
  $('#gotIt').addEventListener('click',closeHelp);
  $('#helpModal').addEventListener('click',e=>{if(e.target===$('#helpModal'))closeHelp()});
  sceneArea.addEventListener('pointerdown',e=>{
    if(e.button!==0 && e.pointerType==='mouse')return;
    if(e.target.closest('.scene-tools') || e.target.closest('.node-label'))return;
    state.pointer={id:e.pointerId,x:e.clientX,y:e.clientY,px:e.clientX,py:e.clientY};
    state.moved=false;
    sceneArea.setPointerCapture?.(e.pointerId);
  });
  sceneArea.addEventListener('pointermove',e=>{
    if(!state.pointer||e.pointerId!==state.pointer.id)return;
    const dx=e.clientX-state.pointer.px,dy=e.clientY-state.pointer.py;
    state.pointer.px=e.clientX;state.pointer.py=e.clientY;
    if(Math.hypot(e.clientX-state.pointer.x,e.clientY-state.pointer.y)>4)state.moved=true;
    if(state.moved){camera.targetYaw=clamp(camera.targetYaw+dx*.007,-1.25,1.25);camera.targetPitch=clamp(camera.targetPitch+dy*.006,.45,1.54);sceneArea.classList.add('dragging')}
  });
  function pointerEnd(e){if(!state.pointer||e.pointerId!==state.pointer.id)return;if(state.moved)state.lastDragTime=Date.now();state.pointer=null;sceneArea.classList.remove('dragging')}
  sceneArea.addEventListener('pointerup',pointerEnd);sceneArea.addEventListener('pointercancel',pointerEnd);
  sceneArea.addEventListener('wheel',e=>{
    // El desplazamiento normal mueve la página. Ctrl/Alt + rueda hace zoom 3D.
    if(!e.ctrlKey && !e.altKey)return;
    e.preventDefault();
    camera.targetZoom=clamp(camera.targetZoom*Math.exp(-e.deltaY*.001),.58,1.6);
  },{passive:false});
  sceneArea.addEventListener('dblclick',resetCamera);
  document.addEventListener('keydown',e=>{
    if(!$('#codeModal').hidden){if(e.key==='Escape'){closeCodeModal();e.preventDefault();}return;}
    if(!$('#helpModal').hidden){if(e.key==='Escape')closeHelp();return}
    if(['INPUT','TEXTAREA'].includes(document.activeElement?.tagName))return;
    if(e.key==='ArrowRight'){selectStep(state.step+1);e.preventDefault()}
    if(e.key==='ArrowLeft'){selectStep(state.step-1);e.preventDefault()}
    if(e.key===' '){togglePlay();e.preventDefault()}
  });
}
function closeHelp(){$('#helpModal').hidden=true}
function notify(message){const t=$('#toast');t.textContent=message;t.classList.add('show');clearTimeout(notify.id);notify.id=setTimeout(()=>t.classList.remove('show'),1700)}
function defaultSceneZoom(){const width=sceneArea.getBoundingClientRect().width;return width<500?1.43:width<790?.74:width<980?.72:.76;}
function resetCamera(){camera.targetYaw=w<560?0:-.10;camera.targetPitch=.68;state.viewFlat=false;$('#cameraCaption').textContent='PERSPECTIVA · 3D';fitCameraToScene();}
function togglePlay(){state.playing?stopPlay():startPlay()}
function startPlay(){stopPlay();state.playing=true;state.step=0;selectStep(0);$('#btnPlay').innerHTML='Ⅱ <span>Pausar</span>';state.interval=setInterval(()=>{if(state.step>=9){stopPlay();return}selectStep(state.step+1)},2200)}
function stopPlay(){state.playing=false;clearInterval(state.interval);state.interval=null;$('#btnPlay').innerHTML='▶ <span>Reproducir</span>'}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function resize(){
  const b=sceneArea.getBoundingClientRect(),oldW=w,oldH=h;
  w=Math.max(1,b.width);h=Math.max(1,b.height);
  dpr=Math.min(window.devicePixelRatio||1,2);
  canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
  canvas.style.width=w+'px';canvas.style.height=h+'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
  if(nodes.length && ((oldW<560)!==(w<560))){
    for(const n of nodes){const a=(w<560?mobilePositions:positions)[n.i];n.pos.x=a[0];n.pos.z=a[1];}
  }
  if(nodes.length && (Math.abs(oldW-w)>2 || Math.abs(oldH-h)>2)) fitCameraToScene(true);
}
/** Use the actual projected footprints, not a guessed browser-specific zoom.
 *  The same framing calculation serves 100% desktop zoom and narrower laptops.
 */
function fitCameraToScene(immediate=false){
  if(!nodes.length || w<10 || h<10)return;
  const saved={yaw:camera.yaw,pitch:camera.pitch,zoom:camera.zoom,offsetY:camera.offsetY};
  camera.yaw=camera.targetYaw;camera.pitch=camera.targetPitch;
  camera.zoom=1;camera.offsetY=0;
  const pts=[];
  for(const node of nodes){
    pts.push(...projectShape(node,0),...projectShape(node,-52));
    pts.push(project(worldPt(node.pos.x,-40,node.pos.z+3)));
  }
  const x0=Math.min(...pts.map(p=>p.x)),x1=Math.max(...pts.map(p=>p.x));
  const y0=Math.min(...pts.map(p=>p.y)),y1=Math.max(...pts.map(p=>p.y));
  const padX=w<560?34:55,topPad=w<560?45:48,bottomPad=w<560?90:90;
  const fitX=(w-2*padX)/Math.max(1,x1-x0);
  const fitY=(h-topPad-bottomPad)/Math.max(1,y1-y0);
  const fit=clamp(Math.min(fitX,fitY)*(w<560?.97:1.075),w<560?.55:.64,w<560?2.0:1.36);
  camera.zoom=fit;
  const centered=[];
  for(const node of nodes){centered.push(...projectShape(node,0),project(worldPt(node.pos.x,-40,node.pos.z+3)));}
  const fy0=Math.min(...centered.map(p=>p.y)),fy1=Math.max(...centered.map(p=>p.y));
  const desiredMid=(topPad+(h-bottomPad))/2;
  const shift=clamp(desiredMid-(fy0+fy1)/2,-h*.2,h*.2);
  camera.yaw=saved.yaw;camera.pitch=saved.pitch;camera.zoom=saved.zoom;camera.offsetY=saved.offsetY;
  camera.targetZoom=fit;camera.targetOffsetY=shift;
  if(immediate){camera.yaw=camera.targetYaw;camera.pitch=camera.targetPitch;camera.zoom=fit;camera.offsetY=shift;}
}
// Camera projection genuinely varies all three world coordinates with orbit, tilt, perspective and zoom.
function project(p){
  const ya=camera.yaw,pi=camera.pitch;
  const cosy=Math.cos(ya),siny=Math.sin(ya),cosp=Math.cos(pi),sinp=Math.sin(pi);
  const right=p.x*cosy-p.z*siny;
  const up=-p.x*siny*sinp+p.y*cosp-p.z*cosy*sinp;
  const towards=p.x*siny*cosp+p.y*sinp+p.z*cosy*cosp;
  const distance=(w<560?2200:1480)-towards;
  const focal=Math.min(w*1.25,h*2.05)*camera.zoom*(w<560?1.4:1);
  const scale=focal/Math.max(420,distance);
  return {x:w*.5+right*scale,y:h*.47-up*scale+camera.offsetY,scale,distance};
}
function worldPt(x,y,z){return {x,y,z}}
function pathPoly(pts,color,stroke=null,width=1){
  if(!pts.length)return;ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y);ctx.closePath();ctx.fillStyle=color;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke()}
}
function pathLine(a,b,color,width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}
function hexToRgba(hex,alpha){const v=hex.replace('#','');const n=parseInt(v.length===3?v.split('').map(c=>c+c).join(''):v,16);return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${alpha})`;}
function shade(hex,factor){const v=hex.replace('#','');const n=parseInt(v.length===3?v.split('').map(c=>c+c).join(''):v,16);const cl=v=>Math.max(0,Math.min(255,Math.round(v)));const r=cl(((n>>16)&255)*factor),g=cl(((n>>8)&255)*factor),b=cl((n&255)*factor);return `rgb(${r},${g},${b})`;}
function shadeRgba(hex,factor,alpha){const v=hex.replace('#','');const n=parseInt(v,16);const cl=x=>Math.max(0,Math.min(255,Math.round(x)));return `rgba(${cl(((n>>16)&255)*factor)},${cl(((n>>8)&255)*factor)},${cl((n&255)*factor)},${alpha})`; }
function getTheme(node,focus,dim){
  const base=(kindTheme[node.kind]||kindTheme.backend).base;
  const light=(kindTheme[node.kind]||kindTheme.backend).light;
  return {base,light,top:focus?light:shade(base,1.03),front:shade(base,.88),side:shade(base,.74),edge:focus?shade(base,.84):shade(base,.94),glow:hexToRgba(base,focus?.13:.05),alpha:dim?.40:1};
}
function stageActive(i){return state.showAll||i===state.step||i===state.step-1}
function projectShape(node,yOffset=0,w=114,d=114){
  const g=kindGeometry[node.kind]||kindGeometry.backend;
  // The footprint coordinates are already normalized to +/- 0.5.
  // Multiplying by half the physical size was shrinking the 3D shapes to sticks.
  const W=(g.w||w), D=(g.d||d);
  return g.foot.map(([px,pz])=>project(worldPt(node.pos.x+px*W,node.pos.y+yOffset,node.pos.z+pz*D)));
}
function drawFloor(){
  ctx.strokeStyle='rgba(196,210,218,.36)';
  ctx.lineWidth=1;
  for(let py=82;py<h-40;py+=34){ctx.beginPath();ctx.moveTo(18,py);ctx.lineTo(w-18,py);ctx.stroke();}
  for(let px=28;px<w-20;px+=34){ctx.beginPath();ctx.moveTo(px,82);ctx.lineTo(px,h-42);ctx.stroke();}
  ctx.fillStyle='rgba(143,164,176,.13)';
  for(let py=98;py<h-55;py+=68){for(let px=44;px<w-30;px+=68){ctx.fillRect(px,py,2,2);}}
}
function drawShadow(node){
  const p=project({x:node.pos.x,y:-65,z:node.pos.z});
  ctx.save();ctx.translate(p.x,p.y);ctx.scale(1,.26);
  let r=96*p.scale;const g=ctx.createRadialGradient(0,0,4,0,0,r);
  g.addColorStop(0,'rgba(35,58,74,.14)');g.addColorStop(.55,'rgba(35,58,74,.06)');g.addColorStop(1,'rgba(35,58,74,0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.restore();
}
function drawIcon(kind, x, y, size, col){
 ctx.save();ctx.translate(x,y);ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=Math.max(1.5,size*.065);ctx.lineCap='round';ctx.lineJoin='round';
 const s=size/20;ctx.scale(s,s);ctx.beginPath();
 switch(kind){
 case 'actor':ctx.arc(0,-5,3.4,0,Math.PI*2);ctx.moveTo(-6,7);ctx.quadraticCurveTo(-6,-1,0,-1);ctx.quadraticCurveTo(6,-1,6,7);ctx.stroke();break;
 case 'frontend':ctx.rect(-8,-7,16,11);ctx.moveTo(-3,8);ctx.lineTo(3,8);ctx.moveTo(0,4);ctx.lineTo(0,8);ctx.stroke();break;
 case 'security':ctx.moveTo(0,-9);ctx.lineTo(7,-6);ctx.lineTo(6,2);ctx.quadraticCurveTo(5,7,0,9);ctx.quadraticCurveTo(-5,7,-6,2);ctx.lineTo(-7,-6);ctx.closePath();ctx.stroke();break;
 case 'database':ctx.ellipse(0,-6,7,3,0,0,Math.PI*2);ctx.moveTo(-7,-6);ctx.lineTo(-7,6);ctx.ellipse(0,6,7,3,0,0,Math.PI);ctx.moveTo(7,-6);ctx.lineTo(7,6);ctx.stroke();break;
 case 'identity':ctx.rect(-6,-1,12,9);ctx.moveTo(-4,-1);ctx.lineTo(-4,-4);ctx.arc(0,-4,4,Math.PI,0);ctx.lineTo(4,-1);ctx.moveTo(0,3);ctx.lineTo(0,5);ctx.stroke();break;
 case 'external':ctx.arc(-6,-5,2,0,Math.PI*2);ctx.moveTo(-4,-4);ctx.lineTo(5,3);ctx.moveTo(4,-7);ctx.lineTo(4,1);ctx.arc(4,-8,2,0,Math.PI*2);ctx.moveTo(-6,6);ctx.lineTo(4,3);ctx.arc(-7,7,2,0,Math.PI*2);ctx.stroke();break;
 case 'result':ctx.moveTo(-9,0);ctx.lineTo(-3,6);ctx.lineTo(9,-7);ctx.stroke();break;
 case 'logic':ctx.moveTo(-7,-5);ctx.lineTo(-3,-5);ctx.lineTo(-3,4);ctx.lineTo(-7,4);ctx.moveTo(7,-5);ctx.lineTo(3,-5);ctx.lineTo(3,4);ctx.lineTo(7,4);ctx.moveTo(-1,-8);ctx.lineTo(1,7);ctx.stroke();break;
 default:ctx.rect(-7,-7,14,14);ctx.moveTo(-2,-7);ctx.lineTo(-2,7);ctx.moveTo(-7,-2);ctx.lineTo(7,-2);ctx.stroke();break;
 }
 ctx.restore();
}
function drawStage(node,t){
 const focus=node.i===state.step, dim=!stageActive(node.i),theme=getTheme(node,focus,dim);
 const top=projectShape(node,0,104,104),bot=projectShape(node,-52,104,104);
 const center=project(worldPt(node.pos.x,node.pos.y+1,node.pos.z));
 const edges=[];for(let i=0;i<top.length;i++){let j=(i+1)%top.length;edges.push({i,j,avg:(top[i].y+top[j].y)/2});}
 const visible=edges.filter(e=>e.avg>=center.y-4).sort((a,b)=>a.avg-b.avg);
 ctx.save();ctx.globalAlpha=theme.alpha;
 for(const e of visible){pathPoly([top[e.i],top[e.j],bot[e.j],bot[e.i]],e.avg>center.y+1?theme.front:theme.side);}
 const gradient=ctx.createLinearGradient(center.x,Math.min(...top.map(p=>p.y)),center.x,Math.max(...top.map(p=>p.y)));
 gradient.addColorStop(0,focus?theme.light:shade(theme.light,.98));gradient.addColorStop(1,shade(theme.base,1.02));
 pathPoly(top,gradient,theme.edge,focus?2:1.3);
 // placa superior blanca
 const insetTop=top.map(p=>({x:center.x+(p.x-center.x)*.62,y:center.y+(p.y-center.y)*.62}));
 pathPoly(insetTop,'rgba(255,255,255,.82)','rgba(255,255,255,.7)',1);
 if(focus){ctx.shadowBlur=16;ctx.shadowColor=theme.glow;ctx.strokeStyle=hexToRgba(theme.base,.42);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(top[0].x,top[0].y);top.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));ctx.closePath();ctx.stroke();ctx.shadowBlur=0;}
 const cp=project(worldPt(node.pos.x,node.pos.y+2,node.pos.z));
 drawIcon(node.kind,cp.x,cp.y-4,Math.max(14,Math.min(26,31*cp.scale)),shade(theme.base,.8));
 ctx.restore();
}
function interpolateEdge(a,b,u){
 const lift=27*Math.sin(Math.PI*u);
 return {x:a.x+(b.x-a.x)*u,y:-57+lift,z:a.z+(b.z-a.z)*u};
}
function drawEdge(a,b,index,t){
 const isPath=state.showAll||index<state.step;
 const hi=!state.showAll&&index===state.step-1;
 const alpha=isPath?.42:.16;
 ctx.save();ctx.strokeStyle=hi?'rgba(71,132,146,.78)':`rgba(133,153,166,${alpha})`;ctx.lineWidth=hi?2.1:1.35;
 ctx.beginPath();for(let i=0;i<=LINE_SEGMENTS;i++){
  const pos=project(interpolateEdge(a.pos,b.pos,i/LINE_SEGMENTS));if(i===0)ctx.moveTo(pos.x,pos.y);else ctx.lineTo(pos.x,pos.y);
 }ctx.stroke();ctx.restore();
 const p1=project(interpolateEdge(a.pos,b.pos,.91)),p2=project(interpolateEdge(a.pos,b.pos,.95));
 ctx.save();ctx.translate(p2.x,p2.y);ctx.rotate(Math.atan2(p2.y-p1.y,p2.x-p1.x));ctx.fillStyle=hi?'#518693':'#98adb8';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-7,-3);ctx.lineTo(-7,3);ctx.closePath();ctx.fill();ctx.restore();
 if(hi){const pos=project(interpolateEdge(a.pos,b.pos,(t%2200)/2200));ctx.fillStyle='#3c7c88';ctx.beginPath();ctx.arc(pos.x,pos.y,3.2,0,Math.PI*2);ctx.fill();}
}
function renderScene(time){
 const grad=ctx.createLinearGradient(0,0,0,h);grad.addColorStop(0,palette.bgTop);grad.addColorStop(.55,palette.bgMid);grad.addColorStop(1,palette.bgBot);ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
 drawFloor();nodes.forEach(drawShadow);
 for(let i=0;i<nodes.length-1;i++)drawEdge(nodes[i],nodes[i+1],i,time);
 for(const node of [...nodes].sort((a,b)=>project(b.pos).distance-project(a.pos).distance))drawStage(node,time);
 for(const n of nodes){
  const p=project(worldPt(n.pos.x,-25,n.pos.z+3)),lab=labels[n.i];
  const scale=clamp(p.scale*1.35,.76,1.08);
  lab.style.left=p.x+'px';lab.style.top=p.y+'px';lab.style.transform=`translate(-50%,-3%) scale(${scale})`;
  lab.style.zIndex=String(Math.round(2000-p.distance));
  lab.style.visibility=(p.x < -130||p.x>w+130||p.y<-90||p.y>h+60)?'hidden':'visible';
 }
}
function frame(time){
  camera.yaw += (camera.targetYaw-camera.yaw)*.1;
  camera.pitch += (camera.targetPitch-camera.pitch)*.1;
  camera.zoom += (camera.targetZoom-camera.zoom)*.1;
  camera.offsetY += (camera.targetOffsetY-camera.offsetY)*.12;
  renderScene(time);
  requestAnimationFrame(frame);
}
init();
