class CheeseGame {
    constructor() {
        this.cheese = 0;
        this.clickPower = 1;
        this.totalClicks = 0;
        this.userId = null;
        this.username = '';
        this.isAdmin = false;
        
        this.upgrades = {
            click: { level: 1, cost: 50 },
            auto: { level: 0, cost: 100 }
        };
        
        this.taxPaid = false;
        this.dailyCollected = false;
        
        this.init();
    }
    
    init() {
        this.loadFromStorage();
        this.initUI();
        this.initClicker();
        this.initUpgrades();
        
        if (this.isAdmin) {
            this.initAdmin();
        } else {
            this.hideAdminTab();
        }
        
        this.startAutoClicker();
        this.startAutoSave();
        
        console.log('Игра запущена!');
    }
    
    loadFromStorage() {
        const saved = localStorage.getItem('cheeseGameData');
        if (saved) {
            const data = JSON.parse(saved);
            this.cheese = data.cheese || 0;
            this.clickPower = data.clickPower || 1;
            this.totalClicks = data.totalClicks || 0;
            this.upgrades = data.upgrades || this.upgrades;
            this.userId = data.userId || this.generateUserId();
            this.isAdmin = data.isAdmin || this.checkIfAdmin();
            this.taxPaid = data.taxPaid || false;
            
            // Проверяем ежедневную награду
            const lastDaily = data.lastDaily;
            const today = new Date().toDateString();
            this.dailyCollected = lastDaily === today;
        } else {
            this.userId = this.generateUserId();
            this.isAdmin = this.checkIfAdmin();
            this.cheese = 50; // Стартовый сыр
            this.saveToStorage();
        }
    }
    
    generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9);
    }
    
    checkIfAdmin() {
        // В реальном приложении проверка через Telegram WebApp
        return this.userId === 'admin' || Math.random() < 0.1; // 10% шанс для теста
    }
    
    saveToStorage() {
        const data = {
            cheese: this.cheese,
            clickPower: this.clickPower,
            totalClicks: this.totalClicks,
            upgrades: this.upgrades,
            userId: this.userId,
            isAdmin: this.isAdmin,
            taxPaid: this.taxPaid,
            lastDaily: this.dailyCollected ? new Date().toDateString() : null,
            lastSave: new Date().toISOString()
        };
        localStorage.setItem('cheeseGameData', JSON.stringify(data));
        
        // Симуляция синхронизации с ботом
        this.syncWithBot();
    }
    
    syncWithBot() {
        // В реальном приложении здесь будет запрос к боту
        console.log('Синхронизация с ботом...');
    }
    
    initUI() {
        this.updateBalance();
        this.updateClickPower();
        this.updateTaxInfo();
        this.updateUpgradeUI();
        this.updateAdminInfo();
    }
    
    initClicker() {
        const clickArea = document.getElementById('click-area');
        if (!clickArea) return;
        
        clickArea.addEventListener('click', (e) => {
            this.addCheese(this.clickPower);
            this.totalClicks++;
            this.showClickEffect(e.clientX, e.clientY);
            
            // Обновляем UI
            document.getElementById('click-count').textContent = this.totalClicks;
            
            // Сохраняем
            this.saveToStorage();
        });
    }
    
    initUpgrades() {
        // Обновляем цены улучшений
        document.getElementById('click-cost').textContent = this.upgrades.click.cost;
        document.getElementById('auto-cost').textContent = this.upgrades.auto.cost;
        document.getElementById('click-level').textContent = this.upgrades.click.level;
        document.getElementById('auto-level').textContent = this.upgrades.auto.level;
    }
    
    initAdmin() {
        // Показываем вкладку админа
        document.getElementById('admin-tab-btn').style.display = 'flex';
        this.loadUsersList();
    }
    
    hideAdminTab() {
        document.getElementById('admin-tab-btn').style.display = 'none';
    }
    
    addCheese(amount) {
        this.cheese += amount;
        this.updateBalance();
        
        // Анимация добавления
        this.showFloatingText(`+${amount}`, document.querySelector('.cheese'));
    }
    
    updateBalance() {
        const balanceEl = document.getElementById('cheese-count');
        if (balanceEl) {
            balanceEl.textContent = this.cheese;
        }
        
        // Обновляем налог
        this.updateTaxAmount();
    }
    
    updateClickPower() {
        document.getElementById('click-power').textContent = this.clickPower;
    }
    
    updateTaxAmount() {
        // Расчет налога на основе баланса и силы клика
        const baseTax = 5;
        const cheeseTax = Math.max(1, Math.floor(this.cheese / 100));
        const powerTax = this.clickPower * 2;
        const totalTax = baseTax + cheeseTax + powerTax;
        
        document.getElementById('tax-amount').textContent = totalTax;
    }
    
    updateTaxInfo() {
        const taxStatusEl = document.getElementById('tax-status');
        if (taxStatusEl) {
            taxStatusEl.textContent = this.taxPaid ? '✅ Оплачен' : '❌ Не оплачен';
            taxStatusEl.style.color = this.taxPaid ? '#34c759' : '#ff3b30';
        }
    }
    
    updateUpgradeUI() {
        // Обновляем доступность улучшений
        const clickUpgrade = document.querySelector('[onclick="buyUpgrade(\'click\')"]');
        const autoUpgrade = document.querySelector('[onclick="buyUpgrade(\'auto\')"]');
        
        if (clickUpgrade) {
            clickUpgrade.style.opacity = this.cheese >= this.upgrades.click.cost ? '1' : '0.5';
        }
        
        if (autoUpgrade) {
            autoUpgrade.style.opacity = this.cheese >= this.upgrades.auto.cost ? '1' : '0.5';
        }
    }
    
    updateAdminInfo() {
        document.getElementById('user-id').textContent = this.userId;
    }
    
    showClickEffect(x, y) {
        const effect = document.createElement('div');
        effect.className = 'click-effect';
        effect.textContent = `+${this.clickPower}`;
        effect.style.left = `${x}px`;
        effect.style.top = `${y}px`;
        
        document.body.appendChild(effect);
        
        setTimeout(() => {
            document.body.removeChild(effect);
        }, 1000);
    }
    
    showFloatingText(text, element) {
        const rect = element.getBoundingClientRect();
        const floatText = document.createElement('div');
        floatText.textContent = text;
        floatText.style.position = 'fixed';
        floatText.style.left = rect.left + rect.width / 2 + 'px';
        floatText.style.top = rect.top + 'px';
        floatText.style.color = '#ff6b35';
        floatText.style.fontWeight = 'bold';
        floatText.style.fontSize = '20px';
        floatText.style.pointerEvents = 'none';
        floatText.style.zIndex = '1000';
        floatText.style.textShadow = '0 2px 10px rgba(0,0,0,0.5)';
        floatText.style.animation = 'floatUp 1s forwards';
        
        document.body.appendChild(floatText);
        
        setTimeout(() => {
            document.body.removeChild(floatText);
        }, 1000);
    }
    
    buyUpgrade(type) {
        const upgrade = this.upgrades[type];
        
        if (this.cheese >= upgrade.cost) {
            this.cheese -= upgrade.cost;
            
            if (type === 'click') {
                this.clickPower++;
                upgrade.level++;
                upgrade.cost = Math.floor(upgrade.cost * 1.5);
                
                this.updateClickPower();
                document.getElementById('click-level').textContent = upgrade.level;
                document.getElementById('click-cost').textContent = upgrade.cost;
            } else if (type === 'auto') {
                upgrade.level++;
                upgrade.cost = Math.floor(upgrade.cost * 2);
                
                document.getElementById('auto-level').textContent = upgrade.level;
                document.getElementById('auto-cost').textContent = upgrade.cost;
            }
            
            this.updateBalance();
            this.updateUpgradeUI();
            this.saveToStorage();
            
            this.showNotification('Улучшение куплено!');
        } else {
            this.showNotification('Недостаточно сыра!');
        }
    }
    
    payTax() {
        const baseTax = 5;
        const cheeseTax = Math.max(1, Math.floor(this.cheese / 100));
        const powerTax = this.clickPower * 2;
        const totalTax = baseTax + cheeseTax + powerTax;
        
        if (this.cheese >= totalTax) {
            this.cheese -= totalTax;
            this.taxPaid = true;
            
            this.updateBalance();
            this.updateTaxInfo();
            this.saveToStorage();
            
            this.showNotification(`Налог ${totalTax} сыра оплачен!`);
        } else {
            this.showNotification(`Недостаточно сыра! Нужно: ${totalTax}`);
        }
    }
    
    collectDaily() {
        if (this.dailyCollected) {
            this.showNotification('Ежедневная награда уже получена!');
            return;
        }
        
        const dailyReward = 100 + (this.clickPower * 10);
        this.cheese += dailyReward;
        this.dailyCollected = true;
        
        this.updateBalance();
        this.saveToStorage();
        
        this.showNotification(`Ежедневная награда: ${dailyReward} сыра!`);
    }
    
    startAutoClicker() {
        setInterval(() => {
            if (this.upgrades.auto.level > 0) {
                const autoGain = this.upgrades.auto.level * 5;
                this.addCheese(autoGain);
                this.saveToStorage();
            }
        }, 60000); // Каждую минуту
    }
    
    startAutoSave() {
        setInterval(() => {
            this.saveToStorage();
            console.log('Автосохранение...');
        }, 30000); // Каждые 30 секунд
    }
    
    // Админ функции
    loadUsersList() {
        if (!this.isAdmin) return;
        
        // Симуляция данных
        const users = [
            { id: 1, name: 'User1', cheese: 1000, taxPaid: true },
            { id: 2, name: 'User2', cheese: 500, taxPaid: false },
            { id: 3, name: 'User3', cheese: 750, taxPaid: true }
        ];
        
        const usersList = document.getElementById('users-list');
        if (!usersList) return;
        
        usersList.innerHTML = '';
        
        users.forEach(user => {
            const userEl = document.createElement('div');
            userEl.className = 'user-item';
            userEl.innerHTML = `
                <div class="user-info">
                    <div class="user-name">${user.name}</div>
                    <div>ID: ${user.id}</div>
                </div>
                <div class="user-cheese">${user.cheese} 🧀</div>
                <div class="user-tax">${user.taxPaid ? '✅' : '❌'}</div>
            `;
            usersList.appendChild(userEl);
        });
    }
    
    setExempt() {
        const userId = document.getElementById('exempt-user').value;
        const exemptType = document.getElementById('exempt-type').value;
        
        if (!userId) {
            this.showNotification('Введите username или ID');
            return;
        }
        
        // Симуляция
        console.log(`Установка исключения: ${userId} - ${exemptType}`);
        this.showNotification('Настройки применены');
        
        document.getElementById('exempt-user').value = '';
    }
    
    exportData() {
        const data = {
            users: [
                { name: 'User1', cheese: 1000 },
                { name: 'User2', cheese: 500 }
            ],
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cheese_data_${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Данные экспортированы');
    }
    
    showNotification(message) {
        // Создаем уведомление
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--tg-accent);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Глобальные функции
let game;

function switchTab(tabName) {
    // Скрыть все вкладки
    document.querySelectorAll('.clicker-section, .upgrades-section, .admin-section').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Убрать активный класс у всех кнопок
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Показать выбранную вкладку
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Активировать кнопку
    document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');
    
    // Если админ, загрузить список
    if (tabName === 'admin' && game && game.isAdmin) {
        game.loadUsersList();
    }
}

function buyUpgrade(type) {
    if (game) game.buyUpgrade(type);
}

function payTax() {
    if (game) game.payTax();
}

function collectDaily() {
    if (game) game.collectDaily();
}

function setExempt() {
    if (game) game.setExempt();
}

function loadUsers() {
    if (game) game.loadUsersList();
}

function exportData() {
    if (game) game.exportData();
}

// Запуск игры
document.addEventListener('DOMContentLoaded', () => {
    game = new CheeseGame();
    
    // Добавляем стили для анимаций
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        @keyframes floatUp {
            0% { opacity: 1; transform: translateY(0) scale(1); }
            100% { opacity: 0; transform: translateY(-50px) scale(1.2); }
        }
    `;
    document.head.appendChild(style);
});