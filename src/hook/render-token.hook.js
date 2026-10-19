import Constants from "../domain/constants.js";
import TokenHud from "../domain/interface/token-hud.js";

Hooks.on("renderTokenHUD", (hud, html, _data) => {
    // Sur un jeton d'autrui, le HUD n'est rouvert au joueur que pour le ciblage
    // (cf. `TokenHud.canOpenHudOnForeignToken`) : lui seul est conservé, quel que
    // soit l'état de la limitation des droits.
    if (TokenHud.isForeignToken(hud.object)) {
        TokenHud.keepOnlyControls(html, "[data-action='target']");
    } else if (Constants.isPlayerRightsLimited) {
        // Sur ses propres jetons, les contrôles natifs du HUD ne sont retirés au
        // joueur que lorsque la limitation de ses droits est activée. On lui
        // conserve toutefois le ciblage et le choix de l'action de mouvement
        // (bouton + palette, tous deux porteurs de data-palette="movementActions").
        TokenHud.keepOnlyControls(html, "[data-action='target'], [data-palette='movementActions']");
    }

    const colLeft = html.querySelector(".col.left");
    if (!colLeft) return;

    // Ajout des boutons de dégâts agissent sur l'acteur DU TOKEN
    if (hud.object?.actor?.isOwner) {
        TokenHud.addDamageButtons(colLeft, hud.object);
    }

    // Ajout du bouton de sacrifice si le token est un sbire du personnage
    if (Constants.actorCurrent) {
        TokenHud.addSacrificeButton(colLeft, hud.object);
    }
});
