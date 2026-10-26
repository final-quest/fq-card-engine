
import Damage from "../../domain/engine/roll/damage.js";
import TradingCards, {
    registerDeckRebuildRunner,
    registerDeckRebuiltBroadcaster
} from "../../domain/trading/trading-cards.js";
import Minion from "../../domain/engine/shared/minion.js";
import ObjectUtils from "../../core/utils/object.utils.js";
import TokenHud from "../../domain/interface/token-hud.js";
import PlayCard from "../../domain/engine/play-card.js";
import {showDeckShuffledAlert} from "../../core/utils/dialog.utils.js";
import ResultWindow from "../../domain/interface/window/result-window.js";
import {registerResultBroadcaster} from "../../domain/engine/roll/result-presenter.js";
import ZoneWall from "../../domain/engine/shared/zone-wall.js";
import Fx from "../../domain/engine/shared/fx.js";

/**
 * Instance socketlib du module, initialisée au hook `socketlib.ready`.
 * Permet d'exécuter côté MJ (ou côté joueur cible) les opérations nécessitant des
 * droits particuliers : application de dégâts/soins, pioche, création d'acteurs,
 * gestion des decks et suppression de tokens.
 *
 * @type {object|undefined}
 */
export let socket;
Hooks.once("socketlib.ready", () => {
    socket = socketlib.registerModule(FqCardEngineModule.moduleName);
    socket.register("addEffectForTarget", Damage.addEffectForTarget);
    socket.register("removeEffectForTarget", Damage.removeEffectForTarget);
    socket.register("consumeAttackEffects", Damage.consumeAttackEffects);
    socket.register("drawCard", TradingCards.drawCard);
    socket.register("applyActorHpModification", Damage.applyActorHpModification);
    socket.register("logCardPlayed", PlayCard.logCardPlayed);
    socket.register("createActorFromData", Damage.createActorFromData);
    socket.register("createTempFold", Minion.createTempFold);
    socket.register("getRandomFileFromFolder", ObjectUtils.getRandomFileFromFolder);
    socket.register("updateDeckForUser", TradingCards.updateDeckForUser);
    socket.register("deleteDeckForUser", TradingCards.deleteDeckForUser);
    socket.register("deleteToken", TokenHud.deleteToken);
    socket.register("deckShuffledAlert", showDeckShuffledAlert);
    socket.register("passCards", TradingCards.passCards);
    socket.register("createZoneWalls", ZoneWall.createZoneWalls);
    // N'écrit rien : rejoue chez chaque client le signal de fin de
    // reconstruction des decks, que seul le client reconstructeur connaît.
    socket.register("deckRebuilt", userId => Hooks.callAll("fq-card-engine.deckRebuilt", userId));
    // Le clignotement de dégâts se joue dans le canvas de CHAQUE client : il ne
    // passe pas par le document du token, qui en persisterait l'opacité basse.
    socket.register("blinkToken", Fx.blinkToken);
    // Le résultat s’affiche chez TOUT LE MONDE : sans chat animé ni dés 3D, un
    // spectateur privé de cette fenêtre ne verrait plus rien du jet, seulement
    // des barres de vie qui tombent sans explication.
    socket.register("showResultWindow", report => {
        // Pas d’attente : seul le client du lanceur retient l’application des
        // dégâts sur son animation, les autres ne font que regarder.
        ResultWindow.present(report);
    });
    // La reconstruction des decks crée et détruit des documents `Cards` du
    // monde : elle est menée par le MJ, et par lui seul, pour qu'un joueur sans
    // droit de création n'échoue pas à mi-chemin et que deux clients ne se
    // disputent pas la suppression du grimoire.
    registerDeckRebuildRunner(userId => socket.executeAsGM("updateDeckForUser", userId));
    // Le signal de fin repart vers TOUS les clients, le reconstructeur compris :
    // le grimoire du déclencheur de l'advancement s'ouvre dessus et les barres
    // de main s'y rafraîchissent, chacun chez lui.
    registerDeckRebuiltBroadcaster(userId => socket.executeForEveryone("deckRebuilt", userId));
    registerResultBroadcaster(report => {
        socket.executeForOthers("showResultWindow",
            {...report, speed: ResultWindow.speed, pauseSpeed: ResultWindow.pauseSpeed});
    });
});
