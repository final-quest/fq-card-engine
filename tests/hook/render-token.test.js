import {afterEach, describe, expect, it, vi} from "vitest";

vi.mock("../../src/hook/integration/socketlib.hook.js", () => ({
    socket: {
        executeAsGM: vi.fn()
    }
}));

import {socket} from "../../src/hook/integration/socketlib.hook.js";
import TokenHud from "../../src/domain/interface/token-hud.js";
import "../../src/hook/render-token.hook.js";

// Le prédicat d'estampille de sbire lit le nom du module sur la façade globale.
globalThis.FqCardEngineModule = {moduleName: "fq-card-engine"};

function getHook(name) {
    const call = Hooks.on.mock.calls.find(c => c[0] === name);
    return call ? call[1] : undefined;
}

/**
 * Construit le DOM minimal attendu par le hook renderTokenHUD : un conteneur
 * avec deux colonnes ".col" (dont une ".col.left"), via jsdom (environment
 * "jsdom" déclaré dans vitest.config.js).
 */
function minionHudObject({name = "Skeleton lvl 2", id = "token-2", type = "skeleton", summoner = "userCharacterId", hp = 10} = {}) {
    return {
        document: {name}, name, id,
        actor: {
            items: [], isOwner: true,
            flags: {"fq-card-engine": {minionType: type, summonerId: summoner}},
            system: {attributes: {hp: {value: hp}}}
        }
    };
}

function buildHudHtml() {
    const container = document.createElement("div");
    const colLeft = document.createElement("div");
    colLeft.classList.add("col", "left");
    const colRight = document.createElement("div");
    colRight.classList.add("col", "right");
    container.appendChild(colLeft);
    container.appendChild(colRight);
    return {container, colLeft, colRight};
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe("render-token", () => {

    describe("deleteToken (exporté, appel direct)", () => {
        it("appelle token.document.delete() pour un token existant", () => {
            const tokenDoc = {delete: vi.fn()};
            game.canvas.tokens = {get: vi.fn(() => ({document: tokenDoc}))};

            TokenHud.deleteToken("token-1");

            expect(game.canvas.tokens.get).toHaveBeenCalledWith("token-1");
            expect(tokenDoc.delete).toHaveBeenCalled();
        });

        it("lève une erreur si le token est introuvable (comportement actuel, non corrigé)", () => {
            game.canvas.tokens = {get: vi.fn(() => undefined)};

            expect(() => TokenHud.deleteToken("missing")).toThrow();
        });
    });

    describe("renderTokenHUD", () => {
        it("ne conserve que le ciblage et l'action de mouvement pour un joueur quand la limitation des droits est active", () => {
            const hook = getHook("renderTokenHUD");
            const {container, colLeft, colRight} = buildHudHtml();
            // DOM calqué sur le template natif v14 (templates/hud/token-hud.hbs).
            colLeft.innerHTML = "<div class='attribute elevation'></div><button data-action='sort'></button>";
            colRight.innerHTML =
                "<button data-action='togglePalette' data-palette='effects'></button>" +
                "<div class='palette status-effects' data-palette='effects'></div>" +
                "<button data-action='togglePalette' data-palette='movementActions'></button>" +
                "<div class='palette palette-list' data-palette='movementActions'></div>" +
                "<button data-action='target'></button>" +
                "<button data-action='combat'></button>";
            game.user.isGM = false;
            game.user.character = undefined;
            CONFIG.FqCardEngine.options.playerLimitCardsRight = true;

            hook({object: {actor: {isOwner: true}}}, container, {});

            // Contrôles natifs de la colonne gauche retirés ; n'y restent que les
            // deux boutons de dégâts ajoutés sur un jeton possédé.
            expect(colLeft.querySelector("[data-action='sort'], .attribute.elevation")).toBeNull();
            expect(colLeft.children.length).toBe(2);
            expect(colRight.querySelector("[data-action='target']")).not.toBeNull();
            // Bouton d'ouverture + palette de l'action de mouvement conservés.
            expect(colRight.querySelectorAll("[data-palette='movementActions']").length).toBe(2);
            expect(colRight.querySelector("[data-palette='effects']")).toBeNull();
            expect(colRight.querySelector("[data-action='combat']")).toBeNull();
        });

        it("laisse les contrôles natifs au joueur quand la limitation des droits est désactivée", () => {
            const hook = getHook("renderTokenHUD");
            const {container, colLeft, colRight} = buildHudHtml();
            colLeft.innerHTML = "<span>existing-left</span>";
            colRight.innerHTML = "<span>existing-right</span>";
            game.user.isGM = false;
            game.user.character = undefined;
            CONFIG.FqCardEngine.options.playerLimitCardsRight = false;

            hook({object: {actor: {isOwner: true}}}, container, {});

            expect(colRight.innerHTML).toBe("<span>existing-right</span>");
            expect(colLeft.innerHTML).toContain("existing-left");
        });

        it("ne conserve que le ciblage sur un jeton d'autrui, limitation des droits active ou non", () => {
            const hook = getHook("renderTokenHUD");
            game.user.isGM = false;
            game.user.character = undefined;

            for (const limited of [true, false]) {
                const {container, colLeft, colRight} = buildHudHtml();
                colLeft.innerHTML = "<div class='attribute elevation'></div><button data-action='sort'></button>";
                colRight.innerHTML =
                    "<button data-action='togglePalette' data-palette='movementActions'></button>" +
                    "<div class='palette palette-list' data-palette='movementActions'></div>" +
                    "<button data-action='target'></button>" +
                    "<button data-action='combat'></button>";
                CONFIG.FqCardEngine.options.playerLimitCardsRight = limited;

                hook({object: {actor: {isOwner: false}}}, container, {});

                expect(colLeft.children.length).toBe(0);
                expect(colRight.children.length).toBe(1);
                expect(colRight.querySelector("[data-action='target']")).not.toBeNull();
            }
        });

        it("laisse intact le HUD du MJ sur un jeton qu'il ne possède pas", () => {
            const hook = getHook("renderTokenHUD");
            const {container, colRight} = buildHudHtml();
            colRight.innerHTML = "<button data-action='combat'></button>";
            game.user.isGM = true;
            CONFIG.FqCardEngine.options.playerLimitCardsRight = true;

            hook({object: {actor: {isOwner: false}}}, container, {});

            expect(colRight.querySelector("[data-action='combat']")).not.toBeNull();
        });

        it("ajoute les boutons de dégâts sur un token possédé même sans personnage assigné", () => {
            const hook = getHook("renderTokenHUD");
            const {container, colLeft} = buildHudHtml();
            game.user.isGM = true;
            game.user.character = undefined;
            const hudObject = {document: {name: "Goblin"}, name: "Goblin", id: "token-1", actor: {items: [], isOwner: true}};

            hook({object: hudObject}, container, {});

            // Les boutons de dégâts portent sur l'acteur du token, pas sur le
            // personnage de l'utilisateur : ils doivent apparaître quand même.
            expect(colLeft.children.length).toBe(2);
        });

        it("n'ajoute aucun bouton de dégâts sur un token que l'utilisateur ne possède pas", () => {
            const hook = getHook("renderTokenHUD");
            const {container, colLeft} = buildHudHtml();
            game.user.isGM = true;
            const hudObject = {document: {name: "Goblin"}, name: "Goblin", id: "token-1", actor: {items: [], isOwner: false}};

            hook({object: hudObject}, container, {});

            expect(colLeft.children.length).toBe(0);
        });

        it("ajoute les boutons de dégâts mêlée/distance (MJ + personnage) sans bouton de sacrifice pour un token qui n'est pas un sbire", () => {
            const hook = getHook("renderTokenHUD");
            const {container, colLeft} = buildHudHtml();
            game.user.isGM = true;
            // game.user.character est déjà défini par défaut dans tests/setup.js.
            const hudObject = {document: {name: "Goblin"}, name: "Goblin", id: "token-1", actor: {items: [], isOwner: true}};

            hook({object: hudObject}, container, {});

            expect(colLeft.children.length).toBe(2);
            expect(colLeft.querySelector("[data-action='minion-sacrificed']")).toBeNull();
        });

        it("ajoute le bouton de sacrifice sur un sbire estampillé du personnage, quel que soit son type", () => {
            const hook = getHook("renderTokenHUD");
            game.user.isGM = true;

            for (const type of ["skeleton", "beast"]) {
                const {container, colLeft} = buildHudHtml();

                hook({object: minionHudObject({type})}, container, {});

                expect(colLeft.children.length).toBe(3);
                expect(colLeft.querySelector("[data-action='minion-sacrificed']")).not.toBeNull();
            }
        });

        it("n'ajoute pas le bouton de sacrifice sur le sbire d'un autre invocateur, ni sur un sbire mort", () => {
            const hook = getHook("renderTokenHUD");
            game.user.isGM = true;

            for (const options of [{summoner: "someoneElse"}, {hp: 0}]) {
                const {container, colLeft} = buildHudHtml();

                hook({object: minionHudObject(options)}, container, {});

                expect(colLeft.querySelector("[data-action='minion-sacrificed']")).toBeNull();
            }
        });

        it("le clic sur le bouton de sacrifice publie le message, met à jour le score et supprime le token via socket", () => {
            const hook = getHook("renderTokenHUD");
            const {container, colLeft} = buildHudHtml();
            game.user.isGM = true;
            game.user.character.system.fq.minions = {sacrificedMinion: 0};

            hook({object: minionHudObject()}, container, {});
            const button = colLeft.querySelector("[data-action='minion-sacrificed']");
            button.click();

            expect(ChatMessage.create).toHaveBeenCalled();
            expect(game.user.character.update).toHaveBeenCalledWith({
                "system.fq.minions.sacrificedMinion": TokenHud.SACRIFICE_SCORES["Skeleton lvl 2"]
            });
            expect(socket.executeAsGM).toHaveBeenCalledWith("deleteToken", "token-2");
        });

        it("un familier suit le score par défaut : il est absent de la table des scores", () => {
            const hook = getHook("renderTokenHUD");
            const {container, colLeft} = buildHudHtml();
            game.user.isGM = true;
            game.user.character.system.fq.minions = {sacrificedMinion: 0};

            hook({object: minionHudObject({name: "Tamed Wolf_4213", type: "beast"})}, container, {});
            colLeft.querySelector("[data-action='minion-sacrificed']").click();

            expect(game.user.character.update).toHaveBeenCalledWith({
                "system.fq.minions.sacrificedMinion": TokenHud.getSacrificedScore("Créature hors table")
            });
        });
    });

    describe("TokenHud.canOpenHudOnForeignToken (enveloppe de Token#_canHUD)", () => {

        it("laisse passer le verdict du noyau quand il accorde déjà le HUD", () => {
            const wrapped = vi.fn(() => true);

            expect(TokenHud.canOpenHudOnForeignToken.call({}, wrapped, game.user, {type: "pointerdown"})).toBe(true);
            expect(wrapped).toHaveBeenCalledTimes(1);
        });

        it("rejoue le prédicat natif avec un MJ pour ne rouvrir que le cas de la propriété", () => {
            game.users.find = vi.fn(fn => [{isGM: true}].find(fn));
            // Natif refusé pour l'utilisateur (non propriétaire), accordé pour un MJ :
            // toutes les autres conditions du noyau sont donc réunies.
            const wrapped = vi.fn(user => user.isGM === true);

            expect(TokenHud.canOpenHudOnForeignToken.call({}, wrapped, game.user, undefined)).toBe(true);
        });

        it("refuse le HUD quand le noyau le refuse même à un MJ (calque inactif, glissement, règle de mesure)", () => {
            game.users.find = vi.fn(fn => [{isGM: true}].find(fn));
            const wrapped = vi.fn(() => false);

            expect(TokenHud.canOpenHudOnForeignToken.call({}, wrapped, game.user, undefined)).toBe(false);
        });

        it("retombe sur le refus du noyau quand aucun utilisateur MJ n'existe", () => {
            game.users.find = vi.fn(() => undefined);
            const wrapped = vi.fn(() => false);

            expect(TokenHud.canOpenHudOnForeignToken.call({}, wrapped, game.user, undefined)).toBe(false);
            expect(wrapped).toHaveBeenCalledTimes(1);
        });
    });

    describe("TokenHud.openHudOnForeignToken (enveloppe de Token#_onClickRight)", () => {

        function foreignToken({isOwner = false, activeHud = false} = {}) {
            const hud = {bind: vi.fn(), close: vi.fn()};
            return {
                hud,
                token: {
                    actor: {isOwner},
                    layer: {hud},
                    hasActiveHUD: activeHud,
                    control: vi.fn(),
                    _propagateRightClick: vi.fn(() => false)
                }
            };
        }

        it("ouvre le HUD d'un jeton d'autrui sans toucher à la sélection du joueur", () => {
            game.user.isGM = false;
            const {hud, token} = foreignToken();
            const wrapped = vi.fn();
            const event = {stopPropagation: vi.fn()};

            TokenHud.openHudOnForeignToken.call(token, wrapped, event);

            expect(hud.bind).toHaveBeenCalledWith(token);
            expect(token.control).not.toHaveBeenCalled();
            expect(wrapped).not.toHaveBeenCalled();
            expect(event.stopPropagation).toHaveBeenCalled();
        });

        it("referme le HUD déjà ouvert sur le même jeton d'autrui", () => {
            game.user.isGM = false;
            const {hud, token} = foreignToken({activeHud: true});

            TokenHud.openHudOnForeignToken.call(token, vi.fn(), {stopPropagation: vi.fn()});

            expect(hud.close).toHaveBeenCalled();
            expect(hud.bind).not.toHaveBeenCalled();
        });

        it("délègue au gestionnaire natif sur un jeton possédé comme pour le MJ", () => {
            const {hud, token} = foreignToken({isOwner: true});
            const event = {stopPropagation: vi.fn()};

            game.user.isGM = false;
            const wrappedOwner = vi.fn();
            TokenHud.openHudOnForeignToken.call(token, wrappedOwner, event);

            game.user.isGM = true;
            const wrappedGM = vi.fn();
            TokenHud.openHudOnForeignToken.call({...token, actor: {isOwner: false}}, wrappedGM, event);

            expect(wrappedOwner).toHaveBeenCalledWith(event);
            expect(wrappedGM).toHaveBeenCalledWith(event);
            expect(hud.bind).not.toHaveBeenCalled();
        });
    });

    describe("TokenHud.getSacrificedScore", () => {

        // Les scores eux-mêmes sont de l'équilibrage : c'est la LECTURE de la
        // table qui est vérifiée ici, jamais ses valeurs.
        it("lit la table par préfixe : le jeton d'un sbire porte un suffixe aléatoire", () => {
            for (const [minion, score] of Object.entries(TokenHud.SACRIFICE_SCORES)) {
                expect(TokenHud.getSacrificedScore(`${minion}_428913`)).toBe(score);
            }
        });

        it("retombe sur le score par défaut pour un sbire absent de la table (familiers compris), et sans nom", () => {
            const byDefault = TokenHud.getSacrificedScore("Créature hors table");

            expect(Object.values(TokenHud.SACRIFICE_SCORES)).not.toContain(undefined);
            expect(TokenHud.getSacrificedScore("Tamed Wolf_4213")).toBe(byDefault);
            expect(TokenHud.getSacrificedScore("Enraged Bear_88")).toBe(byDefault);
            expect(TokenHud.getSacrificedScore("Squelette du MJ")).toBe(byDefault);
            expect(TokenHud.getSacrificedScore(undefined)).toBe(byDefault);
        });
    });
});
