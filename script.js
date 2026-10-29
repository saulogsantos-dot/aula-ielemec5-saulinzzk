/**
 * ==============================================================================
 * PIZZARIA MAMMA MIA! - SCRIPT.JS
 * Lógica completa do jogo estilo "Papa's Pizzeria"
 *
 * Estrutura e Funcionalidades:
 * 1. Estado Global do Jogo & Carregamento/Salvamento com LocalStorage
 * 2. Efeitos Sonoros com Web Audio API (Sintetizador sem arquivos externos)
 * 3. Gerador de Pedidos Aleatórios dos Clientes
 * 4. Manipulação e Montagem da Pizza na Bancada (Camadas Visuais)
 * 5. Sistema de Forno e Temporizador (Crua, Mal Passada, Perfeita, Queimada)
 * 6. Validação, Cálculo de Precisão e Gorjeta
 * 7. Tratamento de Exceções e Feedback Visual Interativo
 * ==============================================================================
 */

// Garante que o código só executa após o carregamento completo do DOM
document.addEventListener('DOMContentLoaded', () => {

  /* ----------------------------------------------------------------------------
     1. ESTADO GLOBAL DO JOGO (GAME STATE)
     ---------------------------------------------------------------------------- */
  const gameState = {
    cash: 0.00,        // Dinheiro acumulado do jogador ($)
    day: 1,            // Nível ou Dia de funcionamento da pizzaria
    score: 0,          // Pontuação da sessão atual
    highScore: 0,      // Maior pontuação histórica (persistente)

    // Pedido atual requisitado pelo cliente
    currentOrder: null,

    // Pizza atualmente em preparação na bancada
    currentPizza: {
      crust: null,     // 'tradicional' | 'fina'
      sauce: null,     // 'tomate' | 'branco'
      cheese: null,    // 'mussarela' | 'parmesao'
      toppings: [],    // Array de recheios (ex: ['pepperoni', 'azeitonas'])
      bakePercent: 0,  // Porcentagem de cozimento (0% a 100%)
      bakeState: 'crua' // 'crua' | 'mal_passada' | 'perfeita' | 'queimada'
    },

    // Controle do Forno
    oven: {
      isBaking: false,
      intervalId: null,
      elapsedSeconds: 0,
      targetTimeSeconds: 8.0 // Tempo ideal para atingir 75% (Perfeita)
    }
  };

  /* ----------------------------------------------------------------------------
     2. MAPEAMENTO DOS ELEMENTOS DO DOM (DOCUMENT OBJECT MODEL)
     ---------------------------------------------------------------------------- */
  const dom = {
    // Placar e Status
    cashDisplay: document.getElementById('cash-display'),
    dayDisplay: document.getElementById('day-display'),
    scoreDisplay: document.getElementById('score-display'),
    highScoreDisplay: document.getElementById('highscore-display'),
    btnResetData: document.getElementById('btn-reset-data'),

    // Painel do Cliente e Ticket
    clientName: document.getElementById('client-name'),
    clientAvatar: document.getElementById('client-avatar'),
    clientMessage: document.getElementById('client-message'),
    orderCrust: document.getElementById('order-crust'),
    orderSauce: document.getElementById('order-sauce'),
    orderCheese: document.getElementById('order-cheese'),
    orderToppings: document.getElementById('order-toppings'),
    orderBakeTarget: document.getElementById('order-bake-target'),

    // Bancada de Montagem
    pizzaDisplay: document.getElementById('pizza-display'),
    layerCrust: document.getElementById('layer-crust'),
    layerSauce: document.getElementById('layer-sauce'),
    layerCheese: document.getElementById('layer-cheese'),
    layerToppings: document.getElementById('layer-toppings'),
    bakeOverlay: document.getElementById('bake-overlay'),
    addedIngredientsTags: document.getElementById('added-ingredients-tags'),
    ingredientButtons: document.querySelectorAll('.btn-ingredient'),
    btnClearPizza: document.getElementById('btn-clear-pizza'),
    btnSendToOven: document.getElementById('btn-send-to-oven'),

    // Estação do Forno
    ovenStation: document.getElementById('oven-station'),
    ovenGraphic: document.getElementById('oven-graphic'),
    ovenStatusBadge: document.getElementById('oven-status-badge'),
    ovenTimer: document.getElementById('oven-timer'),
    ovenProgressBar: document.getElementById('oven-progress-bar'),
    bakeStateText: document.getElementById('bake-state-text'),
    btnStartBaking: document.getElementById('btn-start-baking'),
    btnTakeOut: document.getElementById('btn-take-out'),

    // Modal de Feedback
    feedbackModal: document.getElementById('feedback-modal'),
    modalTitle: document.getElementById('modal-title'),
    modalReactionIcon: document.getElementById('modal-reaction-icon'),
    modalCustomerQuote: document.getElementById('modal-customer-quote'),
    modalToppingScore: document.getElementById('modal-topping-score'),
    modalBakeScore: document.getElementById('modal-bake-score'),
    modalTotalScore: document.getElementById('modal-total-score'),
    modalTipEarned: document.getElementById('modal-tip-earned'),
    btnNextCustomer: document.getElementById('btn-next-customer')
  };

  /* ----------------------------------------------------------------------------
     3. SINTETIZADOR DE ÁUDIO WEB (WEB AUDIO API)
     Permite efeitos sonoros instantâneos sem necessidade de arquivos externos MP3.
     ---------------------------------------------------------------------------- */
  const audio = {
    ctx: null,
    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    },
    // Som suave de colocar ingrediente na bancada
    playPop() {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(350, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(700, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.09);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    },
    // Som de sino quando a pizza fica pronta
    playBell() {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(987.77, this.ctx.currentTime); // Nota B5
      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.85);
    },
    // Som festivo de aprovação e dinheiro
    playCash() {
      this.init();
      if (!this.ctx) return;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.08);
        osc.stop(this.ctx.currentTime + idx * 0.08 + 0.26);
      });
    }
  };

  /* ----------------------------------------------------------------------------
     4. PERSISTÊNCIA DE DADOS COM LOCALSTORAGE
     ---------------------------------------------------------------------------- */

  /**
   * Salva o progresso do jogador (dinheiro acumulado e recorde) no LocalStorage.
   */
  function saveGameProgress() {
    try {
      const dataToSave = {
        cash: gameState.cash,
        highScore: gameState.highScore,
        day: gameState.day
      };
      localStorage.setItem('mamma_mia_save', JSON.stringify(dataToSave));
    } catch (e) {
      console.warn('Não foi possível salvar no localStorage:', e);
    }
  }

  /**
   * Carrega dados prévios salvos no navegador ao iniciar o jogo.
   */
  function loadGameProgress() {
    try {
      const savedData = localStorage.getItem('mamma_mia_save');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        gameState.cash = typeof parsed.cash === 'number' ? parsed.cash : 0.00;
        gameState.highScore = typeof parsed.highScore === 'number' ? parsed.highScore : 0;
        gameState.day = typeof parsed.day === 'number' ? parsed.day : 1;
      }
    } catch (e) {
      console.warn('Erro ao carregar dados do localStorage:', e);
    }
    updateHeaderUI();
  }

  /**
   * Reseta os dados armazenados e recomeça a pizzaria do zero.
   */
  function resetAllProgress() {
    const confirmReset = window.confirm('Deseja realmente zerar todos os seus recordes e dinheiro acumulado?');
    if (confirmReset) {
      localStorage.removeItem('mamma_mia_save');
      gameState.cash = 0.00;
      gameState.score = 0;
      gameState.highScore = 0;
      gameState.day = 1;
      updateHeaderUI();
      startNewOrder();
      alert('Progresso reiniciado com sucesso! Boa sorte na nova jornada!');
    }
  }

  /**
   * Atualiza as informações exibidas no cabeçalho.
   */
  function updateHeaderUI() {
    dom.cashDisplay.textContent = `$ ${gameState.cash.toFixed(2)}`;
    dom.dayDisplay.textContent = gameState.day;
    dom.scoreDisplay.textContent = `${gameState.score} pts`;
    dom.highScoreDisplay.textContent = `${gameState.highScore} pts`;
  }

  /* ----------------------------------------------------------------------------
     5. BANCO DE DADOS & GERADOR DE PEDIDOS ALEATÓRIOS
     ---------------------------------------------------------------------------- */
  const CLIENTS_CATALOG = [
    { name: 'Luigi Rossi', avatar: '👨‍🍳', quote: 'Ciao! Vim direto de Nápoles em busca da melhor pizza!' },
    { name: 'Sophia Bella', avatar: '👩', quote: 'Buonasera! Capriche no queijo e nos temperos frescos!' },
    { name: 'Giovanni Mamma', avatar: '👴', quote: 'Mamma Mia! Não deixe minha pizza passar do ponto no forno!' },
    { name: 'Francesca Roma', avatar: '👵', quote: 'Adoro quando o molho de tomate é bem espalhado e perfumado.' },
    { name: 'Marco Bianchi', avatar: '🧔', quote: 'Estou com muita fome! Quero uma pizza com bastante recheio!' },
    { name: 'Isabella Verde', avatar: '👱‍♀️', quote: 'Hoje quero experimentar uma combinação especial e crocante.' }
  ];

  const CRUST_OPTIONS = ['tradicional', 'fina'];
  const SAUCE_OPTIONS = ['tomate', 'branco'];
  const CHEESE_OPTIONS = ['mussarela', 'parmesao'];
  const TOPPING_OPTIONS = ['pepperoni', 'cogumelos', 'azeitonas', 'manjericao'];

  /**
   * Sorteia um número aleatório de recheios sem repetição.
   */
  function getRandomToppings() {
    // Escolhe aleatoriamente de 1 a 3 recheios diferentes
    const count = Math.floor(Math.random() * 3) + 1;
    const shuffled = [...TOPPING_OPTIONS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  /**
   * Cria um novo pedido aleatório com cliente personalizado.
   */
  function generateRandomOrder() {
    const client = CLIENTS_CATALOG[Math.floor(Math.random() * CLIENTS_CATALOG.length)];
    const crust = CRUST_OPTIONS[Math.floor(Math.random() * CRUST_OPTIONS.length)];
    const sauce = SAUCE_OPTIONS[Math.floor(Math.random() * SAUCE_OPTIONS.length)];
    const cheese = CHEESE_OPTIONS[Math.floor(Math.random() * CHEESE_OPTIONS.length)];
    const toppings = getRandomToppings();

    return {
      client,
      crust,
      sauce,
      cheese,
      toppings,
      bakeTarget: 'perfeita' // Padrão de excelência
    };
  }

  /**
   * Renderiza a comanda do cliente no DOM.
   */
  function renderOrderTicket(order) {
    dom.clientName.textContent = order.client.name;
    dom.clientAvatar.textContent = order.client.avatar;
    dom.clientMessage.textContent = `"${order.client.quote}"`;

    dom.orderCrust.textContent = order.crust === 'tradicional' ? 'Massa Tradicional' : 'Massa Fina / Crocante';
    dom.orderSauce.textContent = order.sauce === 'tomate' ? 'Molho de Tomate' : 'Molho Branco';
    dom.orderCheese.textContent = order.cheese === 'mussarela' ? 'Mussarela' : 'Parmesão';

    // Lista de Recheios na Comanda
    dom.orderToppings.innerHTML = '';
    order.toppings.forEach(top => {
      const li = document.createElement('li');
      li.textContent = `+ ${capitalize(top)}`;
      dom.orderToppings.appendChild(li);
    });
  }

  /* ----------------------------------------------------------------------------
     6. BANCADA DE MONTAGEM (BUILD STATION)
     ---------------------------------------------------------------------------- */

  /**
   * Adiciona ou altera um ingrediente na pizza atual.
   * @param {string} type - 'crust' | 'sauce' | 'cheese' | 'topping'
   * @param {string} item - Nome do ingrediente
   */
  function handleIngredientClick(type, item) {
    audio.playPop();

    if (type === 'crust') {
      gameState.currentPizza.crust = item;
      dom.layerCrust.className = `pizza-crust ${item}`;
    } else if (type === 'sauce') {
      gameState.currentPizza.sauce = item;
      dom.layerSauce.className = `pizza-sauce ${item}`;
      dom.layerSauce.classList.remove('hidden');
    } else if (type === 'cheese') {
      gameState.currentPizza.cheese = item;
      dom.layerCheese.className = `pizza-cheese ${item}`;
      dom.layerCheese.classList.remove('hidden');
    } else if (type === 'topping') {
      // Adiciona o recheio à lista se ainda não estiver ou permite múltiplas unidades
      if (!gameState.currentPizza.toppings.includes(item)) {
        gameState.currentPizza.toppings.push(item);
      }
      renderVisualToppingsOnPizza(item);
    }

    updateAddedIngredientsTags();
  }

  /**
   * Cria visualmente ícones espalhados pela pizza imitando a colocação dos recheios.
   */
  function renderVisualToppingsOnPizza(topping) {
    const iconsMap = {
      pepperoni: '🥓',
      cogumelos: '🍄',
      azeitonas: '🫒',
      manjericao: '🌿'
    };

    // Coordenadas radiais para distribuir 6 unidades harmoniosamente pelo disco
    const positions = [
      { x: 50, y: 30 },
      { x: 72, y: 48 },
      { x: 62, y: 72 },
      { x: 38, y: 72 },
      { x: 28, y: 48 },
      { x: 50, y: 52 } // Centro
    ];

    positions.forEach((pos) => {
      const topElem = document.createElement('div');
      topElem.className = 'topping-item';
      topElem.textContent = iconsMap[topping] || '🍕';

      // Pequena variação aleatória de rotação e deslocamento para parecer artesanal
      const jitterX = (Math.random() - 0.5) * 8;
      const jitterY = (Math.random() - 0.5) * 8;
      const rot = Math.floor(Math.random() * 360);

      topElem.style.left = `${pos.x + jitterX}%`;
      topElem.style.top = `${pos.y + jitterY}%`;
      topElem.style.transform = `translate(-50%, -50%) rotate(${rot}deg)`;

      dom.layerToppings.appendChild(topElem);
    });
  }

  /**
   * Atualiza a lista em etiquetas (tags) com os itens atualmente na pizza.
   */
  function updateAddedIngredientsTags() {
    dom.addedIngredientsTags.innerHTML = '';
    const items = [];

    if (gameState.currentPizza.crust) items.push(`Massa ${capitalize(gameState.currentPizza.crust)}`);
    if (gameState.currentPizza.sauce) items.push(`Molho ${capitalize(gameState.currentPizza.sauce)}`);
    if (gameState.currentPizza.cheese) items.push(`Queijo ${capitalize(gameState.currentPizza.cheese)}`);
    gameState.currentPizza.toppings.forEach(t => items.push(capitalize(t)));

    if (items.length === 0) {
      dom.addedIngredientsTags.innerHTML = '<span class="empty-tag">Pizza vazia. Comece escolhendo a massa!</span>';
      return;
    }

    items.forEach(name => {
      const tag = document.createElement('span');
      tag.className = 'ingredient-tag';
      tag.innerHTML = `✓ ${name}`;
      dom.addedIngredientsTags.appendChild(tag);
    });
  }

  /**
   * Limpa a pizza na bancada para recomeçar.
   */
  function clearCurrentPizza() {
    gameState.currentPizza.crust = null;
    gameState.currentPizza.sauce = null;
    gameState.currentPizza.cheese = null;
    gameState.currentPizza.toppings = [];
    gameState.currentPizza.bakePercent = 0;
    gameState.currentPizza.bakeState = 'crua';

    // Reseta visual da pizza
    dom.layerCrust.className = 'pizza-crust';
    dom.layerSauce.className = 'pizza-sauce hidden';
    dom.layerCheese.className = 'pizza-cheese hidden';
    dom.layerToppings.innerHTML = '';
    dom.bakeOverlay.className = 'pizza-bake-overlay';

    updateAddedIngredientsTags();
  }

  /* ----------------------------------------------------------------------------
     7. ESTAÇÃO DO FORNO (BAKE STATION & TIMER)
     ---------------------------------------------------------------------------- */

  /**
   * Transfere a pizza montada da bancada para a estação do forno.
   */
  function sendPizzaToOven() {
    // Validação de exceção: não permite assar uma pizza vazia
    if (!gameState.currentPizza.crust) {
      alert('⚠️ Atenção Pizzaiolo! Você precisa ao menos escolher a massa antes de levar a pizza ao forno!');
      return;
    }

    // Atualiza status do forno
    dom.ovenStatusBadge.textContent = 'Pizza Pronta para Assar';
    dom.ovenStatusBadge.style.background = '#fef08a';
    dom.ovenStatusBadge.style.color = '#854d0e';

    dom.bakeStateText.textContent = 'Pizza dentro do forno! Clique em "Iniciar Assamento".';
    dom.ovenGraphic.classList.add('has-pizza');

    // Habilita o botão de iniciar o forno
    dom.btnStartBaking.disabled = false;
    dom.btnTakeOut.disabled = true;

    // Rola a visualização até o forno se estiver em telas menores
    if (window.innerWidth <= 1024) {
      dom.ovenStation.scrollIntoView({ behavior: 'smooth' });
    }
  }

  /**
   * Inicia o temporizador contínuo do forno a lenha.
   */
  function startBakingProcess() {
    if (gameState.oven.isBaking) return;

    gameState.oven.isBaking = true;
    gameState.oven.elapsedSeconds = 0;
    gameState.currentPizza.bakePercent = 0;

    dom.btnStartBaking.disabled = true;
    dom.btnTakeOut.disabled = false;
    dom.ovenGraphic.classList.add('baking');

    dom.ovenStatusBadge.textContent = '🔥 Assando...';
    dom.ovenStatusBadge.style.background = '#fee2e2';
    dom.ovenStatusBadge.style.color = '#b91c1c';

    // Intervalo de atualização a cada 100ms para animação suave
    const tickIntervalMs = 100;
    const totalDurationSeconds = 11.0; // Tempo total até queimar completamente

    gameState.oven.intervalId = setInterval(() => {
      gameState.oven.elapsedSeconds += tickIntervalMs / 1000;
      const percent = Math.min(100, (gameState.oven.elapsedSeconds / totalDurationSeconds) * 100);
      gameState.currentPizza.bakePercent = percent;

      // Atualiza texto e largura da barra de progresso
      dom.ovenTimer.textContent = `${gameState.oven.elapsedSeconds.toFixed(1)}s`;
      dom.ovenProgressBar.style.width = `${percent}%`;

      // Determina a classificação do cozimento baseado na porcentagem
      evaluateBakeState(percent);
    }, tickIntervalMs);
  }

  /**
   * Monitora em tempo real a faixa de temperatura/cozimento da pizza.
   */
  function evaluateBakeState(percent) {
    if (percent < 35) {
      gameState.currentPizza.bakeState = 'crua';
      dom.bakeStateText.textContent = '❄️ Ponto: Crua (Aguarde dourar mais...)';
      dom.bakeStateText.style.color = '#3b82f6';
      dom.bakeOverlay.className = 'pizza-bake-overlay';
    } else if (percent >= 35 && percent < 65) {
      gameState.currentPizza.bakeState = 'mal_passada';
      dom.bakeStateText.textContent = '🟡 Ponto: Mal Passada (Começando a borbulhar)';
      dom.bakeStateText.style.color = '#f59e0b';
      dom.bakeOverlay.className = 'pizza-bake-overlay';
    } else if (percent >= 65 && percent <= 85) {
      gameState.currentPizza.bakeState = 'perfeita';
      dom.bakeStateText.textContent = '🌟 PONTO PERFEITO! Dourada e crocante! TIRE AGORA!';
      dom.bakeStateText.style.color = '#10b981';
      dom.bakeOverlay.className = 'pizza-bake-overlay baked-perfect';
    } else {
      gameState.currentPizza.bakeState = 'queimada';
      dom.bakeStateText.textContent = '💀 QUEIMOU! A pizza passou do ponto e tostou!';
      dom.bakeStateText.style.color = '#ef4444';
      dom.bakeOverlay.className = 'pizza-bake-overlay baked-burnt';
    }
  }

  /**
   * Retira a pizza do forno, para o timer e prossegue para a avaliação do cliente.
   */
  function takeOutAndServePizza() {
    if (!gameState.oven.isBaking) return;

    // Para o temporizador
    clearInterval(gameState.oven.intervalId);
    gameState.oven.isBaking = false;
    dom.ovenGraphic.classList.remove('baking');
    dom.ovenGraphic.classList.remove('has-pizza');

    dom.btnStartBaking.disabled = true;
    dom.btnTakeOut.disabled = true;

    audio.playBell();

    // Executa a avaliação do pedido
    evaluatePizzaDelivery();
  }

  /* ----------------------------------------------------------------------------
     8. SISTEMA DE AVALIAÇÃO, CÁLCULO DE NOTA E GORJETA
     ---------------------------------------------------------------------------- */

  /**
   * Compara a pizza montada com o pedido original e calcula as porcentagens.
   */
  function evaluatePizzaDelivery() {
    const order = gameState.currentOrder;
    const pizza = gameState.currentPizza;

    // 1. Cálculo da Precisão dos Ingredientes (Peso: 50% da nota)
    let toppingScore = 0;
    let totalItemsChecked = 3 + order.toppings.length; // Massa + Molho + Queijo + Cada Recheio
    let correctItems = 0;

    // Verifica Massa
    if (pizza.crust === order.crust) correctItems++;
    // Verifica Molho
    if (pizza.sauce === order.sauce) correctItems++;
    // Verifica Queijo
    if (pizza.cheese === order.cheese) correctItems++;

    // Verifica Recheios Solicitados
    order.toppings.forEach(reqTop => {
      if (pizza.toppings.includes(reqTop)) correctItems++;
    });

    // Penalidade para recheios extras indesejados
    pizza.toppings.forEach(extraTop => {
      if (!order.toppings.includes(extraTop)) {
        correctItems = Math.max(0, correctItems - 1);
      }
    });

    toppingScore = Math.round((correctItems / totalItemsChecked) * 100);
    toppingScore = Math.max(0, Math.min(100, toppingScore));

    // 2. Cálculo do Ponto do Forno (Peso: 50% da nota)
    let bakeScore = 0;
    if (pizza.bakeState === 'perfeita') {
      bakeScore = 100;
    } else if (pizza.bakeState === 'mal_passada') {
      bakeScore = 60;
    } else if (pizza.bakeState === 'crua') {
      bakeScore = 20;
    } else if (pizza.bakeState === 'queimada') {
      bakeScore = 10;
    }

    // 3. Nota Geral (Média Ponderada)
    const finalScore = Math.round((toppingScore * 0.55) + (bakeScore * 0.45));

    // 4. Gorjeta em Dinheiro proporcional à qualidade
    let tip = 0;
    if (finalScore >= 95) {
      tip = 16.00 + (Math.random() * 4.00); // Super bônus
    } else if (finalScore >= 80) {
      tip = 10.00 + (Math.random() * 3.00);
    } else if (finalScore >= 60) {
      tip = 5.00 + (Math.random() * 2.00);
    } else {
      tip = 0.50; // Quase nada por pizza ruim/queimada
    }

    // Atualiza o estado
    gameState.cash += tip;
    gameState.score += finalScore;

    if (gameState.score > gameState.highScore) {
      gameState.highScore = gameState.score;
    }

    // Persiste no LocalStorage
    saveGameProgress();
    updateHeaderUI();

    // Apresenta o Modal de Avaliação ao Jogador
    displayFeedbackModal(toppingScore, bakeScore, finalScore, tip);
  }

  /**
   * Preenche e exibe o modal de feedback com as reações e frases do cliente.
   */
  function displayFeedbackModal(toppingScore, bakeScore, finalScore, tip) {
    dom.modalToppingScore.textContent = `${toppingScore}%`;
    dom.modalBakeScore.textContent = `${bakeScore}%`;
    dom.modalTotalScore.textContent = `${finalScore}%`;
    dom.modalTipEarned.textContent = `+$ ${tip.toFixed(2)}`;

    // Reações visuais de acordo com o resultado
    if (finalScore >= 90) {
      audio.playCash();
      dom.modalTitle.textContent = '🌟 MAMMA MIA! PERFEIÇÃO!';
      dom.modalReactionIcon.textContent = '😍🍕';
      dom.modalCustomerQuote.textContent = `"Sem palavras! Esta é a verdadeira pizza italiana! Tome esta bela gorjeta!"`;
    } else if (finalScore >= 70) {
      audio.playCash();
      dom.modalTitle.textContent = '👍 Muito Boa!';
      dom.modalReactionIcon.textContent = '😋✨';
      dom.modalCustomerQuote.textContent = `"Gostei bastante! Pequenos detalhes para ajustar, mas estava saborosa."`;
    } else if (finalScore >= 50) {
      dom.modalTitle.textContent = '😐 Razoável...';
      dom.modalReactionIcon.textContent = '😕';
      dom.modalCustomerQuote.textContent = `"Faltou algum ingrediente ou o ponto não foi o ideal... Mas deu para comer."`;
    } else {
      dom.modalTitle.textContent = '😡 Que decepção!';
      dom.modalReactionIcon.textContent = '🤬🔥';
      dom.modalCustomerQuote.textContent = `"Terrível! Ou está crua ou queimou tudo! Quero falar com o gerente!"`;
    }

    dom.feedbackModal.classList.remove('hidden');
  }

  /**
   * Prepara o jogo para atender o próximo cliente.
   */
  function proceedToNextCustomer() {
    dom.feedbackModal.classList.add('hidden');
    clearCurrentPizza();

    // Reseta visual e timer do forno
    dom.ovenTimer.textContent = '0.0s';
    dom.ovenProgressBar.style.width = '0%';
    dom.bakeStateText.textContent = 'Forno vazio. Monte a próxima pizza!';
    dom.ovenStatusBadge.textContent = 'Aguardando Pizza...';
    dom.ovenStatusBadge.style.background = '#f3f4f6';
    dom.ovenStatusBadge.style.color = '#6b7280';
    dom.btnStartBaking.disabled = true;
    dom.btnTakeOut.disabled = true;

    // Incrementa dia a cada 3 clientes atendidos
    if (gameState.score > 0 && gameState.score % 300 < 100) {
      gameState.day++;
      updateHeaderUI();
      saveGameProgress();
    }

    startNewOrder();
  }

  /**
   * Inicia um novo ciclo de pedido.
   */
  function startNewOrder() {
    gameState.currentOrder = generateRandomOrder();
    renderOrderTicket(gameState.currentOrder);
  }

  /* ----------------------------------------------------------------------------
     9. REGISTRO DE EVENTOS (EVENT LISTENERS)
     ---------------------------------------------------------------------------- */

  // Botões de seleção de ingredientes
  dom.ingredientButtons.forEach(button => {
    button.addEventListener('click', () => {
      const type = button.getAttribute('data-type');
      const item = button.getAttribute('data-item');
      handleIngredientClick(type, item);
    });
  });

  // Botão de Limpar / Descartar Pizza
  dom.btnClearPizza.addEventListener('click', () => {
    if (confirm('Deseja descartar a pizza atual e começar de novo a montagem?')) {
      clearCurrentPizza();
    }
  });

  // Botão de Levar Pizza ao Forno
  dom.btnSendToOven.addEventListener('click', sendPizzaToOven);

  // Botões do Forno
  dom.btnStartBaking.addEventListener('click', startBakingProcess);
  dom.btnTakeOut.addEventListener('click', takeOutAndServePizza);

  // Botão do Modal (Próximo Cliente)
  dom.btnNextCustomer.addEventListener('click', proceedToNextCustomer);

  // Botão de Resetar Dados do LocalStorage
  dom.btnResetData.addEventListener('click', resetAllProgress);

  /* ----------------------------------------------------------------------------
     10. INICIALIZAÇÃO DO JOGO
     ---------------------------------------------------------------------------- */
  loadGameProgress();
  startNewOrder();

});

/* ----------------------------------------------------------------------------
   FUNÇÃO UTILITÁRIA AUXILIAR
   ---------------------------------------------------------------------------- */
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
