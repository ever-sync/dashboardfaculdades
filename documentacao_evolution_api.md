# Documentação da Evolution API - Referência Completa

**Autor:** Manus AI
**Data de Geração:** 21 de Novembro de 2025

Esta documentação detalha os endpoints da API da Evolution API, com foco inicial no endpoint de configuração de Webhook.

## 1. Webhook Controller

### 1.1. POST /webhook/set/{instance} - Configurar Webhook

Este endpoint é utilizado para definir ou atualizar a URL do webhook e as configurações de eventos para uma instância específica.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `POST` | `/webhook/set/{instance}` | Define as configurações do Webhook para a instância. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância a ser conectada. |

#### Corpo da Requisição (`Body`) - `application/json`

| Campo | Tipo | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- |
| `url` | `string` | Sim | URL do Webhook. |
| `events` | `enum<string>[]` | Sim | Eventos a serem enviados para o Webhook. Comprimento mínimo: `1`. Exemplo: `["APPLICATION_STARTUP"]`. |
| `webhook_by_events` | `boolean` | Não | Habilita o Webhook por eventos. |
| `webhook_base64` | `boolean` | Não | Envia arquivos em base64 quando disponíveis. |

#### Exemplo de Requisição cURL

```bash
curl --request POST \
  --url https://{server-url}/webhook/set/{instance} \
  --header 'Content-Type: application/json' \
  --header 'apikey: <api-key>' \
  --data '{
  "url": "<string>",
  "webhook_by_events": true,
  "webhook_base64": true,
  "events": [
    "APPLICATION_STARTUP"
  ]
}'
```

#### Resposta (201 - Created) - `application/json`

```json
{
  "webhook": {
    "instanceName": "teste-docs",
    "webhook": {
      "url": "https://example.com",
      "events": [
        "APPLICATION_STARTUP"
      ],
      "enabled": true
    }
  }
}
```

---

### 1.2. GET /webhook/find/{instance} - Buscar Webhook

Este endpoint é utilizado para buscar as configurações atuais do webhook para uma instância específica.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `GET` | `/webhook/find/{instance}` | Busca as configurações do Webhook para a instância. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância a ser conectada. |

#### Exemplo de Requisição cURL

```bash
curl --request GET \
  --url https://{server-url}/webhook/find/{instance} \
  --header 'apikey: <api-key>'
```

#### Resposta (200 - Ok)

*(A estrutura de resposta não foi detalhada na página, mas segue o padrão de retorno de configurações.)*

---

## 2. Instance Controller

### 2.1. GET / - Obter Informações

Obtém informações gerais sobre a Evolution API.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `GET` | `/` | Obtém informações sobre a EvolutionAPI. |

#### Resposta (200 - Ok) - `application/json`

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `status` | `integer` | O status HTTP da resposta. |
| `message` | `string` | Mensagem descritiva sobre o estado atual da API. |
| `version` | `string` | A versão atual da API. |
| `swagger` | `string` | URL para a documentação Swagger da API. |
| `manager` | `string` | URL para o gerenciador da API. |
| `documentation` | `string` | URL para a documentação detalhada da API. |

```json
{
  "status": 200,
  "message": "Welcome to the Evolution API, it is working!",
  "version": "1.7.4",
  "swagger": "http://example.evolution-api.com/docs",
  "manager": "http://example.evolution-api.com/manager",
  "documentation": "https://doc.evolution-api.com"
}
```

### 2.2. POST /instance/create - Criar Instância Básica

Cria uma nova instância básica do WhatsApp.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `POST` | `/instance/create` | Cria uma nova instância. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Corpo da Requisição (`Body`) - `application/json`

| Campo | Tipo | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- |
| `instanceName` | `string` | Sim | Nome da instância. |
| `token` | `string` | Não | Chave de API (Insira ou deixe vazio para criar dinamicamente). |
| `qrcode` | `boolean` | Não | Cria QR Code automaticamente após a criação. |
| `number` | `string` | Não | Número do proprietário da instância com código de país (ex: 559999999999). |
| `integration` | `enum<string>` | Não | Motor do WhatsApp. Opções: `WHATSAPP-BAILEYS`, `WHATSAPP-BUSINESS`. |
| `webhook` | `string` | Não | URL do Webhook. |
| `webhook_by_events` | `boolean` | Não | Habilita o Webhook por eventos. |
| `events` | `enum<string>[]` | Não | Eventos a serem enviados para o Webhook. |
| `reject_call` | `boolean` | Não | Rejeita chamadas do WhatsApp automaticamente. |
| `msg_call` | `string` | Não | Mensagem a ser enviada quando uma chamada é rejeitada automaticamente. |
| `groups_ignore` | `boolean` | Não | Ignora mensagens de grupo. |
| `always_online` | `boolean` | Não | Mantém o WhatsApp sempre online. |
| `read_messages` | `boolean` | Não | Envia recibos de leitura para mensagens recebidas. |
| `read_status` | `boolean` | Não | Mostra o status de leitura das mensagens enviadas. |
| `websocket_enabled` | `boolean` | Não | Habilita o websocket. |
| `websocket_events` | `enum<string>[]` | Não | Eventos a serem enviados para o websocket. |
| `rabbitmq_enabled` | `boolean` | Não | Habilita o RabbitMQ. |
| `rabbitmq_events` | `enum<string>[]` | Não | Eventos a serem enviados para o RabbitMQ. |
| `sqs_enabled` | `boolean` | Não | Habilita o SQS. |
| `sqs_events` | `enum<string>[]` | Não | Eventos a serem enviados para o SQS. |
| `typebot_url` | `string` | Não | URL para a instância do Typebot. |
| `typebot` | `string` | Não | Nome do fluxo do Typebot. |
| `typebot_expire` | `integer` | Não | Segundos para expirar. |
| `typebot_keyword_finish` | `string` | Não | Palavra-chave para finalizar o fluxo do Typebot. |
| `typebot_delay_message` | `integer` | Não | Atraso padrão para as mensagens do Typebot. |
| `typebot_unknown_message` | `string` | Não | Mensagem para o Typebot em caso de desconhecido. |
| `typebot_listening_from_me` | `boolean` | Não | O Typebot escuta mensagens enviadas pelo número conectado. |
| `proxy` | `object` | Não | Configurações de proxy. |
| `chatwoot_account_id` | `integer` | Não | ID da conta Chatwoot. |
| `chatwoot_token` | `string` | Não | Token de autenticação Chatwoot. |
| `chatwoot_url` | `string` | Não | URL do servidor Chatwoot. |
| `chatwoot_sign_msg` | `boolean` | Não | Envia assinatura de mensagem no Chatwoot. |
| `chatwoot_reopen_conversation` | `boolean` | Não | Reabre a conversa no Chatwoot. |
| `chatwoot_conversation_pending` | `boolean` | Não | Define a conversa como pendente no Chatwoot. |

#### Resposta (201 - Created) - `application/json`

```json
{
  "instance": {
    "instanceName": "teste-docs",
    "instanceId": "af6c5b7c-ee27-4f94-9ea8-192393746ddd",
    "webhook_wa_business": null,
    "access_token_wa_business": "",
    "status": "created"
  },
  "hash": {
    "apikey": "123456"
  },
  "settings": {
    "reject_call": false,
    "msg_call": "",
    "groups_ignore": true,
    "always_online": false,
    "read_messages": false,
    "read_status": false,
    "sync_full_history": false
  }
}
```

### 2.3. GET /instance/fetchInstances - Buscar Instâncias

Busca todas as instâncias criadas.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `GET` | `/instance/fetchInstances` | Busca todas as instâncias. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Consulta (`Query Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instanceName` | `string` | Nome da instância a ser buscada. |

#### Resposta (200 - Ok) - `application/json`

Retorna um array de objetos com informações detalhadas de cada instância.

### 2.4. GET /instance/connect/{instance} - Conectar Instância

Obtém o código de pareamento (pairing code) ou QR code para conectar a instância.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `GET` | `/instance/connect/{instance}` | Conecta a instância. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância a ser conectada. |

#### Parâmetros de Consulta (`Query Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `number` | `string` | Número de telefone (com código de país) a ser conectado. |

#### Resposta (200 - Ok) - `application/json`

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `pairingCode` | `string` | O código único usado para parear um dispositivo ou conta. |
| `code` | `string` | Um código específico associado ao processo de pareamento. |
| `count` | `integer` | A contagem ou número de tentativas ou instâncias relacionadas ao processo de pareamento. |

### 2.5. PUT /instance/restart/{instance} - Reiniciar Instância

Reinicia uma instância específica.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `PUT` | `/instance/restart/{instance}` | Reinicia a instância. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância a ser reiniciada. |

#### Resposta (200 - Ok)

*(A estrutura de resposta não foi detalhada na página.)*

### 2.6. GET /instance/connectionState/{instance} - Estado da Conexão

Verifica o estado da conexão de uma instância.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `GET` | `/instance/connectionState/{instance}` | Verifica o estado da conexão da instância. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância. |

#### Resposta (200 - Ok)

*(A estrutura de resposta não foi detalhada na página.)*

### 2.7. DELETE /instance/logout/{instance} - Desconectar Instância

Desconecta (faz logout) de uma instância.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `DELETE` | `/instance/logout/{instance}` | Desconecta a instância. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância a ser desconectada. |

#### Resposta (200 - Ok)

*(A estrutura de resposta não foi detalhada na página.)*

### 2.8. DELETE /instance/delete/{instance} - Deletar Instância

Deleta uma instância permanentemente.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `DELETE` | `/instance/delete/{instance}` | Deleta a instância. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância a ser deletada. |

#### Resposta (200 - Ok)

*(A estrutura de resposta não foi detalhada na página.)*

### 2.9. POST /instance/setPresence/{instance} - Definir Presença

Define o status de presença (online, digitando, gravando) da instância.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `POST` | `/instance/setPresence/{instance}` | Define o status de presença. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância. |

#### Resposta (200 - Ok)

*(A estrutura de resposta não foi detalhada na página.)*

---

## 3. Settings Controller

### 3.1. POST /settings/set/{instance} - Definir Configurações

Define as configurações gerais da instância.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `POST` | `/settings/set/{instance}` | Define as configurações da instância. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância. |

#### Corpo da Requisição (`Body`) - `application/json`

| Campo | Tipo | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- |
| `reject_call` | `boolean` | Sim | Rejeita chamadas automaticamente. |
| `groups_ignore` | `boolean` | Sim | Ignora mensagens de grupo. |
| `always_online` | `boolean` | Sim | Sempre mostra o WhatsApp online. |
| `read_messages` | `boolean` | Sim | Envia recibos de leitura. |
| `read_status` | `boolean` | Sim | Vê o status das mensagens. |
| `sync_full_history` | `boolean` | Sim | Sincroniza o histórico completo do WhatsApp com a EvolutionAPI. |
| `msg_call` | `string` | Não | Mensagem a ser enviada quando uma chamada é rejeitada automaticamente. |

#### Resposta (201 - Created) - `application/json`

```json
{
  "settings": {
    "instanceName": "teste-docs",
    "settings": {
      "reject_call": true,
      "groups_ignore": true,
      "always_online": true,
      "read_messages": true,
      "read_status": true,
      "sync_full_history": false
    }
  }
}
```

### 3.2. GET /settings/find/{instance} - Buscar Configurações

Busca as configurações atuais da instância.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `GET` | `/settings/find/{instance}` | Busca as configurações da instância. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância. |

#### Resposta (200 - Ok) - `application/json`

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `reject_call` | `boolean` | Indica se deve rejeitar chamadas recebidas. |
| `groups_ignore` | `boolean` | Indica se deve ignorar mensagens de grupo. |
| `always_online` | `boolean` | Indica se deve manter a instância sempre online. |
| `read_messages` | `boolean` | Indica se deve marcar mensagens como lidas. |
| `read_status` | `boolean` | Indica se deve ler atualizações de status. |
| `sync_full_history` | `boolean` | Indica se deve sincronizar o histórico completo de mensagens. |

```json
{
  "reject_call": true,
  "groups_ignore": true,
  "always_online": true,
  "read_messages": true,
  "read_status": true,
  "sync_full_history": false
}
```

---

## 4. Message Controller

### 4.1. POST /message/sendTemplate/{instance} - Enviar Template

Envia uma mensagem de template.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `POST` | `/message/sendTemplate/{instance}` | Envia uma mensagem de template. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância. |

#### Corpo da Requisição (`Body`) - `application/json`

| Campo | Tipo | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- |
| `number` | `string` | Não | Número do destinatário da mensagem com código de país. |
| `templateMessage` | `object` | Não | Objeto contendo os detalhes do template. |

### 4.2. POST /message/sendText/{instance} - Enviar Texto Simples

Envia uma mensagem de texto simples.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `POST` | `/message/sendText/{instance}` | Envia uma mensagem de texto. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância. |

#### Corpo da Requisição (`Body`) - `application/json`

| Campo | Tipo | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- |
| `number` | `string` | Sim | Número para receber a mensagem (com código de país). |
| `textMessage` | `object` | Sim | Objeto contendo o texto da mensagem. |
| `options` | `object` | Não | Opções adicionais (atraso, presença, link preview, citação, menções). |

### 4.3. POST /message/sendStatus/{instance} - Enviar Status

Envia uma atualização de status.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `POST` | `/message/sendStatus/{instance}` | Envia uma atualização de status. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância. |

#### Corpo da Requisição (`Body`) - `application/json`

| Campo | Tipo | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- |
| `statusMessage` | `object` | Sim | Objeto contendo os detalhes da mensagem de status. |

### 4.4. POST /message/sendMedia/{instance} - Enviar Mídia

Envia uma mensagem de mídia (imagem, vídeo, documento).

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `POST` | `/message/sendMedia/{instance}` | Envia uma mensagem de mídia. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância. |

#### Corpo da Requisição (`Body`) - `application/json`

| Campo | Tipo | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- |
| `number` | `string` | Sim | Número para receber a mensagem (com código de país). |
| `mediaMessage` | `object` | Sim | Objeto contendo os detalhes da mídia. |
| `options` | `object` | Não | Opções adicionais (atraso, presença). |

### 4.5. POST /message/sendWhatsAppAudio/{instance} - Enviar Áudio do WhatsApp

Envia uma mensagem de áudio no formato do WhatsApp.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `POST` | `/message/sendWhatsAppAudio/{instance}` | Envia uma mensagem de áudio. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância. |

#### Corpo da Requisição (`Body`) - `application/json`

| Campo | Tipo | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- |
| `number` | `string` | Sim | Número para receber a mensagem (com código de país). |
| `audioMessage` | `object` | Sim | Objeto contendo os detalhes do áudio. |
| `options` | `object` | Não | Opções adicionais (atraso, presença, codificação). |

### 4.6. POST /message/sendSticker/{instance} - Enviar Figurinha

Envia uma figurinha.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `POST` | `/message/sendSticker/{instance}` | Envia uma figurinha. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância. |

#### Corpo da Requisição (`Body`) - `application/json`

| Campo | Tipo | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- |
| `number` | `string` | Sim | Número para receber a mensagem (com código de país). |
| `stickerMessage` | `object` | Sim | Objeto contendo os detalhes da figurinha. |
| `options` | `object` | Não | Opções adicionais (atraso, presença). |

### 4.7. POST /message/sendLocation/{instance} - Enviar Localização

Envia uma localização.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `POST` | `/message/sendLocation/{instance}` | Envia uma localização. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância. |

#### Corpo da Requisição (`Body`) - `application/json`

| Campo | Tipo | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- |
| `number` | `string` | Sim | Número para receber a mensagem (com código de país). |
| `locationMessage` | `object` | Sim | Objeto contendo os detalhes da localização. |
| `options` | `object` | Não | Opções adicionais (atraso, presença). |

### 4.8. POST /message/sendContact/{instance} - Enviar Contato

Envia um ou mais contatos.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `POST` | `/message/sendContact/{instance}` | Envia um contato. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância. |

#### Corpo da Requisição (`Body`) - `application/json`

| Campo | Tipo | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- |
| `number` | `string` | Sim | Número para receber a mensagem (com código de país). |
| `contactMessage` | `object[]` | Sim | Array de objetos contendo os detalhes do contato. Comprimento mínimo: `1`. |
| `options` | `object` | Não | Opções adicionais (atraso, presença). |

### 4.9. POST /message/sendReaction/{instance} - Enviar Reação

Envia uma reação a uma mensagem.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `POST` | `/message/sendReaction/{instance}` | Envia uma reação. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância. |

#### Corpo da Requisição (`Body`) - `application/json`

| Campo | Tipo | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- |
| `reactionMessage` | `object` | Não | Objeto contendo os detalhes da reação. |

### 4.10. POST /message/sendPoll/{instance} - Enviar Enquete

Envia uma enquete.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `POST` | `/message/sendPoll/{instance}` | Envia uma enquete. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância. |

#### Corpo da Requisição (`Body`) - `application/json`

| Campo | Tipo | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- |
| `number` | `string` | Sim | Número para receber a mensagem (com código de país). |
| `pollMessage` | `object` | Sim | Objeto contendo os detalhes da enquete. |
| `options` | `object` | Não | Opções adicionais (atraso, presença). |

### 4.11. POST /message/sendList/{instance} - Enviar Lista

Envia uma mensagem de lista.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `POST` | `/message/sendList/{instance}` | Envia uma mensagem de lista. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância. |

#### Corpo da Requisição (`Body`) - `application/json`

| Campo | Tipo | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- |
| `number` | `string` | Não | Número para receber a mensagem (com código de país). |
| `options` | `object` | Não | Opções adicionais (atraso, presença). |
| `listMessage` | `object` | Não | Objeto contendo os detalhes da lista. |

---

## 5. Chat Controller

### 5.1. POST /chat/whatsappNumbers/{instance} - Verificar se é WhatsApp

Verifica se um ou mais números de telefone possuem conta no WhatsApp.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `POST` | `/chat/whatsappNumbers/{instance}` | Verifica se os números são do WhatsApp. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância. |

#### Corpo da Requisição (`Body`) - `application/json`

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `numbers` | `string[]` | Números de telefone (com código de país) a serem verificados. |

#### Resposta (200 - Ok) - `application/json`

Retorna um array de objetos com informações sobre a existência da conta WhatsApp.

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `exists` | `boolean` | Indica se a conta WhatsApp existe. |
| `jid` | `string` | O JID da conta WhatsApp. |
| `number` | `string` | O número de telefone associado à conta WhatsApp. |

### 5.2. PUT /chat/markMessageAsRead/{instance} - Marcar Mensagem como Lida

Marca uma ou mais mensagens como lidas.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `PUT` | `/chat/markMessageAsRead/{instance}` | Marca mensagens como lidas. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância. |

#### Corpo da Requisição (`Body`) - `application/json`

| Campo | Tipo | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- |
| `read_messages` | `object[]` | Não | Mensagens a serem marcadas como lidas. |

#### Resposta (201 - Created) - `application/json`

```json
{
  "message": "Read messages",
  "read": "success"
}
```

### 5.3. PUT /chat/archiveChat/{instance} - Arquivar Chat

Arquiva ou desarquiva um chat.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `PUT` | `/chat/archiveChat/{instance}` | Arquiva o chat. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância. |

#### Corpo da Requisição (`Body`) - `application/json`

| Campo | Tipo | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- |
| `lastMessage` | `object` | Sim | Objeto contendo a chave da última mensagem. |
| `archive` | `boolean` | Sim | Se deve arquivar o chat ou não. |

#### Resposta (201 - Created) - `application/json`

```json
{
  "chatId": "553198296801@s.whatsapp.net",
  "archived": true
}
```

### 5.4. DELETE /chat/deleteMessageForEveryone/{instance} - Apagar Mensagem para Todos

Apaga uma mensagem para todos os participantes.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `DELETE` | `/chat/deleteMessageForEveryone/{instance}` | Apaga a mensagem para todos. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância. |

#### Corpo da Requisição (`Body`) - `application/json`

| Campo | Tipo | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Sim | ID da mensagem. |
| `remoteJid` | `string` | Sim | JID remoto do contato ou grupo. |
| `fromMe` | `boolean` | Sim | Se a mensagem foi enviada pelo proprietário da instância. |
| `participant` | `string` | Não | Participante (apenas para mensagens de grupo). |

#### Resposta (201 - Created) - `application/json`

Retorna um esquema representando uma mensagem de protocolo do WhatsApp.

### 5.5. POST /chat/sendPresence/{instance} - Enviar Presença

Envia um status de presença (online, digitando, gravando) para um chat.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `POST` | `/chat/sendPresence/{instance}` | Envia um status de presença. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância. |

#### Resposta (200 - Ok)

*(A estrutura de resposta não foi detalhada na página.)*

### 5.6. POST /chat/fetchProfilePictureUrl/{instance} - Buscar URL da Foto de Perfil

Busca a URL da foto de perfil de um número.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `POST` | `/chat/fetchProfilePictureUrl/{instance}` | Busca a URL da foto de perfil. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância. |

#### Corpo da Requisição (`Body`) - `application/json`

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `number` | `string` | Número para buscar a URL da foto de perfil. |

#### Resposta (200 - Ok) - `application/json`

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `wuid` | `string` | O ID de Usuário do WhatsApp (WUID). |
| `profilePictureUrl` | `string` | URL da foto de perfil do usuário. |

### 5.7. POST /chat/findContacts/{instance} - Buscar Contatos

Busca os contatos da instância.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `POST` | `/chat/findContacts/{instance}` | Busca os contatos. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância. |

#### Resposta (200 - Ok)

*(A estrutura de resposta não foi detalhada na página.)*

### 5.8. POST /chat/findMessages/{instance} - Buscar Mensagens

Busca mensagens.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `POST` | `/chat/findMessages/{instance}` | Busca mensagens. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância. |

#### Resposta (200 - Ok)

*(A estrutura de resposta não foi detalhada na página.)*

### 5.9. POST /chat/findStatusMessage/{instance} - Buscar Mensagem de Status

Busca mensagens de status.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `POST` | `/chat/findStatusMessage/{instance}` | Busca mensagens de status. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância. |

#### Resposta (200 - Ok)

*(A estrutura de resposta não foi detalhada na página.)*

### 5.10. PUT /chat/updateMessage/{instance} - Atualizar Mensagem

Atualiza o conteúdo de uma mensagem.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `PUT` | `/chat/updateMessage/{instance}` | Atualiza o conteúdo de uma mensagem. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância. |

#### Corpo da Requisição (`Body`) - `application/json`

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `number` | `integer` | Número de telefone do destinatário com código de país. |
| `text` | `string` | Novo conteúdo da mensagem. |
| `key` | `object` | Chave da mensagem a ser atualizada. |

#### Resposta (200 - Ok)

*(A estrutura de resposta não foi detalhada na página.)*

### 5.11. GET /chat/findChats/{instance} - Buscar Chats

Busca todos os chats da instância.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `GET` | `/chat/findChats/{instance}` | Busca todos os chats. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância. |

#### Resposta (200 - Ok)

*(A estrutura de resposta não foi detalhada na página.)*

---

## 6. Profile Settings Controller

### 6.1. POST /chat/fetchBusinessProfile/{instance} - Buscar Perfil de Negócios

Busca o perfil de negócios.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `POST` | `/chat/fetchBusinessProfile/{instance}` | Busca o perfil de negócios. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância. |

#### Resposta (200 - Ok)

*(A estrutura de resposta não foi detalhada na página.)*

### 6.2. POST /chat/fetchProfile/{instance} - Buscar Perfil

Busca o perfil.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `POST` | `/chat/fetchProfile/{instance}` | Busca o perfil. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância. |

#### Resposta (200 - Ok)

*(A estrutura de resposta não foi detalhada na página.)*

### 6.3. POST /chat/updateProfileName/{instance} - Atualizar Nome do Perfil

Atualiza o nome do perfil.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `POST` | `/chat/updateProfileName/{instance}` | Atualiza o nome do perfil. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância. |

#### Resposta (200 - Ok)

*(A estrutura de resposta não foi detalhada na página.)*

### 6.4. POST /chat/updateProfileStatus/{instance} - Atualizar Status do Perfil

Atualiza o status (recado) do perfil.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `POST` | `/chat/updateProfileStatus/{instance}` | Atualiza o status do perfil. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância. |

#### Resposta (200 - Ok)

*(A estrutura de resposta não foi detalhada na página.)*

### 6.5. PUT /chat/updateProfilePicture/{instance} - Atualizar Foto de Perfil

Atualiza a foto de perfil.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `PUT` | `/chat/updateProfilePicture/{instance}` | Atualiza a foto de perfil. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância. |

#### Resposta (200 - Ok)

*(A estrutura de resposta não foi detalhada na página.)*

### 6.6. PUT /chat/removeProfilePicture/{instance} - Remover Foto de Perfil

Remove a foto de perfil.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `PUT` | `/chat/removeProfilePicture/{instance}` | Remove a foto de perfil. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância. |

#### Resposta (200 - Ok)

*(A estrutura de resposta não foi detalhada na página.)*

### 6.7. GET /chat/fetchPrivacySettings/{instance} - Buscar Configurações de Privacidade

Busca as configurações de privacidade.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `GET` | `/chat/fetchPrivacySettings/{instance}` | Busca as configurações de privacidade. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância. |

#### Resposta (200 - Ok)

*(A estrutura de resposta não foi detalhada na página.)*

### 6.8. PUT /chat/updatePrivacySettings/{instance} - Atualizar Configurações de Privacidade

Atualiza as configurações de privacidade.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `PUT` | `/chat/updatePrivacySettings/{instance}` | Atualiza as configurações de privacidade. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância. |

#### Corpo da Requisição (`Body`) - `application/json`

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `privacySettings` | `object` | Objeto contendo as configurações de privacidade. |

#### Resposta (200 - Ok)

*(A estrutura de resposta não foi detalhada na página.)*

---

## 7. Group Controller

### 7.1. POST /group/create/{instance} - Criar Grupo

Cria um novo grupo.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `POST` | `/group/create/{instance}` | Cria um novo grupo. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância. |

#### Corpo da Requisição (`Body`) - `application/json`

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `subject` | `object` | Assunto do grupo. |
| `description` | `string` | Descrição do grupo. |
| `participants` | `string[]` | Lista de números de telefone dos participantes. |

#### Resposta (200 - Ok)

*(A estrutura de resposta não foi detalhada na página.)*

### 7.2. PUT /group/updateGroupPicture/{instance} - Atualizar Foto do Grupo

Atualiza a foto de perfil do grupo.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `PUT` | `/group/updateGroupPicture/{instance}` | Atualiza a foto do grupo. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância. |

#### Corpo da Requisição (`Body`) - `application/json`

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `image` | `object` | Objeto contendo a imagem. |

#### Resposta (200 - Ok)

*(A estrutura de resposta não foi detalhada na página.)*

### 7.3. PUT /group/updateGroupSubject/{instance} - Atualizar Assunto do Grupo

Atualiza o assunto (nome) do grupo.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `PUT` | `/group/updateGroupSubject/{instance}` | Atualiza o assunto do grupo. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância. |

#### Corpo da Requisição (`Body`) - `application/json`

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `subject` | `object` | Objeto contendo o novo assunto. |

#### Resposta (200 - Ok)

*(A estrutura de resposta não foi detalhada na página.)*

### 7.4. PUT /group/updateGroupDescription/{instance} - Atualizar Descrição do Grupo

Atualiza a descrição do grupo.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `PUT` | `/group/updateGroupDescription/{instance}` | Atualiza a descrição do grupo. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância. |

#### Corpo da Requisição (`Body`) - `application/json`

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `description` | `object` | Objeto contendo a nova descrição. |

#### Resposta (200 - Ok)

*(A estrutura de resposta não foi detalhada na página.)*

### 7.5. GET /group/inviteCode/{instance} - Buscar Código de Convite

Busca o código de convite do grupo.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `GET` | `/group/inviteCode/{instance}` | Busca o código de convite do grupo. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância. |

#### Resposta (200 - Ok) - `application/json`

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `inviteUrl` | `string` | URL de convite do grupo. |
| `inviteCode` | `string` | Código de convite do grupo. |

### 7.6. GET /group/acceptInviteCode/{instance} - Aceitar Código de Convite

Aceita um convite de grupo usando o código.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `GET` | `/group/acceptInviteCode/{instance}` | Aceita um convite de grupo. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância. |

#### Resposta (200 - Ok)

*(A estrutura de resposta não foi detalhada na página.)*

### 7.7. PUT /group/revokeInviteCode/{instance} - Revogar Código de Convite

Revoga o código de convite atual do grupo.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `PUT` | `/group/revokeInviteCode/{instance}` | Revoga o código de convite. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância. |

#### Resposta (200 - Ok)

*(A estrutura de resposta não foi detalhada na página.)*

### 7.8. POST /group/sendInvite/{instance} - Enviar Convite de Grupo

Envia um convite de grupo para números específicos.

#### Detalhes do Endpoint

| Método | Caminho | Descrição |
| :--- | :--- | :--- |
| `POST` | `/group/sendInvite/{instance}` | Envia um convite de grupo. |

#### Autorização

| Parâmetro | Tipo | Localização | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `apikey` | `string` | `header` | Sim | Sua chave de autorização. |

#### Parâmetros de Caminho (`Path Parameters`)

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `instance` | `string` | ID da instância. |

#### Corpo da Requisição (`Body`) - `application/json`

| Campo | Tipo | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- |
| `groupJid` | `string` | Sim | JID remoto do grupo. |
| `numbers` | `string[]` | Sim | Números para receber o convite. |
| `description` | `string` | Não | Descrição a ser enviada com o convite. |

#### Resposta (200 - Ok) - `application/json`

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `send` | `boolean` | Indica se o convite foi enviado com sucesso. |
| `inviteUrl` | `string` | A URL de convite do grupo do WhatsApp. |

---

## 8. Outros Controllers (Mapeamento Parcial)

A documentação da Evolution API inclui outros controladores (Typebot, Chatwoot, SQS, RabbitMQ, WebSocket) que foram mapeados na navegação, mas cujos detalhes de endpoint não foram coletados.

| Controller | Endpoints Mapeados |
| :--- | :--- |
| **Typebot** | `POST Set Typebot`, `POST Start Typebot`, `GET Find Typebot`, `POST Change Typebot Status` |
| **Chatwoot** | `POST Set Chatwoot`, `GET Find Chatwoot` |
| **SQS** | `POST Set SQS`, `GET Find SQS` |
| **RabbitMQ** | `POST Set RabbitMQ`, `GET Find RabbitMQ` |
| **WebSocket** | `GET Find Chatwoot`, `POST Set Chatwoot` |

---

## 9. Referências

[1] Evolution API Documentation. *Evolution API*. Disponível em: <https://doc.evolution-api.com/v1/api-reference/>.

## Conclusão

Esta documentação abrange os principais controladores e endpoints da Evolution API, conforme mapeado na referência oficial. O foco inicial foi o endpoint `webhook/set`, mas a estrutura completa da API foi detalhada para fornecer uma visão abrangente. Para os controladores com mapeamento parcial (Typebot, Chatwoot, SQS, RabbitMQ, WebSocket), recomenda-se a consulta direta à fonte [1] para obter os detalhes completos de corpo de requisição e resposta.
