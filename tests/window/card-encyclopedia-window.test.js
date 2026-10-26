import {afterEach, beforeEach, describe, expect, test, vi} from "vitest";
import DisplayCard from "../../src/domain/interface/card-svg/display-card.js";
import SpellbookWindow from "../../src/domain/interface/window/spellbook-window.js";

const {default: CardEncyclopediaWindow} = await import(
    "../../src/domain/interface/window/card-encyclopedia-window.js");

/**
 * Fenêtre de l'encyclopédie des cartes
 * (`src/domain/interface/window/card-encyclopedia-window.js`).
 *
 * Ce que ces tests verrouillent, et pourquoi :
 *
 * — La carte ne se distribue pas. L'encyclopédie reprend le gabarit et les
 *   classes du grimoire ; une carte qui garderait son `data-action` ou son
 *   attribut de glisser-déposer rendrait cliquable une vue qui n'a aucun deck
 *   à muter.
 * — Le niveau d'une carte générée. Il ne la décrit pas : elle ne porte donc
 *   pas de pastille de niveau et le filtre de niveau ne doit jamais la
 *   retenir (`data-card-level` vide).
 *
 * Le chrome réel d'`ApplicationV2` (rendu, position, premier plan) reste hors
 * Vitest, comme pour le grimoire : la racine de fenêtre est fabriquée à la
 * main et `_prepareContext`/`_onRender` sont appelés directement.
 */

// `$(html)[0]` (jQuery) est un global du client Foundry, fourni par aucune
// dépendance npm : mock minimal, exactement l'usage qu'en fait le rendu des
// cartes.
if (!globalThis.$) {
    globalThis.$ = html => {
        const wrapper = document.createElement("div");
        wrapper.innerHTML = typeof html === "string" ? html.trim() : "";
        return [...wrapper.children];
    };
}

/** Fabrique une carte factice, squelette minimal exigé par `buildCardRenderData`. */
function makeFakeCard({name = "FQCARDTITLE.Punch", id = "card1", level = 1, fqClass = "monk"} = {}) {
    return {
        id, _id: id, name, face: 0,
        back: {img: ""},
        faces: [{img: "", text: ""}],
        system: {fq: {level, class: fqClass, maxSameCard: 3}}
    };
}

/** Fabrique le HTML rendu d'une carte, réplique de la structure de `board/card.hbs`. */
function makeRenderedCardHtml({name = "FQCARDTITLE.Punch", id = "card1"} = {}) {
    return `<div class="fq-card fq-card-engine-card" data-card-id="${id}" title="${name}" draggable="true">`
        + "<div class=\"fq-card-inner\"></div>"
        + `<span class="fq-card-tooltip">${name}</span>`
        + "</div>";
}

/**
 * Fabrique une racine de fenêtre (barre d'outils, grille, panneau d'aperçu) et
 * le conteneur de cartes du groupe donné, tel que le gabarit les produit.
 *
 * @param {string} classKey - L'identifiant de classe du groupe à monter.
 *
 * @returns {{root: Element, grid: Element, toolbar: Element, previewContent: Element}} Les éléments montés.
 */
function makeWindowRoot(classKey) {
    const root = document.createElement("div");
    const toolbar = document.createElement("div");
    toolbar.className = "fq-spellbook-toolbar";
    const grid = document.createElement("div");
    grid.className = "fq-spellbook-grid";
    const groupElement = document.createElement("div");
    groupElement.className = "fq-spellbook-group";
    const cardsContainer = document.createElement("div");
    cardsContainer.className = "fq-spellbook-cards";
    cardsContainer.dataset.spellbookCards = classKey;
    groupElement.appendChild(cardsContainer);
    grid.appendChild(groupElement);
    const preview = document.createElement("div");
    preview.className = "fq-spellbook-preview";
    const previewContent = document.createElement("div");
    previewContent.className = "fq-spellbook-preview-content";
    const invite = document.createElement("div");
    invite.className = "fq-spellbook-preview-empty";
    previewContent.appendChild(invite);
    preview.appendChild(previewContent);
    root.append(toolbar, grid, preview);
    return {root, grid, toolbar, previewContent};
}

describe("CardEncyclopediaWindow._prepareContext — métadonnées seules, aucun document de carte", () => {

    test("rend les groupes, les niveaux du filtre et le total", async () => {
        const entries = [
            {card: makeFakeCard({name: "FQCARDTITLE.Punch", level: 3}), generated: false},
            {card: makeFakeCard({name: "FQCARDTITLE.Surge", id: "card2", level: 1}), generated: true}
        ];
        const win = new CardEncyclopediaWindow(entries);

        const context = await win._prepareContext({});

        expect(context.isEmpty).toBe(false);
        expect(context.total).toBe(2);
        expect(context.levelOptions).toEqual([3]);
        expect(context.groups).toEqual([{classKey: "monk", classLabel: "monk", count: 2}]);
        expect(JSON.stringify(context)).not.toContain("faces");
    });

    test("sans aucune carte publiée : signale l'état vide", async () => {
        const win = new CardEncyclopediaWindow([]);

        const context = await win._prepareContext({});

        expect(context).toEqual({isEmpty: true, groups: [], levelOptions: [], total: 0});
    });
});

describe("CardEncyclopediaWindow._onRender — grille de cartes en lecture seule", () => {
    let win;
    let grid;

    beforeEach(async () => {
        vi.spyOn(foundry.applications.handlebars, "renderTemplate")
            .mockImplementation(async () => makeRenderedCardHtml());
        vi.spyOn(DisplayCard, "fitDescriptionSize").mockImplementation(() => {
        });

        win = new CardEncyclopediaWindow([
            {card: makeFakeCard({name: "FQCARDTITLE.Punch", id: "card1", level: 3}), generated: false},
            {card: makeFakeCard({name: "FQCARDTITLE.Surge", id: "card2", level: 1}), generated: true}
        ]);
        const mounted = makeWindowRoot("monk");
        grid = mounted.grid;
        win.element = mounted.root;

        await win._prepareContext({});
        await win._onRender({}, {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test("aucune carte n'est cliquable ni glissable", () => {
        const cards = [...grid.querySelectorAll(".fq-spellbook-card")];

        expect(cards).toHaveLength(2);
        for (const card of cards) {
            expect(card.dataset.action).toBeUndefined();
            expect(card.getAttribute("draggable")).toBe("false");
            expect(card.classList.contains("fq-encyclopedia-card")).toBe(true);
        }
    });

    test("la carte jouable porte sa pastille de niveau, et pas la pastille d'origine", () => {
        const [playable] = grid.querySelectorAll(".fq-spellbook-card");

        expect(playable.querySelector(".fq-spellbook-card-level").textContent).toBe("3");
        expect(playable.querySelector(".fq-encyclopedia-card-generated")).toBeNull();
        expect(playable.dataset.cardLevel).toBe("3");
    });

    test("la carte générée porte la pastille d'origine, sans niveau ni pastille de niveau", () => {
        const [, generated] = grid.querySelectorAll(".fq-spellbook-card");

        expect(generated.querySelector(".fq-encyclopedia-card-generated")).not.toBeNull();
        expect(generated.querySelector(".fq-spellbook-card-level")).toBeNull();
        expect(generated.dataset.cardLevel).toBe("");
    });

    test("aucune carte ne porte de badge d'exemplaires : rien n'est distribué ici", () => {
        expect(grid.querySelector(".fq-spellbook-card-badge")).toBeNull();
    });

    test("les attributs lus par les filtres sont posés sur chaque carte", () => {
        const cards = [...grid.querySelectorAll(".fq-spellbook-card")];

        expect(cards.map(card => card.dataset.cardClass)).toEqual(["monk", "monk"]);
        expect(cards.map(card => card.dataset.cardName)).toEqual(["FQCARDTITLE.Punch", "FQCARDTITLE.Surge"]);
    });

    test("un filtre de niveau laisse la carte générée hors des résultats", () => {
        SpellbookWindow.applyFilters(grid, {classKey: "", level: "3", search: ""});

        const [playable, generated] = grid.querySelectorAll(".fq-spellbook-card");
        expect(playable.classList.contains("fq-spellbook-card--filtered-out")).toBe(false);
        expect(generated.classList.contains("fq-spellbook-card--filtered-out")).toBe(true);
    });
});

describe("CardEncyclopediaWindow — panneau d'aperçu au survol prolongé", () => {
    let win;
    let grid;
    let previewContent;

    beforeEach(async () => {
        vi.useFakeTimers();
        vi.spyOn(foundry.applications.handlebars, "renderTemplate")
            .mockImplementation(async () => makeRenderedCardHtml());
        vi.spyOn(DisplayCard, "fitDescriptionSize").mockImplementation(() => {
        });

        win = new CardEncyclopediaWindow([
            {card: makeFakeCard({name: "FQCARDTITLE.Punch", id: "card1"}), generated: false}
        ]);
        const mounted = makeWindowRoot("monk");
        grid = mounted.grid;
        previewContent = mounted.previewContent;
        win.element = mounted.root;

        await win._prepareContext({});
        await win._onRender({}, {});
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    test("à l'expiration du délai de survol : remplit le panneau avec la carte survolée", async () => {
        grid.querySelector(".fq-spellbook-card").dispatchEvent(new MouseEvent("mouseenter"));

        await vi.advanceTimersByTimeAsync(250);

        expect(previewContent.querySelector(".fq-spellbook-preview-card")).not.toBeNull();
    });

    test("une sortie avant l'expiration annule le remplissage", async () => {
        const cardElement = grid.querySelector(".fq-spellbook-card");

        cardElement.dispatchEvent(new MouseEvent("mouseenter"));
        cardElement.dispatchEvent(new MouseEvent("mouseleave"));
        await vi.advanceTimersByTimeAsync(500);

        expect(previewContent.querySelector(".fq-spellbook-preview-card")).toBeNull();
    });

    test("la fermeture annule un minuteur en cours : aucun remplissage après", async () => {
        grid.querySelector(".fq-spellbook-card").dispatchEvent(new MouseEvent("mouseenter"));

        win._onClose({});
        await vi.advanceTimersByTimeAsync(500);

        expect(previewContent.querySelector(".fq-spellbook-preview-card")).toBeNull();
    });
});

describe("CardEncyclopediaWindow.open — une seule fenêtre", () => {
    let packDecks;

    beforeEach(() => {
        globalThis.FqCardEngineModule = {moduleName: "fq-card-engine"};
        packDecks = [{name: "Monk Base", cards: [makeFakeCard()]}];
        const pack = {
            collection: "fq-card-engine.decks-pattern-fq8",
            metadata: {name: "decks-pattern-fq8"},
            getDocuments: vi.fn(async () => packDecks)
        };
        game.packs = {
            get: vi.fn(collection => collection === pack.collection ? pack : undefined),
            filter: vi.fn(() => [])
        };
        // `render` et `bringToFront` appartiennent au chrome réel
        // d'`ApplicationV2`, absent du socle de test (tests/setup.js) : on les
        // pose sur le prototype plutôt que de les espionner, et on les retire
        // après chaque test.
        CardEncyclopediaWindow.prototype.render = vi.fn();
        CardEncyclopediaWindow.prototype.bringToFront = vi.fn();
    });

    afterEach(() => {
        delete CardEncyclopediaWindow.prototype.render;
        delete CardEncyclopediaWindow.prototype.bringToFront;
        vi.restoreAllMocks();
    });

    test("ouvre la fenêtre sur l'instantané des compendiums", async () => {
        const app = await CardEncyclopediaWindow.open();

        expect(app.entries).toHaveLength(1);
        expect(app.render).toHaveBeenCalledWith(true);
        app._onClose({});
    });

    test("deux ouvertures simultanées rejoignent la même fenêtre", async () => {
        const [first, second] = await Promise.all([
            CardEncyclopediaWindow.open(), CardEncyclopediaWindow.open()]);

        expect(second).toBe(first);
        expect(first.render).toHaveBeenCalledTimes(1);
        first._onClose({});
    });

    test("une seconde ouverture remet au premier plan la fenêtre déjà ouverte", async () => {
        const first = await CardEncyclopediaWindow.open();
        first.bringToFront = vi.fn();

        const second = await CardEncyclopediaWindow.open();

        expect(second).toBe(first);
        expect(first.bringToFront).toHaveBeenCalled();
        expect(first.render).toHaveBeenCalledTimes(1);
        first._onClose({});
    });

    test("après fermeture, l'ouverture suivante relit les compendiums", async () => {
        const first = await CardEncyclopediaWindow.open();
        first._onClose({});
        packDecks = [{name: "Monk Base", cards: [makeFakeCard(), makeFakeCard({id: "card2"})]}];

        const second = await CardEncyclopediaWindow.open();

        expect(second).not.toBe(first);
        expect(second.entries).toHaveLength(2);
        second._onClose({});
    });
});
