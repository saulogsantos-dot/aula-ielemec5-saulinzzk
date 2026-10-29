# 🌐 LinguaQuest | Plataforma Interativa de Ensino de Inglês e Espanhol

Uma aplicação web completa, moderna e interativa para ensino e prática dos idiomas **Inglês** e **Espanhol**, integrando **Reconhecimento de Voz (Web Speech API)**, **Síntese de Voz (Text-to-Speech)**, **Autenticação Google / Firebase**, **7 Personagens Tutores Virtuais** e **5 Temas Visuais Dinâmicos**.

---

## 🚀 Principais Funcionalidades

### 1. Fluxo de Boas-Vindas e Escolha do Idioma (Onboarding)
- **Pergunta Chave:** *"Qual idioma você quer aprender hoje?"*
- Seleção interativa entre **Inglês** (🇬🇧 / 🇺🇸) e **Espanhol** (🇪🇸 / 🇲🇽).
- Seleção de Nível de Conhecimento:
  1. **Iniciante (A1 - A2):** Vocabulário básico, rotinas e cumprimentos.
  2. **Intermediário (B1 - B2):** Tempos perfeitos, phrasal verbs e conversação prática.
  3. **Veterano (C1 - C2):** Nuances idiomáticas, inversões formais e debates complexos.
- Apresentação guiada por **Leo (O Tutor Guia)** com áudio de boas-vindas.

### 2. Autenticação Google e Persistência de Dados
- **Google Sign-In:** Integração nativa com Firebase Auth (`signInWithPopup`) e botão de **Login Google Instantâneo (1-clique)** para testes imediatos sem necessidade de chaves prévias.
- **Painel de Configuração do Firebase:** Permite inserir chaves próprias de qualquer projeto Google Cloud / Firebase para sincronização remota via Firestore.
- **Persistência Total (LocalStorage + Nuvem):**
  - Idioma ativo e nível escolhido.
  - Pontuação de gramática e média de precisão de pronúncia.
  - Módulos e exercícios concluídos.
  - Streak de dias de estudo e pontos de experiência (XP).
  - Tema visual selecionado.

### 3. Módulos de Aprendizado: Vocal e Escrito
- **A. Treino Vocal (Pronúncia & Dicção):**
  - Captura de áudio pelo microfone via **Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`)**.
  - Modelo sonoro nativo via **Speech Synthesis (Text-to-Speech)** com controle de velocidade (Normal 1.0x e Lenta 0.75x).
  - Algoritmo de precisão fonética com alinhamento palavra por palavra e cores explicativas (Verde = Correto, Amarelo = Parcial, Vermelho = Incorreto).
  - Barra de porcentagem de acerto (0% a 100%) e feedback personalizado falado por **Carlos**.
  - Simulador de teste de texto para ambientes sem microfone.
- **B. Treino Escrito (Gramática Interativa):**
  - 4 tipos dinâmicos de exercícios:
    1. *Preenchimento de Lacunas*
    2. *Reordenação de Frases (Sentence Scramble)*
    3. *Múltipla Escolha*
    4. *Tradução Inversa*
  - Correção imediata com a ficha gramatical aprofundada de **Sofia**, explicando a regra de sintaxe aplicável com opção de leitura por voz.

### 4. Os 7 Personagens Interativos (Mentores)
1. **🧭 Leo (O Tutor Guia):** Dá as boas-vindas, orienta a estrutura das lições e faz a transição entre níveis.
2. **📚 Sofia (Especialista em Gramática):** Apresenta dicas teóricas, regras de sintaxe e correções detalhadas.
3. **🎙️ Carlos (Mestre da Pronúncia):** Dedicado ao módulo vocal, analisa a articulação e ritmo das palavras.
4. **💃 Elena (Conversadora Nativa de Espanhol):** Simula diálogos do cotidiano em Madrid e Cidade do México.
5. **🗽 Jack (Conversador Nativo de Inglês):** Simula situações reais do dia a dia em Nova York e Londres com phrasal verbs.
6. **⚡ Maya (A Desafiadora):** Comanda quizzes relâmpago de 30 segundos com combos e alta pressão.
7. **🔥 Bruno (O Motivador):** Comemora o streak diário, dá dicas para recuperar erros e dispara confetes.

### 5. Temas Personalizados e Interface Dinâmica
Alterne o tema a qualquer momento pelo menu de personalização (ícone de paleta 🎨):
1. **Inglês (London / NYC):** Tons de azul-marinho, vermelho britânico e branco nítido.
2. **Espanhol (Madrid / Fiesta):** Cores solares (amarelo caloroso, carmim vibrante e terracota).
3. **Dark Neon:** Fundo escuro com contrastes em ciano elétrico e violeta neon para estudos noturnos.
4. **Minimalista Light:** Tons neutros e estética limpa focada em leitura.
5. **Tema do Personagem:** As cores do sistema adaptam-se dinamicamente ao tutor que estiver te orientando no momento!

---

## 🛠️ Tecnologias Utilizadas
- **HTML5 Semântico & CSS3 Moderno**
- **Tailwind CSS v4** com variáveis dinâmicas de tema
- **React 19 & JavaScript Moderno (ESModules / Vite)**
- **Web Speech API:** `SpeechRecognition` & `SpeechSynthesisUtterance`
- **Firebase Auth & Firestore** com fallback para `localStorage`
- **Lucide React** (Ícones modernos)
- **Canvas-Confetti** (Animações de conquista)

---

## 💻 Como Executar o Projeto

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
3. Abra no navegador o endereço exibido (geralmente `http://localhost:5173`).
