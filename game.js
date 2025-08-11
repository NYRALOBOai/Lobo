class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.isRunning = false;
        this.isPaused = false;
        this.turn = 0;
        this.speed = 2;
        this.selectedAI = null;
        
        // Configurações do mundo
        this.worldWidth = 150;
        this.worldHeight = 100;
        this.tileSize = 8;
        
        // Mundo e entidades
        this.world = [];
        this.ais = [];
        this.resources = [];
        
        // Cores das IAs
        this.aiColors = [
            '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
            '#1abc9c', '#e67e22', '#34495e', '#f1c40f', '#e91e63'
        ];
        
        this.initializeEventListeners();
        this.generateWorld();
    }

    initializeEventListeners() {
        document.getElementById('start-game').addEventListener('click', () => this.startGame());
        document.getElementById('pause-game').addEventListener('click', () => this.togglePause());
        document.getElementById('reset-game').addEventListener('click', () => this.resetGame());
        document.getElementById('game-speed').addEventListener('change', (e) => {
            this.speed = parseInt(e.target.value);
        });
        
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    }

    generateWorld() {
        this.world = [];
        for (let y = 0; y < this.worldHeight; y++) {
            this.world[y] = [];
            for (let x = 0; x < this.worldWidth; x++) {
                this.world[y][x] = this.generateTile(x, y);
            }
        }
        this.generateCentralIsland();
        this.generateResources();
    }

    generateTile(x, y) {
        const centerX = this.worldWidth / 2;
        const centerY = this.worldHeight / 2;
        const distanceFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        
        // Gerar diferentes biomas baseado na posição
        let biome = 'ocean';
        let temperature = 0.5;
        let humidity = 0.5;
        
        // Usar noise para variação natural
        const noise = this.perlinNoise(x * 0.1, y * 0.1);
        const tempNoise = this.perlinNoise(x * 0.05, y * 0.05 + 1000);
        
        temperature = Math.max(0, Math.min(1, 0.5 + tempNoise * 0.5));
        humidity = Math.max(0, Math.min(1, 0.5 + noise * 0.5));
        
        if (distanceFromCenter > 45) {
            biome = 'ocean';
        } else if (distanceFromCenter > 35) {
            biome = Math.random() < 0.3 ? 'beach' : 'ocean';
        } else {
            // Determinar bioma baseado em temperatura e umidade
            if (temperature < 0.3) {
                biome = humidity > 0.5 ? 'tundra' : 'snow';
            } else if (temperature > 0.7) {
                biome = humidity > 0.6 ? 'jungle' : 'desert';
            } else {
                biome = humidity > 0.5 ? 'forest' : 'grassland';
            }
        }
        
        return {
            x, y, biome, temperature, humidity,
            resources: [],
            animals: this.generateAnimals(biome),
            vegetation: this.generateVegetation(biome, humidity),
            explored: [],
            structures: []
        };
    }

    generateAnimals(biome) {
        const animals = [];
        const animalTypes = {
            forest: ['deer', 'rabbit', 'wolf'],
            grassland: ['rabbit', 'horse', 'buffalo'],
            jungle: ['monkey', 'jaguar', 'bird'],
            desert: ['camel', 'snake', 'lizard'],
            tundra: ['reindeer', 'wolf', 'seal'],
            snow: ['polar_bear', 'seal', 'penguin'],
            beach: ['crab', 'seagull'],
            ocean: ['fish', 'whale']
        };
        
        const types = animalTypes[biome] || [];
        for (const type of types) {
            if (Math.random() < 0.3) {
                animals.push({
                    type,
                    population: Math.floor(Math.random() * 10) + 1
                });
            }
        }
        
        return animals;
    }

    generateVegetation(biome, humidity) {
        const vegetation = [];
        const vegTypes = {
            forest: ['oak', 'pine', 'birch'],
            grassland: ['grass', 'wheat'],
            jungle: ['banana', 'rubber', 'mahogany'],
            desert: ['cactus', 'palm'],
            tundra: ['moss', 'shrub'],
            snow: ['pine'],
            beach: ['palm', 'seaweed']
        };
        
        const types = vegTypes[biome] || [];
        for (const type of types) {
            if (Math.random() < humidity) {
                vegetation.push({
                    type,
                    quantity: Math.floor(Math.random() * 5) + 1
                });
            }
        }
        
        return vegetation;
    }

    generateCentralIsland() {
        const centerX = Math.floor(this.worldWidth / 2);
        const centerY = Math.floor(this.worldHeight / 2);
        const radius = 8;
        
        for (let y = centerY - radius; y <= centerY + radius; y++) {
            for (let x = centerX - radius; x <= centerX + radius; x++) {
                if (x >= 0 && x < this.worldWidth && y >= 0 && y < this.worldHeight) {
                    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                    if (distance <= radius) {
                        this.world[y][x].biome = 'volcanic';
                        this.world[y][x].dangerous = true;
                        
                        // Adicionar características especiais
                        if (distance < 3) {
                            this.world[y][x].features = ['lava_pool'];
                        } else if (distance < 5) {
                            this.world[y][x].features = ['monster_lair'];
                        }
                        
                        // Tesouros e tecnologias avançadas
                        if (Math.random() < 0.4) {
                            this.world[y][x].treasures = [
                                { type: 'gold', amount: Math.floor(Math.random() * 100) + 50 },
                                { type: 'advanced_tech', level: Math.floor(Math.random() * 3) + 1 }
                            ];
                        }
                    }
                }
            }
        }
    }

    generateResources() {
        for (let y = 0; y < this.worldHeight; y++) {
            for (let x = 0; x < this.worldWidth; x++) {
                const tile = this.world[y][x];
                if (tile.biome !== 'ocean') {
                    // Recursos baseados no bioma
                    const resourceChance = {
                        forest: { wood: 0.8, stone: 0.3, iron: 0.1 },
                        grassland: { food: 0.6, stone: 0.4, iron: 0.2 },
                        jungle: { wood: 0.9, food: 0.7, gold: 0.1 },
                        desert: { stone: 0.7, iron: 0.4, gold: 0.2 },
                        tundra: { stone: 0.5, iron: 0.3, coal: 0.4 },
                        snow: { stone: 0.4, iron: 0.2, coal: 0.3 },
                        beach: { stone: 0.3, food: 0.4 },
                        volcanic: { iron: 0.8, gold: 0.6, coal: 0.9 }
                    };
                    
                    const chances = resourceChance[tile.biome] || {};
                    for (const [resource, chance] of Object.entries(chances)) {
                        if (Math.random() < chance) {
                            tile.resources.push({
                                type: resource,
                                amount: Math.floor(Math.random() * 50) + 10
                            });
                        }
                    }
                }
            }
        }
    }

    perlinNoise(x, y) {
        // Implementação simples de Perlin noise
        const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return (n - Math.floor(n));
    }

    startGame() {
        const aiCount = parseInt(document.getElementById('ai-count').value);
        this.createAIs(aiCount);
        this.isRunning = true;
        this.gameLoop();
        this.updateUI();
    }

    createAIs(count) {
        this.ais = [];
        for (let i = 0; i < count; i++) {
            const ai = new AI(i, this.aiColors[i], this);
            this.ais.push(ai);
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        document.getElementById('pause-game').textContent = this.isPaused ? 'Continuar' : 'Pausar';
    }

    resetGame() {
        this.isRunning = false;
        this.isPaused = false;
        this.turn = 0;
        this.selectedAI = null;
        this.ais = [];
        this.generateWorld();
        this.updateUI();
        this.render();
    }

    gameLoop() {
        if (!this.isRunning || this.isPaused) {
            setTimeout(() => this.gameLoop(), 100);
            return;
        }

        // Processar turno de cada IA
        for (const ai of this.ais) {
            if (ai.isAlive) {
                ai.processTurn();
            }
        }

        this.turn++;
        this.updateUI();
        this.render();

        // Controlar velocidade do jogo
        setTimeout(() => this.gameLoop(), 1000 / this.speed);
    }

    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / this.tileSize);
        const y = Math.floor((e.clientY - rect.top) / this.tileSize);
        
        // Procurar IA nesta posição
        for (const ai of this.ais) {
            if (Math.floor(ai.x) === x && Math.floor(ai.y) === y) {
                this.selectAI(ai);
                return;
            }
        }
        
        this.selectedAI = null;
        this.updateUI();
    }

    selectAI(ai) {
        this.selectedAI = ai;
        this.updateUI();
        
        // Destacar entrada da IA na lista
        document.querySelectorAll('.ai-entry').forEach(entry => {
            entry.classList.remove('selected');
        });
        document.getElementById(`ai-${ai.id}`).classList.add('selected');
    }

    updateUI() {
        document.getElementById('turn-counter').textContent = `Turno: ${this.turn}`;
        document.getElementById('active-ais').textContent = `IAs Ativas: ${this.ais.filter(ai => ai.isAlive).length}`;
        
        this.updateAIList();
        this.updateSelectedAIInfo();
    }

    updateAIList() {
        const container = document.getElementById('ai-entries');
        container.innerHTML = '';
        
        for (const ai of this.ais) {
            const entry = document.createElement('div');
            entry.className = `ai-entry ai-color-${ai.id}`;
            entry.id = `ai-${ai.id}`;
            entry.addEventListener('click', () => this.selectAI(ai));
            
            entry.innerHTML = `
                <div class="ai-name">IA ${ai.id + 1} ${ai.isAlive ? '' : '(Morta)'}</div>
                <div class="ai-stats">
                    Época: ${ai.era} | Pop: ${ai.population}<br>
                    Comida: ${ai.resources.food} | Madeira: ${ai.resources.wood}<br>
                    Pedra: ${ai.resources.stone} | Ferro: ${ai.resources.iron}
                </div>
            `;
            
            container.appendChild(entry);
        }
    }

    updateSelectedAIInfo() {
        const details = document.getElementById('ai-details');
        
        if (!this.selectedAI) {
            details.innerHTML = 'Clique em uma IA para ver detalhes';
            return;
        }
        
        const ai = this.selectedAI;
        details.innerHTML = `
            <strong>IA ${ai.id + 1}</strong><br>
            Status: ${ai.isAlive ? 'Viva' : 'Morta'}<br>
            Posição: (${Math.floor(ai.x)}, ${Math.floor(ai.y)})<br>
            Época: ${ai.era}<br>
            População: ${ai.population}<br>
            Conhecimento: ${ai.knownTiles.size} tiles<br>
            <br>
            <strong>Recursos:</strong><br>
            Comida: ${ai.resources.food}<br>
            Madeira: ${ai.resources.wood}<br>
            Pedra: ${ai.resources.stone}<br>
            Ferro: ${ai.resources.iron}<br>
            Ouro: ${ai.resources.gold}<br>
            <br>
            <strong>Tecnologias:</strong><br>
            ${ai.technologies.join(', ') || 'Nenhuma'}<br>
            <br>
            <strong>Alianças:</strong><br>
            ${ai.alliances.length > 0 ? ai.alliances.map(id => `IA ${id + 1}`).join(', ') : 'Nenhuma'}
        `;
    }

    addLogEntry(message, type = 'info') {
        const log = document.getElementById('event-log');
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = `[${this.turn}] ${message}`;
        
        log.appendChild(entry);
        log.scrollTop = log.scrollHeight;
        
        // Limitar número de entradas
        while (log.children.length > 100) {
            log.removeChild(log.firstChild);
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Renderizar mundo
        for (let y = 0; y < this.worldHeight; y++) {
            for (let x = 0; x < this.worldWidth; x++) {
                this.renderTile(x, y, this.world[y][x]);
            }
        }
        
        // Renderizar IAs
        for (const ai of this.ais) {
            if (ai.isAlive) {
                this.renderAI(ai);
            }
        }
        
        // Renderizar seleção
        if (this.selectedAI) {
            this.renderSelection(this.selectedAI);
        }
    }

    renderTile(x, y, tile) {
        const colors = {
            ocean: '#2980b9',
            beach: '#f4d03f',
            grassland: '#27ae60',
            forest: '#1e8449',
            jungle: '#0e6b0e',
            desert: '#e67e22',
            tundra: '#85929e',
            snow: '#ecf0f1',
            volcanic: '#8b0000'
        };
        
        this.ctx.fillStyle = colors[tile.biome] || '#34495e';
        this.ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
        
        // Renderizar recursos
        if (tile.resources.length > 0) {
            this.ctx.fillStyle = '#f1c40f';
            this.ctx.fillRect(x * this.tileSize + 2, y * this.tileSize + 2, 2, 2);
        }
        
        // Renderizar tesouros na ilha central
        if (tile.treasures && tile.treasures.length > 0) {
            this.ctx.fillStyle = '#ffd700';
            this.ctx.fillRect(x * this.tileSize + 1, y * this.tileSize + 1, 4, 4);
        }
    }

    renderAI(ai) {
        this.ctx.fillStyle = ai.color;
        this.ctx.fillRect(
            ai.x * this.tileSize - 1,
            ai.y * this.tileSize - 1,
            this.tileSize + 2,
            this.tileSize + 2
        );
        
        // Renderizar população como círculos pequenos
        this.ctx.fillStyle = ai.color;
        const populationSize = Math.min(ai.population, 9);
        for (let i = 0; i < populationSize; i++) {
            const offsetX = (i % 3) * 2;
            const offsetY = Math.floor(i / 3) * 2;
            this.ctx.fillRect(
                ai.x * this.tileSize + offsetX + 1,
                ai.y * this.tileSize + offsetY + 1,
                1, 1
            );
        }
    }

    renderSelection(ai) {
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(
            ai.x * this.tileSize - 2,
            ai.y * this.tileSize - 2,
            this.tileSize + 4,
            this.tileSize + 4
        );
    }
}

class AI {
    constructor(id, color, game) {
        this.id = id;
        this.color = color;
        this.game = game;
        this.isAlive = true;
        
        // Posição inicial aleatória em terra
        this.findStartPosition();
        
        // Recursos iniciais
        this.resources = {
            food: 20,
            wood: 10,
            stone: 5,
            iron: 0,
            gold: 0,
            coal: 0
        };
        
        // Estado da IA
        this.population = 3;
        this.era = 'Stone Age';
        this.technologies = [];
        this.knownTiles = new Set();
        this.memory = new Map();
        this.alliances = [];
        this.enemies = [];
        
        // Sistema de aprendizado
        this.actionHistory = [];
        this.successfulActions = new Map();
        this.failedActions = new Map();
        
        // Objetivos e comportamento
        this.currentGoal = 'explore';
        this.explorationTarget = null;
        
        this.exploreStartingArea();
    }

    findStartPosition() {
        let attempts = 0;
        do {
            this.x = Math.random() * this.game.worldWidth;
            this.y = Math.random() * this.game.worldHeight;
            attempts++;
        } while (
            (this.getTileAt(Math.floor(this.x), Math.floor(this.y)).biome === 'ocean' ||
             this.getTileAt(Math.floor(this.x), Math.floor(this.y)).biome === 'volcanic') &&
            attempts < 100
        );
    }

    exploreStartingArea() {
        const radius = 3;
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const x = Math.floor(this.x) + dx;
                const y = Math.floor(this.y) + dy;
                if (x >= 0 && x < this.game.worldWidth && y >= 0 && y < this.game.worldHeight) {
                    this.knownTiles.add(`${x},${y}`);
                }
            }
        }
    }

    processTurn() {
        if (!this.isAlive) return;
        
        // Consumir comida
        this.consumeFood();
        
        // Verificar sobrevivência
        if (this.resources.food <= 0 && this.population > 0) {
            this.population--;
            if (this.population <= 0) {
                this.die();
                return;
            }
        }
        
        // Decidir ação baseada no aprendizado
        const action = this.decideAction();
        this.executeAction(action);
        
        // Atualizar memória
        this.updateMemory();
        
        // Tentar evoluir
        this.tryEvolve();
    }

    consumeFood() {
        const consumption = Math.max(1, Math.floor(this.population / 2));
        this.resources.food = Math.max(0, this.resources.food - consumption);
    }

    decideAction() {
        // Sistema de decisão baseado em prioridades e aprendizado
        const priorities = this.calculatePriorities();
        const actions = this.getAvailableActions();
        
        // Usar histórico de sucesso para influenciar decisões
        let bestAction = null;
        let bestScore = -1;
        
        for (const action of actions) {
            let score = priorities[action.type] || 0;
            
            // Bonus para ações bem-sucedidas no passado
            const successRate = this.getActionSuccessRate(action.type);
            score *= (0.5 + successRate);
            
            if (score > bestScore) {
                bestScore = score;
                bestAction = action;
            }
        }
        
        return bestAction || { type: 'wait' };
    }

    calculatePriorities() {
        const priorities = {};
        
        // Prioridade de sobrevivência
        if (this.resources.food < this.population * 3) {
            priorities.gather_food = 10;
            priorities.hunt = 8;
        }
        
        // Prioridade de crescimento
        if (this.resources.food > this.population * 5) {
            priorities.reproduce = 7;
            priorities.build = 6;
        }
        
        // Prioridade de exploração
        if (this.knownTiles.size < 50) {
            priorities.explore = 5;
        }
        
        // Prioridade de recursos
        if (this.resources.wood < 10) priorities.gather_wood = 6;
        if (this.resources.stone < 10) priorities.gather_stone = 5;
        
        // Prioridade de pesquisa
        if (this.resources.wood > 20 && this.resources.stone > 15) {
            priorities.research = 4;
        }
        
        return priorities;
    }

    getAvailableActions() {
        const actions = [];
        const currentTile = this.getCurrentTile();
        
        // Ações de movimento
        actions.push({ type: 'explore', direction: this.getExplorationDirection() });
        
        // Ações de coleta
        if (currentTile.resources.length > 0) {
            for (const resource of currentTile.resources) {
                if (resource.amount > 0) {
                    actions.push({ type: 'gather', resource: resource.type });
                }
            }
        }
        
        // Ações de caça
        if (currentTile.animals.length > 0) {
            actions.push({ type: 'hunt' });
        }
        
        // Ações de construção
        if (this.resources.wood >= 5 && this.resources.stone >= 3) {
            actions.push({ type: 'build', structure: 'shelter' });
        }
        
        // Ações de pesquisa
        if (this.canResearch()) {
            actions.push({ type: 'research' });
        }
        
        // Ações de reprodução
        if (this.resources.food > this.population * 4) {
            actions.push({ type: 'reproduce' });
        }
        
        return actions;
    }

    executeAction(action) {
        let success = false;
        
        switch (action.type) {
            case 'explore':
                success = this.explore(action.direction);
                break;
            case 'gather':
                success = this.gatherResource(action.resource);
                break;
            case 'hunt':
                success = this.hunt();
                break;
            case 'build':
                success = this.build(action.structure);
                break;
            case 'research':
                success = this.research();
                break;
            case 'reproduce':
                success = this.reproduce();
                break;
            default:
                success = true; // Wait sempre sucede
        }
        
        // Registrar resultado para aprendizado
        this.recordActionResult(action.type, success);
        
        if (success) {
            this.game.addLogEntry(`IA ${this.id + 1} executou: ${action.type}`, 'success');
        } else {
            this.game.addLogEntry(`IA ${this.id + 1} falhou em: ${action.type}`, 'warning');
        }
    }

    explore(direction) {
        const directions = [
            { dx: 0, dy: -1 }, { dx: 1, dy: -1 }, { dx: 1, dy: 0 }, { dx: 1, dy: 1 },
            { dx: 0, dy: 1 }, { dx: -1, dy: 1 }, { dx: -1, dy: 0 }, { dx: -1, dy: -1 }
        ];
        
        const dir = directions[direction % 8];
        const newX = Math.max(0, Math.min(this.game.worldWidth - 1, this.x + dir.dx));
        const newY = Math.max(0, Math.min(this.game.worldHeight - 1, this.y + dir.dy));
        
        const targetTile = this.getTileAt(Math.floor(newX), Math.floor(newY));
        
        if (targetTile.biome !== 'ocean') {
            this.x = newX;
            this.y = newY;
            this.knownTiles.add(`${Math.floor(newX)},${Math.floor(newY)}`);
            return true;
        }
        
        return false;
    }

    gatherResource(resourceType) {
        const tile = this.getCurrentTile();
        const resource = tile.resources.find(r => r.type === resourceType);
        
        if (resource && resource.amount > 0) {
            const gathered = Math.min(5, resource.amount);
            resource.amount -= gathered;
            this.resources[resourceType] = (this.resources[resourceType] || 0) + gathered;
            
            if (resource.amount <= 0) {
                tile.resources = tile.resources.filter(r => r !== resource);
            }
            
            return true;
        }
        
        return false;
    }

    hunt() {
        const tile = this.getCurrentTile();
        if (tile.animals.length > 0) {
            const animal = tile.animals[0];
            const hunted = Math.min(2, animal.population);
            animal.population -= hunted;
            
            this.resources.food += hunted * 3;
            
            if (animal.population <= 0) {
                tile.animals = tile.animals.filter(a => a !== animal);
            }
            
            return true;
        }
        
        return false;
    }

    build(structureType) {
        const costs = {
            shelter: { wood: 5, stone: 3 }
        };
        
        const cost = costs[structureType];
        if (this.hasResources(cost)) {
            this.spendResources(cost);
            
            const tile = this.getCurrentTile();
            tile.structures.push({
                type: structureType,
                owner: this.id
            });
            
            return true;
        }
        
        return false;
    }

    research() {
        const costs = {
            'Stone Age': { wood: 10, stone: 10 },
            'Bronze Age': { wood: 20, stone: 15, iron: 5 },
            'Iron Age': { wood: 30, stone: 20, iron: 10 },
            'Medieval': { wood: 40, stone: 30, iron: 20, coal: 10 }
        };
        
        const nextEra = this.getNextEra();
        const cost = costs[nextEra];
        
        if (cost && this.hasResources(cost)) {
            this.spendResources(cost);
            this.era = nextEra;
            this.technologies.push(`${nextEra}_tech`);
            
            this.game.addLogEntry(`IA ${this.id + 1} evoluiu para ${nextEra}!`, 'success');
            return true;
        }
        
        return false;
    }

    reproduce() {
        if (this.resources.food >= this.population * 4) {
            this.resources.food -= this.population * 2;
            this.population += Math.floor(this.population * 0.5) + 1;
            return true;
        }
        
        return false;
    }

    // Métodos auxiliares
    getCurrentTile() {
        return this.getTileAt(Math.floor(this.x), Math.floor(this.y));
    }

    getTileAt(x, y) {
        if (x >= 0 && x < this.game.worldWidth && y >= 0 && y < this.game.worldHeight) {
            return this.game.world[y][x];
        }
        return { biome: 'ocean', resources: [], animals: [], structures: [] };
    }

    getExplorationDirection() {
        // Direção inteligente baseada em tiles não explorados
        const unexplored = [];
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                const x = Math.floor(this.x) + dx;
                const y = Math.floor(this.y) + dy;
                if (!this.knownTiles.has(`${x},${y}`) && 
                    x >= 0 && x < this.game.worldWidth && 
                    y >= 0 && y < this.game.worldHeight) {
                    unexplored.push({ x, y, dx, dy });
                }
            }
        }
        
        if (unexplored.length > 0) {
            const target = unexplored[Math.floor(Math.random() * unexplored.length)];
            return Math.floor(Math.atan2(target.dy, target.dx) * 4 / Math.PI + 4.5) % 8;
        }
        
        return Math.floor(Math.random() * 8);
    }

    canResearch() {
        const nextEra = this.getNextEra();
        return nextEra !== this.era;
    }

    getNextEra() {
        const eras = ['Stone Age', 'Bronze Age', 'Iron Age', 'Medieval', 'Renaissance'];
        const currentIndex = eras.indexOf(this.era);
        return currentIndex < eras.length - 1 ? eras[currentIndex + 1] : this.era;
    }

    hasResources(cost) {
        for (const [resource, amount] of Object.entries(cost)) {
            if ((this.resources[resource] || 0) < amount) {
                return false;
            }
        }
        return true;
    }

    spendResources(cost) {
        for (const [resource, amount] of Object.entries(cost)) {
            this.resources[resource] -= amount;
        }
    }

    recordActionResult(actionType, success) {
        this.actionHistory.push({ action: actionType, success, turn: this.game.turn });
        
        if (success) {
            this.successfulActions.set(actionType, (this.successfulActions.get(actionType) || 0) + 1);
        } else {
            this.failedActions.set(actionType, (this.failedActions.get(actionType) || 0) + 1);
        }
    }

    getActionSuccessRate(actionType) {
        const successes = this.successfulActions.get(actionType) || 0;
        const failures = this.failedActions.get(actionType) || 0;
        const total = successes + failures;
        
        return total > 0 ? successes / total : 0.5;
    }

    updateMemory() {
        // Atualizar memória sobre o ambiente
        const tile = this.getCurrentTile();
        const key = `${Math.floor(this.x)},${Math.floor(this.y)}`;
        
        this.memory.set(key, {
            biome: tile.biome,
            resources: [...tile.resources],
            lastVisited: this.game.turn,
            danger: tile.dangerous || false
        });
    }

    tryEvolve() {
        // Tentar descobrir outras IAs
        this.discoverOtherAIs();
        
        // Tentar formar alianças
        this.considerAlliances();
    }

    discoverOtherAIs() {
        for (const otherAI of this.game.ais) {
            if (otherAI !== this && otherAI.isAlive) {
                const distance = Math.sqrt((this.x - otherAI.x) ** 2 + (this.y - otherAI.y) ** 2);
                if (distance < 3 && !this.knownAIs.includes(otherAI.id)) {
                    this.knownAIs = this.knownAIs || [];
                    this.knownAIs.push(otherAI.id);
                    this.game.addLogEntry(`IA ${this.id + 1} descobriu IA ${otherAI.id + 1}!`, 'info');
                }
            }
        }
    }

    considerAlliances() {
        if (this.knownAIs && this.knownAIs.length > 0) {
            for (const aiId of this.knownAIs) {
                if (!this.alliances.includes(aiId) && !this.enemies.includes(aiId)) {
                    // Decidir se formar aliança baseado em recursos e proximidade
                    if (Math.random() < 0.3) {
                        this.alliances.push(aiId);
                        const otherAI = this.game.ais[aiId];
                        if (otherAI && !otherAI.alliances.includes(this.id)) {
                            otherAI.alliances.push(this.id);
                        }
                        this.game.addLogEntry(`IA ${this.id + 1} formou aliança com IA ${aiId + 1}!`, 'success');
                    }
                }
            }
        }
    }

    die() {
        this.isAlive = false;
        this.game.addLogEntry(`IA ${this.id + 1} morreu!`, 'error');
    }
}

// Inicializar jogo quando página carregar
window.addEventListener('load', () => {
    window.game = new Game();
});