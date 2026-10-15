/**
 * Les trois volumes globaux de Foundry : le canal, tel qu'il est nommé dans la
 * barre de la liste de lecture, vers le réglage client qui le porte.
 */
const VOLUME_SETTINGS = {
    music: "globalPlaylistVolume",
    environment: "globalAmbientVolume",
    interface: "globalInterfaceVolume"
};

/**
 * Lit les trois volumes globaux de ce client.
 *
 * @returns {{music: number, environment: number, interface: number}} Les volumes, de 0 à 1.
 */
export function readGlobalVolumes() {
    return Object.fromEntries(Object.entries(VOLUME_SETTINGS)
        .map(([channel, setting]) => [channel, game.settings.get("core", setting)]));
}

/**
 * Pose des volumes globaux sur ce client. Ces réglages sont de portée « client » :
 * ils vivent dans le navigateur de chaque utilisateur et ne peuvent pas être
 * écrits depuis la base, d'où la diffusion par socket. Enregistrée dans socketlib
 * (`applyGlobalVolumes`).
 *
 * @param {object} [volumes] - Les volumes à poser, de 0 à 1. Un canal absent ou
 *                             non numérique laisse le réglage local intact.
 * @param {number} [volumes.music]       - Le volume de la musique.
 * @param {number} [volumes.environment] - Le volume de l'environnement.
 * @param {number} [volumes.interface]   - Le volume de l'interface.
 *
 * @returns {Promise<void>}
 */
export async function applyGlobalVolumes(volumes = {}) {
    for (const [channel, setting] of Object.entries(VOLUME_SETTINGS)) {
        const volume = Number(volumes[channel]);
        if (!Number.isFinite(volume)) continue;
        // Les réglages sont des AlphaField : une valeur hors [0, 1] venue du
        // socket serait rejetée par le schéma.
        await game.settings.set("core", setting, Math.min(Math.max(volume, 0), 1));
    }
}

/**
 * Aligne les volumes globaux de tous les clients connectés sur ceux du MJ.
 * Point d'entrée des macros : `FqCardEngineModule.audio.pushVolumes()`.
 *
 * @param {object} [socket] - L'instance socketlib du module (`executeForEveryone`).
 *
 * @returns {Promise<void>}
 */
export async function pushGlobalVolumes(socket) {
    if (!game.user.isGM) {
        ui.notifications.warn(game.i18n.localize("FQCARDENGINE.MacroMsgVolumesGMOnly"));
        return;
    }
    if (!socket) {
        ui.notifications.error(game.i18n.localize("FQCARDENGINE.MacroMsgVolumesNoSocket"));
        return;
    }
    const volumes = readGlobalVolumes();
    await socket.executeForEveryone("applyGlobalVolumes", volumes);
    ui.notifications.info(game.i18n.format("FQCARDENGINE.MacroMsgVolumesPushed", {
        music: Math.round(volumes.music * 100),
        environment: Math.round(volumes.environment * 100),
        interface: Math.round(volumes.interface * 100)
    }));
}
