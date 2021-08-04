chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if(!document.getElementById("bladechance")){
        var container = document.createElement("div");
        document.getElementsByClassName("weapon-selection")[0].appendChild(container);
        container.setAttribute("id", "bladechance");
        container.innerHTML="Hover over weapon to calculate";
    }
    

    document.getElementsByClassName("weapon-icon")[0].addEventListener("mouseover", (event) =>{
        
        var enemies = getEnemies();
        var weapon = getWeapon();
        var character = getCharacter(weapon);
        
        this.generateUI(character, weapon, enemies);
        this.compute(character, weapon, enemies);
    });
});


function getEnemies() {
    var encounters = document.getElementsByClassName("encounter-container");
    var elements = ["fire", "water", "earth", "lightning"];
    var enemies = [];
    for (var i =0; i<encounters.length; i++){
        var encounter=encounters[i];
        var elementHTML = encounter.getElementsByClassName("encounter-element")[0].innerHTML;
        var powerString = encounter.getElementsByClassName("encounter-power")[0].innerHTML.split(" ");
        var power;
        for (var j = 0; j<powerString.length; j++){
            power = parseInt(powerString[j])
            if (power > 0){
                break
            } 
        }
        for (var j = 0; j<elements.length; j++) {
            var e = elements[j];
            if(elementHTML.includes(e)){
                element = e;
                break;
            }
        }
        var min = Math.ceil(power*0.9);
        var max = Math.floor(power*1.1);
        enemies.push({"power":power, "trait":element, "min": min, "max": max});
    }
    return enemies;
}

function getCharacter(weapon) {
    var character = {};
    character.power = getCharacterPower();
    character.trait = getCharacterTrait();
    character.totalPower = (character.power*weapon.powerMultiplier) + weapon.bonusPower;
    character.min = Math.ceil(character.totalPower*0.9);
    character.max = Math.floor(character.totalPower*1.1);
    return character;
}

function getCharacterPower(){
    var character = document.querySelector('.subtext.subtext-stats');
    for(var i=0; i<character.childElementCount; i++){
        var child = character.children[i].innerHTML;
        if(!child.includes(",")){
            continue;
        }
        var power = parseInt(child.replaceAll(',', ''));
        if(power > 0){
            return power;
        }
    }
}

function getCharacterTrait() {
    var character = document.getElementsByClassName("character-name")[0].innerHTML; 
    var elements = ["fire", "water", "earth", "lightning"];
    for(var i=0; i<elements.length; i++){
        if(character.includes(elements[i])){
            return elements[i];
        }
    }
}

function getWeapon() {
    var weapon = document.getElementsByClassName("weapon-icon")[0];
   
    var trait = weapon.getElementsByClassName("trait")[0].innerHTML;
    var elements = ["fire", "water", "earth", "lightning", "PWR"];
    for(var i=0; i<elements.length; i++){
        if(trait.includes(elements[i])){
            trait = elements[i];
            break;
        }
    }
    var stats = weapon.getElementsByClassName("stats")[0];
    var elestats = ["STR", "INT", "DEX", "CHA", "PWR"];
    var s = [];
    for(var i=0; i<stats.childElementCount; i++){
        var stat = stats.children[i];
        for (var j=0; j<stat.childElementCount; j ++){
            var substat = stat.children[j].innerHTML;
            for(var k=0; k<elements.length; k++){
                if(substat.includes(elestats[k])){
                    var words = substat.split(" ");
                    s.push({"trait":elements[k], "power":parseInt(words[1])});
                    break;
                }
            }
        }
    }
    var weapon = {"trait": trait, "substats": s, "bonusPower": getWeaponBonus()};
    weapon.powerMultiplier = getWeaponPower(weapon);
    return weapon;
}

function getWeaponPower(weapon) {
    let powerPerPoint = 0.0025;
    let matchingPowerPerPoint = powerPerPoint * 1.07;
    let traitlessPowerPerPoint = powerPerPoint * 1.03;
    let result = 1;
    for (var i = 0; i<weapon.substats.length; i++){
        var substat=weapon.substats[i];
        if (substat.trait == weapon.trait){
            result += substat.power*matchingPowerPerPoint;
        } else if (substat.trait === "PWR") {
            result += substat.power*traitlessPowerPerPoint;
        } else {
            result += substat.power*powerPerPoint
        }
    }
    return result;
}

function getWeaponBonus(){
    var bonusPower = 0;
    var tt = document.getElementsByClassName("tooltip-inner");
    for(var i=0; i<tt.length; i++){
        if (tt[i].innerHTML.includes("Bonus")){
            var words = tt[i].innerHTML.split(" ");
            bonusPower = parseInt(words[words.length-1]);
            break;
        }
    }
    return bonusPower;
}

function isTraitEffectiveAgainst(trait1, trait2) {
    if (trait1 == "fire" && trait2 == "earth") return true;
    if (trait1 == "water" && trait2 == "fire") return true;
    if (trait1 == "lightning" && trait2 == "water") return true;
    if (trait1 == "earth" && trait2 == "lightning") return true;
    return false;
}

function isTraitWeakAgainst(trait1, trait2) {
    if (trait1 == "fire" && trait2 == "water") return true;
    if (trait1 == "water" && trait2 == "lightning") return true;
    if (trait1 == "lightning" && trait2 == "earth") return true;
    if (trait1 == "earth" && trait2 == "fire") return true;
    return false;
}
function traitBonus(characterTrait, weaponTrait, monsterTrait) {
    let bonus = 1;
    let oneBonus = 0.075;

    if (characterTrait == weaponTrait) bonus = bonus + oneBonus;
    if (isTraitEffectiveAgainst(characterTrait, monsterTrait)) bonus = bonus + oneBonus;
    if (isTraitWeakAgainst(characterTrait, monsterTrait)) bonus = bonus - oneBonus;
    return bonus;
}

function getRandom10(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//https://wax-dapps.site/crypto-blades/combat
function compute(character, weapon, enemies) {
    var domelements = document.getElementsByClassName("victory-chance");
    for(var i =0; i<enemies.length; i++) {
        var enemy = enemies[i];
        let tBonus = traitBonus(character.trait, weapon.trait, enemy.trait);
        if (character.min*tBonus > enemy.max) {
            domelements[i].innerHTML = "!100% Win Chance!";
        } else {
            let won = 0;
            let loop = 1000;
            for (let index = 0; index < loop; index++) {
                randomHeroPower = getRandom10(character.min, character.max) * tBonus;
                randomEnemyPower = getRandom10(enemy.min, enemy.max);
                if(randomHeroPower >= randomEnemyPower) won++;
            }
            var chance = (Math.min((won/loop),0.9999)*100).toFixed(2);
            domelements[i].innerHTML = chance + "% Win Chance";
        }
    }
}

function generateUI(character, weapon, enemies){
    var content = "<p>Hover over weapon to reroll.";
    content += "</br>Review to make sure I read your stats right.</p>";
    content += "Character:<ul>";
    content += "<li>Power: " + character.power+"</li>";
    content += "<li>Trait: " + character.trait+"</li></ul>";

    content += "Weapon:<ul>";
    content += "<li>Bonus power: " + weapon.bonusPower+"</li>";
    content += "<li>Trait: " + weapon.trait+"</li>";
    
    for(var i=0; i<weapon.substats.length; i++) {
        var sub = weapon.substats[i];
        content += "<li> stat " + (i+1) + ": " + sub.trait + " +" + sub.power+"</li>";
    }
    content += "<li>Power multiplier: " + weapon.powerMultiplier+"</li></ul>";

    content += "Total power: " + character.totalPower.toFixed(2) + "<ul>";
    var elements = ["fire", "water", "earth", "lightning"];
    for(var i=0; i<elements.length; i++) {
        var trait = elements[i];
        let tBonus = traitBonus(character.trait, weapon.trait, trait);
        content += "<li>vs "+ trait + ": "+Math.floor(character.min*tBonus)+"-"+Math.ceil(character.max*tBonus)+"</li>";
    }
    
    content += "</ul>Enemies:<ol>";
    for(var i=0; i<enemies.length; i++) {
        var enemy = enemies[i];
        content += "<li>"+ enemy.power+ " " + enemy.trait + " ("+enemy.min+"-"+enemy.max+")</li>";
    }
    content += "</ol>";
    document.getElementById("bladechance").innerHTML = content;
}