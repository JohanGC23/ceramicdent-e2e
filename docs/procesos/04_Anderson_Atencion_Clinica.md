# 4. Atención odontológica y actualización clínica

**Responsable:** Huamani Alarcon Anderson

**Inicio:** Un odontólogo inicia la atención de una cita confirmada y registra el procedimiento realizado.

**Resultado:** Cita COMPLETED, historial ATTENDED, diagnóstico/tratamiento y recomendaciones persistidos.

## Diagrama de arquitectura E2E

![Diagrama Jeymi](../diagramas/04_Jeymi_Atencion_Clinica.png)

## Recorrido de extremo a extremo

1. **Inicio:** Doctor selecciona una cita CONFIRMED que le corresponde. **Datos:** idAppointment.
2. **Estado:** Angular llama changestatus con IN_PROGRESS. **Datos:** Estado y JWT.
3. **Controller:** AppointmentController.actionChangeStatus delega al negocio. **Datos:** RequestAppointmentStatus.
4. **Reglas:** BusinessAppointment valida transición, acceso y hora de inicio. **Datos:** Estado previo, hora programada.
5. **Persistencia 1:** Actualiza tappointment a IN_PROGRESS y sincroniza historial. **Datos:** idAppointment, status=IN_PROGRESS.
6. **Clínica:** Doctor escribe diagnóstico, tratamiento, notas y recomendaciones. **Datos:** Texto clínico.
7. **Solicitud final:** Angular envía PATCH appointment/finalize/{id}. **Datos:** RequestAppointmentFinalize.
8. **Validación:** BusinessAppointment.finalizeAppointment exige estado IN_PROGRESS y datos obligatorios. **Datos:** Diagnóstico y tratamiento.
9. **Persistencia 2:** Guarda cita COMPLETED, tmedicalhistory ATTENDED y trecommendation. **Datos:** Datos de atención, momento final y recomendaciones.
10. **Resultado:** Genera auditoría/aviso y respuesta con historial. **Datos:** Servicio realizado e historial actualizado.

## Endpoints relevantes

- `PATCH /api/appointment/changestatus/{idAppointment}`
- `PATCH /api/appointment/finalize/{idAppointment}`

## Tablas

`tappointment`, `tmedicalhistory`, `trecommendation`, `tauditlog`, `tnotification`

## Evidencia del código (extractos parciales)

Estos extractos provienen del código original; para revisar la implementación completa se requiere acceso al repositorio privado del grupo.

### Inicio de atención en backend

**Ruta de origen:** `backend/src/main/java/com/ceramic/apiceramic/business/BusinessAppointment.java` (líneas 448–480)

```java
0448 |     public ResponseAppointmentStatus changeStatus(String idAppointment, RequestAppointmentStatus request) {
0449 |         ResponseAppointmentStatus response = new ResponseAppointmentStatus();
0450 |         Optional<EntityAppointment> optional = repositoryAppointment.findByIdForUpdate(normalizeId(idAppointment));
0451 |         if (optional.isEmpty()) { response.warning(); response.listMessage.add("No se encontró la cita."); return response; }
0452 |         EntityAppointment entity = optional.get();
0453 |         EnumAppointmentStatus target = request.getStatus();
0454 |         if (target == null) { response.warning(); response.listMessage.add("El estado es obligatorio."); return response; }
0455 |         if (target == EnumAppointmentStatus.CONFIRMED && entity.getParentDoctor() == null) {
0456 |             response.warning(); response.listMessage.add("Use Confirmar y tomar cita para asignarla al doctor autenticado."); return response;
0457 |         }
0458 |         if (target == EnumAppointmentStatus.COMPLETED) {
0459 |             response.warning(); response.listMessage.add("Use Finalizar atención para registrar el contenido clínico."); return response;
0460 |         }
0461 |         if (!accessControl.canModifyAppointment(entity, response.listMessage)) { response.warning(); return response; }
0462 |         if (!isValidStatusTransition(entity.getStatus(), target)) {
0463 |             response.warning(); response.listMessage.add("El cambio de estado no es válido."); return response;
0464 |         }
0465 |         LocalDateTime now = LocalDateTime.now();
0466 |         if (target == EnumAppointmentStatus.IN_PROGRESS && now.isBefore(entity.getAppointmentDateTime().minusMinutes(EARLY_START_MINUTES))) {
0467 |             response.warning(); response.listMessage.add("La atención solo puede iniciarse hasta 10 minutos antes del horario programado."); return response;
0468 |         }
0469 |         if (target == EnumAppointmentStatus.NO_SHOW && now.isBefore(calculateEndDateTime(entity))) {
0470 |             response.warning(); response.listMessage.add("No se puede marcar inasistencia antes de finalizar el horario de la cita."); return response;
0471 |         }
0472 |
0473 |         Map<String, Object> before = toAppointmentMap(entity);
0474 |         entity.setStatus(target);
0475 |         repositoryAppointment.saveAndFlush(entity);
0476 |         if (target == EnumAppointmentStatus.CANCELLED || target == EnumAppointmentStatus.NO_SHOW) {
0477 |             syncClosedMedicalHistory(entity, toAttendanceStatus(target));
0478 |         } else {
0479 |             ensureScheduledMedicalHistory(entity);
0480 |         }
```

### Formulario de finalización

**Ruta de origen:** `frontend/src/app/page/appointment/appointment-list/appointment-list.ts` (líneas 342–365)

```ts
0342 |   protected finalizeAttention(): void {
0343 |     if (!this.finishAppointment) {
0344 |       return;
0345 |     }
0346 |
0347 |     if (this.finishForm.invalid) {
0348 |       this.finishForm.markAllAsTouched();
0349 |       this.showError('Registra diagnóstico y tratamiento realizado para finalizar la atención.');
0350 |       return;
0351 |     }
0352 |
0353 |     const raw = this.finishForm.getRawValue();
0354 |     const payload: AppointmentFinalizePayload = {
0355 |       diagnosis: normalizeText(raw.diagnosis),
0356 |       treatment: normalizeText(raw.treatment),
0357 |       notes: normalizeText(raw.notes) || null,
0358 |       doctorNotes: normalizeText(raw.doctorNotes) || null,
0359 |       recommendationList: this.parseRecommendations(raw.recommendations ?? '')
0360 |     };
0361 |
0362 |     this.finishing = true;
0363 |     this.apiService
0364 |       .patch<ResponseGeneric>(`appointment/finalize/${this.finishAppointment.idAppointment}`, payload)
0365 |       .pipe(finalize(() => (this.finishing = false)))
```

### Transacción e historial clínico

**Ruta de origen:** `backend/src/main/java/com/ceramic/apiceramic/business/BusinessAppointment.java` (líneas 511–545)

```java
0511 |         Map<String, Object> before = toAppointmentMap(entity);
0512 |         entity.setDoctorNotes(normalizeText(request.getDoctorNotes()));
0513 |         entity.setStatus(EnumAppointmentStatus.COMPLETED);
0514 |         repositoryAppointment.saveAndFlush(entity);
0515 |
0516 |         EntityMedicalHistory history = ensureMedicalHistory(entity);
0517 |         syncMedicalHistoryBase(history, entity);
0518 |         history.setAttendanceStatus(EnumClinicalAttendanceStatus.ATTENDED);
0519 |         history.setDiagnosis(diagnosis);
0520 |         history.setTreatment(treatment);
0521 |         history.setNotes(normalizeText(request.getNotes()));
0522 |         history.setDoctorNotes(entity.getDoctorNotes());
0523 |         history.setCompletedAt(LocalDateTime.now());
0524 |         repositoryMedicalHistory.saveAndFlush(history);
0525 |
0526 |         for (String item : normalizeRecommendationList(request.getRecommendationList())) {
0527 |             EntityRecommendation recommendation = new EntityRecommendation();
0528 |             recommendation.setIdRecommendation(GenericHelper.generateUuid());
0529 |             recommendation.setParentPatient(entity.getParentPatient());
0530 |             recommendation.setParentDoctor(entity.getParentDoctor());
0531 |             recommendation.setParentAppointment(entity);
0532 |             recommendation.setDescription(item);
0533 |             repositoryRecommendation.saveAndFlush(recommendation);
0534 |             response.getListRecommendation().add(toRecommendationMap(recommendation));
0535 |         }
0536 |         Map<String, Object> after = toAppointmentMap(entity);
0537 |         Map<String, Object> historyMap = toMedicalHistoryMap(history);
0538 |         businessAuditLog.register("ATENCION_CLINICA", "FINALIZAR_ATENCION", "Appointment", entity.getIdAppointment(),
0539 |             "Se finalizó la atención y se actualizó automáticamente el historial clínico.", before,
0540 |             Map.of("appointment", after, "medicalHistory", historyMap));
0541 |         businessNotification.createForRole("ADMIN", "Atención finalizada",
0542 |             "Finalizó la atención de " + entity.getParentPatient().getFullName() + ".", "ATENCION_CLINICA", entity.getIdAppointment());
0543 |         response.setAppointment(after); response.setMedicalHistory(historyMap); response.success();
0544 |         response.listMessage.add("La atención finalizó y el historial clínico se actualizó automáticamente.");
0545 |         return response;
```

## Manejo de errores

- No se permite terminar si la cita no está IN_PROGRESS o antes de su hora de inicio.
- Diagnóstico y tratamiento tienen validaciones de texto significativo; entradas inválidas se rechazan.
- La persistencia ocurre bajo @Transactional; un fallo antes de confirmar puede revertir los cambios de base de datos de esa transacción.

## Decisión técnica

La atención termina con una operación transaccional que sincroniza cita e historial, en vez de exigir que el usuario actualice cada tabla por separado. La alternativa hipotética de llamadas independientes expondría estados clínicos inconsistentes.

## Guion oral de repaso

1. Mi proceso inicia con una cita confirmada, cuando el doctor cambia el estado a IN_PROGRESS.
2. El backend verifica que el doctor esté autorizado y que la hora permita comenzar.
3. Cuando termina el procedimiento, Angular envía diagnóstico, tratamiento y recomendaciones a appointment/finalize.
4. BusinessAppointment exige estado IN_PROGRESS; luego actualiza tappointment, tmedicalhistory y trecommendation dentro de una transacción.
5. El resultado medible es una atención COMPLETED con historial ATTENDED y trazabilidad de auditoría.
