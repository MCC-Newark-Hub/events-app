# Ciclo de vida de un evento

Este documento describe las fases de un evento desde su creación hasta el cierre.

---

## Fases del evento

```mermaid
flowchart LR
    A([Evento creado por Admin]) --> B[Inscripciones abiertas]
    B --> C[Período de inscripciones]
    C --> D{¿Cupos agotados?}
    D -->|Sí| E[Lista de espera activa]
    D -->|No| C
    E --> F[Día del evento]
    C --> F
    F --> G[Confirmación de asistencia]
    G --> H[Pagos finalizados]
    H --> I([Evento cerrado])
```

---

## Flujo de pago

```mermaid
flowchart TD
    A([Miembro llega al evento]) --> B[Asistente localiza la inscripción]
    B --> C{Estado actual}
    C -->|Pendiente| D[Cobra el pago en efectivo]
    C -->|Confirmado| E([Ya pagó - permite entrada])
    C -->|Lista de espera| F{¿Hay cupo ahora?}
    F -->|Sí| D
    F -->|No| G([Mantiene en lista de espera])
    D --> H[Marca como Confirmado en el sistema]
    H --> I([Imprime credencial y permite entrada])
```

---

## Flujo de generación de credencial

```mermaid
flowchart TD
    A([Inscripción confirmada]) --> B[Sistema genera PDF automáticamente]
    B --> C{Canal}
    C -->|Portal público| D[Descarga automática en el navegador]
    C -->|Asistente| E[Impresión por impresora térmica BY48BT]
    D --> F([Miembro guarda o imprime])
    E --> G([Credencial 3x2 apaisada en blanco y negro])
```
