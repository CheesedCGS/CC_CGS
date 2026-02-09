// Инициализация
Telegram.WebApp.ready();
Telegram.WebApp.expand();

// Баланс игры (исправленный)
const BALANCE = {
    basePowerCost: 15,
    baseMultiplierCost: 100,
    baseAutoclickerCost: 200,
    powerGrowth: 1.7,
    multiplierGrowth: 3.0,
    autoclickerGrowth: 2.5
};

// Игровое состояние
let gameState = {
    cheese: 0,
    power: 1,
    powerLevel: 0,
    multiplier: 1,
    multiplierLevel: 0,
    autoclicker: 0,
    autoclickerLevel: 0,
    totalClicks: 0,
    ownedPrefixes: [],
    activePrefix: null,
    userId: null,
    username: 'Игрок',
    joinDate: new Date().toLocaleDateString('ru-RU'),
    history: []
};

// Онлайн игроки (симуляция)
let onlinePlayers = [
    { id: 1, name: 'Алексей', cheese: 1250, level: 5, online: true, prefix: 'star' },
    { id: 2, name: 'Мария', cheese: 890, level: 4, online: true, prefix: null },
    { id: 3, name: 'Дмитрий', cheese: 2150, level: 7, online: false, prefix: 'king' }
];

// Инициализация
async function initGame() {
    try {
        // Получаем данные пользователя Telegram
        if (Telegram.WebApp.initDataUnsafe.user) {
            const user = Telegram.WebApp.initDataUnsafe.user;
            gameState.userId = user.id;
            gameState.username = user.first_name || 'Игрок';
            
            // Устанавливаем имя в интерфейсе
            document.getElementById('userName').textContent = gameState.username;
            document.getElementById('profileName').textContent = gameState.username;
            document.getElementById('userId').textContent = user.id;
            
            // Создаем аватар на основе ID
            const avatars = ['👤', '👨', '👩', '🧔', '👱', '🧑', '👨‍💻', '👩‍💻'];
            const avatarIndex = user.id % avatars.length;
            document.getElementById('profileAvatar').textContent = avatars[avatarIndex];
        }
        
        // Загружаем сохраненную игру
        loadGame();
        
        // Инициализируем интерфейс
        initUI();
        
        // Запускаем автокликер
        startAutoclicker();
        
        // Обновляем онлайн-список
        updateOnlineList();
        
        // Симуляция обновления онлайн-статуса
        setInterval(updateOnlineList, 30000);
        
        // Обновляем интерфейс
        updateUI();
        
        // Добавляем запись в историю
        addHistory('Добро пожаловать в Сырный Мир!');
        
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        showNotification('❌ Ошибка загрузки игры', 'error');
    }
}

// Инициализация интерфейса
function initUI() {
    // Навигация по вкладкам
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Обновляем активные кнопки
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Обновляем активные вкладки
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            document.getElementById(`${tabId}-tab`).classList.add('active');
            
            // Обновляем данные на вкладке, если нужно
            if (tabId === 'friends') {
                updateOnlineList();
            }
        });
    });
    
    // Клик по сыру
    const cheeseButton = document.getElementById('clickerButton');
    cheeseButton.addEventListener('click', handleClick);
    
    // Покупка улучшений
    document.querySelectorAll('.buy-upgrade').forEach(btn => {
        btn.addEventListener('click', function() {
            const upgrade = this.closest('.upgrade-card').getAttribute('data-upgrade');
            buyUpgrade(upgrade);
        });
    });
    
    // Покупка префиксов
    document.querySelectorAll('.prefix-buy').forEach(btn => {
        btn.addEventListener('click', function() {
            const prefix = this.closest('.prefix-item').getAttribute('data-prefix');
            buyPrefix(prefix);
        });
    });
    
    // Отправка перевода
    document.getElementById('sendTransfer').addEventListener('click', sendCheeseTransfer);
    
    // Помощь другу
    document.querySelectorAll('.help-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const helpType = this.getAttribute('data-help');
            helpFriend(helpType);
        });
    });
    
    // Закрытие попапа
    document.querySelector('.close-popup')?.addEventListener('click', () => {
        document.getElementById('friendPopup').style.display = 'none';
    });
}

// Обработка клика
function handleClick() {
    // Анимация
    this.style.transform = 'scale(0.95)';
    setTimeout(() => this.style.transform = 'scale(1)', 100);
    
    // Расчет заработка (синхронизированная формула)
    const baseEarn = gameState.power;
    const multiplierEarn = baseEarn * gameState.multiplier;
    const totalEarn = Math.floor(multiplierEarn);
    
    // Начисление
    gameState.cheese += totalEarn;
    gameState.totalClicks++;
    
    // Визуальные эффекты
    createClickEffect(this, totalEarn);
    
    // Тактильная отдача
    if (Telegram.WebApp.HapticFeedback) {
        Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
    
    // Обновление
    updateUI();
    saveGame();
    
    // Добавляем в историю каждые 100 кликов
    if (gameState.totalClicks % 100 === 0) {
        addHistory(`🎉 ${gameState.totalClicks} кликов!`);
    }
}

// Эффект при клике
function createClickEffect(element, amount) {
    const effect = document.createElement('div');
    effect.className = 'click-effect';
    effect.textContent = `+${amount}`;
    effect.style.cssText = `
        position: absolute;
        color: #FFD166;
        font-weight: bold;
        font-size: 20px;
        text-shadow: 1px 1px 0 #8B4513;
        pointer-events: none;
        z-index: 10;
        animation: floatUp 1s ease-out forwards;
    `;
    
    const rect = element.getBoundingClientRect();
    const x = Math.random() * (rect.width - 40) + 20;
    const y = Math.random() * (rect.height - 40) + 20;
    
    effect.style.left = `${x}px`;
    effect.style.top = `${y}px`;
    
    element.appendChild(effect);
    setTimeout(() => effect.remove(), 1000);
}

// Покупка улучшения
function buyUpgrade(type) {
    let cost = 0;
    let success = false;
    let message = '';
    
    switch(type) {
        case 'power':
            cost = Math.floor(BALANCE.basePowerCost * Math.pow(BALANCE.powerGrowth, gameState.powerLevel));
            if (gameState.cheese >= cost) {
                gameState.cheese -= cost;
                gameState.power++;
                gameState.powerLevel++;
                success = true;
                message = `💪 Сила клика: ${gameState.power}`;
            }
            break;
            
        case 'multiplier':
            cost = Math.floor(BALANCE.baseMultiplierCost * Math.pow(BALANCE.multiplierGrowth, gameState.multiplierLevel));
            if (gameState.cheese >= cost && gameState.multiplierLevel < 5) {
                gameState.cheese -= cost;
                gameState.multiplierLevel++;
                gameState.multiplier = Math.pow(2, gameState.multiplierLevel);
                success = true;
                message = `⚡ Множитель: x${gameState.multiplier}`;
            } else if (gameState.multiplierLevel >= 5) {
                message = '🚫 Максимальный уровень множителя';
            }
            break;
            
        case 'autoclicker':
            cost = Math.floor(BALANCE.baseAutoclickerCost * Math.pow(BALANCE.autoclickerGrowth, gameState.autoclickerLevel));
            if (gameState.cheese >= cost) {
                gameState.cheese -= cost;
                gameState.autoclickerLevel++;
                gameState.autoclicker = gameState.autoclickerLevel * 2;
                success = true;
                message = `🤖 Автокликер: +${gameState.autoclicker}/сек`;
                startAutoclicker();
            }
            break;
    }
    
    if (success) {
        showNotification(message, 'success');
        updateUI();
        saveGame();
        addHistory(`Купил улучшение: ${type} за ${cost}🧀`);
    } else if (message) {
        showNotification(message, 'error');
    } else {
        showNotification(`❌ Нужно ещё ${cost - gameState.cheese} сыра`, 'error');
    }
}

// Покупка префикса
function buyPrefix(prefix) {
    const prices = { king: 5000, star: 2500, fire: 3500 };
    const price = prices[prefix];
    
    if (!price) {
        showNotification('❌ Неизвестный префикс', 'error');
        return;
    }
    
    if (gameState.cheese >= price) {
        // Проверяем, есть ли уже этот префикс
        if (!gameState.ownedPrefixes.includes(prefix)) {
            gameState.cheese -= price;
            gameState.ownedPrefixes.push(prefix);
            showNotification(`✅ Префикс куплен!`, 'success');
            addHistory(`Купил префикс ${prefix} за ${price}🧀`);
        } else {
            showNotification('✅ У вас уже есть этот префикс', 'info');
        }
        
        // Автоматически выбираем купленный префикс
        selectPrefix(prefix);
        updatePrefixSelector();
        updateUI();
        saveGame();
    } else {
        showNotification(`❌ Нужно ещё ${price - gameState.cheese} сыра`, 'error');
    }
}

// Выбор префикса
function selectPrefix(prefix) {
    if (gameState.ownedPrefixes.includes(prefix)) {
        gameState.activePrefix = prefix;
        
        const prefixNames = {
            king: '[👑]',
            star: '[⭐]',
            fire: '[🔥]'
        };
        
        document.getElementById('currentPrefix').textContent = prefixNames[prefix] || 'Нет';
        showNotification(`✅ Выбран префикс ${prefixNames[prefix]}`, 'success');
        saveGame();
    }
}

// Обновление селектора префиксов
function updatePrefixSelector() {
    const selector = document.getElementById('prefixSelector');
    selector.innerHTML = '';
    
    gameState.ownedPrefixes.forEach(prefix => {
        const btn = document.createElement('button');
        btn.className = 'prefix-select-btn';
        btn.textContent = prefix === 'king' ? '👑' : 
                         prefix === 'star' ? '⭐' : '🔥';
        btn.title = `Выбрать ${prefix}`;
        btn.onclick = () => selectPrefix(prefix);
        selector.appendChild(btn);
    });
    
    if (gameState.ownedPrefixes.length === 0) {
        selector.innerHTML = '<span style="color: #a0a0a0; font-size: 0.9rem;">Купите префикс в магазине</span>';
    }
}

// Отправка перевода
async function sendCheeseTransfer() {
    const tagInput = document.getElementById('friendTag');
    const amountInput = document.getElementById('transferAmount');
    
    const tag = tagInput.value.trim();
    const amount = parseInt(amountInput.value);
    
    if (!tag || !tag.startsWith('@')) {
        showNotification('❌ Введите @username пользователя', 'error');
        return;
    }
    
    if (!amount || amount < 1) {
        showNotification('❌ Введите сумму перевода', 'error');
        return;
    }
    
    if (amount > gameState.cheese) {
        showNotification(`❌ Недостаточно сыра. У вас: ${gameState.cheese}`, 'error');
        return;
    }
    
    // Симуляция отправки
    const sendBtn = document.getElementById('sendTransfer');
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
    
    // В реальном приложении здесь был бы запрос к серверу
    setTimeout(() => {
        gameState.cheese -= amount;
        sendBtn.disabled = false;
        sendBtn.innerHTML = 'Отправить';
        
        showNotification(`✅ Отправлено ${amount}🧀 пользователю ${tag}`, 'success');
        addHistory(`Отправил ${amount}🧀 пользователю ${tag}`);
        
        // Очищаем поле суммы, оставляем тег для удобства
        amountInput.value = '10';
        
        updateUI();
        saveGame();
    }, 1000);
}

// Помощь другу
function helpFriend(type) {
    const costs = { boost: 500, gift: 0 };
    const cost = costs[type];
    
    if (gameState.cheese < cost) {
        showNotification(`❌ Нужно ${cost} сыра`, 'error');
        return;
    }
    
    gameState.cheese -= cost;
    
    if (type === 'boost') {
        showNotification('✅ Буст +10% активирован на час!', 'success');
        addHistory('Активировал буст помощи другу');
    } else {
        showNotification('🎁 Подарок отправлен другу!', 'success');
        addHistory('Отправил подарок другу');
    }
    
    updateUI();
    saveGame();
}

// Обновление онлайн-списка
function updateOnlineList() {
    const list = document.getElementById('onlineList');
    if (!list) return;
    
    // Обновляем статус онлайн случайным образом (симуляция)
    onlinePlayers.forEach(player => {
        if (Math.random() > 0.3) player.online = !player.online;
    });
    
    list.innerHTML = '';
    
    onlinePlayers.forEach(player => {
        const div = document.createElement('div');
        div.className = 'online-user';
        
        const prefix = player.prefix === 'king' ? '[👑] ' : 
                      player.prefix === 'star' ? '[⭐] ' : 
                      player.prefix === 'fire' ? '[🔥] ' : '';
        
        div.innerHTML = `
            <div class="user-online-info">
                <div class="online-dot" style="${player.online ? '' : 'opacity: 0.3; background: #a0a0a0;'}"></div>
                <span>${prefix}${player.name}</span>
            </div>
            <div class="user-stats">
                <span style="color: #FFD166; font-weight: bold;">${player.cheese}🧀</span>
            </div>
        `;
        
        // Добавляем возможность посмотреть профиль
        div.style.cursor = 'pointer';
        div.onclick = () => viewProfile(player);
        
        list.appendChild(div);
    });
}

// Просмотр профиля друга
function viewProfile(player) {
    showNotification(`👤 ${player.name}\n🧀 ${player.cheese} сыра\n📊 Уровень ${player.level}`, 'info');
}

// Автокликер
let autoclickerInterval = null;

function startAutoclicker() {
    if (autoclickerInterval) {
        clearInterval(autoclickerInterval);
    }
    
    if (gameState.autoclicker > 0) {
        autoclickerInterval = setInterval(() => {
            if (gameState.autoclicker > 0) {
                gameState.cheese += gameState.autoclicker;
                updateUI();
                saveGame();
            }
        }, 1000);
    }
}

// Обновление интерфейса
function updateUI() {
    // Основные счетчики
    document.getElementById('totalCheese').textContent = gameState.cheese;
    document.getElementById('clickValue').textContent = `+${gameState.power * gameState.multiplier}`;
    
    // Статистика
    document.getElementById('powerStat').textContent = gameState.power;
    document.getElementById('multiplierStat').textContent = `x${gameState.multiplier}`;
    document.getElementById('levelStat').textContent = gameState.powerLevel + gameState.multiplierLevel + gameState.autoclickerLevel;
    document.getElementById('autoClickerStat').textContent = `+${gameState.autoclicker}/сек`;
    
    // Профиль
    document.getElementById('totalCheeseStat').textContent = gameState.cheese;
    document.getElementById('totalClicks').textContent = gameState.totalClicks;
    document.getElementById('joinDate').textContent = gameState.joinDate;
    
    // Цены улучшений
    document.getElementById('powerPrice').textContent = `Цена: ${Math.floor(BALANCE.basePowerCost * Math.pow(BALANCE.powerGrowth, gameState.powerLevel))} сыра`;
    document.getElementById('multiplierPrice').textContent = `Цена: ${Math.floor(BALANCE.baseMultiplierCost * Math.pow(BALANCE.multiplierGrowth, gameState.multiplierLevel))} сыра`;
    document.getElementById('autoclickerPrice').textContent = `Цена: ${Math.floor(BALANCE.baseAutoclickerCost * Math.pow(BALANCE.autoclickerGrowth, gameState.autoclickerLevel))} сыра`;
    
    // Обновляем кнопки
    updateButtons();
}

// Обновление состояния кнопок
function updateButtons() {
    document.querySelectorAll('.buy-upgrade').forEach(btn => {
        const upgrade = btn.closest('.upgrade-card').getAttribute('data-upgrade');
        let cost = 0;
        
        switch(upgrade) {
            case 'power':
                cost = Math.floor(BALANCE.basePowerCost * Math.pow(BALANCE.powerGrowth, gameState.powerLevel));
                break;
            case 'multiplier':
                cost = Math.floor(BALANCE.baseMultiplierCost * Math.pow(BALANCE.multiplierGrowth, gameState.multiplierLevel));
                if (gameState.multiplierLevel >= 5) {
                    btn.disabled = true;
                    btn.textContent = 'Макс. ур.';
                    return;
                }
                break;
            case 'autoclicker':
                cost = Math.floor(BALANCE.baseAutoclickerCost * Math.pow(BALANCE.autoclickerGrowth, gameState.autoclickerLevel));
                break;
        }
        
        btn.disabled = gameState.cheese < cost;
    });
    
    document.querySelectorAll('.prefix-buy').forEach(btn => {
        const prefix = btn.closest('.prefix-item').getAttribute('data-prefix');
        const prices = { king: 5000, star: 2500, fire: 3500 };
        const price = prices[prefix];
        
        if (gameState.ownedPrefixes.includes(prefix)) {
            btn.disabled = true;
            btn.textContent = 'Куплено';
            btn.style.background = '#4CD964';
        } else {
            btn.disabled = gameState.cheese < price;
        }
    });
}

// Уведомления
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notificationTemplate').cloneNode(true);
    notification.id = '';
    
    const icon = notification.querySelector('.notification-icon');
    const text = notification.querySelector('.notification-text');
    
    text.textContent = message;
    
    switch(type) {
        case 'success':
            icon.innerHTML = '✅';
            notification.style.borderLeftColor = '#4CD964';
            break;
        case 'error':
            icon.innerHTML = '❌';
            notification.style.borderLeftColor = '#FF3B30';
            break;
        case 'warning':
            icon.innerHTML = '⚠️';
            notification.style.borderLeftColor = '#FF9500';
            break;
        default:
            icon.innerHTML = '💡';
            notification.style.borderLeftColor = '#5D9CEC';
    }
    
    document.getElementById('notifications').appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Добавление записи в историю
function addHistory(text) {
    const now = new Date();
    const time = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    
    gameState.history.unshift(`[${time}] ${text}`);
    if (gameState.history.length > 10) {
        gameState.history.pop();
    }
    
    // Обновляем отображение истории
    const historyList = document.getElementById('historyList');
    if (historyList) {
        historyList.innerHTML = '';
        gameState.history.forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.textContent = item;
            historyList.appendChild(div);
        });
    }
}

// Сохранение и загрузка
function saveGame() {
    try {
        const saveData = {
            ...gameState,
            saveTime: Date.now()
        };
        localStorage.setItem('cheeseWorldSave', JSON.stringify(saveData));
    } catch (e) {
        console.error('Ошибка сохранения:', e);
    }
}

function loadGame() {
    try {
        const saved = localStorage.getItem('cheeseWorldSave');
        if (saved) {
            const data = JSON.parse(saved);
            
            // Восстанавливаем основные данные
            gameState.cheese = data.cheese || 0;
            gameState.power = data.power || 1;
            gameState.powerLevel = data.powerLevel || 0;
            gameState.multiplier = data.multiplier || 1;
            gameState.multiplierLevel = data.multiplierLevel || 0;
            gameState.autoclicker = data.autoclicker || 0;
            gameState.autoclickerLevel = data.autoclickerLevel || 0;
            gameState.totalClicks = data.totalClicks || 0;
            gameState.ownedPrefixes = data.ownedPrefixes || [];
            gameState.activePrefix = data.activePrefix || null;
            gameState.history = data.history || [];
            
            // Обновляем текущий префикс
            if (gameState.activePrefix) {
                const prefixNames = {
                    king: '[👑]',
                    star: '[⭐]',
                    fire: '[🔥]'
                };
                document.getElementById('currentPrefix').textContent = 
                    prefixNames[gameState.activePrefix] || 'Нет';
            }
            
            updatePrefixSelector();
        }
    } catch (e) {
        console.error('Ошибка загрузки:', e);
    }
}

// Запуск игры
document.addEventListener('DOMContentLoaded', initGame);

// Добавляем CSS для эффектов
const style = document.createElement('style');
style.textContent = `
    .click-effect {
        animation: floatUp 1s ease-out forwards;
    }
    
    @keyframes floatUp {
        0% {
            opacity: 1;
            transform: translate(0, 0) scale(1);
        }
        100% {
            opacity: 0;
            transform: translate(0, -50px) scale(1.2);
        }
    }
    
    .prefix-select-btn {
        background: rgba(255, 209, 102, 0.2);
        color: #FFD166;
        border: 1px solid #FFD166;
        border-radius: 8px;
        padding: 5px 10px;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .prefix-select-btn:hover {
        background: #FFD166;
        color: #8B4513;
    }
`;
document.head.appendChild(style);