import {afterEach, beforeEach, describe, expect, it} from "vitest";
import HitPointsGuard from "../../src/domain/system/actors/hit-points-guard.js";

let previousPlayerLimitCardsRight;

beforeEach(() => {
    previousPlayerLimitCardsRight = CONFIG.FqCardEngine.options.playerLimitCardsRight;
    // Cas par défaut des suites : un joueur (game.user.isGM absent du socle de
    // tests/setup.js) sous « Limitation des droits du joueur ».
    CONFIG.FqCardEngine.options.playerLimitCardsRight = true;
});

afterEach(() => {
    CONFIG.FqCardEngine.options.playerLimitCardsRight = previousPlayerLimitCardsRight;
});

/**
 * Construit un item de classe brut tel que l'AdvancementManager le passe au
 * hook : `system.advancement` est un enregistrement indexé par identifiant.
 *
 * @param {object}  options
 * @param {string}  [options.id]           Identifiant de l'item.
 * @param {string}  [options.name]         Nom de la classe.
 * @param {string}  [options.denomination] Dénomination du dé de vie.
 * @param {object}  [options.value]        PV par niveau de l'avancement.
 * @param {string}  [options.advancementId] Identifiant de l'avancement.
 * @returns {object} Les données brutes de l'item.
 */
function classItem({
    id = "class-1", name = "Moine", denomination = "d8", value = {}, advancementId = "adv-1"
} = {}) {
    return {
        _id: id,
        name,
        type: "class",
        system: {
            hd: {denomination},
            advancement: {
                [advancementId]: {_id: advancementId, type: "HitPoints", configuration: {}, value},
                "adv-grant": {_id: "adv-grant", type: "ItemGrant", level: 1, value: {}}
            }
        }
    };
}

/**
 * Acteur minimal portant un historique de PV déjà enregistré pour l'avancement.
 *
 * @param {object} valuesByItem PV par niveau, indexés par identifiant d'item.
 * @param {string} [advancementId] Identifiant de l'avancement porteur.
 * @returns {object} L'acteur mocké.
 */
function actorWith(valuesByItem, advancementId = "adv-1") {
    return {
        items: {
            get: id => (id in valuesByItem)
                ? {_source: {system: {advancement: {[advancementId]: {_id: advancementId, value: valuesByItem[id]}}}}}
                : undefined
        }
    };
}

describe("system/hit-points-guard — champ d'application des verrous", () => {

    it("s'applique à un joueur sous limitation des droits", () => {
        expect(HitPointsGuard.applies()).toBe(true);
    });

    it("ne s'applique pas au MJ, même sous limitation des droits", () => {
        game.user.isGM = true;
        expect(HitPointsGuard.applies()).toBe(false);
    });

    it("ne s'applique pas hors limitation des droits", () => {
        CONFIG.FqCardEngine.options.playerLimitCardsRight = false;
        expect(HitPointsGuard.applies()).toBe(false);
    });
});

describe("system/hit-points-guard — verrou du champ de saisie", () => {

    /**
     * Rendu du flux d'avancement contenant le champ de saisie du jet.
     *
     * @param {boolean} [withInput] False pour un rendu sans champ (moyenne prise).
     * @returns {HTMLElement} La racine du rendu.
     */
    function flowElement(withInput = true) {
        const root = document.createElement("div");
        if (withInput) root.innerHTML = "<input class='roll-result' type='number' name='value' value='5'>";
        return root;
    }

    it("passe le champ en lecture seule et l'explique par une infobulle", () => {
        const element = flowElement();

        HitPointsGuard.lockRollInput({}, element);

        const input = element.querySelector("input.roll-result");
        expect(input.readOnly).toBe(true);
        expect(input.dataset.tooltip).toBe("FQCARDENGINE.HitPointsRollLocked");
    });

    it("laisse le champ libre au MJ", () => {
        game.user.isGM = true;
        const element = flowElement();

        HitPointsGuard.lockRollInput({}, element);

        expect(element.querySelector("input.roll-result").readOnly).toBe(false);
    });

    it("laisse le champ libre hors limitation des droits", () => {
        CONFIG.FqCardEngine.options.playerLimitCardsRight = false;
        const element = flowElement();

        HitPointsGuard.lockRollInput({}, element);

        expect(element.querySelector("input.roll-result").readOnly).toBe(false);
    });

    it("ne plante ni sans champ de saisie ni sans rendu", () => {
        expect(() => HitPointsGuard.lockRollInput({}, flowElement(false))).not.toThrow();
        expect(() => HitPointsGuard.lockRollInput({}, undefined)).not.toThrow();
    });
});

describe("system/hit-points-guard — contrôle de plage à la validation", () => {

    it("laisse passer un jet dans la plage du dé de vie", () => {
        const item = classItem({value: {1: "max", 2: 7}});

        const refused = HitPointsGuard.validateRolledHitPoints({actor: actorWith({})}, {}, [], [item]);

        expect(refused).toBeUndefined();
        expect(ui.notifications.error).not.toHaveBeenCalled();
    });

    it("laisse passer la moyenne et le maximum, qui ne sont pas des saisies", () => {
        const item = classItem({value: {1: "max", 2: "avg", 3: "avg"}});

        expect(HitPointsGuard.validateRolledHitPoints({actor: actorWith({})}, {}, [], [item])).toBeUndefined();
    });

    it("laisse passer la borne haute et la borne basse", () => {
        const item = classItem({value: {2: 8, 3: 1}});

        expect(HitPointsGuard.validateRolledHitPoints({actor: actorWith({})}, {}, [], [item])).toBeUndefined();
    });

    it("refuse une valeur au-dessus du dé de vie et le signale au joueur", () => {
        const item = classItem({value: {1: "max", 2: 99}});

        const refused = HitPointsGuard.validateRolledHitPoints({actor: actorWith({})}, {}, [], [item]);

        expect(refused).toBe(false);
        expect(ui.notifications.error).toHaveBeenCalledTimes(1);
        expect(game.i18n.format).toHaveBeenCalledWith("FQCARDENGINE.HitPointsOutOfRange", {
            className: "Moine", level: "2", value: 99, faces: 8
        });
    });

    it("refuse zéro, une valeur négative et une valeur fractionnaire", () => {
        for (const value of [0, -3, 4.5]) {
            ui.notifications.error.mockClear();
            const item = classItem({value: {2: value}});

            expect(HitPointsGuard.validateRolledHitPoints({actor: actorWith({})}, {}, [], [item])).toBe(false);
            expect(ui.notifications.error).toHaveBeenCalledTimes(1);
        }
    });

    it("contrôle aussi un item créé par l'avancement, que l'acteur ne porte pas encore", () => {
        const item = classItem({value: {1: 42}});

        expect(HitPointsGuard.validateRolledHitPoints({actor: actorWith({})}, {}, [item], [])).toBe(false);
    });

    it("contrôle chaque classe contre son propre dé de vie", () => {
        const monk = classItem({id: "monk", name: "Moine", denomination: "d8", value: {1: 8}});
        const witch = classItem({
            id: "witch", name: "Sorcière", denomination: "d6", value: {1: 8}, advancementId: "adv-2"
        });

        expect(HitPointsGuard.validateRolledHitPoints({actor: actorWith({})}, {}, [], [monk])).toBeUndefined();

        const refused = HitPointsGuard.validateRolledHitPoints({actor: actorWith({})}, {}, [], [witch]);
        expect(refused).toBe(false);
        expect(game.i18n.format).toHaveBeenCalledWith("FQCARDENGINE.HitPointsOutOfRange", {
            className: "Sorcière", level: "1", value: 8, faces: 6
        });
    });

    it("laisse passer un historique hors plage que l'acteur porte déjà", () => {
        // Donnée héritée : dé de vie changé après coup, valeur posée par le MJ.
        // La bloquer condamnerait toutes les montées de niveau suivantes.
        const item = classItem({value: {1: 42, 2: 5}});
        const manager = {actor: actorWith({"class-1": {1: 42}})};

        expect(HitPointsGuard.validateRolledHitPoints(manager, {}, [], [item])).toBeUndefined();
    });

    it("refuse une valeur hors plage qui remplace un historique différent", () => {
        const item = classItem({value: {1: 42}});
        const manager = {actor: actorWith({"class-1": {1: 5}})};

        expect(HitPointsGuard.validateRolledHitPoints(manager, {}, [], [item])).toBe(false);
    });

    it("ignore un item sans dé de vie, dont la plage est inconnue", () => {
        const item = classItem({denomination: "", value: {1: 42}});

        expect(HitPointsGuard.validateRolledHitPoints({actor: actorWith({})}, {}, [], [item])).toBeUndefined();
    });

    it("ne contrôle rien hors limitation des droits, ni pour le MJ", () => {
        CONFIG.FqCardEngine.options.playerLimitCardsRight = false;
        const item = classItem({value: {1: 99}});
        expect(HitPointsGuard.validateRolledHitPoints({actor: actorWith({})}, {}, [], [item])).toBeUndefined();

        CONFIG.FqCardEngine.options.playerLimitCardsRight = true;
        game.user.isGM = true;
        expect(HitPointsGuard.validateRolledHitPoints({actor: actorWith({})}, {}, [], [item])).toBeUndefined();
    });

    it("ne plante pas sans item ni gestionnaire", () => {
        expect(() => HitPointsGuard.validateRolledHitPoints({}, {})).not.toThrow();
        expect(() => HitPointsGuard.validateRolledHitPoints(undefined, {}, [], [])).not.toThrow();
    });
});
