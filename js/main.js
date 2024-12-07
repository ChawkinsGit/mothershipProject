class Ship {
    constructor(name, hp, attackPower, speed) {
        this.name = name;
        this.hp = hp;
        this.attackPower = attackPower;
        this.speed = speed
    }

    takeDamage(damage, opponentSpeed) {
        const hitChance = 1 - (opponentSpeed * 0.066) - 0.15
        if(Math.random() < hitChance) {
            this.hp = Math.max(this.hp - damage, 0);
           
         if(!this.isAlive()) { 
            return `${this.name} has been destroyed`
            
        } 
        return 'hit';
        } else{
            return 'miss'
        }
    }
    isAlive(){
        return this.hp > 0
    }
}

class LightShip extends Ship {
    constructor(name, health, attackPower, speed = 5) {
        super(name, health, attackPower);
        this.speed = speed
        this.dodgeChance = 0.15; // 15% chance to dodge
    }

    evade(opponentSpeed) {
        const speedDifference = this.speed - opponentSpeed;
        const evadeChance = this.dodgeChance + (speedDifference * 0.07); // increase evade chance based on speed difference

        return Math.random() < evadeChance;
    }

    takeDamage(damage, opponentSpeed) {
        if (!this.evade(opponentSpeed)) {
            return 'evaded'
        } else{
            return super.takeDamage(damage, opponentSpeed);
        }
    }
}

// HeavyShip Class
class HeavyShip extends Ship {
    constructor(name, health, attackPower, speed) {
        super(name, health, attackPower);
        this.speed = speed
    }
}
class Mothership extends Ship {
    constructor(name, health, attackPower, speed) {
        super(name, health, attackPower);
        this.speed = speed
    }
}
class Player{
    constructor(name) {
        this.name = name;
        this.mothership = new Ship("Mothership", 1000, 300, 1);
        this.lightships = new Ship("Lightships", 600, 100, 5);
        this.heavyships = new Ship("Heavyships", 600, 200, 3);
    }

    get randomShip() {
        return Math.random() < 0.5 ? this.lightships : this.heavyships;
    }
}

class Game {
    constructor() {
        this.player1 = new Player("Player 1");
        this.player2 = new Player("Player 2");
        this.currentPlayer = Math.random() < 0.5 ? this.player1 : this.player2;
        this.selectedPlayerShip = null;
        this.selectedTarget = null;
        this.pendingLogs = [];
        this.updateTurnIndicator();
        this.addEventListeners();
    }

    updateTurnIndicator() {
        document.getElementById("turnIndicator").textContent = this.currentPlayer.name;
    }

    // logAttack(attacker, target, damage) {
    //     const attackLog = document.getElementById("attackLog");
    //     const log = document.createElement("div");
    //     log.textContent = `${attacker.name} attacked ${target.name} for ${damage} damage!`;
    //     attackLog.appendChild(log);
    // }
    logAttack(attacker, target, damage, result) {
        const attackLog = document.getElementById("attackLog");
        const log = document.createElement("div");

        if (result === 'miss') {
            log.textContent = `${attacker.name} attacked ${target.name} but missed!`;
        }else if (result === "evaded") {
            log.textContent = `${attacker.name} attacked ${target.name}, but the attack was evaded!`;
        } else if (result === 'hit') {
            log.textContent = `${attacker.name} attacked ${target.name} for ${damage} damage!`;
        } else {
            // When the target is destroyed
            log.textContent = `${attacker.name} attacked ${target.name} for ${damage} damage! ${result}`;
        }
        

        attackLog.appendChild(log);
    }

    clearLog() {
        document.getElementById("attackLog").innerHTML = ""; // Clear previous log entries
    }

    endGame(winner) {
        document.getElementById("gameEndMessage").textContent = `${winner} wins!`;
        document.querySelectorAll(".ship, .targetBtn").forEach(btn => btn.disabled = true);
    }

    checkWinCondition() {
        const opponent = this.currentPlayer === this.player1 ? this.player2 : this.player1;
        if (opponent.mothership.hp <= 0 || (opponent.lightships.hp <= 0 && opponent.heavyships.hp <= 0)) {
            this.endGame(this.currentPlayer.name);
            return true;
        }
        return false;
    }

    mothershipAttackPhase(opponent) {
        // Clear log before appending new sequence
        this.clearLog();
        
        // Log both mothership attacks
        const attacker = this.currentPlayer.mothership;
        const defender = opponent.mothership;
        const mothershipAttackResult = defender.takeDamage(attacker.attackPower, attacker.speed)
        this.logAttack(attacker, defender, attacker.attackPower, mothershipAttackResult);
        
        if (this.checkWinCondition()) return;

        const randomTarget = opponent.randomShip;
        const randomTargetAttackResult = randomTarget.takeDamage(attacker.attackPower, attacker.speed);
        this.logAttack(attacker, randomTarget, attacker.attackPower, randomTargetAttackResult);
        

        // Log pending attack from selected ship, if any
        if (this.pendingLogs.length > 0) {
            this.pendingLogs.forEach(logFunc => {
                logFunc()
                console.log("Executing pending log:"); // Debug check
                console.log(this.pendingLogs); // Display the stored log
            });
            this.pendingLogs = []; // Clear after processing
        }

        this.updateDOM();
    }

    selectPlayerShip(shipType) {
        if (shipType === "lightships" || shipType === "heavyships") {
            this.selectedPlayerShip = shipType;
            document.querySelectorAll(".targetBtn").forEach(btn => btn.disabled = false);

            const attackLog = document.getElementById("attackLog");
            const selectionLog = document.createElement("div");
            selectionLog.textContent = `${this.currentPlayer.name} selected their ${shipType} to attack.`;
            attackLog.appendChild(selectionLog);
        } else {
            alert("Only lightships and heavyships can be selected for attack!");
        }
    }

    selectTarget(targetType) {
        if (!this.selectedPlayerShip) {
            alert("Please select one of your ships to attack with first!");
            return;
        }
    
        // Debugging: Log selectedPlayerShip and targetType
        console.log("Selected Player Ship:", this.selectedPlayerShip);
        console.log("Target Type:", targetType);
    
        this.selectedTarget = targetType;
        const opponent = this.currentPlayer === this.player1 ? this.player2 : this.player1;
        const targetShip = targetType === "lightships" ? opponent.lightships : opponent.heavyships;
    
        // Debugging: Log the opponent's ship details
        console.log("Target Ship Object:", targetShip);
    
        if (!targetShip) {
            alert(`Target ${targetType} does not exist!`);
            return;
        }
    
        const attacker = this.currentPlayer[this.selectedPlayerShip];
        const damage = attacker ? attacker.attackPower : null;
    
        // Debugging: Log attacker and damage values
        console.log("Attacker:", attacker);
        console.log("Damage:", damage);
    
        const attackResult = targetShip.takeDamage(damage, attacker.speed)
        if (!attacker || damage === null) {
            alert(`Selected attacker (${this.selectedPlayerShip}) is invalid!`);
            return;
        }
    
        if (targetShip instanceof LightShip) {
            targetShip.takeDamage(damage, attacker.speed);
        } else {
            targetShip.takeDamage(damage, attacker.speed);
        }
    
        // Add the log of the selected attack to the pending logs
        this.pendingLogs.push(() => {
            this.logAttack(attacker, targetShip, damage, attackResult);
        });
    
        if (this.checkWinCondition()) return;
    
        // Reset selection
        this.selectedPlayerShip = null;
        this.selectedTarget = null;
    
        // Switch turn to the next player
        this.switchTurn();
    }

    switchTurn() {
        this.currentPlayer = this.currentPlayer === this.player1 ? this.player2 : this.player1;
        this.selectedPlayerShip = null;
        this.selectedTarget = null;
        this.updateTurnIndicator();
        document.querySelectorAll(".targetBtn").forEach(btn => btn.disabled = true);
        this.mothershipAttackPhase(this.currentPlayer === this.player1 ? this.player2 : this.player1);
    }

    addEventListeners() {
        document.getElementById("p1Lightships").addEventListener("click", () => {
            if (this.currentPlayer === this.player1) this.selectPlayerShip("lightships");
        });
        document.getElementById("p1Heavyships").addEventListener("click", () => {
            if (this.currentPlayer === this.player1) this.selectPlayerShip("heavyships");
        });
        document.getElementById("p2Lightships").addEventListener("click", () => {
            if (this.currentPlayer === this.player2) this.selectPlayerShip("lightships");
        });
        document.getElementById("p2Heavyships").addEventListener("click", () => {
            if (this.currentPlayer === this.player2) this.selectPlayerShip("heavyships");
        });

        document.getElementById("targetLightship").addEventListener("click", () => this.selectTarget("lightships"));
        document.getElementById("targetHeavyship").addEventListener("click", () => this.selectTarget("heavyships"));
    }

    updateDOM() {
        document.getElementById("p1MothershipHp").textContent = this.player1.mothership.hp;
        document.getElementById("p1LightHp").textContent = this.player1.lightships.hp;
        document.getElementById("p1HeavyHp").textContent = this.player1.heavyships.hp;
        document.getElementById("p2MothershipHp").textContent = this.player2.mothership.hp;
        document.getElementById("p2LightHp").textContent = this.player2.lightships.hp;
        document.getElementById("p2HeavyHp").textContent = this.player2.heavyships.hp;
    }

    start() {
        this.mothershipAttackPhase(this.currentPlayer === this.player1 ? this.player2 : this.player1);
    }
}

const game = new Game();
game.start();
