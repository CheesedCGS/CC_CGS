// Инициализация Telegram Mini App
Telegram.WebApp.ready();
Telegram.WebApp.expand();

// Игровые переменные
let gameState = {
    cheese: 0,
    clickPower: 1,
    level: 1,
    multiplier: 1,
    multiplierLevel: 0,
    autoclickerLevel: 0,
    prefix: '',
    userId: null,
    username: 'Игрок'
};

// Цены
let prices = {
    power: 10,
    multiplier: 500,
    autoclicker: 1000,
    king: 5000,
    star: 3000,
    fire: 8000
};

// Получаем данные пользователя Telegram
function initUser() {
    if (Telegram.WebApp.initDataUnsafe.user) {
        const user = Telegram.WebApp.initDataUnsafe.user;
        gameState.userId = user.id;
        gameState.username = user.first_name || 'Игрок';
        
        // Загружаем сохраненную игру
        loadGame();
    } else {
        // Для теста
        gameState.userId = Date.now();
        loadGame();
    }
}

// Загрузка игры
function loadGame() {
    const saved = localStorage.getItem('cheeseGame_' + gameState.userId);
    if (saved) {
        const data = JSON.parse(saved);
        Object.assign(gameState, data);
        updateUI();
    }
}

// Сохранение игры
function saveGame() {
    localStorage.setItem('cheeseGame_' + gameState.userId, JSON.stringify(gameState));
}

// Клик по сыру
document.getElementById('cheese').addEventListener('click', function() {
    // Анимация
    this.style.transform = 'scale(0.95)';
    setTimeout(() => {
        this.style.transform = 'scale(1)';
    }, 100);
    
    // Начисление
    const earned = gameState.clickPower * gameState.multiplier;
    gameState.cheese += earned;
    
    // Показываем всплывающий текст
    showFloatingText('+' + earned, this);
    
    // Обновляем
    updateUI();
    saveGame();
    
    // Тактильная отдача
    if (Telegram.WebApp.HapticFeedback) {
        Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
});

// Покупка улучшения
function buyUpgrade(type) {
    const price = prices[type];
    
    if (gameState.cheese >= price) {
        gameState.cheese -= price;
        
        switch(type) {
            case 'power':
                gameState.clickPower++;
                prices.power = Math.floor(prices.power * 1.5);
                showNotification('⚡ Сила увеличена до ' + gameState.clickPower);
                break;
                
            case 'multiplier':
                if (gameState.multiplierLevel < 5) {
                    gameState.multiplierLevel++;
                    gameState.multiplier = Math.pow(2, gameState.multiplierLevel);
                    prices.multiplier = Math.floor(prices.multiplier * 3);
                    showNotification('✖️ Множитель x' + gameState.multiplier + '!');
                } else {
                    showNotification('🚫 Максимальный уровень множителя');
                    return;
                }
                break;
                
            case 'autoclicker':
                gameState.autoclickerLevel++;
                prices.autoclicker = Math.floor(prices.autoclicker * 2);
                showNotification('🤖 Автокликер ' + gameState.autoclickerLevel + ' ур.');
                startAutoclicker();
                break;
        }
        
        gameState.level++;
        updateUI();
        saveGame();
    } else {
        showNotification('❌ Не хватает ' + (price - gameState.cheese) + ' сырков');
    }
}

// Покупка префикса
function buyPrefix(type) {
    const price = prices[type];
    
    if (gameState.cheese >= price) {
        gameState.cheese -= price;
        gameState.prefix = type;
        
        let prefixName = '';
        switch(type) {
            case 'king': prefixName = '👑 Король'; break;
            case 'star': prefixName = '⭐ Звезда'; break;
            case 'fire': prefixName = '🔥 Огненный'; break;
        }
        
        showNotification('✅ Куплен префикс ' + prefixName);
        updateUI();
        saveGame();
    } else {
        showNotification('❌ Не хватает сырков');
    }
}

// Перевод сыра
function transferCheese() {
    const amount = parseInt(document.getElementById('transferAmount').value);
    const targetId = document.getElementById('transferUser').value;
    
    if (!amount || amount < 1) {
        showNotification('❌ Введите сумму');
        return;
    }
    
    if (!targetId) {
        showNotification('❌ Введите ID игрока');
        return;
    }
    
    if (gameState.cheese >= amount) {
        // В реальном приложении здесь будет запрос к серверу
        gameState.cheese -= amount;
        showNotification('✅ Переведено ' + amount + ' сырков игроку ' + targetId);
        updateUI();
        saveGame();
    } else {
        showNotification('❌ Недостаточно сырков');
    }
}

// Автокликер
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

// Обновление интерфейса
function updateUI() {
    // Обновляем счетчики
    document.getElementById('cheeseCount').textContent = formatNumber(gameState.cheese);
    document.getElementById('clickPower').textContent = gameState.clickPower;
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('currentPower').textContent = '+' + (gameState.clickPower * gameState.multiplier);
    
    // Обновляем цены
    document.getElementById('powerPrice').textContent = prices.power + ' сырков';
    document.getElementById('multiplierPrice').textContent = prices.multiplier + ' сырков';
    document.getElementById('autoclickerPrice').textContent = prices.autoclicker + ' сырков';
    
    // Обновляем топ (заглушка)
    updateTopList();
    
    // Обновляем время
    document.getElementById('updateTime').textContent = new Date().toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Проверяем кнопки
    checkButtons();
}

// Обновление топа (заглушка)
function updateTopList() {
    // В реальном приложении здесь запрос к серверу
    const topList = document.getElementById('topList');
    topList.innerHTML = `
        <div class="top-item">1. ${gameState.prefix ? getPrefixEmoji(gameState.prefix) + ' ' : ''}${gameState.username} - ${formatNumber(gameState.cheese)} 🧀</div>
        <div class="top-item">2. Игрок2 - 500 🧀</div>
        <div class="top-item">3. Игрок3 - 300 🧀</div>
    `;
}

// Проверка доступности кнопок
function checkButtons() {
    const buttons = document.querySelectorAll('.upgrade-btn, .prefix-btn');
    buttons.forEach(btn => {
        const type = btn.getAttribute('onclick')?.match(/'(.*?)'/)?.[1];
        if (type && prices[type]) {
            btn.disabled = gameState.cheese < prices[type];
        }
    });
}

// Всплывающий текст при клике
function showFloatingText(text, element) {
    const floatText = document.createElement('div');
    floatText.textContent = text;
    floatText.style.cssText = `
        position: absolute;
        color: #fff;
        font-weight: bold;
        font-size: 20px;
        text-shadow: 1px 1px 2px #000;
        pointer-events: none;
        animation: floatUp 1s ease-out forwards;
        z-index: 100;
    `;
    
    const rect = element.getBoundingClientRect();
    floatText.style.left = (rect.width / 2 - 20) + 'px';
    floatText.style.top = (rect.height / 2 - 20) + 'px';
    
    element.appendChild(floatText);
    
    setTimeout(() => {
        floatText.remove();
    }, 1000);
}

// Уведомления
function showNotification(text) {
    const notification = document.getElementById('notification');
    notification.textContent = text;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Форматирование чисел
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num;
}

// Получение эмодзи префикса
function getPrefixEmoji(prefix) {
    switch(prefix) {
        case 'king': return '👑';
        case 'star': return '⭐';
        case 'fire': return '🔥';
        default: return '';
    }
}

// Добавляем CSS анимацию
const style = document.createElement('style');
style.textContent = `
@keyframes floatUp {
    0% { opacity: 1; transform: translateY(0) scale(1); }
    100% { opacity: 0; transform: translateY(-50px) scale(1.2); }
}
`;
document.head.appendChild(style);

// Запуск игры
initUser();
startAutoclicker();