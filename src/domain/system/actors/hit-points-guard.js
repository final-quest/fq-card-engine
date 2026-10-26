/**
 * Garde-fou sur les points de vie gagnés à la montée de niveau.
 *
 * Le flux d'avancement de dnd5e (`HitPointsFlow`) présente un champ numérique
 * libre dès que le niveau n'est pris ni à la moyenne ni au maximum. Rien ne
 * borne ce champ : ni une permission du noyau Foundry — `CONST.USER_PERMISSIONS`
 * n'en expose aucune sur les champs d'un acteur — ni un réglage du système, et
 * `HitPointsFlow#_handleForm` n'exige qu'un entier. Un joueur y inscrit donc le
 * total qu'il veut.
 *
 * Deux verrous, tous deux réservés aux non-MJ et conditionnés au réglage
 * « Limitation des droits du joueur » :
 *  - {@link HitPointsGuard.lockRollInput} passe le champ en lecture seule, ce
 *    qui ne laisse que le dé et la case « prendre la moyenne » ;
 *  - {@link HitPointsGuard.validateRolledHitPoints} annule l'avancement si une
 *    valeur nouvelle sort de la plage du dé de vie.
 *
 * Le second est un filet pour un champ déverrouillé aux outils de développement,
 * pas pour un module désactivé : les deux tournent sur le client du joueur. La
 * trace reste le journal de chat, où `Actor5e#rollClassHitPoints` publie chaque
 * jet de dé de vie.
 *
 * Toutes les méthodes sont statiques : la classe sert de namespace.
 */
export default class HitPointsGuard {

    /** Champ de saisie du jet, dans le gabarit `hit-points-flow.hbs` de dnd5e. */
    static ROLL_INPUT_SELECTOR = "input.roll-result";

    /** Type d'avancement dnd5e porteur des PV gagnés niveau par niveau. */
    static HIT_POINTS_TYPE = "HitPoints";

    /**
     * Vrai si les verrous s'appliquent à l'utilisateur courant : un MJ saisit
     * toujours ce qu'il veut, et le reste de la table n'est bridé que sous
     * « Limitation des droits du joueur ».
     *
     * @returns {boolean} True si les verrous s'appliquent.
     */
    static applies() {
        return !game.user?.isGM && Boolean(CONFIG.FqCardEngine?.options?.playerLimitCardsRight);
    }

    /**
     * Passe le champ de saisie du jet en lecture seule, ce qui ne laisse au
     * joueur que le bouton de dé et la case « prendre la moyenne » — les deux
     * seules valeurs que le système sait justifier.
     *
     * Branché sur `renderHitPointsFlow`.
     *
     * @param {Application} app     Le flux d'avancement rendu.
     * @param {HTMLElement} element La racine du rendu.
     */
    static lockRollInput(app, element) {
        if (!HitPointsGuard.applies()) return;

        const input = element?.querySelector?.(HitPointsGuard.ROLL_INPUT_SELECTOR);
        if (!input) return;

        input.readOnly = true;
        // Le noyau localise `data-tooltip` à l'affichage : la clé suffit ici.
        input.dataset.tooltip = "FQCARDENGINE.HitPointsRollLocked";
    }

    /**
     * Contrôle les PV gagnés avant que l'acteur et ses items ne soient écrits.
     *
     * Seules les valeurs NOUVELLES sont contrôlées, c'est-à-dire celles qui
     * diffèrent de ce que l'acteur porte déjà : un historique hors plage (donnée
     * ancienne, dé de vie changé après coup, valeur posée par le MJ) bloquerait
     * sinon indéfiniment toutes les montées de niveau suivantes.
     *
     * Branché sur `dnd5e.preAdvancementManagerComplete`.
     *
     * @param {object}   manager   Le gestionnaire d'avancement.
     * @param {object}   updates   Mises à jour de l'acteur, non lues ici.
     * @param {object[]} toCreate  Données brutes des items à créer sur l'acteur.
     * @param {object[]} toUpdate  Données brutes des items à mettre à jour.
     * @returns {boolean|undefined} False pour annuler l'avancement, sinon rien.
     */
    static validateRolledHitPoints(manager, updates, toCreate = [], toUpdate = []) {
        if (!HitPointsGuard.applies()) return;

        for (const itemData of [...toCreate, ...toUpdate]) {
            const faces = HitPointsGuard.hitDieFaces(itemData);
            if (!faces) continue;

            for (const advancement of Object.values(itemData.system?.advancement ?? {})) {
                if (advancement?.type !== HitPointsGuard.HIT_POINTS_TYPE) continue;

                const stored = HitPointsGuard.storedValues(manager?.actor, itemData._id, advancement._id);
                for (const [level, value] of Object.entries(advancement.value ?? {})) {
                    // « avg » et « max » sont des choix du système, pas une saisie.
                    if (typeof value !== "number") continue;
                    if (value === stored[level]) continue;
                    if (Number.isInteger(value) && (value >= 1) && (value <= faces)) continue;

                    ui.notifications.error(game.i18n.format("FQCARDENGINE.HitPointsOutOfRange", {
                        className: itemData.name, level, value, faces
                    }));
                    return false;
                }
            }
        }
    }

    /**
     * Nombre de faces du dé de vie d'un item de classe, lu sur sa dénomination
     * (« d8 »).
     *
     * @param {object} itemData Données brutes de l'item.
     * @returns {number|null}   Les faces du dé, ou null hors d'un item de classe.
     */
    static hitDieFaces(itemData) {
        const faces = Number(String(itemData?.system?.hd?.denomination ?? "").replace(/^d/i, ""));
        return (Number.isInteger(faces) && (faces > 0)) ? faces : null;
    }

    /**
     * Valeurs de PV par niveau que l'acteur porte DÉJÀ pour cet avancement.
     *
     * Lues sur `_source` : sur un item préparé, `system.advancement` est une
     * `AdvancementCollection` (une `Collection`, donc une `Map`) dont les entrées
     * échappent à `Object.values`, alors que la source reste le même
     * enregistrement indexé par identifiant que les données du gestionnaire.
     *
     * @param {Actor}  actor         L'acteur en cours d'avancement.
     * @param {string} itemId        Identifiant de l'item de classe.
     * @param {string} advancementId Identifiant de l'avancement.
     * @returns {object} Les PV par niveau déjà enregistrés, vide à défaut.
     */
    static storedValues(actor, itemId, advancementId) {
        const advancements = actor?.items?.get?.(itemId)?._source?.system?.advancement ?? {};
        return advancements[advancementId]?.value ?? {};
    }
}
