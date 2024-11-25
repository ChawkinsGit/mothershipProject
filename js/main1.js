// CODE TO HIDE CONTENT AFTER CREATION OF MOTHERSHIPS
let player1 = null
let player2 = null
let mainShips = []
let subShips1 = []
let subShips2 = []
let motherships = {}
let results = document.querySelector('#subShip-results')
let results2 = document.querySelector('#subShip2-results')
let mainResults = document.querySelector('#mainShip-results')
let currentTurn = document.querySelector('#currentTurn')
let messageLogPlayer1 = [];
let messageLogPlayer2 = [];
//TURN SYSTEM

const game = (function() {
    let currentPlayer = Math.random() < 0.5 ? 'player1' : 'player2'

    function playerTurn() {
        const playerNum = currentPlayer.slice(-1) === '1' ? 1 : 2;
        const otherPlayer = currentPlayer.slice(-1) === '1' ? 2 : 1;

        const currentPlayerMothership = mainShips.find(ship => ship.shipNum === playerNum);
        const otherPlayerMothership = mainShips.find(ship => ship.shipNum === otherPlayer);
        currentTurn.innerHTML = `It is ${game.getCurrentPlayer().slice(-1) === playerNum.toString() ? currentPlayerMothership.name : otherPlayerMothership.name}'s turn`;


        if(checkGameOver(currentPlayerMothership)) {
            return;
        }

        // currentPlayerMothership.attackMother(otherPlayerMothership);
        currentPlayerMothership.attackOpponents(otherPlayerMothership);

        let selectedPlayerShip = null;
        let selectedOpponentShip = null;

        const currentPlayerButtons = document.querySelectorAll(`button[id^="p${playerNum}-"]`);
        const otherPlayerButtons = document.querySelectorAll(`button[id^="p${otherPlayer}-"]`);

        otherPlayerButtons.forEach(opButton => opButton.disabled = true)

        let playerHasSelectedShip = false;
        let opponentHasSelectedShip = false;

        currentPlayerButtons.forEach(button => {
            button.disabled = false;
            button.style.backgroundColor = 'lightblue'

            button.addEventListener('click', function playerShipSelection() {
                selectedPlayerShip = currentPlayerMothership.getShipFromButtonId(button.id);
                console.log('Selected Player Ship:', selectedPlayerShip);

                currentPlayerButtons.forEach(btn => btn.disabled = true);
                button.removeEventListener('click', playerShipSelection);

                otherPlayerButtons.forEach(opButton => opButton.disabled = false);
 
                playerHasSelectedShip = true;

                otherPlayerButtons.forEach(opButton => {
                    // opButton.disabled = false;

                    opButton.addEventListener('click', function opponentShipSelection() {
                        selectedOpponentShip = otherPlayerMothership.getShipFromButtonId(opButton.id);
                        console.log('Selected Opponent Ship:', selectedOpponentShip);

                        otherPlayerButtons.forEach(opBtn => opBtn.disabled = true);
                        opButton.removeEventListener('click', opponentShipSelection);

                        opponentHasSelectedShip = true;

                        currentPlayerMothership.performAttack(button.id, opButton.id, otherPlayerMothership);
                    
                    if(playerHasSelectedShip && opponentHasSelectedShip){
                        if (selectedOpponentShip.isAlive()) {
                            selectedPlayerShip = null;
                            selectedOpponentShip = null;
                            switchPlayer();
                            // currentTurn.innerHTML = `It is ${mainShips.shipNum === game.getCurrentPlayer().slice(-1) ? `${currentPlayerMothership.name}`: `${currentPlayerMothership.name}`}'s turn`
                            // currentTurn.innerHTML = `It is ${game.getCurrentPlayer().slice(-1) === playerNum.toString() ? currentPlayerMothership.name : otherPlayerMothership.name}'s turn`
                            playerTurn();
                        // }else if (!selectedOpponentShip.isAlive()) {
                        }else{
                            console.log(`${currentPlayerMothership.name} you have destroyed ${otherPlayerMothership.name}'s ${selectedOpponentShip.unitName}`)
                            playerTurn()
                        }
                    }
                    }, { once: true }); // Ensure the event listener is removed after execution
                });
            }, { once: true }); // Ensure the event listener is removed after execution
        });
    }

        function switchPlayer() {
            currentPlayer = currentPlayer === 'player1' ? 'player2' : 'player1';
            document.querySelectorAll('button').forEach(button => {
                button.style.backgroundColor = 'none';
            });
            return currentPlayer
        }
    /* CHECK IF GAME ENDS */
        function checkGameOver(currentPlayerObj) {
            const isAnyGroupDestroyed = Object.keys(currentPlayerObj.subordinates).some(groupName => {
                const shipsInGroup = currentPlayerObj.subordinates[groupName];
                return Object.values(shipsInGroup).every(ship => !ship.isAlive());
            });
            
            if(!currentPlayerObj.isAlive() && isAnyGroupDestroyed){
                const winningPlayer = currentPlayer === 'player1' ? 'player2' : 'player1';
                currentTurn.innerHTML = `${winningPlayer} wins`
                document.querySelectorAll('button').forEach(button => {
                    button.disabled = true;
                    button.style.backgroundColor = 'gray';
                });
                return true
            }
            return false
        }

        return {
            playerTurn,
            switchPlayer,
            getCurrentPlayer: () => currentPlayer
           
        };
    })();

document.getElementById('engage-btn').addEventListener('click', function() {
    let player1Name = document.getElementById('person1').value.trim();
    let player2Name = document.getElementById('person2').value.trim();
    document.querySelector('.p1-btn1').innerHTML = `${player1Name}`
    document.querySelector('.p2-btn1').innerHTML = `${player2Name}`
    
    // Check if both player names are entered
    if (player1Name !== '' && player2Name !== '') {
        //Create player objects
        player1 = new MotherShip(player1Name, 1, 'player1-info');
        player2 = new MotherShip(player2Name, 2, 'player2-info');
        mainShips = [player1, player2]
        subShips1 = [player1.subordinates.J, player1.subordinates.L]
        subShips2 = [player2.subordinates.J, player2.subordinates.L]

        

      // Hide player section
      document.getElementById('player-section').style.display = 'none';
      // Show grid container
      document.getElementById('grid-container').style.display = 'flex';
    //   document.getElementById('subShip-results').style.display = 'block'
    //   document.getElementById('mainShip-results').style.display = 'block'
    //   document.getElementById('subShip2-results').style.display = 'block'
      document.getElementById('currentTurn').style.display = 'block'
      //Display of DOM inputs and texts
      document.getElementById('player1-info').innerHTML = "<ul><br></ul>";
      document.getElementById('player2-info').innerHTML = "<ul><br></ul>"
    }
    game.playerTurn()
  });


class ShipLogs {
    constructor(domElementId) {
        this.domElementId = domElementId;
        this.currentAttackId = null; // ID for tracking current attack log entries
    }

    // Method to clear only the messages from the last attack
    clearLastAttackMessages() {
        const logElement = document.getElementById(this.domElementId);
        const previousMessages = logElement.querySelectorAll(`[data-attack-id="${this.currentAttackId}"]`);

        // Remove all elements with the old attack ID
        previousMessages.forEach(message => {
            logElement.removeChild(message);
        });
    }

    // Method to update the DOM with attack results (adding new messages) and tag them with an attack ID
    updatePlayerInfo(message) {
        const logElement = document.getElementById(this.domElementId);

        // Unique identifier for the current attack
        if (!this.currentAttackId) {
            this.currentAttackId = `attack-${Date.now()}`;
        }

        // Add the message as a new paragraph and tag it with the current attack ID
        const newMessage = document.createElement('p');
        newMessage.setAttribute('data-attack-id', this.currentAttackId);
        newMessage.innerHTML = `${message}<br>`;
        logElement.appendChild(newMessage);
    }

    // Start a new attack sequence (called at the beginning of each attack method)
    startNewAttack() {
        this.clearLastAttackMessages(); // Clear previous attack's messages
        this.currentAttackId = `attack-${Date.now()}`; // Assign a new ID for this attack
    }

}
  




class MotherShip extends ShipLogs{
    constructor(shipName, shipNum, domElementId){
        super(domElementId)
        this.name = shipName
        this.shipNum = shipNum
        this.damage = Weapons.laser
        this.speed = 1
        this.shield = Shield.highShield
        // this.subordinates1 = [new Juggernaut('J1', 1), new Juggernaut('J2', 2), new Juggernaut('J3', 3), new Juggernaut('J4', 4)]
        // this.subordinates2 = [new LightCruiser('LC1', 1), new LightCruiser('LC2', 2), new LightCruiser('LC3', 3), new LightCruiser('LC4', 4), new LightCruiser('LC5', 5), new LightCruiser('LC6', 6), new LightCruiser('LC7', 7), new LightCruiser('LC8', 8)]
        this.subordinates = {
            J: this.createSubordinate('Juggernaut', 4, Juggernaut),
            L: this.createSubordinate('LightCruiser', 8, LightCruiser)
        };
        this.domElementId = domElementId
        // this.subordinates.J.forEach(sub => sub.motherShipName = this.name);
        // this.subordinates.LC.forEach(sub => sub.motherShipName = this.name);
    }


    createSubordinate(type, total, SubordinateClass) {
        const subordinates = {};
        for (let i = 1; i <= total; i++) {
            const unitName = `${type[0]}${i}`;
            subordinates[unitName] = new SubordinateClass(unitName, this.domElementId);
        }
        return subordinates;
    }

    getShip(type, index) {
        const ship = this.subordinates[type][`${type}${index}`];
        return ship
    }

    getShipFromButtonId(buttonId) {
        const shipTypeWithIndex = buttonId.split('-')[1];
        const shipType = shipTypeWithIndex.charAt(0);
        const shipIndex = shipTypeWithIndex.slice(1);
        return this.getShip(shipType, shipIndex);
    }

    performAttack(attackerButtonId, defenderButtonId, opponentMotherShip) {
        this.startNewAttack()
        const attacker = this.getShipFromButtonId(attackerButtonId);
        const defender = opponentMotherShip.getShipFromButtonId(defenderButtonId);

        const damage = attacker.damage;
        const hitChance = 1 - (defender.speed * 0.066) - 0.15;
        let message = '';

        if (Math.random() < hitChance) {
            if (defender instanceof LightCruiser && defender.evade(attacker.speed)) {
                message = `${this.name}'s ${attacker.unitName} attacks ${defender.unitName} but the attack is evaded. Remaining shield: ${defender.shield < 0 ? 0 : defender.shield}`;
            } else {
                defender.receiveDamage(damage, this, opponentMotherShip);
            }
        } else {
            message = `${this.name}'s ${attacker.unitName} attacks ${defender.unitName} but misses. Remaining shield: ${defender.shield < 0 ? 0 : defender.shield}`;
        }

        this.updatePlayerInfo(message); // Display the message for the current player
    }

    // attackMother(opponentMotherShip) {
    //     // this.startNewAttack()
    //     const damage = this.damage;
    //     const hitChance = 1 - (opponentMotherShip.speed *.066) - .15
       
    //     let message = '';

    //     if (Math.random() < hitChance) {
    //         if (opponentMotherShip instanceof LightCruiser && opponentMotherShip.evade(this.speed)) {
    //             message = `${this.name} attacks ${opponentMotherShip.name} but the attack is evaded. Remaining shield: ${opponentMotherShip.shield < 0 ? 0 : opponentMotherShip.shield}`;
    //         } else {
    //             opponentMotherShip.shield -= damage;
    //             message = `${this.name} attacks ${opponentMotherShip.name} and deals ${damage} damage. Remaining shield: ${opponentMotherShip.shield < 0 ? 0 : opponentMotherShip.shield}`;
    //         }
    //     } else {
    //         message = `${this.name} attacks ${opponentMotherShip.name} but misses. Remaining shield: ${opponentMotherShip.shield < 0 ? 0 : opponentMotherShip.shield}`;
    //     }

    //     this.updatePlayerInfo(message); // Display the message for the current player
    // }
    
    attackOpponents(opponentMotherShip) {
        this.startNewAttack(); // Start a new attack sequence (clears old messages)

        const motherShipDamage = this.damage;
        const hitChanceForMotherShip = 1 - (opponentMotherShip.speed * 0.066) - 0.15;
        let motherShipMessage = '';

        // First attack on the opponent's MotherShip
        if (Math.random() < hitChanceForMotherShip) {
            if (opponentMotherShip instanceof LightCruiser && opponentMotherShip.evade(this.speed)) {
                motherShipMessage = `${this.name} attacks ${opponentMotherShip.name} but the attack is evaded, leaving remaining defenses to be ${opponentMotherShip.shield < 0 ? 0 : opponentMotherShip.shield} hp`;
            } else {
                opponentMotherShip.shield -= motherShipDamage;
                motherShipMessage = `${this.name} attacks ${opponentMotherShip.name} dealing ${motherShipDamage} damage, leaving remaining defenses to be ${opponentMotherShip.shield < 0 ? 0 : opponentMotherShip.shield} hp`;
            }
        } else {
            motherShipMessage = `${this.name} attacks ${opponentMotherShip.name} but misses, leaving remaining defenses to be ${opponentMotherShip.shield < 0 ? 0 : opponentMotherShip.shield} hp`;
        }

        // Second attack on a random subordinate ship
        const shipTypes = Object.keys(opponentMotherShip.subordinates);
        const randomShipType = shipTypes[Math.floor(Math.random() * shipTypes.length)];
        const subordinatesOfType = Object.values(opponentMotherShip.subordinates[randomShipType]);
        const randomSubordinate = subordinatesOfType[Math.floor(Math.random() * subordinatesOfType.length)];
        const subShipDamage = this.damage;
        const hitChanceForSubShip = 1 - (randomSubordinate.speed * 0.066) - 0.15;
        let subShipMessage = '';

        if (Math.random() < hitChanceForSubShip) {
            if (randomSubordinate instanceof LightCruiser && randomSubordinate.evade(this.speed)) {
                subShipMessage = ` but the attack on ${randomSubordinate.unitName} is evaded, leaving remaining defenses to be ${randomSubordinate.shield < 0 ? 0 : randomSubordinate.shield} hp`;
            } else {
                randomSubordinate.receiveDamage(subShipDamage, this, opponentMotherShip);
                subShipMessage = ` and also attacks ${opponentMotherShip.name}'s ${randomSubordinate.unitName} dealing ${subShipDamage} damage, leaving remaining defenses to be ${randomSubordinate.shield < 0 ? 0 : randomSubordinate.shield} hp`;
            }
        } else {
            subShipMessage = ` but misses the opponent's ${randomSubordinate.unitName}, leaving remaining defenses to be ${randomSubordinate.shield < 0 ? 0 : randomSubordinate.shield} hp`;
        }

        // Combine the messages
        const combinedMessage = motherShipMessage + subShipMessage;

        // Update player info with the combined message
        this.updatePlayerInfo(combinedMessage);

    }

    isAlive() {
        return this.shield > 0
    }
}

/* Subclass, SpaceShip, with the types of juggernaut and lightCruiser */
class Subordinate extends ShipLogs{
    constructor(type, unitName, domElementId) {
        super(domElementId)
        this.type = type;
        this.unitName = unitName;
        this.shield = 100; // default shield value, can be overridden in subclasses
        this.damage = 10; // default damage value, can be overridden in subclasses
    }
    receiveDamage(damage, attacker, opponent) {
        this.shield -= damage;
        let message = `${attacker.name} attacks ${opponent.name}'s ${this.unitName} and deals ${damage} damage, leaving remaining defenses to be ${this.shield < 0 ? 0 : this.shield} hp`

        return message
    }

    isAlive() {
        return this.shield > 0
    }
}
/* Juggernaut Class, speed, miss mechanic, damage*/

class Juggernaut extends Subordinate{
    constructor(unitName, domElementId) {
        super('Juggernaut', unitName, domElementId)
        this.speed = 2.5
        this.damage = Weapons.kineticEnergy
        this.shield = Shield.midShield
    }
    
}

/* Light Cruiser Class, speed, dodge mechanic, miss mechanic, damage */
class LightCruiser extends Subordinate{
    constructor(unitName, domElementId) {
        super('LightCruiser', unitName, domElementId)
        this.speed = 5
        this.damage = Weapons.pulse
        this.shield = Shield.basicShield
    }


    evade(attackerSpeed) {
        const speedDifference = this.speed - attackerSpeed;
        const baseEvadeChance = 0.15; // base evade chance, e.g., 15%
        const evadeChance = baseEvadeChance + (speedDifference * 0.07); // increase evade chance based on speed difference

        return Math.random() < evadeChance;
    }

} 

/* Armament Class, Weapons, Shield, exclusivity */
class Weapons{
    static laser = 350
    static kineticEnergy = 75
    static pulse = 85
      constructor() {
        
      }
}
class Shield {
    static highShield = 1000
    static midShield = 450
    static basicShield = 200
      constructor() {
        
      }
}
