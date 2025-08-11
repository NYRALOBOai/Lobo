// Sistema de Jogo AI Civilization
class AICivilization {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameRunning = false;
        this.gamePaused = false;
        this.currentTurn = 0;
        this.currentEra = 'Idade da Pedra';
        this.eras = [
            'Idade da Pedra',
            'Idade do Bronze',
            'Idade do Ferro',
            'Idade Média',
            'Idade Industrial',
            'Idade Moderna'
        ];
        
        this.climates = ['Tropical', 'Savana', 'Neve', 'Deserto'];
        this.currentClimate = 'Tropical';
        
        this.mapWidth = 1200;
        this.mapHeight = 800;
        this.tileSize = 20;
        
        this.ais = [];
        this.resources = [];
        this.buildings = [];
        this.animals = [];
        this.centralIsland = null;
        
        this.gameLog = [];
        this.maxLogEntries = 100;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.generateMap();
        this.updateUI();
    }
    
    setupEventListeners() {
        document.getElementById('start-game').addEventListener('click', () => this.startGame());
        document.getElementById('pause-game').addEventListener('click', () => this.togglePause());
        document.getElementById('reset-game').addEventListener('click', () => this.resetGame());
        document.getElementById('ai-count').addEventListener('change', (e) => this.updateAICount(e.target.value));
    }
    
    generateMap() {
        // Gerar ilha central
        this.centralIsland = {
            x: this.mapWidth / 2 - 100,
            y: this.mapHeight / 2 - 100,
            width: 200,
            height: 200,
            type: 'central',
            difficulty: 'hard',
            treasures: this.generateTreasures(),
            monsters: this.generateMonsters()
        };
        
        // Gerar recursos distribuídos pelo mapa
        this.generateResources();
        
        // Gerar animais baseados no clima
        this.generateAnimals();
    }
    
    generateTreasures() {
        const treasures = [];
        for (let i = 0; i < 5; i++) {
            treasures.push({
                x: this.centralIsland.x + Math.random() * this.centralIsland.width,
                y: this.centralIsland.y + Math.random() * this.centralIsland.height,
                type: ['gold', 'technology', 'weapon', 'tool'][Math.floor(Math.random() * 4)],
                value: Math.floor(Math.random() * 100) + 50
            });
        }
        return treasures;
    }
    
    generateMonsters() {
        const monsters = [];
        for (let i = 0; i < 8; i++) {
            monsters.push({
                x: this.centralIsland.x + Math.random() * this.centralIsland.width,
                y: this.centralIsland.y + Math.random() * this.centralIsland.height,
                type: ['dragon', 'lava-beast', 'shadow-creature'][Math.floor(Math.random() * 3)],
                health: Math.floor(Math.random() * 200) + 100,
                damage: Math.floor(Math.random() * 50) + 25
            });
        }
        return monsters;
    }
    
    generateResources() {
        this.resources = [];
        const resourceTypes = ['wood', 'stone', 'iron', 'gold', 'food', 'water'];
        
        for (let i = 0; i < 100; i++) {
            this.resources.push({
                x: Math.random() * this.mapWidth,
                y: Math.random() * this.mapHeight,
                type: resourceTypes[Math.floor(Math.random() * resourceTypes.length)],
                amount: Math.floor(Math.random() * 100) + 50,
                respawnTime: Math.floor(Math.random() * 50) + 20
            });
        }
    }
    
    generateAnimals() {
        this.animals = [];
        const animalTypes = {
            'Tropical': ['monkey', 'parrot', 'snake', 'jaguar'],
            'Savana': ['lion', 'elephant', 'giraffe', 'zebra'],
            'Neve': ['polar-bear', 'wolf', 'seal', 'penguin'],
            'Deserto': ['camel', 'scorpion', 'snake', 'vulture']
        };
        
        const currentAnimals = animalTypes[this.currentClimate];
        for (let i = 0; i < 30; i++) {
            this.animals.push({
                x: Math.random() * this.mapWidth,
                y: Math.random() * this.mapHeight,
                type: currentAnimals[Math.floor(Math.random() * currentAnimals.length)],
                health: Math.floor(Math.random() * 50) + 20,
                behavior: Math.random() > 0.5 ? 'passive' : 'aggressive'
            });
        }
    }
    
    createAI(count) {
        this.ais = [];
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#8800ff'];
        
        for (let i = 0; i < count; i++) {
            const ai = new AI(
                `AI-${i + 1}`,
                Math.random() * this.mapWidth,
                Math.random() * this.mapHeight,
                colors[i],
                this
            );
            this.ais.push(ai);
        }
    }
    
    startGame() {
        if (this.gameRunning) return;
        
        const aiCount = parseInt(document.getElementById('ai-count').value);
        this.createAI(aiCount);
        
        this.gameRunning = true;
        this.gamePaused = false;
        this.gameLoop();
        
        this.addLogEntry('Jogo iniciado!', 'success');
        this.updateUI();
    }
    
    togglePause() {
        this.gamePaused = !this.gamePaused;
        const button = document.getElementById('pause-game');
        button.textContent = this.gamePaused ? 'Continuar' : 'Pausar';
        
        if (!this.gamePaused && this.gameRunning) {
            this.gameLoop();
        }
    }
    
    resetGame() {
        this.gameRunning = false;
        this.gamePaused = false;
        this.currentTurn = 0;
        this.currentEra = 'Idade da Pedra';
        this.ais = [];
        this.buildings = [];
        this.gameLog = [];
        
        this.generateMap();
        this.updateUI();
        this.addLogEntry('Jogo reiniciado!', 'info');
    }
    
    updateAICount(count) {
        if (!this.gameRunning) {
            this.addLogEntry(`Número de IAs alterado para ${count}`, 'info');
        }
    }
    
    gameLoop() {
        if (!this.gameRunning || this.gamePaused) return;
        
        this.currentTurn++;
        this.updateGame();
        this.updateUI();
        
        // Verificar evolução de época
        if (this.currentTurn % 100 === 0) {
            this.advanceEra();
        }
        
        setTimeout(() => this.gameLoop(), 100);
    }
    
    updateGame() {
        // Atualizar todas as IAs
        this.ais.forEach(ai => {
            if (ai.isAlive) {
                ai.think();
                ai.act();
            }
        });
        
        // Atualizar recursos
        this.updateResources();
        
        // Atualizar animais
        this.updateAnimals();
        
        // Verificar interações entre IAs
        this.checkAIInteractions();
    }
    
    updateResources() {
        this.resources.forEach(resource => {
            if (resource.amount <= 0 && resource.respawnTime > 0) {
                resource.respawnTime--;
                if (resource.respawnTime <= 0) {
                    resource.amount = Math.floor(Math.random() * 100) + 50;
                    resource.respawnTime = Math.floor(Math.random() * 50) + 20;
                }
            }
        });
    }
    
    updateAnimals() {
        this.animals.forEach(animal => {
            if (animal.health > 0) {
                // Movimento simples dos animais
                animal.x += (Math.random() - 0.5) * 2;
                animal.y += (Math.random() - 0.5) * 2;
                
                // Manter animais dentro dos limites do mapa
                animal.x = Math.max(0, Math.min(this.mapWidth, animal.x));
                animal.y = Math.max(0, Math.min(this.mapHeight, animal.y));
            }
        });
    }
    
    checkAIInteractions() {
        for (let i = 0; i < this.ais.length; i++) {
            for (let j = i + 1; j < this.ais.length; j++) {
                const ai1 = this.ais[i];
                const ai2 = this.ais[j];
                
                if (ai1.isAlive && ai2.isAlive) {
                    const distance = Math.sqrt(
                        Math.pow(ai1.x - ai2.x, 2) + Math.pow(ai1.y - ai2.y, 2)
                    );
                    
                    if (distance < 100) {
                        // IAs estão próximas - podem interagir
                        this.handleAIInteraction(ai1, ai2);
                    }
                }
            }
        }
    }
    
    handleAIInteraction(ai1, ai2) {
        // Lógica de interação entre IAs
        if (!ai1.knownAIs.includes(ai2.id)) {
            ai1.discoverAI(ai2);
            ai2.discoverAI(ai1);
            this.addLogEntry(`${ai1.name} descobriu ${ai2.name}!`, 'info');
        }
        
        // Decidir relação baseada na personalidade e recursos
        const relation = this.calculateRelation(ai1, ai2);
        
        if (relation > 0.7) {
            this.formAlliance(ai1, ai2);
        } else if (relation < 0.3) {
            this.startWar(ai1, ai2);
        }
    }
    
    calculateRelation(ai1, ai2) {
        // Fatores que influenciam a relação:
        // - Diferença de poder
        // - Recursos complementares
        // - Histórico de interações
        // - Personalidade da IA
        
        let relation = 0.5; // Neutro por padrão
        
        // Diferença de poder (IAs similares tendem a se aliar)
        const powerDiff = Math.abs(ai1.power - ai2.power) / Math.max(ai1.power, ai2.power);
        relation += (1 - powerDiff) * 0.2;
        
        // Recursos complementares
        const resourceComplement = this.calculateResourceComplement(ai1, ai2);
        relation += resourceComplement * 0.3;
        
        // Personalidade
        if (ai1.personality === ai2.personality) {
            relation += 0.2;
        }
        
        return Math.max(0, Math.min(1, relation));
    }
    
    calculateResourceComplement(ai1, ai2) {
        const ai1Resources = ai1.getResourceTypes();
        const ai2Resources = ai2.getResourceTypes();
        
        let complement = 0;
        ai1Resources.forEach(type => {
            if (!ai2Resources.includes(type)) {
                complement += 0.1;
            }
        });
        
        return Math.min(complement, 1);
    }
    
    formAlliance(ai1, ai2) {
        if (ai1.alliance !== ai2.alliance) {
            const allianceId = `Alliance-${Date.now()}`;
            ai1.joinAlliance(allianceId);
            ai2.joinAlliance(allianceId);
            
            this.addLogEntry(`${ai1.name} e ${ai2.name} formaram uma aliança!`, 'success');
        }
    }
    
    startWar(ai1, ai2) {
        if (ai1.alliance === ai2.alliance) return;
        
        this.addLogEntry(`${ai1.name} declarou guerra a ${ai2.name}!`, 'danger');
        
        // Iniciar combate
        this.initiateCombat(ai1, ai2);
    }
    
    initiateCombat(ai1, ai2) {
        const ai1Power = ai1.calculateCombatPower();
        const ai2Power = ai2.calculateCombatPower();
        
        if (ai1Power > ai2Power) {
            ai2.takeDamage(ai1Power - ai2Power);
            this.addLogEntry(`${ai1.name} venceu o combate contra ${ai2.name}!`, 'warning');
        } else if (ai2Power > ai1Power) {
            ai1.takeDamage(ai2Power - ai1Power);
            this.addLogEntry(`${ai2.name} venceu o combate contra ${ai1.name}!`, 'warning');
        }
    }
    
    advanceEra() {
        const currentIndex = this.eras.indexOf(this.currentEra);
        if (currentIndex < this.eras.length - 1) {
            this.currentEra = this.eras[currentIndex + 1];
            this.addLogEntry(`Nova época: ${this.currentEra}!`, 'success');
            
            // Atualizar capacidades das IAs
            this.ais.forEach(ai => ai.advanceEra());
        }
    }
    
    addLogEntry(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const entry = {
            timestamp,
            message,
            type
        };
        
        this.gameLog.unshift(entry);
        
        // Manter apenas as últimas entradas
        if (this.gameLog.length > this.maxLogEntries) {
            this.gameLog = this.gameLog.slice(0, this.maxLogEntries);
        }
        
        this.updateLogDisplay();
    }
    
    updateLogDisplay() {
        const logContainer = document.getElementById('event-log');
        logContainer.innerHTML = '';
        
        this.gameLog.forEach(entry => {
            const logElement = document.createElement('div');
            logElement.className = `log-entry ${entry.type}`;
            logElement.innerHTML = `<strong>${entry.timestamp}</strong>: ${entry.message}`;
            logContainer.appendChild(logElement);
        });
    }
    
    updateUI() {
        document.getElementById('current-era').textContent = this.currentEra;
        document.getElementById('current-turn').textContent = this.currentTurn;
        document.getElementById('active-ais').textContent = this.ais.filter(ai => ai.isAlive).length;
        document.getElementById('current-climate').textContent = this.currentClimate;
        document.getElementById('available-resources').textContent = this.resources.filter(r => r.amount > 0).length;
        
        this.updateAIList();
        this.render();
    }
    
    updateAIList() {
        const aiListContainer = document.getElementById('ai-list');
        aiListContainer.innerHTML = '';
        
        this.ais.forEach(ai => {
            const aiElement = document.createElement('div');
            aiElement.className = 'ai-item';
            aiElement.style.borderLeftColor = ai.color;
            
            aiElement.innerHTML = `
                <strong>${ai.name}</strong><br>
                Época: ${ai.era}<br>
                Recursos: ${ai.resources.food}/${ai.resources.wood}/${ai.resources.stone}<br>
                Poder: ${ai.power}<br>
                Aliança: ${ai.alliance || 'Nenhuma'}
            `;
            
            aiListContainer.appendChild(aiElement);
        });
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.mapWidth, this.mapHeight);
        
        // Renderizar terreno base
        this.renderTerrain();
        
        // Renderizar recursos
        this.renderResources();
        
        // Renderizar animais
        this.renderAnimals();
        
        // Renderizar ilha central
        this.renderCentralIsland();
        
        // Renderizar IAs
        this.renderAIs();
        
        // Renderizar construções
        this.renderBuildings();
    }
    
    renderTerrain() {
        // Renderizar terreno base com cores baseadas no clima
        const climateColors = {
            'Tropical': '#2d5016',
            'Savana': '#8b4513',
            'Neve': '#f0f8ff',
            'Deserto': '#daa520'
        };
        
        this.ctx.fillStyle = climateColors[this.currentClimate];
        this.ctx.fillRect(0, 0, this.mapWidth, this.mapHeight);
        
        // Adicionar textura ao terreno
        for (let i = 0; i < 1000; i++) {
            const x = Math.random() * this.mapWidth;
            const y = Math.random() * this.mapHeight;
            const size = Math.random() * 3 + 1;
            
            this.ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.3})`;
            this.ctx.fillRect(x, y, size, size);
        }
    }
    
    renderResources() {
        this.resources.forEach(resource => {
            if (resource.amount > 0) {
                const colors = {
                    'wood': '#8b4513',
                    'stone': '#696969',
                    'iron': '#708090',
                    'gold': '#ffd700',
                    'food': '#32cd32',
                    'water': '#4169e1'
                };
                
                this.ctx.fillStyle = colors[resource.type] || '#ffffff';
                this.ctx.fillRect(resource.x - 5, resource.y - 5, 10, 10);
                
                // Mostrar quantidade
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = '10px Arial';
                this.ctx.fillText(resource.amount, resource.x - 10, resource.y - 15);
            }
        });
    }
    
    renderAnimals() {
        this.animals.forEach(animal => {
            if (animal.health > 0) {
                const colors = {
                    'monkey': '#8b4513',
                    'parrot': '#ff0000',
                    'snake': '#32cd32',
                    'jaguar': '#ff8c00',
                    'lion': '#daa520',
                    'elephant': '#696969',
                    'giraffe': '#daa520',
                    'zebra': '#ffffff',
                    'polar-bear': '#f0f8ff',
                    'wolf': '#808080',
                    'seal': '#708090',
                    'penguin': '#000000',
                    'camel': '#daa520',
                    'scorpion': '#8b0000',
                    'vulture': '#2f4f4f'
                };
                
                this.ctx.fillStyle = colors[animal.type] || '#ffffff';
                this.ctx.fillRect(animal.x - 3, animal.y - 3, 6, 6);
            }
        });
    }
    
    renderCentralIsland() {
        if (this.centralIsland) {
            // Renderizar ilha central
            this.ctx.fillStyle = '#654321';
            this.ctx.fillRect(
                this.centralIsland.x,
                this.centralIsland.y,
                this.centralIsland.width,
                this.centralIsland.height
            );
            
            // Renderizar tesouros
            this.centralIsland.treasures.forEach(treasure => {
                this.ctx.fillStyle = '#ffd700';
                this.ctx.fillRect(treasure.x - 3, treasure.y - 3, 6, 6);
            });
            
            // Renderizar monstros
            this.centralIsland.monsters.forEach(monster => {
                if (monster.health > 0) {
                    this.ctx.fillStyle = '#8b0000';
                    this.ctx.fillRect(monster.x - 4, monster.y - 4, 8, 8);
                }
            });
        }
    }
    
    renderAIs() {
        this.ais.forEach(ai => {
            if (ai.isAlive) {
                // Renderizar IA
                this.ctx.fillStyle = ai.color;
                this.ctx.fillRect(ai.x - 8, ai.y - 8, 16, 16);
                
                // Renderizar nome
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = '12px Arial';
                this.ctx.fillText(ai.name, ai.x - 15, ai.y - 15);
                
                // Renderizar barra de vida
                const healthBarWidth = 20;
                const healthBarHeight = 3;
                const healthPercentage = ai.health / ai.maxHealth;
                
                this.ctx.fillStyle = '#ff0000';
                this.ctx.fillRect(ai.x - 10, ai.y - 20, healthBarWidth, healthBarHeight);
                
                this.ctx.fillStyle = '#00ff00';
                this.ctx.fillRect(ai.x - 10, ai.y - 20, healthBarWidth * healthPercentage, healthBarHeight);
            }
        });
    }
    
    renderBuildings() {
        this.buildings.forEach(building => {
            const colors = {
                'house': '#8b4513',
                'farm': '#32cd32',
                'mine': '#696969',
                'workshop': '#708090',
                'tower': '#4169e1'
            };
            
            this.ctx.fillStyle = colors[building.type] || '#ffffff';
            this.ctx.fillRect(building.x - 10, building.y - 10, 20, 20);
        });
    }
}

// Classe IA
class AI {
    constructor(name, x, y, color, game) {
        this.id = `ai-${Date.now()}-${Math.random()}`;
        this.name = name;
        this.x = x;
        this.y = y;
        this.color = color;
        this.game = game;
        
        this.health = 100;
        this.maxHealth = 100;
        this.power = 10;
        this.era = 'Idade da Pedra';
        this.personality = this.generatePersonality();
        
        this.resources = {
            food: 50,
            wood: 30,
            stone: 20,
            iron: 0,
            gold: 0,
            water: 100
        };
        
        this.knownAIs = [];
        this.alliance = null;
        this.enemies = [];
        this.buildings = [];
        this.technologies = [];
        this.memory = [];
        this.goals = [];
        
        this.isAlive = true;
        this.lastAction = null;
        this.actionCooldown = 0;
        
        this.initializeGoals();
    }
    
    generatePersonality() {
        const personalities = ['aggressive', 'defensive', 'diplomatic', 'economic', 'explorer'];
        return personalities[Math.floor(Math.random() * personalities.length)];
    }
    
    initializeGoals() {
        this.goals = [
            { type: 'survive', priority: 1.0, completed: false },
            { type: 'gather_resources', priority: 0.8, completed: false },
            { type: 'explore', priority: 0.6, completed: false },
            { type: 'build', priority: 0.7, completed: false },
            { type: 'research', priority: 0.5, completed: false }
        ];
    }
    
    think() {
        if (this.actionCooldown > 0) {
            this.actionCooldown--;
            return;
        }
        
        // Analisar situação atual
        this.analyzeSituation();
        
        // Decidir próxima ação
        const action = this.decideAction();
        
        // Executar ação
        this.executeAction(action);
        
        // Aprender com a ação
        this.learn(action);
    }
    
    analyzeSituation() {
        // Verificar recursos críticos
        if (this.resources.food < 20) {
            this.addGoal({ type: 'gather_food', priority: 0.9, completed: false });
        }
        
        if (this.resources.water < 30) {
            this.addGoal({ type: 'find_water', priority: 0.9, completed: false });
        }
        
        // Verificar ameaças
        const nearbyEnemies = this.game.ais.filter(ai => 
            ai.id !== this.id && 
            ai.isAlive && 
            this.calculateDistance(ai.x, ai.y) < 100
        );
        
        if (nearbyEnemies.length > 0) {
            this.addGoal({ type: 'defend', priority: 0.95, completed: false });
        }
        
        // Verificar oportunidades
        const nearbyResources = this.game.resources.filter(resource =>
            resource.amount > 0 && this.calculateDistance(resource.x, resource.y) < 50
        );
        
        if (nearbyResources.length > 0) {
            this.addGoal({ type: 'gather_resources', priority: 0.8, completed: false });
        }
    }
    
    decideAction() {
        // Ordenar objetivos por prioridade
        this.goals.sort((a, b) => b.priority - a.priority);
        
        const topGoal = this.goals[0];
        
        switch (topGoal.type) {
            case 'survive':
                return this.getSurvivalAction();
            case 'gather_food':
                return this.getGatherFoodAction();
            case 'find_water':
                return this.getFindWaterAction();
            case 'gather_resources':
                return this.getGatherResourcesAction();
            case 'defend':
                return this.getDefendAction();
            case 'explore':
                return this.getExploreAction();
            case 'build':
                return this.getBuildAction();
            case 'research':
                return this.getResearchAction();
            default:
                return this.getRandomAction();
        }
    }
    
    getSurvivalAction() {
        if (this.health < 30) {
            return { type: 'heal', target: null, priority: 1.0 };
        }
        
        if (this.resources.food < 10) {
            return { type: 'gather_food', target: null, priority: 0.9 };
        }
        
        return { type: 'rest', target: null, priority: 0.5 };
    }
    
    getGatherFoodAction() {
        const nearbyFood = this.game.resources.filter(resource =>
            resource.type === 'food' && 
            resource.amount > 0 && 
            this.calculateDistance(resource.x, resource.y) < 100
        );
        
        if (nearbyFood.length > 0) {
            const closest = this.findClosest(nearbyFood);
            return { type: 'move_to', target: closest, priority: 0.8 };
        }
        
        return { type: 'explore', target: null, priority: 0.6 };
    }
    
    getFindWaterAction() {
        const nearbyWater = this.game.resources.filter(resource =>
            resource.type === 'water' && 
            resource.amount > 0 && 
            this.calculateDistance(resource.x, resource.y) < 100
        );
        
        if (nearbyWater.length > 0) {
            const closest = this.findClosest(nearbyWater);
            return { type: 'move_to', target: closest, priority: 0.8 };
        }
        
        return { type: 'explore', target: null, priority: 0.6 };
    }
    
    getGatherResourcesAction() {
        const nearbyResources = this.game.resources.filter(resource =>
            resource.amount > 0 && this.calculateDistance(resource.x, resource.y) < 100
        );
        
        if (nearbyResources.length > 0) {
            const closest = this.findClosest(nearbyResources);
            return { type: 'gather', target: closest, priority: 0.7 };
        }
        
        return { type: 'explore', target: null, priority: 0.5 };
    }
    
    getDefendAction() {
        const nearbyEnemies = this.game.ais.filter(ai => 
            ai.id !== this.id && 
            ai.isAlive && 
            this.calculateDistance(ai.x, ai.y) < 80
        );
        
        if (nearbyEnemies.length > 0) {
            if (this.power > 15) {
                return { type: 'attack', target: nearbyEnemies[0], priority: 0.9 };
            } else {
                return { type: 'flee', target: null, priority: 0.8 };
            }
        }
        
        return { type: 'patrol', target: null, priority: 0.6 };
    }
    
    getExploreAction() {
        const unexploredAreas = this.findUnexploredAreas();
        if (unexploredAreas.length > 0) {
            return { type: 'move_to', target: unexploredAreas[0], priority: 0.6 };
        }
        
        return { type: 'random_move', target: null, priority: 0.4 };
    }
    
    getBuildAction() {
        if (this.resources.wood >= 20 && this.resources.stone >= 15) {
            return { type: 'build_house', target: null, priority: 0.7 };
        }
        
        return { type: 'gather_resources', target: null, priority: 0.6 };
    }
    
    getResearchAction() {
        if (this.resources.gold >= 50) {
            return { type: 'research_technology', target: null, priority: 0.6 };
        }
        
        return { type: 'gather_resources', target: null, priority: 0.5 };
    }
    
    getRandomAction() {
        const actions = ['explore', 'rest', 'patrol'];
        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        return { type: randomAction, target: null, priority: 0.3 };
    }
    
    executeAction(action) {
        this.lastAction = action;
        this.actionCooldown = Math.floor(Math.random() * 10) + 5;
        
        switch (action.type) {
            case 'move_to':
                this.moveTo(action.target);
                break;
            case 'gather':
                this.gatherResource(action.target);
                break;
            case 'attack':
                this.attack(action.target);
                break;
            case 'flee':
                this.flee();
                break;
            case 'build_house':
                this.buildHouse();
                break;
            case 'rest':
                this.rest();
                break;
            case 'explore':
                this.explore();
                break;
            case 'patrol':
                this.patrol();
                break;
            case 'random_move':
                this.randomMove();
                break;
            case 'heal':
                this.heal();
                break;
        }
    }
    
    moveTo(target) {
        if (!target) return;
        
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
            const speed = 2;
            this.x += (dx / distance) * speed;
            this.y += (dy / distance) * speed;
        }
    }
    
    gatherResource(resource) {
        if (!resource || resource.amount <= 0) return;
        
        const distance = this.calculateDistance(resource.x, resource.y);
        if (distance < 10) {
            const gatherAmount = Math.min(10, resource.amount);
            resource.amount -= gatherAmount;
            
            switch (resource.type) {
                case 'food':
                    this.resources.food += gatherAmount;
                    break;
                case 'wood':
                    this.resources.wood += gatherAmount;
                    break;
                case 'stone':
                    this.resources.stone += gatherAmount;
                    break;
                case 'iron':
                    this.resources.iron += gatherAmount;
                    break;
                case 'gold':
                    this.resources.gold += gatherAmount;
                    break;
                case 'water':
                    this.resources.water += gatherAmount;
                    break;
            }
            
            this.game.addLogEntry(`${this.name} recolheu ${gatherAmount} ${resource.type}`, 'info');
        }
    }
    
    attack(target) {
        if (!target || !target.isAlive) return;
        
        const distance = this.calculateDistance(target.x, target.y);
        if (distance < 20) {
            const damage = this.power + Math.floor(Math.random() * 10);
            target.takeDamage(damage);
            
            this.game.addLogEntry(`${this.name} atacou ${target.name} causando ${damage} de dano!`, 'warning');
        }
    }
    
    flee() {
        // Mover em direção oposta aos inimigos
        const nearbyEnemies = this.game.ais.filter(ai => 
            ai.id !== this.id && 
            ai.isAlive && 
            this.calculateDistance(ai.x, ai.y) < 100
        );
        
        if (nearbyEnemies.length > 0) {
            const avgEnemyX = nearbyEnemies.reduce((sum, enemy) => sum + enemy.x, 0) / nearbyEnemies.length;
            const avgEnemyY = nearbyEnemies.reduce((sum, enemy) => sum + enemy.y, 0) / nearbyEnemies.length;
            
            const dx = this.x - avgEnemyX;
            const dy = this.y - avgEnemyY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const speed = 3;
                this.x += (dx / distance) * speed;
                this.y += (dy / distance) * speed;
            }
        }
    }
    
    buildHouse() {
        if (this.resources.wood >= 20 && this.resources.stone >= 15) {
            this.resources.wood -= 20;
            this.resources.stone -= 15;
            
            const building = {
                type: 'house',
                x: this.x,
                y: this.y,
                owner: this.id,
                health: 100
            };
            
            this.buildings.push(building);
            this.game.buildings.push(building);
            
            this.game.addLogEntry(`${this.name} construiu uma casa!`, 'success');
        }
    }
    
    rest() {
        // Recuperar um pouco de vida
        this.health = Math.min(this.maxHealth, this.health + 2);
        
        // Consumir um pouco de comida
        this.resources.food = Math.max(0, this.resources.food - 1);
    }
    
    explore() {
        // Mover para uma direção aleatória
        const angle = Math.random() * Math.PI * 2;
        const distance = 30;
        
        this.x += Math.cos(angle) * distance;
        this.y += Math.sin(angle) * distance;
        
        // Manter dentro dos limites do mapa
        this.x = Math.max(0, Math.min(this.game.mapWidth, this.x));
        this.y = Math.max(0, Math.min(this.game.mapHeight, this.y));
    }
    
    patrol() {
        // Mover em um padrão de patrulha
        const time = Date.now() * 0.001;
        const radius = 20;
        
        this.x += Math.cos(time) * radius * 0.1;
        this.y += Math.sin(time) * radius * 0.1;
        
        // Manter dentro dos limites do mapa
        this.x = Math.max(0, Math.min(this.game.mapWidth, this.x));
        this.y = Math.max(0, Math.min(this.game.mapHeight, this.y));
    }
    
    randomMove() {
        // Movimento aleatório
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 20 + 10;
        
        this.x += Math.cos(angle) * distance;
        this.y += Math.sin(angle) * distance;
        
        // Manter dentro dos limites do mapa
        this.x = Math.max(0, Math.min(this.game.mapWidth, this.x));
        this.y = Math.max(0, Math.min(this.game.mapHeight, this.y));
    }
    
    heal() {
        // Consumir recursos para curar
        if (this.resources.food >= 5) {
            this.resources.food -= 5;
            this.health = Math.min(this.maxHealth, this.health + 10);
        }
    }
    
    takeDamage(damage) {
        this.health -= damage;
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die() {
        this.isAlive = false;
        this.game.addLogEntry(`${this.name} foi derrotado!`, 'danger');
    }
    
    discoverAI(ai) {
        if (!this.knownAIs.includes(ai.id)) {
            this.knownAIs.push(ai.id);
        }
    }
    
    joinAlliance(allianceId) {
        this.alliance = allianceId;
        this.color = this.game.ais.find(ai => ai.alliance === allianceId)?.color || this.color;
    }
    
    advanceEra() {
        const currentIndex = this.game.eras.indexOf(this.era);
        if (currentIndex < this.game.eras.length - 1) {
            this.era = this.game.eras[currentIndex + 1];
            this.power += 5;
            this.maxHealth += 20;
            this.health = this.maxHealth;
        }
    }
    
    calculateDistance(x, y) {
        return Math.sqrt(Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2));
    }
    
    findClosest(objects) {
        if (objects.length === 0) return null;
        
        return objects.reduce((closest, current) => {
            const closestDistance = this.calculateDistance(closest.x, closest.y);
            const currentDistance = this.calculateDistance(current.x, current.y);
            return currentDistance < closestDistance ? current : closest;
        });
    }
    
    findUnexploredAreas() {
        // Implementar lógica para encontrar áreas não exploradas
        const areas = [];
        for (let i = 0; i < 5; i++) {
            areas.push({
                x: Math.random() * this.game.mapWidth,
                y: Math.random() * this.game.mapHeight
            });
        }
        return areas;
    }
    
    addGoal(goal) {
        // Evitar objetivos duplicados
        if (!this.goals.find(g => g.type === goal.type)) {
            this.goals.push(goal);
        }
    }
    
    getResourceTypes() {
        return Object.keys(this.resources).filter(key => this.resources[key] > 0);
    }
    
    calculateCombatPower() {
        return this.power + (this.health / this.maxHealth) * 10;
    }
    
    learn(action) {
        // Sistema de aprendizado simples
        const memoryEntry = {
            turn: this.game.currentTurn,
            action: action,
            result: this.evaluateActionResult(action),
            resources: { ...this.resources },
            health: this.health,
            position: { x: this.x, y: this.y }
        };
        
        this.memory.push(memoryEntry);
        
        // Manter apenas as últimas 100 memórias
        if (this.memory.length > 100) {
            this.memory = this.memory.slice(-100);
        }
        
        // Ajustar prioridades dos objetivos baseado no aprendizado
        this.adjustGoalPriorities();
    }
    
    evaluateActionResult(action) {
        // Avaliar se a ação foi bem-sucedida
        let success = 0;
        
        switch (action.type) {
            case 'gather':
                if (this.resources.food > 20 || this.resources.wood > 20) {
                    success = 1;
                }
                break;
            case 'build_house':
                if (this.buildings.length > 0) {
                    success = 1;
                }
                break;
            case 'attack':
                if (this.health > 50) {
                    success = 1;
                }
                break;
            case 'flee':
                if (this.health > 30) {
                    success = 1;
                }
                break;
        }
        
        return success;
    }
    
    adjustGoalPriorities() {
        // Ajustar prioridades baseado no histórico de sucesso
        this.goals.forEach(goal => {
            const recentActions = this.memory
                .filter(m => m.action.type.includes(goal.type))
                .slice(-10);
            
            if (recentActions.length > 0) {
                const successRate = recentActions.reduce((sum, m) => sum + m.result, 0) / recentActions.length;
                
                if (successRate > 0.7) {
                    goal.priority = Math.min(1.0, goal.priority + 0.1);
                } else if (successRate < 0.3) {
                    goal.priority = Math.max(0.1, goal.priority - 0.1);
                }
            }
        });
    }
}

// Inicializar o jogo quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    const game = new AICivilization();
    
    // Adicionar ao escopo global para debugging
    window.game = game;
});
