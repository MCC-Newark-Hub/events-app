# Funções e perfis de acesso

O sistema tem dois tipos de acesso: **público** (sem PIN) e **interno** (com PIN). O acesso interno é dividido em cinco perfis, cada um com permissões específicas.

---

## Acesso público

Disponível para qualquer pessoa com o link do sistema. Não precisa de PIN.

Permite:
- Realizar inscrição em eventos
- Entrar na lista de espera
- Baixar crachá em PDF
- Receber confirmação por email

Não permite:
- Ver inscrições de outros membros
- Gerenciar eventos
- Acessar o painel interno

---

## Perfis internos

### Admin

Acesso total ao sistema.

Pode:
- Criar e editar eventos
- Ver e gerenciar todas as inscrições
- Gerenciar usuários e PINs
- Importar dados via CSV
- Configurar categorias, funções, e igrejas
- Ver relatórios e exportar dados

### Atendente

Perfil de apoio no balcão de atendimento durante eventos.

Pode:
- Registrar inscrições manualmente
- Ver a lista de inscritos e status de pagamento
- Marcar presença
- Imprimir crachás

Não pode:
- Editar configurações do evento
- Gerenciar usuários
- Importar dados

### Pastor

Visão geral de registros e aprovações.

Pode:
- Ver todas as inscrições do evento
- Aprovar ou recusar registros que requerem aprovação pastoral
- Ver status de pagamentos por família

Não pode:
- Editar inscrições
- Gerenciar configurações

### Líder de GA (Grupo de Assistência)

Acesso aos membros do próprio grupo de assistência.

Pode:
- Ver a lista de membros inscritos do seu GA
- Confirmar presença dos membros do seu GA
- Ver status de pagamento dos membros do seu GA

Não pode:
- Ver membros de outros GAs
- Editar inscrições

### Líder de Equipe

Acesso aos membros da própria equipe de trabalho.

Pode:
- Ver a lista de membros da sua equipe
- Confirmar presença dos membros da sua equipe

Não pode:
- Ver outras equipes
- Editar inscrições ou configurações

---

## Resumo de permissões

| Ação | Público | Atendente | Pastor | Líder GA | Líder Equipe | Admin |
|---|---|---|---|---|---|---|
| Inscrição própria | ✓ | ✓ | | | | ✓ |
| Inscrição de terceiros | | ✓ | | | | ✓ |
| Ver todas as inscrições | | ✓ | ✓ | | | ✓ |
| Ver inscrições do GA | | | | ✓ | | ✓ |
| Ver inscrições da equipe | | | | | ✓ | ✓ |
| Aprovar inscrições | | | ✓ | | | ✓ |
| Gerenciar eventos | | | | | | ✓ |
| Gerenciar usuários | | | | | | ✓ |
| Importar dados | | | | | | ✓ |
