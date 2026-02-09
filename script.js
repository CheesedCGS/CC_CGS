// Инициализация Telegram Mini App
Telegram.WebApp.ready();
Telegram.WebApp.expand();

// Игровые переменные
let gameState = {
    cheeseCount: 0,
    clickPower: 1,
    playerLevel: 1,
    powerUpgradeCost: 10,
    autoClickerCost: 50,
    autoClickerActive: false,
    autoClickerInterval: null
};

// DOM элементы
const cheeseButton = document.getElementById('cheeseButton');
const cheeseCountElement = document.getElementById('cheeseCount');
const clickPowerElement = document.getElementById('clickPower');
const powerValueElement = document.getElementById('powerValue');
const playerLevelElement = document.getElementById('playerLevel');
const powerCostElement = document.getElementById('powerCost');
const autoCostElement = document.getElementById('autoCost');
const upgradePowerBtn = document.getElementById('upgradePower');
const upgradeAutoBtn = document.getElementById('upgradeAuto');
const notification = document.getElementById('notification');
const notificationText = document.getElementById('notificationText');

// Загрузка сохранённой игры
function loadGame() {
    const savedGame = localStorage.getItem('cheeseClickerSave');
    if (savedGame) {
        gameState = JSON.parse(savedGame);
        updateUI();
        
        // Запускаем автокликер если он был активен
        if (gameState.autoClickerActive) {
            startAutoClicker();
        }
    }
}

// Сохранение игры
function saveGame() {
    localStorage.setItem('cheeseClickerSave', JSON.stringify(gameState));
}

// Обновление интерфейса
function updateUI() {
    cheeseCountElement.textContent = gameState.cheeseCount.toLocaleString();
    clickPowerElement.textContent = gameState.clickPower;
    powerValueElement.textContent = gameState.clickPower;
    playerLevelElement.textContent = gameState.playerLevel;
    powerCostElement.textContent = `${gameState.powerUpgradeCost} сырков`;
    autoCostElement.textContent = `${gameState.autoClickerCost} сырков`;
    
    // Проверка возможности улучшений
    upgradePowerBtn.disabled = gameState.cheeseCount < gameState.powerUpgradeCost;
    upgradeAutoBtn.disabled = gameState.cheeseCount < gameState.autoClickerCost || gameState.autoClickerActive;
    
    // Сохраняем игру
    saveGame();
}

// Показ уведомления
function showNotification(text, type = 'default') {
    notificationText.textContent = text;
    notification.className = 'notification show';
    
    // Цвет в зависимости от типа
    if (type === 'upgrade') {
        notification.style.background = '#2196F3';
    } else if (type === 'error') {
        notification.style.background = '#F44336';
    } else {
        notification.style.background = '#4CAF50';
    }
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 2000);
}

// Клик по сыру
cheeseButton.addEventListener('click', function() {
    // Анимация
    this.style.transform = 'scale(0.95)';
    setTimeout(() => {
        this.style.transform = 'scale(1)';
    }, 100);
    
    // Добавление очков
    gameState.cheeseCount += gameState.clickPower;
    
    // Показ всплывающего текста
    const popup = document.createElement('div');
    popup.textContent = `+${gameState.clickPower}`;
    popup.style.position = 'absolute';
    popup.style.color = '#FF6F00';
    popup.style.fontWeight = 'bold';
    popup.style.fontSize = '1.5rem';
    popup.style.pointerEvents = 'none';
    popup.style.animation = 'floatUp 1s forwards';
    
    // Позиционируем случайно вокруг сыра
    const x = Math.random() * 200 - 100;
    const y = Math.random() * 200 - 100;
    popup.style.left = `calc(50% + ${x}px)`;
    popup.style.top = `calc(50% + ${y}px)`;
    
    cheeseButton.appendChild(popup);
    setTimeout(() => popup.remove(), 1000);
    
    // Тактильная отдача (вибрация)
    if (Telegram.WebApp.HapticFeedback) {
        Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
    
    // Обновление интерфейса
    updateUI();
    
    // Уведомление при достижении круглых чисел
    if (gameState.cheeseCount % 100 === 0 && gameState.cheeseCount > 0) {
        showNotification(`🎉 ${gameState.cheeseCount} сырков!`, 'upgrade');
    }
});

// Улучшение силы клика
upgradePowerBtn.addEventListener('click', function() {
    if (gameState.cheeseCount >= gameState.powerUpgradeCost) {
        gameState.cheeseCount -= gameState.powerUpgradeCost;
        gameState.clickPower += 1;
        gameState.playerLevel += 1;
        gameState.powerUpgradeCost = Math.floor(gameState.powerUpgradeCost * 1.5);
        
        showNotification(`⚡ Сила клика: ${gameState.clickPower}`, 'upgrade');
        updateUI();
        
        // Анимация улучшения
        cheeseButton.style.boxShadow = '0 0 30px #FF9800';
        setTimeout(() => {
            cheeseButton.style.boxShadow = '';
        }, 500);
    }
});

// Покупка автокликера
upgradeAutoBtn.addEventListener('click', function() {
    if (gameState.cheeseCount >= gameState.autoClickerCost && !gameState.autoClickerActive) {
        gameState.cheeseCount -= gameState.autoClickerCost;
        gameState.autoClickerActive = true;
        startAutoClicker();
        
        showNotification('🐭 Мышка куплена! Автокликер активен', 'upgrade');
        updateUI();
    }
});

// Запуск автокликера
function startAutoClicker() {
    if (gameState.autoClickerInterval) {
        clearInterval(gameState.autoClickerInterval);
    }
    
    gameState.autoClickerInterval = setInterval(() => {
        gameState.cheeseCount += Math.floor(gameState.clickPower / 2);
        updateUI();
    }, 1000); // Кликает каждую секунду
}

// Добавляем CSS анимацию для всплывающего текста
const style = document.createElement('style');
style.textContent = `
    @keyframes floatUp {
        0% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-50px); }
    }
`;
document.head.appendChild(style);

// Получение данных пользователя Telegram
if (Telegram.WebApp.initDataUnsafe.user) {
    const user = Telegram.WebApp.initDataUnsafe.user;
    console.log(`Привет, ${user.first_name}! Добро пожаловать в Сырный Кликер!`);
    
    // Можно персонализировать приветствие
    const welcomeElement = document.querySelector('.subtitle');
    if (welcomeElement) {
        welcomeElement.textContent = `${user.first_name}, нажимай на сыр, зарабатывай сырки!`;
    }
}

// Загрузка игры при старте
loadGame();

// Сохранение при закрытии
window.addEventListener('beforeunload', saveGame);