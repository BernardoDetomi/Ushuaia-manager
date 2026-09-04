# ✈️ Ushuaia Manager

<div align="center">

**Planejamento de viagens e divisão de despesas em um só lugar**

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-11.0-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com/)

[🌐 Acessar demonstração](https://ushuaia-manager.vercel.app)

</div>

---

## Sobre o projeto

O **Ushuaia Manager** nasceu como um projeto particular para organizar uma viagem que eu faria para Ushuaia. A primeira versão tinha um objetivo simples: acompanhar as parcelas e os pagamentos relacionados a passagens, hospedagens, passeios e outras despesas da viagem.

Com o uso, surgiu também a necessidade de controlar os gastos do dia a dia entre os participantes. Assim nasceu o módulo **Split**, criado para registrar despesas com alimentação, presentes, passeios, transporte e outras compras, calculando corretamente quanto cada pessoa pagou e quanto ainda precisa acertar.

O projeto continuou evoluindo e deixou de ser limitado a uma única viagem. Atualmente, cada usuário pode criar suas próprias viagens e grupos de Split, convidar outras pessoas e gerenciar apenas os espaços dos quais participa.

A aplicação ainda está em desenvolvimento e há melhorias planejadas, mas os principais fluxos já estão funcionais.

## Funcionalidades

### Viagens

- Criação e gerenciamento de múltiplas viagens
- Controle de gastos com passagens, hotéis, alimentação, transporte e passeios
- Registro de compras à vista ou parceladas
- Organização de pagamentos por mês e por pessoa
- Acompanhamento de parcelas pagas e pendentes
- Dashboard com resumo financeiro e gráficos
- Cadastro de passeios e atividades
- Checklist de bagagem por participante
- Contagem regressiva baseada na data da viagem

### Split de despesas

- Criação de múltiplos grupos
- Registro de despesas compartilhadas
- Divisão igual, percentual ou por valores personalizados
- Identificação de quem pagou e de quem participa de cada gasto
- Cálculo automático dos saldos e acertos entre participantes
- Registro do histórico de pagamentos
- Despesas recorrentes
- Meta mensal de gastos
- Fechamento mensal do grupo

### Colaboração e acesso

- Autenticação por e-mail e senha com Firebase Authentication
- Viagens e Splits privados, visíveis somente para seus membros
- Convite direto pelo e-mail de um usuário cadastrado
- Link compartilhável com solicitação de entrada
- Aprovação de solicitações pelo líder
- Membros podem visualizar e criar registros
- Apenas o líder pode editar, excluir e administrar acessos

## Tecnologias

- **React 18** — construção da interface
- **Vite 6** — ambiente de desenvolvimento e build
- **Tailwind CSS 3** — estilização responsiva
- **Firebase Authentication** — cadastro e autenticação
- **Cloud Firestore** — armazenamento e sincronização dos dados
- **Recharts** — gráficos e indicadores financeiros
- **Lucide React** — ícones
- **Vercel** — hospedagem e deploy

## Arquitetura e segurança

Os dados são organizados por viagem ou grupo. Cada documento mantém a relação dos usuários autorizados, enquanto as regras do Firestore validam o acesso no servidor.

```text
React + Vite
     │
     ├── Firebase Authentication
     │
     └── Cloud Firestore
          ├── Usuários
          ├── Viagens privadas
          │    ├── Gastos
          │    ├── Passeios
          │    └── Checklist
          └── Grupos de Split
               ├── Despesas
               ├── Pagamentos
               └── Recorrências
```

As chaves utilizadas por aplicações web do Firebase identificam o projeto, mas não substituem controle de acesso. A proteção dos dados depende das regras disponíveis em [`firestore.rules`](firestore.rules). Nunca publique arquivos `.env` com configurações pessoais ou credenciais de serviços privados.

## Executando localmente

### Pré-requisitos

- Node.js 18 ou superior
- npm
- Um projeto no Firebase com Authentication e Firestore habilitados

### Instalação

```bash
git clone https://github.com/BernardoDetomi/Ushuaia-manager.git
cd Ushuaia-manager
npm install
```

Crie um arquivo `.env` na raiz usando o arquivo [`.env.example`](.env.example) como referência:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

No Firebase Console, habilite o provedor **E-mail/senha** em **Authentication → Sign-in method** e crie um banco do Cloud Firestore.

Depois, execute:

```bash
npm run dev
```

A aplicação ficará disponível, por padrão, em `http://localhost:5173`.

> No Windows, caso o PowerShell bloqueie os scripts do npm, utilize `npm.cmd install` e `npm.cmd run dev`.

## Regras do Firestore

Com a Firebase CLI autenticada, publique as regras de segurança informando o ID do seu projeto:

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules --project seu-project-id
```

No PowerShell com execução de scripts bloqueada, substitua `npx` por `npx.cmd`.

## Build e deploy

Para gerar uma versão de produção:

```bash
npm run build
npm run preview
```

O projeto pode ser publicado na Vercel. Cadastre nela as mesmas variáveis definidas no `.env` e utilize as configurações padrão para aplicações Vite:

- Build command: `npm run build`
- Output directory: `dist`

## Estrutura principal

```text
Ushuaia-manager/
├── src/
│   ├── components/
│   │   └── split/
│   ├── config/
│   ├── services/
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── firebase.json
├── firestore.rules
├── package.json
└── vite.config.js
```

## Roadmap

- [x] Controle de despesas e parcelas de viagem
- [x] Dashboard e visualização mensal
- [x] Passeios e checklist de bagagem
- [x] Grupos de Split e cálculo de acertos
- [x] Múltiplas viagens e grupos privados
- [x] Convites por e-mail e link
- [x] Permissões de líder e membro
- [ ] Melhorar o gerenciamento de participantes
- [ ] Adicionar recuperação de senha
- [ ] Criar notificações para convites e solicitações
- [ ] Ampliar testes automatizados
- [ ] Otimizar o carregamento e a divisão do bundle
- [ ] Continuar refinando a experiência em dispositivos móveis

## Contribuições

Sugestões, relatos de problemas e contribuições são bem-vindos. Abra uma [issue](https://github.com/BernardoDetomi/Ushuaia-manager/issues) para propor uma melhoria ou relatar um erro.

---

<div align="center">

Desenvolvido por [Bernardo Detomi](https://github.com/BernardoDetomi)

⭐ Se o projeto foi útil ou interessante para você, considere deixar uma estrela.

</div>
