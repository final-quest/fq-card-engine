import FqCharacterSheet from "./fq-character-sheet.js";
import {lockPlayMode, removeModeToggle} from "../sheet-play-mode.js";
import {fqCostEntries, withFqCostColumn, withSortedFqCostColumn} from "./fq-cost-column.js";

/**
 * Feuille de PNJ FQ. Étend la feuille de PNJ dnd5e en ajoutant un en-tête et une
 * barre latérale FQ, et réutilise les calculs de jauges de {@link FqCharacterSheet}.
 *
 * @extends dnd5e.applications.actor.NPCActorSheet
 */
export default class FqNpcSheet extends dnd5e.applications.actor.NPCActorSheet {


    /** @override */
    static PARTS = {
        ... dnd5e.applications.actor.NPCActorSheet.PARTS,
        ... {
            header: {
                template: `modules/fq-card-engine/src/templates/actors/fq-npc-header.hbs`
            },
            sidebar: {
                container: {classes: ["main-content"], id: "main"},
                template: `modules/fq-card-engine/src/templates/actors/fq-npc-sidebar.hbs`
            }
        }
    };
    /**
     * Force le mode « jeu » lorsque les droits du joueur sont limités.
     *
     * @override
     * @param {object} options - Les options de rendu Foundry.
     */
    _configureRenderOptions(options) {
        super._configureRenderOptions(options);
        lockPlayMode(this);
    }

    /**
     * Retire la bascule d'édition de l'en-tête de la fenêtre lorsque les droits
     * du joueur sont limités.
     *
     * @override
     */
    _renderModeToggle() {
        if (removeModeToggle(this)) return;
        super._renderModeToggle();
    }

    /**
     * Ajoute la colonne « Coût FQ » à chaque section de l'inventaire.
     *
     * @override
     * @param {object[]} sections - Les sections de l'inventaire, mutées sur place.
     */
    async _configureInventorySections(sections) {
        await super._configureInventorySections(sections);
        for (const section of sections) {
            section.columns = withFqCostColumn(section.columns);
        }
    }

    /**
     * Ajoute la colonne « Coût FQ » à chaque section du grimoire dnd5e (onglet des sorts).
     *
     * @override
     * @param {object} context - Le contexte de rendu de la feuille.
     *
     * @returns {object} Les sections du grimoire, indexées par clé.
     */
    _prepareSpellbook(context) {
        const spellbook = super._prepareSpellbook(context);
        for (const section of Object.values(spellbook)) {
            section.columns = withFqCostColumn(section.columns);
        }
        return spellbook;
    }

    /**
     * Ajoute la colonne « Coût FQ » aux sections de l'onglet des capacités, où
     * se rangent les actions d'un PNJ (armes et capacités groupées par type
     * d'activation). Ces sections sont déjà préparées par la classe parente,
     * d'où le tri des colonnes.
     *
     * @override
     * @param {object} context - Le contexte de base fourni par la classe parente.
     * @param {object} options - Les options de rendu Foundry.
     *
     * @returns {Promise<object>} Le contexte dont les sections portent la colonne « Coût FQ ».
     */
    async _prepareFeaturesContext(context, options) {
        context = await super._prepareFeaturesContext(context, options);
        for (const section of context.sections ?? []) {
            section.columns = withSortedFqCostColumn(section.columns);
        }
        return context;
    }

    /**
     * Prépare les coûts FQ de chaque objet, lus par la colonne « Coût FQ ».
     * Les coûts sont posés avant l'appel à la classe parente : dnd5e n'attend
     * pas la promesse de `_prepareItem`, le contexte doit donc être complet dès
     * son premier point d'attente.
     *
     * @override
     * @param {object} item - L'objet à préparer.
     * @param {object} ctx  - Le contexte de rendu de l'objet, muté sur place.
     */
    async _prepareItem(item, ctx) {
        ctx.fqCosts = fqCostEntries(item);
        await super._prepareItem(item, ctx);
    }

    /**
     * Prépare le contexte de rendu de l'en-tête : ajoute les pourcentages des
     * jauges FQ et le drapeau `canModifyFQ`.
     *
     * @override
     * @param {object} _context - Le contexte de base fourni par la classe parente.
     * @param {object} options  - Les options de rendu Foundry.
     *
     * @returns {Promise<object>} Le contexte enrichi des données FQ.
     */
    async _prepareHeaderContext(_context, options) {
        const context = await super._prepareHeaderContext(_context, options);
        return FqCharacterSheet.enrichFqContext(this, context, _context, options);
    }

    /**
     * Prépare le contexte de rendu de la barre latérale : ajoute les pourcentages
     * des jauges FQ et le drapeau `canModifyFQ`.
     *
     * @override
     * @param {object} _context - Le contexte de base fourni par la classe parente.
     * @param {object} options  - Les options de rendu Foundry.
     *
     * @returns {Promise<object>} Le contexte enrichi des données FQ.
     */
    async _prepareSidebarContext(_context, options) {
        const context = await super._prepareSidebarContext(_context, options);
        return FqCharacterSheet.enrichFqContext(this, context, _context, options);
    }
}
