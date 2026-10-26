import {beforeEach, describe, expect, it, vi} from "vitest";
import {
    buildEncyclopediaGroups, collectEncyclopediaCards, dedupeDecksByName, encyclopediaLevelOptions,
    isGeneratedDeck, loadEncyclopediaCards, orderEncyclopediaCards
} from "../../src/domain/engine/shared/card-encyclopedia.js";

/**
 * Collecte de l'encyclopédie des cartes
 * (`src/domain/engine/shared/card-encyclopedia.js`).
 *
 * Ce que ces tests verrouillent, et pourquoi :
 *
 * — Les decks homonymes. Deux modules peuvent livrer un compendium
 *   `decks-pattern-fq8` portant un `"Monk Base"` : sans déduplication, chaque
 *   carte de la classe apparaîtrait deux fois dans la grille.
 * — La distinction jouable/générée. Une carte générée n'est pas débloquée par
 *   une montée de niveau : elle reste groupée après les jouables, dans un bloc
 *   séparé. Son niveau la situe en revanche dans la progression de sa classe,
 *   il ordonne donc son bloc et alimente le filtre de niveau comme les autres.
 * — Les decks dont les cartes ne se construisent pas. Les decks de runes du
 *   guerrier runique sont dans ce cas au même titre que les decks `Generated` :
 *   sans eux, des cartes impossibles à mettre dans un deck s'afficheraient
 *   comme jouables.
 *
 * Les cartes et decks sont des littéraux fabriqués ici : aucune donnée
 * d'équilibrage réelle (noms de cartes des paquets, niveaux, nombre
 * d'exemplaires) n'est assertée.
 */

/** Fabrique une carte minimale, suffisante pour le tri et le groupement. */
function makeCard({name, level = 1, fqClass = "monk"} = {}) {
    return {name, system: {fq: {level, class: fqClass}}};
}

/** Fabrique un deck patron de compendium portant les cartes données. */
function makeDeck(name, cards) {
    return {name, cards};
}

describe("isGeneratedDeck", () => {
    it("reconnaît un deck de cartes générées par son suffixe", () => {
        expect(isGeneratedDeck(makeDeck("Monk Generated", []))).toBe(true);
    });

    it("reconnaît un deck de runes, que le joueur ne construit pas davantage", () => {
        expect(isGeneratedDeck(makeDeck("Runic-Warrior Blue Runes", []))).toBe(true);
    });

    it("ne retient ni les decks de classe ni le deck neutre", () => {
        expect(isGeneratedDeck(makeDeck("Monk Base", []))).toBe(false);
        expect(isGeneratedDeck(makeDeck("Neutral Base", []))).toBe(false);
    });

    it("tient devant un deck sans nom", () => {
        expect(isGeneratedDeck({})).toBe(false);
    });
});

describe("dedupeDecksByName", () => {
    it("ne garde que le premier deck d'un nom donné", () => {
        const engine = makeDeck("Monk Base", [makeCard({name: "FQCARDTITLE.A"})]);
        const content = makeDeck("Monk Base", [makeCard({name: "FQCARDTITLE.B"})]);

        expect(dedupeDecksByName([engine, content])).toEqual([engine]);
    });

    it("garde les decks de noms différents dans leur ordre d'entrée", () => {
        const monk = makeDeck("Monk Base", []);
        const neutral = makeDeck("Neutral Base", []);

        expect(dedupeDecksByName([monk, neutral])).toEqual([monk, neutral]);
    });
});

describe("collectEncyclopediaCards", () => {
    it("aplatit les decks en cartes annotées de leur origine", () => {
        const playable = makeCard({name: "FQCARDTITLE.Punch"});
        const generated = makeCard({name: "FQCARDTITLE.Surge"});

        const entries = collectEncyclopediaCards([
            makeDeck("Monk Base", [playable]),
            makeDeck("Monk Generated", [generated])
        ]);

        expect(entries).toEqual([
            {card: playable, generated: false},
            {card: generated, generated: true}
        ]);
    });

    it("n'aplatit qu'une fois les cartes des decks homonymes", () => {
        const kept = makeCard({name: "FQCARDTITLE.Punch"});
        const shadowed = makeCard({name: "FQCARDTITLE.Other"});

        const entries = collectEncyclopediaCards([
            makeDeck("Monk Base", [kept]),
            makeDeck("Monk Base", [shadowed])
        ]);

        expect(entries.map(entry => entry.card)).toEqual([kept]);
    });

    it("tient devant un deck sans carte", () => {
        expect(collectEncyclopediaCards([makeDeck("Monk Base", undefined)])).toEqual([]);
    });
});

describe("loadEncyclopediaCards", () => {

    beforeEach(() => {
        globalThis.FqCardEngineModule = {moduleName: "fq-card-engine"};
    });

    it("lit les compendiums de decks de TOUS les modules, le moteur d'abord", async () => {
        const own = makeCard({name: "FQCARDTITLE.Punch"});
        const extended = makeCard({name: "FQCARDTITLE.Hex", fqClass: "witch"});
        const packOf = (collection, decks) => ({
            collection,
            metadata: {name: "decks-pattern-fq8"},
            getDocuments: vi.fn(async () => decks)
        });
        const enginePack = packOf("fq-card-engine.decks-pattern-fq8", [makeDeck("Monk Base", [own])]);
        const contentPack = packOf("fq-content.decks-pattern-fq8", [makeDeck("Witch Base", [extended])]);
        game.packs = {
            get: vi.fn(collection => [enginePack, contentPack].find(pack => pack.collection === collection)),
            filter: vi.fn(predicate => [enginePack, contentPack].filter(predicate))
        };

        const entries = await loadEncyclopediaCards();

        expect(entries.map(entry => entry.card)).toEqual([own, extended]);
    });
});

describe("orderEncyclopediaCards", () => {
    it("trie les cartes jouables par niveau puis par nom localisé", () => {
        const high = makeCard({name: "FQCARDTITLE.High", level: 3});
        const lowB = makeCard({name: "FQCARDTITLE.B", level: 1});
        const lowA = makeCard({name: "FQCARDTITLE.A", level: 1});

        const ordered = orderEncyclopediaCards(
            [high, lowB, lowA].map(card => ({card, generated: false})));

        expect(ordered.map(card => card.name))
            .toEqual(["FQCARDTITLE.A", "FQCARDTITLE.B", "FQCARDTITLE.High"]);
    });

    it("place les cartes générées après les jouables, quel que soit leur niveau", () => {
        const generated = makeCard({name: "FQCARDTITLE.Surge", level: 1});
        const playable = makeCard({name: "FQCARDTITLE.Punch", level: 9});

        const ordered = orderEncyclopediaCards([
            {card: generated, generated: true},
            {card: playable, generated: false}
        ]);

        expect(ordered).toEqual([playable, generated]);
    });

    it("trie les cartes générées entre elles par niveau puis par nom localisé", () => {
        const highA = makeCard({name: "FQCARDTITLE.A", level: 4});
        const lowZ = makeCard({name: "FQCARDTITLE.Z", level: 1});
        const lowB = makeCard({name: "FQCARDTITLE.B", level: 1});

        const ordered = orderEncyclopediaCards(
            [highA, lowZ, lowB].map(card => ({card, generated: true})));

        expect(ordered).toEqual([lowB, lowZ, highA]);
    });
});

describe("encyclopediaLevelOptions", () => {
    it("propose les niveaux de toutes les cartes, générées comprises, triés", () => {
        const entries = [
            {card: makeCard({name: "FQCARDTITLE.C", level: 3}), generated: false},
            {card: makeCard({name: "FQCARDTITLE.A", level: 1}), generated: false},
            {card: makeCard({name: "FQCARDTITLE.G", level: 7}), generated: true}
        ];

        expect(encyclopediaLevelOptions(entries)).toEqual([1, 3, 7]);
    });
});

describe("buildEncyclopediaGroups", () => {
    it("signale l'absence de carte sans produire de groupe", () => {
        expect(buildEncyclopediaGroups([])).toEqual({isEmpty: true, groups: []});
    });

    it("groupe par classe et conserve l'origine de chaque carte", () => {
        const punch = makeCard({name: "FQCARDTITLE.Punch", fqClass: "monk"});
        const surge = makeCard({name: "FQCARDTITLE.Surge", fqClass: "monk"});
        const flame = makeCard({name: "FQCARDTITLE.Flame", fqClass: "elementalist"});

        const {isEmpty, groups} = buildEncyclopediaGroups([
            {card: punch, generated: false},
            {card: surge, generated: true},
            {card: flame, generated: false}
        ]);

        expect(isEmpty).toBe(false);
        expect(groups.map(group => group.classKey).sort()).toEqual(["elementalist", "monk"]);
        const monk = groups.find(group => group.classKey === "monk");
        expect(monk.count).toBe(2);
        expect(monk.entries).toEqual([
            {card: punch, generated: false},
            {card: surge, generated: true}
        ]);
    });

    it("ordonne les groupes par libellé de classe localisé", () => {
        game.i18n.localize.mockImplementation(key => key === "FQCARDENGINE.ClassMonk" ? "Aaa" : "Zzz");

        const {groups} = buildEncyclopediaGroups([
            {card: makeCard({name: "FQCARDTITLE.Flame", fqClass: "elementalist"}), generated: false},
            {card: makeCard({name: "FQCARDTITLE.Punch", fqClass: "monk"}), generated: false}
        ]);

        expect(groups.map(group => group.classKey)).toEqual(["monk", "elementalist"]);
    });
});
