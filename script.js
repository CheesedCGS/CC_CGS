// Инициализация Telegram Mini App
Telegram.WebApp.ready();
Telegram.WebApp.expand();

// Игровые переменные
let gameState = {
    cheese: 0,
    clickPower: 1,
    multiplier: 1,
    multiplierLevel: 0,
    autoclickerLevel: 0,
    level: 1,
    prefix: '',
    username: 'Игрок'
};

// Цены (будут расти)
let prices = {
    power: 10,
    multiplier: 500,
    autoclicker: 1000,
    king: 5000,
    star: 3000,
    fire: 8000
};

// Инициализация
function init() {
    // Получаем данные пользователя Telegram
    if (Telegram.WebApp.initDataUnsafe.user) {
        const user = Telegram.WebApp.initDataUnsafe.user;
        gameState.username = user.first_name || 'Игрок';
        document.getElementById('username').textContent = gameState.username;
    }
    
    // Загружаем сохраненную игру
    loadGame();
    
    // Инициализируем вкладки
    initTabs();
    
    // Запускаем автокликер
    startAutoclicker();
    
    // Обновляем интерфейс
    updateUI();
}

// ВКЛАДКИ
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Убираем активный класс у всех кнопок
            tabBtns.forEach(b => b.classList.remove('active'));
            // Добавляем активный класс текущей кнопке
            this.classList.add('active');
            
            // Получаем ID вкладки
            const tabId = this.getAttribute('data-tab');
            
            // Скрываем все вкладки
            tabPanes.forEach(pane => {
                pane.classList.remove('active');
            });
            
            // Показываем нужную вкладку
            document.getElementById(`${tabId}-tab`).classList.add('active');
            
            // Анимация перехода
            document.getElementById(`${tabId}-tab`).style.animation = 'none';
            setTimeout(() => {
                document.getElementById(`${tabId}-tab`).style.animation = 'fadeInUp 0.4s ease';
            }, 10);
        });
    });
}

// КЛИК ПО СЫРУ
document.getElementById('cheeseButton').addEventListener('click', function() {
    // Анимация нажатия
    this.style.transform = 'scale(0.95)';
    setTimeout(() => {
        this.style.transform = 'scale(1)';
    }, 100);
    
    // Эффект частиц
    createParticles(this);
    
    // Начисление сыра
    const earned = gameState.clickPower * gameState.multiplier;
    gameState.cheese += earned;
    
    // Всплывающий текст
    showFloatingText(`+${earned}`, this);
    
    // Тактильная отдача
    if (Telegram.WebApp.HapticFeedback) {
        Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
    
    // Обновление
    updateUI();
    saveGame();
});

// ЭФФЕКТ ЧАСТИЦ
function createParticles(element) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'cheese-particle';
        particle.textContent = '🧀';
        particle.style.cssText = `
            position: fixed;
            left: ${centerX}px;
            top: ${centerY}px;
            font-size: 20px;
            pointer-events: none;
            z-index: 1000;
            animation: particleFly ${Math.random() * 0.5 + 0.5}s ease-out forwards;
        `;
        
        document.body.appendChild(particle);
        
        // Удаляем частицу после анимации
        setTimeout(() => {
            particle.remove();
        }, 500);
    }
    
    // Добавляем CSS анимацию для частиц
    if (!document.querySelector('#particle-animation')) {
        const style = document.createElement('style');
        style.id = 'particle-animation';
        style.textContent = `
            @keyframes particleFly {
                0% {
                    opacity: 1;
                    transform: translate(0, 0) scale(1) rotate(0deg);
                }
                100% {
                    opacity: 0;
                    transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) scale(0.5) rotate(360deg);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// ПОКУПКА УЛУЧШЕНИЙ
function buyUpgrade(type) {
    const price = prices[type];
    
    if (gameState.cheese >= price) {
        gameState.cheese -= price;
        
        switch(type) {
            case 'power':
                gameState.clickPower++;
                prices.power = Math.floor(prices.power * 1.5);
                showNotification(`⚡ Сила клика: ${gameState.clickPower}`);
                break;
                
            case 'multiplier':
                if (gameState.multiplierLevel < 5) {
                    gameState.multiplierLevel++;
                    gameState.multiplier = Math.pow(2, gameState.multiplierLevel);
                    prices.multiplier = Math.floor(prices.multiplier * 3);
                    showNotification(`✖️ Множитель x${gameState.multiplier}!`);
                }
                break;
                
            case 'autoclicker':
                gameState.autoclickerLevel++;
                prices.autoclicker = Math.floor(prices.autoclicker * 2);
                showNotification(`🤖 Автокликер: ${gameState.autoclickerLevel} ур.`);
                startAutoclicker();
                break;
        }
        
        gameState.level++;
        updateUI();
        saveGame();
        
        // Анимация успешной покупки
        const event = new CustomEvent('upgradeBought', { detail: { type, level: gameState.level } });
        document.dispatchEvent(event);
        
    } else {
        showNotification(`❌ Не хватает ${price - gameState.cheese} сыра`);
    }
}

// ПОКУПКА ПРЕФИКСА
document.querySelectorAll('.buy-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const item = this.closest('.shop-item').getAttribute('data-item');
        const price = parseInt(this.getAttribute('data-price'));
        
        if (gameState.cheese >= price) {
            gameState.cheese -= price;
            gameState.prefix = item;
            
            // Анимация покупки
            this.style.background = 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)';
            this.innerHTML = '<i class="fas fa-check"></i> Куплено';
            this.disabled = true;
            
            showNotification(`✅ Префикс куплен!`);
            updateUI();
            saveGame();
            
        } else {
            showNotification(`❌ Не хватает ${price - gameState.cheese} сыра`);
        }
    });
});

// АВТОКЛИКЕР
let autoclickerInterval = null;

function startAutoclicker() {
    if (autoclickerInterval) {
        clearInterval(autoclickerInterval);
    }
    
    if (gameState.autoclickerLevel > 0) {
        autoclickerInterval = setInterval(() => {
            const earned = gameState.autoclickerLevel * 5;
            gameState.cheese += earned;
            updateUI();
            saveGame();
        }, 1000);
    }
}

// ПЕРЕВОД СЫРА
function transferCheese() {
    const amount = parseInt(document.getElementById('transferAmount').value);
    const targetId = document.getElementById('transferUser').value.trim();
    
    if (!amount || amount < 1) {
        showNotification('❌ Введите корректную сумму');
        return;
    }
    
    if (!targetId) {
        showNotification('❌ Введите ID получателя');
        return;
    }
    
    if (gameState.cheese >= amount) {
        gameState.cheese -= amount;
        
        // Анимация перевода
        const btn = document.querySelector('.transfer-btn');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
        btn.disabled = true;
        
        setTimeout(() => {
            showNotification(`✅ Переведено ${amount} сыра игроку ${targetId}`);
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Отправить перевод';
            btn.disabled = false;
            
            updateUI();
            saveGame();
        }, 1500);
        
    } else {
        showNotification('❌ Недостаточно сыра');
    }
}

// ОБНОВЛЕНИЕ ИНТЕРФЕЙСА
function updateUI() {
    // Счетчики
    document.getElementById('cheeseCount').textContent = formatNumber(gameState.cheese);
    document.getElementById('clickPower').textContent = gameState.clickPower;
    document.getElementById('multiplier').textContent = `x${gameState.multiplier}`;
    document.getElementById('autoclicker').textContent = `${gameState.autoclickerLevel * 5}/сек`;
    document.getElementById('userLevel').textContent = `Ур. ${gameState.level}`;
    document.getElementById('clickPowerText').textContent = `+${gameState.clickPower * gameState.multiplier}`;
    document.getElementById('availableCheese').textContent = `${gameState.cheese} 🧀`;
    
    // Цены
    document.getElementById('powerPrice').textContent = prices.power;
    document.getElementById('multiplierPrice').textContent = prices.multiplier;
    document.getElementById('autoclickerPrice').textContent = prices.autoclicker;
    
    // Обновляем кнопки
    updateButtons();
    
    // Обновляем топ
    updateTopList();
}

// ФОРМАТИРОВАНИЕ ЧИСЕЛ
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num;
}

// ВСПЛЫВАЮЩИЙ ТЕКСТ
function showFloatingText(text, element) {
    const floatText = document.createElement('div');
    floatText.textContent = text;
    floatText.className = 'floating-text';
    
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    floatText.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        color: #ff8f00;
        font-weight: bold;
        font-size: 24px;
        text-shadow: 2px 2px 0 white;
        pointer-events: none;
        z-index: 1000;
        animation: floatUp 1s ease-out forwards;
    `;
    
    document.body.appendChild(floatText);
    
    setTimeout(() => {
        floatText.remove();
    }, 1000);
}

// УВЕДОМЛЕНИЯ
function showNotification(text) {
    const notification = document.getElementById('notification');
    notification.textContent = text;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// ОБНОВЛЕНИЕ КНОПОК
function updateButtons() {
    // Улучшения
    const upgradeBtns = document.querySelectorAll('.upgrade-btn');
    upgradeBtns.forEach(btn => {
        const type = btn.getAttribute('onclick')?.match(/'(.*?)'/)?.[1];
        if (type && prices[type]) {
            btn.disabled = gameState.cheese < prices[type];
        }
    });
    
    // Префиксы
    const buyBtns = document.querySelectorAll('.buy-btn:not([disabled])');
    buyBtns.forEach(btn => {
        const price = parseInt(btn.getAttribute('data-price'));
        btn.disabled = gameState.cheese < price;
    });
    
    // Перевод
    document.querySelector('.transfer-btn').disabled = gameState.cheese < 1;
}

// ОБНОВЛЕНИЕ ТОПА
function updateTopList() {
    const topPlayers = document.querySelectorAll('.top-player');
    if (topPlayers[0]) {
        const nameSpan = topPlayers[0].querySelector('.player-name');
        let prefix = '';
        if (gameState.prefix === 'king') prefix = '[👑] ';
        else if (gameState.prefix === 'star') prefix = '[⭐] ';
        else if (gameState.prefix === 'fire') prefix = '[🔥] ';
        
        nameSpan.textContent = prefix + gameState.username;
        topPlayers[0].querySelector('.player-score').textContent = `${gameState.cheese} 🧀`;
    }
}

// СОХРАНЕНИЕ И ЗАГРУЗКА
function saveGame() {
    localStorage.setItem('cheeseGame_v2', JSON.stringify({
        ...gameState,
        prices: prices
    }));
}

function loadGame() {
    const saved = localStorage.getItem('cheeseGame_v2');
    if (saved) {
        const data = JSON.parse(saved);
        Object.assign(gameState, data);
        if (data.prices) {
            prices = data.prices;
        }
    }
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', init);

// Добавляем CSS для всплывающего текста
const floatingStyle = document.createElement('style');
floatingStyle.textContent = `
    @keyframes floatUp {
        0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
        100% {
            opacity: 0;
            transform: translate(-50%, -100px) scale(1.5);
        }
    }
`;
document.head.appendChild(floatingStyle);