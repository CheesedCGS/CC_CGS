class CheeseGame {
    constructor() {
        this.cheese = 0;
        this.power = 1;
        this.totalClicks = 0;
        this.userId = null;
        this.isAdmin = false;
        
        // Улучшения
        this.upgrades = {
            click: { level: 1, cost: 50 },
            auto: { level: 0, cost: 100 },
            tax: { level: 0, cost: 200 }
        };
        
        // Данные для админки
        this.users = [];
        
        this.init();
    }
    
    init() {
        // Загрузка из localStorage
        this.loadFromStorage();
        
        // Инициализация UI
        this.updateUI();
        
        // Автокликер
        if (this.upgrades.auto.level > 0) {
            this.startAutoClicker();
        }
        
        // Периодическое сохранение
        setInterval(() => this.saveToStorage(), 30000);
        
        // Обновление статуса бота
        this.updateBotStatus();
        
        console.log('Cheese Game initialized!');
    }
    
    loadFromStorage() {
        const saved = localStorage.getItem('cheeseGame');
        if (saved) {
            const data = JSON.parse(saved);
            this.cheese = data.cheese || 0;
            this.power = data.power || 1;
            this.totalClicks = data.totalClicks || 0;
            this.upgrades = data.upgrades || this.upgrades;
            this.userId = data.userId || null;
            this.isAdmin = data.isAdmin || false;
        }
        
        // Тестовый режим (для демо)
        if (!this.userId) {
            this.userId = Math.floor(Math.random() * 1000000);
            this.isAdmin = this.userId === 777777; // Тестовый админ
            this.saveToStorage();
        }
    }
    
    saveToStorage() {
        const data = {
            cheese: this.cheese,
            power: this.power,
            totalClicks: this.totalClicks,
            upgrades: this.upgrades,
            userId: this.userId,
            isAdmin: this.isAdmin,
            lastSave: new Date().toISOString()
        };
        localStorage.setItem('cheeseGame', JSON.stringify(data));
        
        // Симуляция отправки на сервер
        this.simulateServerSave(data);
    }
    
    simulateServerSave(data) {
        // В реальном приложении здесь будет запрос к боту
        console.log('Данные сохранены:', data);
        
        // Обновляем статус
        document.getElementById('bot-status').textContent = '🟢 онлайн';
        setTimeout(() => {
            if (Math.random() > 0.1) { // 90% шанс что бот онлайн
                document.getElementById('bot-status').textContent = '🟢 онлайн';
            } else {
                document.getElementById('bot-status').textContent = '🔴 офлайн';
            }
        }, 5000);
    }
    
    updateUI() {
        // Обновление баланса
        document.getElementById('balance').textContent = this.cheese;
        document.getElementById('power').textContent = this.power;
        document.getElementById('total-clicks').textContent = this.totalClicks;
        
        // Обновление улучшений
        document.getElementById('click-level').textContent = this.upgrades.click.level;
        document.getElementById('click-cost').textContent = this.upgrades.click.cost;
        
        document.getElementById('auto-level').textContent = this.upgrades.auto.level;
        document.getElementById('auto-cost').textContent = this.upgrades.auto.cost;
        
        document.getElementById('tax-level').textContent = this.upgrades.tax.level;
        document.getElementById('tax-cost').textContent = this.upgrades.tax.cost;
        
        // Обновление статуса налога
        const taxPaid = localStorage.getItem('taxPaid') === new Date().toDateString();
        document.getElementById('tax-status').textContent = taxPaid ? '✅' : '❌';
        
        // Админ панель
        document.getElementById('admin-id').textContent = this.userId;
        
        if (!this.isAdmin) {
            document.getElementById('admin-tab').style.display = 'none';
            document.querySelector('[onclick="switchTab(\'admin\')"]').style.display = 'none';
        } else {
            this.loadUsers();
        }
    }
    
    clickCheese() {
        this.cheese += this.power;
        this.totalClicks++;
        
        // Анимация
        const cheese = document.getElementById('cheese-btn');
        cheese.style.transform = 'scale(0.9)';
        setTimeout(() => {
            cheese.style.transform = 'scale(1)';
        }, 100);
        
        // Показать +N
        this.showFloatingText(`+${this.power}`, cheese);
        
        this.updateUI();
        this.saveToStorage();
    }
    
    buyUpgrade(type) {
        const upgrade = this.upgrades[type];
        
        if (this.cheese >= upgrade.cost) {
            this.cheese -= upgrade.cost;
            upgrade.level++;
            upgrade.cost = Math.floor(upgrade.cost * 1.5);
            
            // Эффекты улучшений
            if (type === 'click') {
                this.power += 1;
            } else if (type === 'auto' && upgrade.level === 1) {
                this.startAutoClicker();
            }
            
            // Анимация покупки
            const upgradeCard = document.querySelector(`[onclick="buyUpgrade('${type}')"]`);
            upgradeCard.style.background = 'var(--tg-success)';
            setTimeout(() => {
                upgradeCard.style.background = '';
            }, 500);
            
            this.updateUI();
            this.saveToStorage();
            
            // Уведомление
            this.showNotification('Улучшение куплено!');
        } else {
            this.showNotification('Недостаточно сыра!');
        }
    }
    
    startAutoClicker() {
        if (this.upgrades.auto.level > 0) {
            setInterval(() => {
                this.cheese += this.upgrades.auto.level * 5;
                this.updateUI();
                
                // Автосохранение каждую минуту
                if (new Date().getSeconds() === 0) {
                    this.saveToStorage();
                }
            }, 60000); // Каждую минуту
        }
    }
    
    showFloatingText(text, element) {
        const floatText = document.createElement('div');
        floatText.textContent = text;
        floatText.style.position = 'absolute';
        floatText.style.color = '#FFD700';
        floatText.style.fontWeight = 'bold';
        floatText.style.fontSize = '24px';
        floatText.style.pointerEvents = 'none';
        floatText.style.zIndex = '1000';
        floatText.style.textShadow = '0 2px 10px rgba(0,0,0,0.5)';
        
        const rect = element.getBoundingClientRect();
        floatText.style.left = (rect.left + rect.width / 2 - 20) + 'px';
        floatText.style.top = (rect.top - 20) + 'px';
        
        document.body.appendChild(floatText);
        
        // Анимация
        let opacity = 1;
        let top = rect.top - 20;
        
        const animate = () => {
            opacity -= 0.02;
            top -= 2;
            floatText.style.opacity = opacity;
            floatText.style.top = top + 'px';
            
            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                document.body.removeChild(floatText);
            }
        };
        
        animate();
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
            border-radius: var(--tg-radius);
            z-index: 10000;
            box-shadow: var(--tg-shadow);
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Убираем через 3 секунды
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    // Админ функции
    setExempt() {
        const userId = document.getElementById('exempt-id').value;
        const exemptType = document.querySelector('input[name="exempt-type"]:checked').value;
        
        if (!userId) {
            this.showNotification('Введите ID пользователя');
            return;
        }
        
        // Симуляция запроса к боту
        console.log(`Освободить ${userId} от ${exemptType}`);
        this.showNotification(`Настройки применены для ${userId}`);
        document.getElementById('exempt-id').value = '';
    }
    
    loadUsers() {
        // Симуляция загрузки пользователей
        this.users = [
            { id: 123456, name: 'User1', cheese: 1000, taxPaid: true },
            { id: 654321, name: 'User2', cheese: 500, taxPaid: false },
            { id: 777777, name: 'Admin', cheese: 9999, taxPaid: true }
        ];
        
        const usersList = document.getElementById('users-list');
        usersList.innerHTML = '';
        
        this.users.forEach(user => {
            const row = document.createElement('div');
            row.className = 'user-row';
            row.innerHTML = `
                <div class="col-user">
                    <div class="user-avatar">${user.name.charAt(0)}</div>
                    <div class="user-info">
                        <div class="user-name">${user.name}</div>
                        <div class="user-id">ID: ${user.id}</div>
                    </div>
                </div>
                <div class="col-cheese">${user.cheese} 🧀</div>
                <div class="col-tax">${user.taxPaid ? '✅' : '❌'}</div>
            `;
            usersList.appendChild(row);
        });
        
        this.showNotification('Список обновлен');
    }
    
    exportData() {
        const data = {
            users: this.users,
            timestamp: new Date().toISOString(),
            totalCheese: this.users.reduce((sum, user) => sum + user.cheese, 0)
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cheese_data_${new Date().getTime()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Данные экспортированы');
    }
    
    updateBotStatus() {
        setInterval(() => {
            const status = document.getElementById('bot-status');
            if (Math.random() > 0.2) { // 80% шанс что онлайн
                status.textContent = '🟢 онлайн';
                status.style.color = 'var(--tg-success)';
            } else {
                status.textContent = '🔴 офлайн';
                status.style.color = 'var(--tg-danger)';
            }
        }, 15000);
    }
}

// Глобальные функции для вызова из HTML
function switchTab(tabName) {
    // Скрыть все вкладки
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Показать выбранную вкладку
    document.getElementById(`${tabName}-tab`).classList.add('active');
    document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');
}

function clickCheese() {
    window.game.clickCheese();
}

function buyUpgrade(type) {
    window.game.buyUpgrade(type);
}

function setExempt() {
    window.game.setExempt();
}

function loadUsers() {
    window.game.loadUsers();
}

function exportData() {
    window.game.exportData();
}

// Запуск игры при загрузке страницы
window.addEventListener('DOMContentLoaded', () => {
    window.game = new CheeseGame();
    
    // Добавляем CSS для анимаций
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
    `;
    document.head.appendChild(style);
});