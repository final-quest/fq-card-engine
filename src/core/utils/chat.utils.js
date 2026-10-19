import {ERROR_COLOR, WARNING_COLOR} from "../constants.js";

/**
 * Publie dans le chat un message d'avertissement stylisé (span italique coloré) —
 * helper générique factorisant le pattern répété partout dans le code.
 *
 * @param {string} message - Le texte déjà localisé/formaté à afficher.
 * @param {object} [options] - Options d'affichage.
 * @param {object} [options.actor] - L'acteur speaker du message.
 * @param {string} [options.color=WARNING_COLOR] - La couleur du texte (ex. `ERROR_COLOR`).
 * @param {boolean} [options.prependActorName=false] - Préfixe le message du nom de l'acteur.
 * @param {boolean} [options.notify=false] - Double le message d'une notification Foundry.
 *
 * @returns {void}
 */
export function createWarning(message, {actor = null, color = WARNING_COLOR, prependActorName = false, notify = false} = {}) {
    const text = prependActorName && actor?.name ? `${actor.name} ${message}` : message;
    // Le chat seul ne suffit pas à dire un REFUS : le dialogue de jeu, le voile de
    // sélection et la fenêtre de résultat sont des calques qui le recouvrent, et la
    // notification Foundry est la seule à passer au-dessus d'eux. Le message de chat
    // reste quand même : c'est la trace lisible par toute la table.
    if (notify) {
        ui.notifications[color === ERROR_COLOR ? "error" : "warn"](text);
    }
    ChatMessage.create({
        speaker: ChatMessage.getSpeaker({actor}),
        content: `<span style='color: ${color}; font-style: italic'>${text}</span>`
    });
}

/**
 * Publie dans le chat un message d'information stylisé (div italique).
 *
 * @param {string} message - Le texte déjà localisé/formaté à afficher.
 * @param {object} [options] - Options d'affichage.
 * @param {object} [options.actor] - L'acteur speaker du message.
 *
 * @returns {void}
 */
export function createInfo(message, {actor = null} = {}) {
    ChatMessage.create({
        speaker: ChatMessage.getSpeaker({actor}),
        content: `<div style='font-style: italic'>${message}</div>`
    });
}

/**
 * Publie dans le chat un message de statut stylisé (div italique grasse colorée),
 * utilisé pour les états de carte (éphémère, passive, charges restantes…).
 *
 * @param {string} message - Le texte déjà localisé/formaté à afficher.
 * @param {object} [options] - Options d'affichage.
 * @param {object} [options.actor] - L'acteur speaker du message.
 * @param {string} [options.color="green"] - La couleur du texte.
 *
 * @returns {void}
 */
export function createStatus(message, {actor = null, color = "green"} = {}) {
    ChatMessage.create({
        speaker: ChatMessage.getSpeaker({actor}),
        content: `<div style='color: ${color};font-style: italic;font-weight: 700'>${message}</div>`
    });
}
