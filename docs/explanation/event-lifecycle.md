# Ciclo de vida de um evento

Este documento descreve as fases de um evento desde a criação até o encerramento.

---

## Fases do evento

```mermaid
flowchart LR
    A([Evento criado pelo Admin]) --> B[Inscrições abertas]
    B --> C[Período de inscrições]
    C --> D{Vagas esgotadas?}
    D -->|Sim| E[Lista de espera ativa]
    D -->|Não| C
    E --> F[Dia do evento]
    C --> F
    F --> G[Confirmação de presença]
    G --> H[Pagamentos finalizados]
    H --> I([Evento encerrado])
```

---

## Fluxo de pagamento em dinheiro

```mermaid
flowchart TD
    A([Membro chega ao evento]) --> B[Atendente localiza inscrição]
    B --> C{Status atual}
    C -->|Pendente| D[Coleta pagamento em dinheiro]
    C -->|Confirmado| E([Já pago - libera entrada])
    C -->|Lista de espera| F{Há vaga agora?}
    F -->|Sim| D
    F -->|Não| G([Mantém na lista de espera])
    D --> H[Marca como Confirmado no sistema]
    H --> I([Imprime crachá e libera entrada])
```

---

## Fluxo de geração de crachá

```mermaid
flowchart TD
    A([Inscrição confirmada]) --> B[Sistema gera PDF automaticamente]
    B --> C{Canal}
    C -->|Portal público| D[Download automático no navegador]
    C -->|Atendente| E[Impressão via impressora térmica BY48BT]
    D --> F([Membro salva ou imprime])
    E --> G([Crachá 3x2 paisagem preto e branco])
```
