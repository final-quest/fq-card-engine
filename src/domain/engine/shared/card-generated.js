/**
 * Cartes de compendium : résolution d'une référence `compendium.deck.carte` et
 * fabrication de copies « générées ». Module dédié, sans dépendance moteur ni
 * interface
 */
export default class CardGenerated {

    /**
     * Résout une référence `compendium.deck.carte` et renvoirt la carte concerné
     *
     * @param {string} reference - La référence `compendium.deck.carte`.
     *
     * @returns {Promise<Card|null>} La carte trouvée, ou null si la référence est irrésoluble.
     */
    static async resolveCompendiumCard(reference) {
        const [card] = await CardGenerated.resolveCompendiumCards([reference]);
        return card ?? null;
    }

    /**
     * Résout une liste de références `compendium.deck.carte` en UNE lecture par
     * compendium.
     *
     * Résolue seule, chaque référence relit le compendium ENTIER :
     * `pack.getDocuments()` ne filtre rien et rend tous les decks du paquet, avec
     * toutes leurs cartes. Un encart qui propose des cartes de dix niveaux en
     * résout une quarantaine, et ces résolutions partent toutes avant que la
     * première ne revienne — aucune mise en cache du paquet ne peut les absorber,
     * puisqu'elles ratent toutes le cache en même temps. La lecture est donc
     * partagée par compendium, et c'est la PROMESSE qui est mémorisée, pas son
     * résultat : des résolutions concurrentes attendent ainsi la même lecture au
     * lieu d'en lancer chacune une.
     *
     * Le partage ne vaut que pour l'appel : rien n'est gardé d'un lot à l'autre,
     * un compendium modifié en cours de partie est donc relu au lot suivant.
     *
     * @param {string[]} references - Les références à résoudre.
     *
     * @returns {Promise<(Card|null)[]>} Les cartes trouvées, dans l'ordre des références (null pour une référence irrésoluble).
     */
    static async resolveCompendiumCards(references) {
        // Clé = le compendium lui-même : deux références au même paquet le
        // désignent par le même objet, quelle que soit la façon de l'écrire.
        const loading = new Map();
        const documentsOf = pack => {
            if (!loading.has(pack)) {
                loading.set(pack, pack.getDocuments());
            }
            return loading.get(pack);
        };
        return Promise.all((references ?? []).map(async reference => {
            const parts = reference.split(".").map(part => part.trim());
            const byFullId = parts.length > 3 ? game.packs.get(parts.slice(0, 2).join(".")) : null;
            const pack = byFullId ?? (parts.length > 2 ? game.packs.find(p => p.metadata?.name === parts[0]) : null);
            if (!pack) {
                return null;
            }
            const deckIndex = byFullId ? 2 : 1;
            const deck = (await documentsOf(pack)).find(doc => doc.name === parts[deckIndex]);
            return deck?.cards.find(c => c.name === parts.slice(deckIndex + 1).join(".")) ?? null;
        }));
    }

    /**
     * Construit les données d'une copie « générée » d'une carte de compendium
     *
     * @param {Card} compendiumCard - La carte de compendium à copier.
     *
     * @returns {object} Les données prêtes pour `createEmbeddedDocuments("Card", …)`.
     */
    static buildGeneratedCardData(compendiumCard) {
        const data = compendiumCard.toObject();
        delete data._id;
        data.drawn = false;
        data.origin = null;
        data.face = data.face ?? 0;
        // Foundry n'écrit pas le dos d'une carte : il le dérive de son deck porteur
        // (`Card#prepareDerivedData`, via `origin`), et retombe sur son joker par
        // défaut à défaut de deck. Une copie générée n'a justement pas de deck
        // d'origine (`origin: null`) : le dos du deck de compendium copié est donc
        // figé ici, sans quoi la carte porterait le joker en main comme en défausse.
        data.back = {
            ...data.back,
            img: data.back?.img || compendiumCard.source?.img || compendiumCard.parent?.img || null
        };
        CardGenerated.stampPlayedRound(data.system?.fq?.choices);
        const moduleName = globalThis.FqCardEngineModule?.moduleName;
        data.flags = {...data.flags, [moduleName]: {...data.flags?.[moduleName], generated: true, generatedAt: Date.now()}};
        return data;
    }

    /**
     * Horodate au round courant les choix d'une carte générée déjà marqués joués
     * (`hasBeenPlayed`) : la copie arrive en main épuisée pour le round de sa
     * création et n'est jouable qu'à partir du round suivant.
     *
     * @param {object[]} [choices] - Les choix de la carte générée, modifiés sur place.
     *
     * @returns {void}
     */
    static stampPlayedRound(choices) {
        for (const choice of choices ?? []) {
            if (choice?.hasBeenPlayed) {
                choice.playedRound = game.combat?.round?.toString() ?? "";
            }
        }
    }
}
