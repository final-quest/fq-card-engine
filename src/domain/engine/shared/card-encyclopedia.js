import PackUtils from "../../../core/utils/pack.utils.js";
import {buildLevelOptions, groupCardsByClass, localizeClassKey, sortCardsByLevelThenName} from "./spellbook-grid.js";

/** Le compendium qui porte les decks patrons de toutes les classes. */
export const PATTERN_PACK_NAME = "decks-pattern-fq8";

/**
 * Les suffixes des decks patrons dont les cartes ne se construisent pas : les
 * decks de cartes générées (`"Monk Generated"`) et les decks de runes du
 * guerrier runique (`"Runic-Warrior Blue Runes"`). Dans les deux cas, ce sont
 * d'autres cartes qui mettent celles-ci en jeu, aucune montée de niveau ne les
 * débloque. Le reste des decks du compendium (`"<Classe> Base"`,
 * `"Neutral Base"`) porte les cartes qu'un joueur peut mettre dans son deck.
 */
export const GENERATED_DECK_SUFFIXES = [" Generated", " Runes"];

/**
 * Collecte de l'encyclopédie des cartes : l'intégralité des cartes publiées
 * par les compendiums `decks-pattern-fq8`, tous modules confondus, sans
 * référence à un personnage ni à un grimoire — c'est une vue du CONTENU du
 * jeu, identique pour tout le monde.
 *
 * Le tri, le groupement par classe et la localisation des libellés sont ceux
 * du grimoire (`spellbook-grid.js`), réutilisés tels quels : les deux vues
 * présentent les mêmes cartes et ne doivent pas pouvoir les ordonner
 * différemment. Ce module n'ajoute que ce qui lui est propre : la résolution
 * des compendiums, la déduplication des decks homonymes et la distinction
 * entre cartes jouables et cartes générées.
 */

/**
 * Détermine si un deck patron porte des cartes mises en jeu par d'autres
 * cartes plutôt que construites par le joueur.
 *
 * @param {Cards} deck - Le deck patron du compendium.
 *
 * @returns {boolean} Vrai pour un deck `"<Classe> Generated"` ou `"<Classe> <Couleur> Runes"`.
 */
export function isGeneratedDeck(deck) {
    const name = String(deck?.name ?? "");
    return GENERATED_DECK_SUFFIXES.some(suffix => name.endsWith(suffix));
}

/**
 * Ne garde qu'un deck par nom, le premier rencontré.
 *
 * Deux modules peuvent livrer un compendium `decks-pattern-fq8` portant un
 * deck de même nom (un module de contenu qui remplace le `"Monk Base"` du
 * moteur) : afficher les deux doublerait chaque carte dans la grille. Le
 * premier gagne, et `PackUtils.packsNamed` place toujours le moteur en tête —
 * c'est exactement la règle qu'applique déjà la reconstruction des decks, qui
 * résout son deck d'origine par un `find` sur le nom.
 *
 * @param {Cards[]} decks - Les decks patrons, dans l'ordre des compendiums.
 *
 * @returns {Cards[]} Les decks retenus, dans l'ordre d'entrée.
 */
export function dedupeDecksByName(decks) {
    const seen = new Set();
    return decks.filter(deck => {
        const name = String(deck?.name ?? "");
        if (seen.has(name)) {
            return false;
        }
        seen.add(name);
        return true;
    });
}

/**
 * Aplatit les decks patrons en une liste de cartes annotées de leur origine
 * (`generated`), les decks homonymes déjà écartés.
 *
 * @param {Cards[]} decks - Les decks patrons des compendiums.
 *
 * @returns {{card: Card, generated: boolean}[]} Les cartes de l'encyclopédie.
 */
export function collectEncyclopediaCards(decks) {
    const entries = [];
    for (const deck of dedupeDecksByName(decks)) {
        const generated = isGeneratedDeck(deck);
        for (const card of deck?.cards ?? []) {
            entries.push({card, generated});
        }
    }
    return entries;
}

/**
 * Lit les compendiums `decks-pattern-fq8` de tous les modules installés et en
 * tire les cartes de l'encyclopédie. Seul point asynchrone de la collecte :
 * l'appelant l'attend AVANT d'ouvrir la fenêtre, qui ne travaille ensuite que
 * sur cet instantané.
 *
 * @returns {Promise<{card: Card, generated: boolean}[]>} Les cartes de l'encyclopédie.
 */
export async function loadEncyclopediaCards() {
    return collectEncyclopediaCards(await PackUtils.documentsFrom(PATTERN_PACK_NAME));
}

/**
 * Ordonne les cartes de l'encyclopédie : d'abord les cartes jouables, puis les
 * cartes générées, chaque bloc trié comme la grille du grimoire (niveau
 * croissant puis nom localisé). Le niveau d'une carte générée ne la débloque
 * pas, mais il la situe dans la progression de sa classe — c'est le même
 * critère de lecture d'un bloc à l'autre, et la séparation des deux blocs dit
 * seule ce qui se construit et ce qui ne se construit pas.
 *
 * @param {{card: Card, generated: boolean}[]} entries - Les cartes de l'encyclopédie.
 *
 * @returns {Card[]} Les cartes dans leur ordre d'affichage.
 */
export function orderEncyclopediaCards(entries) {
    const cardsOf = generated => entries.filter(entry => entry.generated === generated).map(entry => entry.card);
    return [...sortCardsByLevelThenName(cardsOf(false)), ...sortCardsByLevelThenName(cardsOf(true))];
}

/**
 * Les niveaux distincts proposés par le filtre de niveau : ceux de TOUTES les
 * cartes, générées comprises. Le filtre sert à lire l'encyclopédie par palier
 * de progression ; écarter les cartes générées de ses options rendrait leurs
 * niveaux introuvables alors que la grille les affiche.
 *
 * @param {{card: Card, generated: boolean}[]} entries - Les cartes de l'encyclopédie.
 *
 * @returns {number[]} Les niveaux distincts, triés par ordre croissant.
 */
export function encyclopediaLevelOptions(entries) {
    return buildLevelOptions(entries.map(entry => entry.card));
}

/**
 * Prépare la grille de l'encyclopédie : ordonne les cartes, les groupe par
 * classe FQ puis réassocie à chacune son origine. Les groupes sont ordonnés
 * entre eux par libellé de classe localisé, comme ceux du grimoire.
 *
 * @param {{card: Card, generated: boolean}[]} entries - Les cartes de l'encyclopédie.
 *
 * @returns {{isEmpty: boolean, groups: {classKey: string, classLabel: string, count: number, entries: {card: Card, generated: boolean}[]}[]}}
 *   L'état préparé de la grille.
 */
export function buildEncyclopediaGroups(entries) {
    if (!entries.length) {
        return {isEmpty: true, groups: []};
    }
    const generatedCards = new Set(entries.filter(entry => entry.generated).map(entry => entry.card));
    const grouped = groupCardsByClass(orderEncyclopediaCards(entries));
    const groups = [...grouped.entries()].map(([classKey, cards]) => ({
        classKey,
        classLabel: localizeClassKey(classKey),
        count: cards.length,
        entries: cards.map(card => ({card, generated: generatedCards.has(card)}))
    }));
    groups.sort((a, b) => a.classLabel.localeCompare(b.classLabel));
    return {isEmpty: false, groups};
}
