import {beforeEach, describe, expect, it, vi} from "vitest";
import {applyGlobalVolumes, pushGlobalVolumes, readGlobalVolumes} from "../../src/core/utils/audio.utils.js";

const VOLUMES = {
    globalPlaylistVolume: 0.8,
    globalAmbientVolume: 0.35,
    globalInterfaceVolume: 0.5
};

let socket;

beforeEach(() => {
    // game.settings.set n'est pas fourni par le socle (aucune suite n'écrivait de
    // réglage jusqu'ici) : les volumes globaux sont justement des réglages écrits.
    game.settings.set = vi.fn();
    game.settings.get = vi.fn((namespace, setting) => VOLUMES[setting]);
    game.user = {isGM: true};
    socket = {executeForEveryone: vi.fn()};
});

describe("core/utils/audio.utils.js", () => {

    describe("readGlobalVolumes", () => {
        it("lit les trois volumes globaux du client", () => {
            expect(readGlobalVolumes()).toEqual({music: 0.8, environment: 0.35, interface: 0.5});
            expect(game.settings.get).toHaveBeenCalledWith("core", "globalPlaylistVolume");
            expect(game.settings.get).toHaveBeenCalledWith("core", "globalAmbientVolume");
            expect(game.settings.get).toHaveBeenCalledWith("core", "globalInterfaceVolume");
        });
    });

    describe("applyGlobalVolumes", () => {
        it("écrit les trois réglages client", async () => {
            await applyGlobalVolumes({music: 0.4, environment: 0.2, interface: 1});

            expect(game.settings.set).toHaveBeenCalledWith("core", "globalPlaylistVolume", 0.4);
            expect(game.settings.set).toHaveBeenCalledWith("core", "globalAmbientVolume", 0.2);
            expect(game.settings.set).toHaveBeenCalledWith("core", "globalInterfaceVolume", 1);
        });

        it("borne les valeurs à l'intervalle accepté par le schéma", async () => {
            await applyGlobalVolumes({music: 42, environment: -3, interface: 0.5});

            expect(game.settings.set).toHaveBeenCalledWith("core", "globalPlaylistVolume", 1);
            expect(game.settings.set).toHaveBeenCalledWith("core", "globalAmbientVolume", 0);
            expect(game.settings.set).toHaveBeenCalledWith("core", "globalInterfaceVolume", 0.5);
        });

        it("laisse intact un canal absent ou illisible", async () => {
            await applyGlobalVolumes({music: 0.6, environment: "forte"});

            expect(game.settings.set).toHaveBeenCalledOnce();
            expect(game.settings.set).toHaveBeenCalledWith("core", "globalPlaylistVolume", 0.6);
        });
    });

    describe("pushGlobalVolumes", () => {
        it("diffuse les volumes du MJ à tous les clients connectés", async () => {
            await pushGlobalVolumes(socket);

            expect(socket.executeForEveryone).toHaveBeenCalledWith("applyGlobalVolumes",
                {music: 0.8, environment: 0.35, interface: 0.5});
            expect(ui.notifications.info).toHaveBeenCalledOnce();
        });

        it("ne diffuse rien si l'utilisateur n'est pas MJ", async () => {
            game.user = {isGM: false};

            await pushGlobalVolumes(socket);

            expect(socket.executeForEveryone).not.toHaveBeenCalled();
            expect(ui.notifications.warn).toHaveBeenCalledOnce();
        });

        it("signale l'absence de socket plutôt que de n'appliquer que localement", async () => {
            await pushGlobalVolumes(undefined);

            expect(game.settings.set).not.toHaveBeenCalled();
            expect(ui.notifications.error).toHaveBeenCalledOnce();
        });
    });
});
