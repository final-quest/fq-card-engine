import DisplayCard from "../card-svg/display-card.js";
import SpellbookWindow from "./spellbook-window.js";
import {
    buildEncyclopediaGroups, encyclopediaLevelOptions, loadEncyclopediaCards
} from "../../engine/shared/card-encyclopedia.js";

/** Délai du survol prolongé avant remplissage du panneau d'aperçu, en millisecondes (même geste que le grimoire). */
const PREVIEW_DWELL_DELAY = 250;

const {ApplicationV2, HandlebarsApplicationMixin} = foundry.applications.api;

/**
 * Fenêtre `ApplicationV2` de l'encyclopédie des cartes : toutes les cartes
 * publiées par les compendiums `decks-pattern-fq8`, en grille de vraies cartes
 * `card-svg` groupées par classe, avec les mêmes filtres et le même panneau
 * d'aperçu que le grimoire.
 *
 * C'est une vue du CONTENU du jeu, pas de l'état d'un personnage : elle ne
 * connaît ni grimoire, ni deck, ni utilisateur, et ne mute rien. D'où un
 * singleton (`#instance`) là où le grimoire garde une instance par document :
 * tout le monde y voit la même chose, et il n'y en a rien à ouvrir « pour un
 * autre joueur ». Comme le grimoire, elle ne lit son contenu qu'à l'ouverture
 * et n'écoute aucun hook ensuite.
 *
 * Les gestes de présentation partagés avec le grimoire — tooltip de nom,
 * pastille de niveau, filtres, aperçu — sont appelés sur `SpellbookWindow`
 * plutôt que recopiés : ce sont des helpers statiques qui ne touchent qu'au
 * DOM reçu en argument, et le gabarit de cette fenêtre reprend exactement les
 * classes `fq-spellbook-*` qu'ils ciblent. Rien n'est repris en revanche des
 * gestes de distribution (bascule, clic droit, verrous, taille de deck) : il
 * n'y a ici aucun deck à muter.
 */
export default class CardEncyclopediaWindow extends HandlebarsApplicationMixin(ApplicationV2) {

    /** @type {CardEncyclopediaWindow|null} L'unique instance ouverte, s'il y en a une. */
    static #instance = null;

    /** @type {Promise<CardEncyclopediaWindow>|null} L'ouverture en cours, le temps de lire les compendiums. */
    static #opening = null;

    /** @type {{isEmpty: boolean, groups: object[]}} L'état préparé de la grille, mémorisé entre `_prepareContext` et `_onRender`. */
    #preparedGroups = {isEmpty: true, groups: []};

    /** @type {{classKey: string, level: string, search: string}} L'état de filtre courant, entre deux événements de la barre d'outils. */
    #filters = {classKey: "", level: "", search: ""};

    /** @type {number|null} Le minuteur partagé du survol prolongé (champ privé, jamais une propriété de nœud DOM : `_onClose` ne voit plus `this.element`). */
    #dwellTimer = null;

    /** @override */
    static DEFAULT_OPTIONS = {
        // `fq-spellbook-window` apporte la grille, les groupes et le panneau
        // d'aperçu ; `fq-encyclopedia-window` retire ce qui promettrait une
        // interactivité absente ici.
        classes: ["fq-spellbook-window", "fq-encyclopedia-window"],
        window: {
            resizable: false,
            positioned: true,
            minimizable: true
        },
        actions: {
            fqResetFilters: CardEncyclopediaWindow.#onResetFilters
        }
    };

    /** @override */
    static PARTS = {
        grid: {
            template: "modules/fq-card-engine/src/templates/encyclopedia/card-encyclopedia-window.hbs",
            scrollable: [".fq-spellbook-grid"]
        }
    };

    /**
     * @param {{card: Card, generated: boolean}[]} entries   - Les cartes de l'encyclopédie, déjà lues des compendiums.
     * @param {object}                             [options] - Options additionnelles transmises à `ApplicationV2`.
     */
    constructor(entries, options = {}) {
        const width = Math.min(2400, Math.max(640, Math.round(window.innerWidth * 0.85)));
        const height = Math.min(900, Math.max(480, Math.round(window.innerHeight * 0.85)));
        super({
            ...options,
            position: {width, height},
            window: {title: game.i18n.localize("FQCARDENGINE.EncyclopediaTitle")}
        });
        this.entries = entries;
    }

    /**
     * Ouvre l'encyclopédie, ou la remet au premier plan si elle est déjà
     * ouverte. La lecture des compendiums précède la création de la fenêtre :
     * un second appel pendant cette lecture rejoint la même promesse plutôt
     * que d'ouvrir une deuxième fenêtre (l'instance n'existe pas encore, s'y
     * fier ne protégerait de rien).
     *
     * @returns {Promise<CardEncyclopediaWindow>} L'instance ouverte (existante ou nouvelle).
     */
    static async open() {
        const existing = CardEncyclopediaWindow.#instance;
        if (existing) {
            if (existing.minimized) {
                existing.maximize();
            }
            existing.bringToFront();
            return existing;
        }
        if (CardEncyclopediaWindow.#opening) {
            return CardEncyclopediaWindow.#opening;
        }
        CardEncyclopediaWindow.#opening = (async () => {
            try {
                const app = new CardEncyclopediaWindow(await loadEncyclopediaCards());
                CardEncyclopediaWindow.#instance = app;
                app.render(true);
                return app;
            } finally {
                CardEncyclopediaWindow.#opening = null;
            }
        })();
        return CardEncyclopediaWindow.#opening;
    }

    /**
     * Prépare le contexte de rendu : groupe les cartes par classe et mémorise
     * le résultat complet pour `_onRender`. Le contexte renvoyé au gabarit ne
     * contient AUCUN document `Card` — seulement les métadonnées de groupe,
     * les niveaux du filtre et le total affiché ; c'est `_onRender` qui insère
     * les fragments de carte rendus.
     *
     * @inheritDoc
     * @returns {Promise<object>} Le contexte de rendu.
     */
    async _prepareContext(_options) {
        this.#preparedGroups = buildEncyclopediaGroups(this.entries);
        return {
            isEmpty: this.#preparedGroups.isEmpty,
            groups: this.#preparedGroups.groups.map(({classKey, classLabel, count}) => ({classKey, classLabel, count})),
            levelOptions: encyclopediaLevelOptions(this.entries),
            total: this.entries.length
        };
    }

    /**
     * Rend les cartes de chaque groupe de classe dans la grille, puis câble
     * les filtres et réapplique les critères courants — un re-rendu du PART
     * (minimisation, déplacement) reconstruit la barre d'outils à ses valeurs
     * par défaut, et la grille doit rester cohérente avec le dernier critère
     * choisi sans exiger un nouveau geste.
     *
     * @inheritDoc
     * @returns {Promise<void>}
     */
    async _onRender(_context, _options) {
        const gridElement = this.element.querySelector(".fq-spellbook-grid");
        const toolbarElement = this.element.querySelector(".fq-spellbook-toolbar");
        if (toolbarElement && gridElement) {
            SpellbookWindow.bindFilterControls(toolbarElement, gridElement, filters => {
                this.#filters = filters;
            });
        }
        if (this.#preparedGroups.isEmpty) {
            return;
        }
        for (const group of this.#preparedGroups.groups) {
            const container = this.element.querySelector(`[data-spellbook-cards="${group.classKey}"]`);
            if (container) {
                await this.#renderCardsInto(container, group.entries);
            }
        }
        if (toolbarElement && gridElement) {
            for (const [name, value] of Object.entries(this.#filters)) {
                const control = toolbarElement.querySelector(`[name="${name}"]`);
                if (control) {
                    control.value = value;
                }
            }
            SpellbookWindow.applyFilters(gridElement, this.#filters);
            toolbarElement.classList.toggle(
                "fq-spellbook-toolbar--filtered",
                !!(this.#filters.classKey || this.#filters.level || this.#filters.search)
            );
        }
        DisplayCard.fitDescriptionSize(this.element);
    }

    /**
     * Pose sur une carte déjà rendue la pastille de la carte générée, dans le
     * coin opposé à sa pastille de niveau : les deux se lisent ensemble — le
     * niveau situe la carte dans la progression de sa classe, la pastille
     * d'origine dit qu'aucune montée de niveau ne la débloque, c'est une autre
     * carte qui la crée en jeu. Retour silencieux sans `.fq-card-inner`,
     * miroir des pastilles du grimoire.
     *
     * @param {Element} cardElement - L'élément racine de la carte rendue.
     *
     * @returns {void}
     */
    static applyGeneratedBadge(cardElement) {
        const inner = cardElement.querySelector(".fq-card-inner");
        if (!inner) {
            return;
        }
        const badge = document.createElement("span");
        badge.className = "fq-card-badge fq-encyclopedia-card-generated";
        const icon = document.createElement("i");
        icon.className = "fa-solid fa-wand-magic-sparkles";
        badge.appendChild(icon);
        badge.dataset.tooltip = game.i18n.localize("FQCARDENGINE.EncyclopediaGeneratedTooltip");
        inner.appendChild(badge);
    }

    /**
     * Rend un lot de cartes et les insère dans le conteneur donné, dans
     * l'ordre reçu : vide le conteneur, rend chaque carte via le gabarit
     * partagé `board/card.hbs`, puis pose les marques de cette vue — la carte
     * ne se glisse pas, ne se clique pas (aucun `data-action` : il n'y a rien
     * à distribuer), porte sa pastille de niveau et, pour une carte générée,
     * sa pastille d'origine en plus.
     *
     * Les attributs lus par les filtres suivent : `data-card-class` recopié du
     * conteneur de groupe, `data-card-name` le nom localisé et `data-card-level`
     * le niveau, carte générée comprise — le filtre de niveau les retient comme
     * les autres (cf. `encyclopediaLevelOptions`, qui propose aussi leurs
     * niveaux).
     *
     * Les écouteurs d'aperçu sont posés PAR CARTE et non délégués
     * (`mouseenter`/`mouseleave` ne bouillonnent pas) ; cette méthode recrée
     * chaque nœud à chaque appel, aucun ancien écouteur ne survit.
     * N'appelle PAS `fitDescriptionSize` : l'appelant le fait une fois, après
     * le dernier groupe.
     *
     * @param {Element}                            container - Le conteneur à remplir.
     * @param {{card: Card, generated: boolean}[]} entries   - Les cartes à rendre, dans l'ordre d'affichage.
     *
     * @returns {Promise<void>}
     */
    async #renderCardsInto(container, entries) {
        container.replaceChildren();
        const contents = await Promise.all(entries.map(({card}) => foundry.applications.handlebars.renderTemplate(
            "modules/fq-card-engine/src/templates/board/card.hbs", SpellbookWindow.buildCardRenderData(card)
        )));
        contents.forEach((raw, i) => {
            const el = $(raw)[0];
            if (!el) {
                return;
            }
            const {card, generated} = entries[i];
            el.classList.add("fq-spellbook-card", "fq-encyclopedia-card");
            el.setAttribute("draggable", "false");
            SpellbookWindow.applyNameTooltip(el);
            const level = Number(card?.system?.fq?.level) || 0;
            SpellbookWindow.applyLevelBadge(el, level);
            if (generated) {
                CardEncyclopediaWindow.applyGeneratedBadge(el);
            }
            el.dataset.cardClass = container.dataset.spellbookCards ?? "";
            el.dataset.cardLevel = String(level);
            el.dataset.cardName = game.i18n.localize(card.name);
            el.addEventListener("mouseenter", () => this.#schedulePreview(card));
            el.addEventListener("mouseleave", () => this.#cancelPreview());
            el.addEventListener("focusin", () => this.#showPreview(card));
            container.appendChild(el);
        });
    }

    /**
     * Action handler `ApplicationV2` de réinitialisation des filtres, partagée
     * par les deux boutons de réinitialisation (barre d'outils et état « aucun
     * résultat »), exactement comme dans le grimoire.
     *
     * @this {CardEncyclopediaWindow}
     * @param {PointerEvent} _event  - L'événement de clic déclencheur, non utilisé.
     * @param {HTMLElement}  _target - L'élément cliqué, non utilisé.
     *
     * @returns {void}
     */
    static #onResetFilters(_event, _target) {
        const toolbarElement = this.element.querySelector(".fq-spellbook-toolbar");
        const gridElement = this.element.querySelector(".fq-spellbook-grid");
        if (!toolbarElement || !gridElement) {
            return;
        }
        SpellbookWindow.resetFilterControls(toolbarElement);
        this.#filters = SpellbookWindow.refreshFilters(toolbarElement, gridElement);
    }

    /**
     * Arme le minuteur partagé du survol prolongé pour la carte reçue, après
     * avoir annulé celui en cours : un seul minuteur pour toute la fenêtre,
     * jamais d'accumulation en balayant la grille.
     *
     * @param {Card} card - La carte survolée.
     *
     * @returns {void}
     */
    #schedulePreview(card) {
        clearTimeout(this.#dwellTimer);
        this.#dwellTimer = setTimeout(() => this.#showPreview(card), PREVIEW_DWELL_DELAY);
    }

    /**
     * Annule le minuteur de survol en cours, et RIEN d'autre : le panneau
     * garde la dernière carte lue (zone de lecture, pas infobulle).
     *
     * @returns {void}
     */
    #cancelPreview() {
        clearTimeout(this.#dwellTimer);
    }

    /**
     * Remplit le panneau d'aperçu avec la carte reçue, par le même chemin de
     * rendu que le grimoire.
     *
     * @param {Card} card - La carte à afficher en grand.
     *
     * @returns {Promise<void>}
     */
    async #showPreview(card) {
        const previewElement = this.element?.querySelector(".fq-spellbook-preview-content");
        if (!previewElement) {
            return;
        }
        await SpellbookWindow.renderPreviewCard(previewElement, card);
        // Le rendu du gabarit est asynchrone : un re-rendu survenu pendant
        // l'attente aurait détaché le conteneur capturé plus haut, et la carte
        // s'écrirait dans un nœud invisible.
        const current = this.element?.querySelector(".fq-spellbook-preview-content");
        if (current && current !== previewElement) {
            await SpellbookWindow.renderPreviewCard(current, card);
        }
    }

    /**
     * À la fermeture, annule EN PREMIER le minuteur de survol — sans jamais
     * passer par `this.element`, retiré avant `_onClose` — puis libère le
     * singleton si c'est bien cette instance (une réouverture concurrente ne
     * doit pas se faire écraser).
     *
     * @inheritDoc
     */
    _onClose(options) {
        clearTimeout(this.#dwellTimer);
        super._onClose(options);
        if (CardEncyclopediaWindow.#instance === this) {
            CardEncyclopediaWindow.#instance = null;
        }
    }
}
