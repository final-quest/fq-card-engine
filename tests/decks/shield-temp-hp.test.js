import {beforeEach, describe, expect, test, vi} from "vitest";

// ─── Mocks requis par tests/decks/play-harness.js (vi.mock est hissé PAR FICHIER,
// voir le commentaire JSDoc en tête de play-harness.js pour la liste canonique) ──
vi.mock("../../src/domain/interface/sheet/actor/fq-character-sheet.js", () => ({default: class {}}));
vi.mock("../../src/domain/interface/sheet/actor/fq-npc-sheet.js", () => ({default: class {}}));
vi.mock("../../src/domain/interface/sheet/items/fq-item-sheet.js", () => ({default: class {}}));
vi.mock("../../src/domain/interface/sheet/cards/fq-cards-sheet.js", () => ({default: class {}}));
vi.mock("../../src/domain/interface/sheet/cards/fq-card-sheet.js", () => ({default: class {}}));
vi.mock("../../src/domain/interface/window/hand-board.js", () => ({default: class {}}));
vi.mock("../../src/hook/integration/socketlib.hook.js", () => ({socket: {executeAsGM: vi.fn()}}));

globalThis.socketlib = {registerModule: vi.fn(() => ({register: vi.fn()}))};

const {playChoice} = await import("./play-harness.js");
const {makeCard, makeChoice} = await import("../factories.js");

/**
 * Boucliers à PV temporaires, par le VRAI pipeline (`playValidatedCard`) : les
 * PV temporaires FQ sont le SURPLUS au-dessus du maximum — un effet relève le
 * plafond (`hp.tempmax`), un gain de PV vient le garnir. L'ORDRE des deux est
 * tout le mécanisme : appliqué avant l'effet, le gain serait écrêté au maximum
 * nu et le bouclier naîtrait vide, donc sans un seul point à absorber.
 */
function shieldCard(hp, tempmax) {
    return makeCard({
        name: "FQCARDTITLE.ShieldHarness",
        faces: [{name: "", img: "", text: ""}],
        system: {
            fq: {
                maxSameCard: 1, class: "neutral", level: 1, isInnate: false,
                choices: [makeChoice({
                    minReach: "1",
                    maxReach: "6",
                    hp,
                    applyEffectsFormulas: [{
                        title: "Bouclier", formula: "1",
                        effects: [{
                            result: "1", self: true, messages: [],
                            data: [{
                                name: "Harness Shield",
                                img: "icons/svg/aura.svg",
                                changes: [{
                                    key: "system.attributes.hp.tempmax",
                                    value: tempmax,
                                    type: "add",
                                    priority: null
                                }],
                                duration: {value: "3", units: "rounds"},
                                expireOnDamage: false,
                                expireOnTempHpSpent: true
                            }]
                        }]
                    }]
                })]
            }
        }
    });
}

/** Un blessé à 18/20 dont le bouclier relève déjà le plafond de 6. */
const woundedWithCeiling = {
    character: {system: {attributes: {hp: {value: 18, max: 20, temp: 0, tempmax: 6}}}}
};

/** Les appels de mise à jour du personnage, dans l'ordre d'invocation. */
function hpUpdateIndex() {
    return globalThis.game.user.character.update.mock.calls
        .findIndex(call => "system.attributes.hp.value" in call[0]);
}

describe("Boucliers à PV temporaires : le gain de PV s'inscrit au-dessus du maximum", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test("le gain est plafonné au maximum EFFECTIF, tempmax compris", async () => {
        const result = await playChoice(shieldCard("10", "+10"), 0, {world: woundedWithCeiling});

        expect(result.threw).toBe(false);
        const hpUpdate = result.updates.find(call => "system.attributes.hp.value" in call[0]);
        expect(hpUpdate).toBeDefined();
        // 18 + 10 = 28, écrêté à 20 + 6 = 26. Écrêté au maximum NU, il ne
        // resterait aucun point au-dessus de 20 : rien à absorber.
        expect(hpUpdate[0]["system.attributes.hp.value"]).toBe(26);
    });

    test("le gain vient APRÈS la pose de l'effet, qui relève le plafond", async () => {
        const result = await playChoice(shieldCard("10", "+10"), 0, {world: woundedWithCeiling});

        expect(result.threw).toBe(false);
        const effectOrder = globalThis.ActiveEffect.implementation.create.mock.invocationCallOrder[0];
        const hpOrder = globalThis.game.user.character.update.mock.invocationCallOrder[hpUpdateIndex()];
        expect(effectOrder).toBeGreaterThan(0);
        expect(hpOrder).toBeGreaterThan(effectOrder);
    });

    test("un coût en PV reste prélevé, sans écrêtage", async () => {
        const result = await playChoice(shieldCard("-4", "+10"), 0, {world: woundedWithCeiling});

        expect(result.threw).toBe(false);
        const hpUpdate = result.updates.find(call => "system.attributes.hp.value" in call[0]);
        expect(hpUpdate[0]["system.attributes.hp.value"]).toBe(14);
    });
});
