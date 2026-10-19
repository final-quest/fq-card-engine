import Constants from "../constants.js";
import WeaponDamage from "../engine/roll/weapon-damage.js";
import TargetingPredicates from "../engine/shared/targeting-predicates.js";
import {socket} from "../../hook/integration/socketlib.hook.js";

/**
 * Gestion des boutons personnalisés ajoutés au HUD des tokens (dégâts, sacrifice
 * de sbire) et suppression de token côté MJ.
 * Toutes les méthodes sont statiques : la classe sert de namespace.
 */
export default class TokenHud {

    /**
     * Score de sacrifice par sbire : ce que rapporte au compteur
     * `fq.minions.sacrificedMinion` le sbire envoyé au charnier. Tout sbire
     * absent de la table — les familiers du trappeur — vaut le score par défaut
     * de `getSacrificedScore`.
     * @type {Object<string, number>}
     */
    static SACRIFICE_SCORES = Object.freeze({
        "Skeleton lvl 1": 1,
        "Skeleton lvl 2": 2,
        "Skeleton lvl 3": 3,
        "Skeleton lvl 4": 4,
        "Giant Skeleton": 3,
        "Skeleton Sorcerer": 6
    });

    /**
     * Ajoute au HUD du token un bouton « sacrifier le sbire », réservé aux sbires
     * VIVANTS invoqués par le personnage courant : le verdict vient de
     * l'estampille posée à l'invocation ({@link TargetingPredicates.isLivingMinion}),
     * et non du nom du token — un squelette de la sorcière comme un familier du
     * trappeur s'offrent au charnier, la créature d'un autre joueur ou du MJ non.
     * Au clic : joue un effet Sequencer si disponible, publie un message de chat,
     * incrémente le score de sacrifice du personnage et supprime le token via
     * socket (droits MJ).
     *
     * @param {HTMLElement} column - La colonne du HUD où insérer le bouton.
     * @param {object}      token  - Le token concerné.
     *
     * @returns {void}
     */
    static addSacrificeButton(column, token) {
        if (!TargetingPredicates.isLivingMinion(token)) return;
        if (column.querySelector("[data-action='minion-sacrificed']")) return;
        column.appendChild(TokenHud.#createHudButton({
            tooltipKey: "FQCARDENGINE.SacrifyMinionButton",
            iconSrc: "icons/magic/death/skeleton-skull-soul-blue.webp",
            action: "minion-sacrificed",
            onClick: () => {
                if (game.modules.get("sequencer")?.active) {
                    new Sequence()
                        .effect()
                        .file("jb2a.explosion.04.blue")
                        .atLocation(token)
                        .scaleToObject(1.5)
                        .fadeIn(300)
                        .fadeOut(500)
                        .duration(1500)
                        .belowTokens()
                        .effect()
                        .file("jb2a.smoke.puff.centered.grey")
                        .atLocation(token)
                        .scaleToObject(1.5)
                        .randomRotation()
                        .fadeIn(100)
                        .fadeOut(1000)
                        .duration(1200)
                        .effect()
                        .file("jb2a.explosion.04.blue")
                        .atLocation(token)
                        .scaleToObject(1.5)
                        .play();
                }
                ChatMessage.create({
                    speaker: ChatMessage.getSpeaker({actor: Constants.actorCurrent}),
                    content: `<span>${game.i18n.format("FQCARDENGINE.SacrifyMinionMsg")}, ${game.i18n.format("FQCARDENGINE.SacrificedScoreMinionMsg",
                        {"sacrifice": Constants.actorCurrent.system.fq.minions.sacrificedMinion + TokenHud.getSacrificedScore(token.name)})}</span>`
                });
                Constants.actorCurrent.update({
                    "system.fq.minions.sacrificedMinion":
                        Constants.actorCurrent.system.fq.minions.sacrificedMinion + TokenHud.getSacrificedScore(token.name)
                });
                socket.executeAsGM("deleteToken", token.id);
            }
        }));
    }

    /**
     * Construit un bouton de HUD de token : icône, tooltip, et action au clic. Un
     * `action` de dataset est optionnel (utilisé par le sacrifice de sbire pour
     * détecter sa propre présence, cf. `addSacrificeButton`).
     *
     * @param {object}   options
     * @param {string}   options.tooltipKey - La clé i18n du tooltip du bouton.
     * @param {string}   options.iconSrc    - Le chemin de l'icône (36×36).
     * @param {string}   [options.action]   - La valeur `dataset.action` du bouton.
     * @param {Function} options.onClick    - Le gestionnaire de clic.
     *
     * @returns {HTMLButtonElement} Le bouton, prêt à être inséré dans la colonne du HUD.
     */
    static #createHudButton({tooltipKey, iconSrc, action, onClick}) {
        const bouton = document.createElement("button");
        bouton.type = "button";
        bouton.classList.add("control-icon");
        if (action) {
            bouton.dataset.action = action;
        }
        bouton.dataset.tooltip = game.i18n.localize(tooltipKey);
        bouton.innerHTML = `<img src="${iconSrc}" width="36" height="36"/>`;
        bouton.addEventListener("click", onClick);
        return bouton;
    }

    /**
     * Supprime un token de la scène active à partir de son id. Exécutée côté MJ via
     * socket (voir `hook/integration/socketlib.hook.js`).
     *
     * @param {string} tokenId - L'id du token à supprimer.
     *
     * @returns {void}
     */
    static deleteToken(tokenId) {
        const token = game.canvas.tokens.get(tokenId);
        token.document.delete();
    }

    /**
     * Retourne le score de sacrifice associé à un sbire, d'après son nom.
     *
     * @param {string} tokenName - Le nom du token du sbire.
     *
     * @returns {number} Le score de sacrifice (5 par défaut, pour tout sbire absent de la table).
     */
    static getSacrificedScore(tokenName) {
        // Le jeton d'un sbire porte le nom du sbire SUIVI d'un suffixe aléatoire
        // (« Skeleton lvl 3_428913 », cf. `Minion.createActorData`) : la table se
        // lit donc par préfixe, jamais par égalité.
        const name = String(tokenName ?? "");
        const entry = Object.entries(TokenHud.SACRIFICE_SCORES).find(([minion]) => name.startsWith(minion));
        return entry ? entry[1] : 5;
    }

    /**
     * Indique si le jeton appartient à autrui : le MJ n'est jamais concerné, et
     * un joueur l'est sur tout jeton dont il ne possède pas l'acteur (personnage
     * d'un autre joueur, créature du MJ, jeton sans acteur).
     *
     * @param {object} token - Le jeton considéré.
     *
     * @returns {boolean} True si l'utilisateur courant ne possède pas ce jeton.
     */
    static isForeignToken(token) {
        return !game.user?.isGM && token?.actor?.isOwner !== true;
    }

    /**
     * Ne conserve dans les colonnes du HUD que les contrôles désignés : tout
     * autre enfant direct d'une colonne — bouton natif, palette, barre de
     * ressource — est retiré du DOM.
     *
     * @param {HTMLElement} html     - La racine du HUD rendu.
     * @param {string}      selector - Le sélecteur des contrôles conservés.
     *
     * @returns {void}
     */
    static keepOnlyControls(html, selector) {
        html.querySelectorAll(".col > *").forEach(el => {
            if (!el.matches(selector)) el.remove();
        });
    }

    /**
     * Enveloppe libWrapper de `Token#_canHUD` : le noyau réserve le HUD du jeton
     * au MJ et aux propriétaires, ce qui prive le joueur de tout ciblage au clic
     * droit sur les jetons d'autrui. Le HUD y est donc rouvert, réduit au seul
     * bouton de ciblage par le hook `renderTokenHUD`.
     *
     * Appelée par libWrapper avec `this` lié au jeton.
     *
     * @param {Function} wrapped - Le prédicat d'origine.
     * @param {object}   user    - L'utilisateur qui clique (toujours l'utilisateur courant).
     * @param {object}   [event] - L'événement pointeur, quand le clic vient du canvas.
     *
     * @returns {boolean} True si le HUD peut s'ouvrir sur ce jeton.
     */
    static canOpenHudOnForeignToken(wrapped, user, event) {
        if (wrapped(user, event)) {
            return true;
        }
        // Le natif ne consulte `user` que pour la propriété : rejoué avec un MJ,
        // il ne tranche plus que ses AUTRES conditions (calque actif, pose de
        // région, glissement en cours, règle de mesure), qui n'ont donc pas à
        // être redites ici. Un jeton que le joueur ne voit pas ne reçoit de toute
        // façon aucun clic.
        const gm = game.users?.find(u => u.isGM);
        return gm ? wrapped(gm, event) : false;
    }

    /**
     * Enveloppe libWrapper de `Token#_onClickRight` : sur un jeton d'autrui, le
     * HUD s'ouvre (ou se referme) sans passer par `control()`, qui libérerait la
     * sélection du joueur sur SON jeton au profit d'un jeton qu'il ne peut de
     * toute façon pas contrôler.
     *
     * Appelée par libWrapper avec `this` lié au jeton.
     *
     * @param {Function} wrapped - Le gestionnaire d'origine.
     * @param {object}   event   - L'événement pointeur du clic droit.
     *
     * @returns {*} Le résultat du gestionnaire d'origine, ou undefined sur un jeton d'autrui.
     */
    static openHudOnForeignToken(wrapped, event) {
        const hud = this.layer?.hud;
        if (!hud || !TokenHud.isForeignToken(this)) {
            return wrapped(event);
        }
        if (this.hasActiveHUD) {
            hud.close();
        } else {
            hud.bind(this);
        }
        if (!this._propagateRightClick(event)) {
            event.stopPropagation();
        }
    }

    /**
     * Ajoute au HUD du token deux boutons « infliger des dégâts » : l'un déclenche
     * l'usage de la première arme de mêlée équipée de l'acteur, l'autre celui de la
     * première arme à distance équipée, après validation de l'usage d'un sort dans
     * le tour.
     *
     * @param {HTMLElement} column - La colonne du HUD où insérer les boutons.
     * @param {object}      token  - Le token dont l'acteur porte les armes.
     *
     * @returns {void}
     */
    static addDamageButtons(column, token) {
        const actor = token.actor;
        const configs = [
            {weaponToken: "@wpnM", icon: "icons/weapons/swords/scimitar-guard-gold.webp", tooltipKey: "FQCARDENGINE.TokenMeleeDamageButton"},
            {weaponToken: "@wpnR", icon: "icons/weapons/bows/shortbow-recurve-yellow.webp", tooltipKey: "FQCARDENGINE.TokenRangedDamageButton"}
        ];
        for (const {weaponToken, icon, tooltipKey} of configs) {
            column.appendChild(TokenHud.#createHudButton({
                tooltipKey,
                iconSrc: icon,
                onClick: () => WeaponDamage.useFirstEquippedWeapon(actor, weaponToken)
            }));
        }
    }
}
