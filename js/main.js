let player1Name = document.getElementById('person1')
let player2Name = document.getElementById('person2')
const engage = document.getElementById("engage-btn")
class Ship {
    constructor(name, hp, attackPower, speed, owner) {
        this.name = name;
        this.hp = hp;
        this.attackPower = attackPower;
        this.speed = speed
        this.owner = owner
        this.destroyed = false
    }

    takeDamage(damage, opponentSpeed) {
        const hitChance = 1 - (opponentSpeed * 0.066) - 0.15;
        if (Math.random() < hitChance) {
            const effectiveDamage = Math.min(damage, this.hp); // Damage dealt can't exceed remaining HP
            this.hp = Math.max(this.hp - damage, 0);
    
            if (!this.isAlive() && !this.destroyed) {
                this.destroyed = true; // Mark the ship as destroyed
                return { 
                    status: 'destroyed', 
                    message: `${this.name} has been destroyed after taking ${effectiveDamage} damage.`,
                    damage: effectiveDamage 
                };
            }
    
            return { 
                status: 'hit', 
                message: `${this.name} took ${effectiveDamage} damage.`,
                damage: effectiveDamage 
            };
        } else {
            return { status: 'miss', message: `${this.name} evaded the attack!`, damage: 0 };
        }
    }
    isAlive(){
        return this.hp > 0
    }
}

class LightShip extends Ship {
    constructor(name, health, attackPower, speed = 10) {
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
        this.mothership = new Ship("Mothership", 1500, 350, 2, this);
        this.lightships = new Ship("Lightships", 1600, 175, 8, this);
        this.heavyships = new Ship("Heavyships", 1400, 250, 4, this);
    }

    get randomShip() {
        return Math.random() < 0.5 ? this.lightships : this.heavyships;
    }
}

class Game {
    constructor(player1Name, player2Name) {
        console.log("Received player names:", player1Name, player2Name)
        this.player1 = new Player(player1Name);
        this.player2 = new Player(player2Name);
        this.currentPlayer = Math.random() < 0.5 ? this.player1 : this.player2;
        this.selectedPlayerShip = null;
        this.selectedTarget = null;
        this.pendingLogs = [];
        this.updateTurnIndicator();
        this.addEventListeners();
    }
   

    updateTurnIndicator() {
        document.getElementById("turnIndicator").textContent = this.currentPlayer.name;
    
        const isPlayer1Turn = this.currentPlayer === this.player1;
        document.getElementById("p1Lightships").disabled = !isPlayer1Turn;
        document.getElementById("p1Heavyships").disabled = !isPlayer1Turn;
        document.getElementById("p2Lightships").disabled = isPlayer1Turn;
        document.getElementById("p2Heavyships").disabled = isPlayer1Turn;
    }

    // logAttack(attacker, target, damage) {
    //     const attackLog = document.getElementById("attackLog");
    //     const log = document.createElement("div");
    //     log.textContent = `${attacker.name} attacked ${target.name} for ${damage} damage!`;
    //     attackLog.appendChild(log);
    // }
    logAttack(attacker, target, result) {
        const attackLog = document.getElementById("attackLog");
        const log = document.createElement("div");
        log.className = "log-entry"
        const attackerPlayer = attacker.owner.name;
        const targetPlayer = target.owner.name;
        log.textContent = `${attackerPlayer}'s ${attacker.name} attacked ${targetPlayer}'s ${target.name}: ${result}`;
      
            if (attackLog.firstChild) {
                attackLog.insertBefore(log, attackLog.firstChild);
            } else {
                attackLog.appendChild(log);
            }
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
        if(!defender.destroyed){
            const mothershipAttackResult = defender.takeDamage(attacker.attackPower, attacker.speed)
            this.logAttack(attacker, defender, mothershipAttackResult.message);
        }


        const randomTarget = opponent.randomShip;
        if(!randomTarget.destroyed) {
            const randomTargetAttackResult = randomTarget.takeDamage(attacker.attackPower, attacker.speed);
            this.logAttack(attacker, randomTarget, randomTargetAttackResult.message);
        }
        
        if (this.checkWinCondition()) return;

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
    
        if (targetShip.destroyed) {
            alert(`The ${targetType} has already been destroyed! Please select another target.`);
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
            this.logAttack(attacker, targetShip, attackResult.message);
        });
    
        if (this.checkWinCondition()) return;
    
        // Reset selection
        this.selectedPlayerShip = null;
        this.selectedTarget = null;
    
        // Switch turn to the next player
        this.switchTurn();
    }

    switchTurn() {
        //ADJUST THIS METHOD NEXT
        this.currentPlayer = this.currentPlayer === this.player1 ? this.player2 : this.player1;
        this.selectedPlayerShip = null;
        this.selectedTarget = null;

        this.updateTurnIndicator();
        const opponent = this.currentPlayer === this.player1 ? this.player2 : this.player1;
        
        const playerLightButton = document.getElementById(this.currentPlayer === this.player1 ? "p1Lightships" : "p2Lightships");
        const playerHeavyButton = document.getElementById(this.currentPlayer === this.player1 ? "p1Heavyships" : "p2Heavyships");

        playerLightButton.disabled = this.currentPlayer.lightships.destroyed;
        playerHeavyButton.disabled = this.currentPlayer.heavyships.destroyed;

        // Disable target buttons for destroyed ships
        document.getElementById("targetLightship").disabled = opponent.lightships.destroyed;
        document.getElementById("targetHeavyship").disabled = opponent.heavyships.destroyed;

        this.mothershipAttackPhase(opponent);
    }


    addEventListeners() {
        // Player 1's ships
        document.getElementById("p1Lightships").addEventListener("click", () => {
            if (this.currentPlayer === this.player1) {
                this.selectPlayerShip("lightships");
            } else {
                alert("It's not your turn! Wait for your turn to select your ships.");
            }
        });
    
        document.getElementById("p1Heavyships").addEventListener("click", () => {
            if (this.currentPlayer === this.player1) {
                this.selectPlayerShip("heavyships");
            } else {
                alert("It's not your turn! Wait for your turn to select your ships.");
            }
        });
    
        // Player 2's ships
        document.getElementById("p2Lightships").addEventListener("click", () => {
            if (this.currentPlayer === this.player2) {
                this.selectPlayerShip("lightships");
            } else {
                alert("It's not your turn! Wait for your turn to select your ships.");
            }
        });
    
        document.getElementById("p2Heavyships").addEventListener("click", () => {
            if (this.currentPlayer === this.player2) {
                this.selectPlayerShip("heavyships");
            } else {
                alert("It's not your turn! Wait for your turn to select your ships.");
            }
        });
        
        document.getElementById("p1Mothership").addEventListener("click", () => {
            alert("The mothership acts automatically and cannot be selected for actions.");
        });
    
        document.getElementById("p2Mothership").addEventListener("click", () => {
            alert("The mothership acts automatically and cannot be selected for actions.");
        });

        document.getElementById("targetLightship").addEventListener("click", () => this.selectTarget("lightships"));
        document.getElementById("targetHeavyship").addEventListener("click", () => this.selectTarget("heavyships"));
    }

    updateDOM() {
        const updateShip = (ship, hpElementId, buttonID) => {
            const hpElement = document.getElementById(hpElementId);
            const buttonElement = document.getElementById(buttonID)
            console.log(document.querySelector(`#${hpElementId}`));
            hpElement.textContent = ship.hp;
    
            // Disable or gray out destroyed ships
            if (ship.destroyed) {
                const parentElement = hpElement.closest(".ship");
                if (parentElement) {
                    parentElement.classList.add("destroyed");
                }
                if (buttonElement) {
                    buttonElement.disabled = true; // Disable the button for selecting this ship
                }
            } else if (buttonElement) {
                buttonElement.disabled = false; // Re-enable button if the ship is alive
            }
        };
    
        updateShip(this.player1.mothership, "p1MothershipHp", null);
        updateShip(this.player1.lightships, "p1LightHp", "p1Lightships");
        updateShip(this.player1.heavyships, "p1HeavyHp", "p1Heavyships");
        updateShip(this.player2.mothership, "p2MothershipHp", null); 
        updateShip(this.player2.lightships, "p2LightHp", "p2Lightships");
        updateShip(this.player2.heavyships, "p2HeavyHp", "p2Heavyships");
    }

    start() {
        this.mothershipAttackPhase(this.currentPlayer === this.player1 ? this.player2 : this.player1);
    }
}


// const game = new Game(player1Name, player2Name);

document.addEventListener('DOMContentLoaded', () => {
    const mothership = document.getElementById("p1Mothership")
    if(mothership) {
        mothership.addEventListener('click', () =>{
            console.log("Mothership clicked!")
        });
    }else {
        console.error("Mothership element not found")
    }
    engage.addEventListener('click', () =>{
        const p1Name = player1Name.value.trim()
        const p2Name = player2Name.value.trim()


        if (player1Name === '' || player2Name === '') {
            alert("Please enter names for both players!");
            return;
        }
        
        // Check if both player names are entered
        if (player1Name !== '' && player2Name !== '') {
            document.getElementById('player1').textContent = p1Name;
            document.getElementById('player2').textContent = p2Name;
        // Hide player section
            document.getElementById('player-section').style.display = 'none';
            document.getElementById('game').style.display = 'flex'
            const game = new Game(p1Name, p2Name);
            game.start()
        }
        

    });
})
// UI display when button selected for actions that do nothing
//start button
//turn order oldest info should be at the top
//restrict player from clicking the same ship to attack more than once
//buttons should change color when selected for attack
//reset or play new game button
// Tinker with lightship evading and dodging chances


/*main.js:110 Uncaught TypeError: Cannot set properties of null (setting 'disabled')
at Game.updateTurnIndicator (main.js:110:58)
at new Game (main.js:101:14)
at HTMLButtonElement.<anonymous> (main.js:393:26)
FIGURE OUT why the game will not run from here.
*/