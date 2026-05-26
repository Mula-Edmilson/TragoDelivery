# Trago Delivery — Sistema de Gestão Logística e Distribuição

O **Trago Delivery** é uma plataforma corporativa e *production-ready* desenhada para centralizar operações logísticas, gestão em tempo real de frota, processamento de encomendas e controlo financeiro unificado. 

A arquitetura assenta numa separação limpa entre um **Front-end 100% puro** (HTML5/CSS3/JavaScript, com suporte integral a WebSockets e geolocalização nativa) e um **Back-end de alta eficiência** em Node.js e Express, apoiado por uma base de dados MongoDB.

---

## 🚀 1. Funcionalidades e Diferenciais Técnicos

- **Rastreamento de Alta Precisão em Tempo Real:** Motoristas enviam pacotes periódicos da sua geolocalização via `Socket.IO`. O painel central retransmite as posições ativas sobre mapas nativos integrados com **Leaflet** e OpenStreetMap.
- **Atribuição Automática por Raio de Distância:** O back-end implementa um algoritmo de cálculo da distância euclidiana/esférica (hipotenusa) para localizar instantaneamente o motorista com o status `online_livre` mais próximo das coordenadas da encomenda.
- **Fluxo Operacional Blindado:** Controlo rigoroso dos estados de recolha e entrega com **código de segurança obrigatório de 5 caracteres** exigido no momento da entrega ao destinatário.
- **Processamento Estático Otimizado de Imagens:** Suporte a upload de pacotes em memória (`multer` + `memoryStorage`), otimizados e convertidos em formato ultraleve `.webp` via **Sharp** no back-end.
- **Exportação Financeira Nativa em Excel:** Geração de relatórios `XLSX` nativos via **ExcelJS** no back-end, incluindo múltiplos separadores (Resumo Financeiro, Encomendas e Custos), contornando as limitações e problemas de codificação de ferramentas puramente front-end.
- **Segurança Robusta de API:** Camada reforçada com **Helmet**, limites de tráfego com **Rate Limiter**, proteção de injeção NoSQL com **Mongo Sanitize**, higienização de inputs via **XSS Clean** e validação tipada de dados via **Express Validator**.

---

## 🛠 2. Stack Técnica Implementada

### Front-end
- **Linguagens:** HTML5, CSS3, JavaScript puro (ES6+)
- **Estilização:** Tailwind CSS v4 (CDN) + Font Awesome
- **Gráficos e Mapas:** Chart.js, Leaflet (OpenStreetMap)
- **Real-time:** Socket.IO Client

### Back-end
- **Plataforma:** Node.js (v18+)
- **Framework:** Express.js
- **Base de Dados:** MongoDB + Mongoose ODM (com suporte a *Connection Pooling*)
- **Segurança & Real-time:** JWT, bcryptjs, Socket.IO
- **Processamento:** Multer, Sharp, ExcelJS

---

## 💻 3. Guia de Instalação e Execução Local

### Pré-requisitos
- **Node.js** na versão `18.18.0` ou superior.
- **MongoDB** a executar localmente (porta por omissão `27017`) ou uma URI do MongoDB Atlas.

### Passos de Instalação

1. **Instalar as Dependências:**
   Abra o terminal na raiz do projeto e execute:
   ```bash
   npm install
   ```

2. **Configurar as Variáveis de Ambiente:**
   Crie um ficheiro `.env` na raiz, baseando-se no ficheiro de exemplo `.env.example`:
   ```bash
   cp .env.example .env
   ```
   *Pode manter as configurações por omissão para testes locais.*

3. **Pré-popular a Base de Dados (Seed):**
   O projeto inclui um script que injeta as contas obrigatórias, clientes reais e encomendas com histórico:
   ```bash
   npm run seed
   ```

4. **Iniciar o Servidor:**
   Para arrancar em modo de produção:
   ```bash
   npm start
   ```
   Para arrancar em modo de desenvolvimento com recarregamento automático:
   ```bash
   npm run dev
   ```

5. **Aceder à Aplicação:**
   O servidor Express serve nativamente a aplicação sob a mesma porta. Abra o navegador no endereço:
   ```text
   http://localhost:3000
   ```

---

## 🔑 4. Credenciais de Acesso (Geradas no Seed)

Para testar todos os fluxos da aplicação de forma imediata, utilize as seguintes contas configuradas de fábrica:

| Perfil | Correio Eletrónico | Palavra-Passe | Portal de Acesso |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@tragodelivery.co.mz` | `admin123` | `login.html` |
| **Motorista** | `carlos@tragodelivery.co.mz` | `driver123` | `login-motorista.html` |
| **Gestor** | `gestor@tragodelivery.co.mz` | `gestor123` | `login.html` |

---

## 📡 5. Listagem de Endpoints da API REST

A API expõe as seguintes rotas baseadas na URL base (`/api`):

### Autenticação (`/api/auth`)
- `GET /me` — Obtém os dados e o perfil do utilizador autenticado.
- `POST /login` — Autentica administradores, gestores ou motoristas.
- `POST /logout` — Termina a sessão de forma segura.
- `PUT /change-password` — Altera a palavra-passe do utilizador.
- `POST /register-driver` — Regista um novo motorista e a sua viatura *(Apenas Admin)*.

### Encomendas (`/api/orders`)
- `POST /` — Cria uma nova encomenda com suporte a imagem anexada *(Apenas Admin)*.
- `GET /my-deliveries` — Lista entregas ativas atribuídas ao motorista autenticado.
- `POST /:id/pickup-start` — Inicia o fluxo operacional de recolha *(Apenas Motorista)*.
- `POST /:id/pickup-complete` — Conclui a recolha no cliente parceiro *(Apenas Motorista)*.
- `POST /:id/delivery-start` — Inicia o trânsito final de entrega ao destinatário *(Apenas Motorista)*.
- `POST /:id/delivery-complete` — Valida o código do cliente e processa comissões *(Apenas Motorista)*.
- `PUT /:orderId/assign` — Atribui ou reatribui uma encomenda a um motorista *(Apenas Admin)*.
- `POST /:id/cancel` — Cancela uma encomenda indicando o motivo *(Apenas Admin)*.
- `GET /active` — Lista todas as encomendas não finalizadas *(Apenas Admin)*.
- `GET /history` — Lista o histórico de encomendas concluídas ou canceladas *(Apenas Admin)*.

### Motoristas (`/api/drivers`)
- `GET /` — Lista toda a frota de motoristas e os seus perfis.
- `GET /available` — Lista apenas motoristas com o estado `online_livre`.
- `GET /my-earnings` — Retorna as métricas financeiras acumuladas do motorista.
- `GET /live-locations` — Retorna os dados de GPS em tempo real de todos os motoristas online.

### Clientes (`/api/clients`)
- `POST /` — Regista uma nova conta de cliente empresarial.
- `GET /` — Lista todos os clientes do sistema.
- `DELETE /:id` — Remove um cliente *(Bloqueado se tiver encomendas associadas)*.

### Custos e Despesas (`/api/costs` & `/api/expenses`)
- `POST /costs` — Lança custos fixos operacionais da empresa.
- `GET /costs/dashboard-summary` — Retorna a consolidação financeira para os gráficos.
- `POST /expenses` — Lança despesas avulsas *(Apenas Admin ou Gestor)*.

### Administração e Relatórios (`/api/admin`)
- `DELETE /orders/history` — Limpa permanentemente o histórico antigo da base de dados.
- `GET /export-financial` — Transfere o relatório contabilístico global em formato `.xlsx`.

---

## ☁️ 6. Publicação em Produção (Render & MongoDB Atlas)

### Configurar a Base de Dados no MongoDB Atlas
1. Crie um cluster gratuito no [MongoDB Atlas](https://www.mongodb.com/atlas/database).
2. Vá a **Database Access** e crie um novo utilizador com privilégios de leitura e escrita.
3. Vá a **Network Access** e adicione o IP `0.0.0.0/0` para permitir a ligação dos servidores da Render.
4. Clique em **Connect**, selecione **Drivers** e copie a sua *Connection String* (substituindo a palavra-passe).

### Publicação Contínua no Render
1. Crie uma conta no [Render](https://render.com) e ligue o seu repositório GitHub.
2. Crie um novo **Web Service** e escolha o repositório do **Trago Delivery**.
3. Configure os seguintes parâmetros de compilação:
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Vá à secção **Environment Variables** e adicione as seguintes chaves obrigatórias:
   - `NODE_ENV`: `production`
   - `MONGO_URI`: `mongodb+srv://<user>:<password>@cluster.mongodb.net/trago_delivery?retryWrites=true&w=majority`
   - `JWT_SECRET`: *(Introduza uma chave de hash longa e aleatória)*
   - `UPLOAD_IMAGE_MAX_SIZE`: `5242880`
5. Guarde e inicie a publicação. A deteção do URL em produção pelo Front-end será feita de forma automática via `window.location.hostname`.

---

## 🛡️ 7. Conformidade e Critérios de Aceitação

Este sistema cumpre na íntegra a especificação do projeto:
- **Zero Protótipos Visuais:** Todas as ações, desde a criação de entregas, monitorização, alteração de senhas e atribuições operam em base de dados real.
- **Zero Dados Fixos:** Gráficos, métricas, tabelas ativas e relatórios são alimentados nativamente pelas respostas da API REST.
- **Responsividade e Compactação:** A interface foi construída num design corporativo sério (Paleta verde `#2F7A3C` / âmbar `#C97813`) com total suporte à navegação móvel da frota sem obstruções visuais.
