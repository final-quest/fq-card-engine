# Caractérisation des classes

Document de référence design : ce qui définit chaque classe (identité dnd5e, stats FQ, rôle, mécaniques signature, spécialisations, contraintes), établi à partir des données réelles (`packs/_source/classes-fq8`, `decks-pattern-fq8`, `classes-stats-fq8`, `starter-heroes`, `lang/fr.json`) et du code (`src/domain`, `src/hook`).
Chiffres mis à jour le 2026-09-21 : rééquilibrage des stats de départ et des pools de stats (étape 2), puis répartition des 323 cartes des huit classes sur les niveaux N1 à N12 et lot de 4 cartes (étape 1). `npm test` est vert.

---
> ⚠️ **Document de travail temporaire.** Une fois toutes les étapes du TODO réalisées, on retire tout ce qui relève des questionnements et des TODO : ce fichier devient une **aide pour les joueurs** qui décrit chaque classe avec ses points forts et ses points faibles (voir « Fin de chantier » en bas du TODO).

### Outils de la passe (temporaires)
Deux outils ont été ajoutés pour cette passe. **Ils seront supprimés à la fin du rééquilibrage** (voir « Fin de chantier »).

| Outil | Commande | Rôle |
|---|---|---|
| Rapport des classes (`utils/class-report.mjs`) | `npm run report:classes` | Affiche en markdown les tableaux de ce fichier : stats moyennes, vue d'ensemble des cartes, exemplaires, caracs utilisées, rendement des cartes (dégâts/soins par PA). |
| | `npm run report:classes -- --out devNotes/rapport-classes.md` | Écrit le même rapport dans un fichier, pour copier les tableaux dans CLASSES.md. |
| | `npm run report:classes -- --check` | Contrôle les cibles de la passe : 30‑40 cartes distinctes N1‑N12, aucune carte hors N1‑N12, et exemplaires par niveau une fois la cible fixée (`TARGETS` en tête du script). Code de sortie 1 s'il reste des écarts. |
| | `npm run report:classes -- --extended <dir>` | Joint un autre emplacement du module d'extension (`none` pour s'en passer). Par défaut le rapport lit `../fq-card-engine-extended` s'il est installé à côté : sans lui il n'a que trois classes et le dit en tête. |
| Test d'intégrité (`tests/decks/class-deck-integrity.test.js`) | `npx vitest run tests/decks` | Tests des decks : intégrité (niveau, exemplaires, classe, image avec la bonne casse, portée, pools de stats), clés de traduction (`deck-references`), clés de paquet (`pack-keys`)… Les anomalies déjà connues sont listées dans `KNOWN_ISSUES` : **retirer chaque entrée corrigée**, le test l'exige. |
| Suite complète | `npm test` | Toute la suite (~2 min), à lancer en fin d'étape. |

## TODO Manuel
- Quand tu veux :
  - Rajouter des images
- Pour chaque classe, dans l'ordre :
  - [x] Revoir les stats FQ
  - [ ] Répartir les classes du niveau 1 à 12 plus remplir les eventuelle trous -> Sorcière (avec premier équilibrage des coûts action mana zèle) -> Moine (1)
  - [ ] IA - Points sur les coûts ET dégâts/heal et à chaque niveau ( Étape 4) 
  - [ ] Rééquilibrage manuel
  - [ ] Revoir les types d'attaques (Attaque, sauvegarde, dégâts bruts)
  - [ ] Revoir la constitution avec les dés de vie
  - [ ] Réatribuer les stats dnd5E sur les cartes (en rajouter sur les cartes qui en ont pas)
  - [ ] IA - Points sur les coûts ET dégâts/heal et à chaque niveau
  - [ ] Detection incohérence entre descriptions et ce aue fais réélement la carte
  - [ ] Vérifier la lisibilité des descriptions
  - [ ] Vérifier chaque fonctionnalité du moteur et des cartes utilisée par chaque classe.
  - [ ] Faire un inventaire des types de dégâts par classe.
  - [ ] Description ou méthodes orphelines.

### Rééquilibrage coût
- ratio **générateurs / consommateurs de zèle**
- ration consommation de resource VS dégâts ou heal entre les classes
- Equilibrage nombres d'exemplaire de cartes (entre les classes)
- [x] Transformer la grille provisoire en **grille de coûts** définitive → voir « Grille de valorisation des cartes ». 1 PA = 1,25 dégât, 1 mana ≈ 2,9 PA, 1 zèle ≈ 4,7 PA ; les effets y sont chiffrés, statut par statut.
- [ ] Plus un sort est haut en niveau plus il doit avoir un ratio cout/efficacité élevé (légèrement, il faut que les sorts de faible niveau reste interessant). La grille relève **73 cartes « dominées » par une carte de niveau inférieur** (Sorcière et Guerrier Runique exclus) : Élémentaliste 16, Gardien 14, Illusionniste 12, Moine 11, Maître d'Armes 11, Mage Blanc 5, Trapper 4. **Ce compte n'est pas une liste de fautes** : il ignore le prix d'entrée des cartes combo, qui est la première explication. À relire classe par classe en classant d'abord les cartes par profondeur de prérequis.
  - [x] **Élémentaliste** : l'échelle des combos tient (valeur/PA médiane 2,50 sans prérequis → 2,11 à un élément → 3,76 à deux éléments → 9,10 à trois exemplaires du même). Ses 16 cartes « dominées » se réduisent à deux écarts : *Cœur Du Volcan* (N11, 2,58/PA, et il paie 5 PV en plus) et *Nuée Incandescente* (N10, 2,70), tous deux sous les N5‑N6 du même palier (4,17 et 4,35) — le ventre mou est au milieu de la montée, le N12 remonte à 5,4. *Nécrose Blanche* est résolue : avec `virus` chiffré, elle passe de 1,47 à **5,74/PA**, en haut de son palier. Deux cartes restent à mesurer autrement : *Brasier Tournant* (N10, `auto`, coût ET valeur récurrents) et *Mur De Givre* (N2, sans prérequis à 5,12/PA, dont le mur infranchissable est valué 0).
  - [x] **Gardien** : progression saine, avec un creux au milieu. Valeur/PA-équivalent médiane par palier : **1,66 (N1‑3) → 0,91 (N4‑6) → 1,76 (N7‑9) → 3,07 (N10‑12)**. Le creux de N4 à N6 reste le plus marqué du jeu. *(Chiffres révisés après la règle 9 : le relevé précédent, 1,17/0,87/1,10/1,68, ne comptait pas ses 18 générateurs de zèle et concluait à tort que ses cartes de début étaient ses meilleures.)* Trois cartes tirent tout le reste vers le bas : *Onde De Choc* (N5, 2,58, bouclier requis et cibles adjacentes), *Hémorragie* (N1, 1,57) et *Renfort D‘Armure* (N1, 1,33). Les moins rentables : *Affutage* (N3, **0,25** — 4 PA pour un avantage sur un seul jet), *Changement De Posture* (N4, 0,34 et 0,70), *Soif De Sang* (N10, 0,37) et *Égide* (N9, 0,57).
    - À mesurer autrement avant d'y toucher : *Sacrifice du Gardien* (N11, 0,54 mesuré) transfère **la moitié des PV courants** en PV temporaires à un allié, soit 82 PV au N12, qui n'apparaît dans aucun champ ; *Soif De Sang* n'est jouable qu'à 20 % de vie ou moins et donne +5 dégâts jusqu'à la fin du combat ; *Chair De Titan* (N8, 0,65) baisse tous les dégâts du modificateur de Force en contrepartie de ses PV temporaires.
    - **À trancher : *Changement De Posture* (N4).** Sa description dit « Transférez jusqu'à X points d'esquive en critique **ou** jusqu'à Y points de critique en esquive », X étant la Force et Y la Constitution. Les données portent trois écarts avec ce texte :
      1. le mode 1 s'appelle « Posture défensive » mais fait `critical +@str` / `evasion −@str`, c'est-à-dire l'échange offensif ; le mode 2 s'appelle « Posture offensive » et fait `critical −@con` / `evasion +@con`, l'échange défensif ;
      2. le mode 2 porte `self: false`, donc applique le transfert **à la cible** et non au Gardien ;
      3. le texte dit « jusqu'à », donc un choix, mais `xvalue` et `yvalue` sont vides : les données appliquent @str ou @con en entier.
      Ces deux modes sont **deux des trois plus bas de tout le palier N4‑N6** (0,34 et 0,70). Tant que la carte n'est pas tranchée, le creux du Gardien ne se rééquilibre pas : il ne reste que *Chaîne De Fer* (0,60), dont la valeur est entièrement positionnelle — elle tire un ennemi de 6 cases jusqu'au contact et l'agrippe, ce que la grille vaut 0. **Les cinq autres modes du palier sont à 1,36 ou plus** : il n'y a pas de problème de réglage à cet endroit.
  - [x] **Moine** : progression correcte jusqu'au N9, puis décrochage au dernier palier. Valeur/PA-équivalent médiane après correction de *Gant De Fer* : **1,47 (N1‑3) → 1,65 (N4‑6) → 1,87 (N7‑9) → 1,23 (N10‑12)** — le N10‑12 était à 0,49 avant, soit un quart de son N7‑9. Le constat résiste au test de sensibilité sur X. *(Chiffres révisés après la règle 9 : le relevé précédent, 0,62/0,78/0,57/0,33, ne comptait pas ses 20 générateurs de zèle — les plus nombreux du jeu — et donnait une classe plate ; c'est bien le seul N10‑12 qui décroche.)*
    - À lire avec précaution : **55 % de ses modes dépendent d'un `XXX`**, deux fois la classe suivante. C'est sa signature (le rendement monte avec le tempo du tour) et c'est exactement ce que la convention X = 2 écrase. Les cinq cartes concernées sont des convertisseurs : *Paume de l'Aube* (N12, dépense X PA et rend X PV, sans plafond), *Bague de soins* (N10, soigne les PA déjà dépensés), *Sérénité Pleine* (N3, soin et esquive selon les cartes en main), *Méditation Zen* (N7) et *Transfert De Soins* (N8, transfère X de ses PV à un allié — somme nulle pour lui, positive pour le groupe).
    - Sa rejouabilité conditionnelle n'est pas dans la mesure par PA : *Coup Droit* (N1, ×6), *Coup Gauche* (N2, ×4) et *Crochet* (N8, ×3) portent `replayable: XXX` et valent deux usages pour une place en main quand le joueur a déjà dépensé 4 PA dans le tour. La main étant la ressource qui contraint, c'est là que la classe se paie : **valeur par place en main** de 6,0 à 9,0 contre 3,0 pour une carte moyenne de la classe (le quartile bas le plus faible du jeu, à égalité avec l'Illusionniste), compensé par la meilleure pioche du jeu (2,2 par tour).
    - Ses deux cartes les plus hautes sont ses moins rentables : *Paume de l'Aube* (N12, 0,09) et *Gant De Fer* (N12, 0,14, 22 PA-équivalent pour +1 dégât jusqu'à la fin du combat, ×3 exemplaires). Les dominantes sont *Sillage Curatif* (N9, 2,98) et *Déplacement Éclair* (N5, 2,14), deux cartes de déplacement traçant.
  - [x] **Maître d'Armes** : rendement en cloche, **1,15 (N1‑3) → 2,54 (N4‑6) → 1,43 (N7‑9) → 1,16 (N10‑12)** en valeur par PA-équivalent. Le pic est au N4‑6 et la fin de campagne retombe au niveau du début.
    - La cause est identifiée : **28 % de son deck de base (12 cartes) alimente le moteur de couteaux de lancer**, que la grille valorise à 0 parce que `cardBonus.knife` est une monnaie à part. Quatre cartes produisent les couteaux (*Ceinture de couteaux*, *Fourreau caché*, *Volée de couteaux*, et les quatre chaînes de *Forge*), cinq multiplient leurs dégâts (*Affûtage* +2 cumulable jusqu'à la fin du combat ×3, *Sang-froid* +6, *Lancer lesté* +4, *Momentum* +6/+4/+2, *Prise inversée* +8). Coût cumulé du moteur, exemplaires compris : **91 PA-équivalent**.
    - Le couteau coûte **0 point d'action**, est `ephemere`, et son deck généré en porte **24 exemplaires**. À +25 de bonus accumulé, il inflige 30 dégâts pour zéro PA. C'est là que la classe se paie, et aucune mesure par PA ne peut le voir.
    - Vérifié au passage : la grille pose `@wpnM`/`@wpnR` à 3,5 (dé d6) et c'est correct — `WeaponDamage.getEquippedWeaponDamageFormula` retire volontairement le modificateur de caractéristique des jetons d'arme. Les formules de `items-fq8` l'incluent (`@abilities.str.mod + 1d6`) mais il est retiré à la résolution.
    - Deux dominantes : *Chakram* (N5, 4,29) et *Attaque Diagonale* (N6, 3,36). Leur valeur repose sur la convention de 3 cibles pour une zone, alors que les deux portent une contrainte géométrique réelle (« fend un rang entier », « sur les diagonales ») que la grille suppose toujours satisfaite.
  - [x] **Mage Blanc** : monte jusqu'au N9 puis décroche, comme le Moine. Valeur/PA-équivalent médiane après correction d'*Effet Ange Et Démon* et de *Frappe de l'Éclipse* : **0,88 (N1‑3) → 1,09 (N4‑6) → 1,51 (N7‑9) → 0,98 (N10‑12)** — le N10‑12 était à 0,46 avant. Le constat tient au test de sensibilité : même en posant X = 6 marques, le N10‑12 (0,96) reste sous son N7‑9.
    - Son dernier palier est le plus cher du jeu : **32 PA-équivalent de moyenne** pour 16,2 de valeur médiane. *Effet Ange Et Démon* (N12) demande à elle seule 16 PA + 4 mana + 4 zèle, soit **46,4 PA-équivalent** — la carte la plus chère mesurée, pour 18,0 de valeur (0,39).
    - **35 % de ses modes n'ont aucun coût en PA** (16 sur 46), la part la plus haute du jeu : 9 réactives et 5 passives ou `auto`. Ses cinq cartes `auto` sont des auras qui **repaient leur coût à chaque tour** (1 mana) et se défaussent dès que le mana manque ; une mesure en un seul coup ne les voit pas. Quatre des dix modes de son palier N10‑12 sont de ce type (*Bouclier Vengeur*, *Bouclier Empathique*, *Aura de Hantise*, *Aura De Force*).
    - L'économie des marques se tient : **53 entrées posent une marque** (`curse` 22, `haunt` 31) pour **6 modes qui lisent un compteur** (*Châtiments* N1, *Jugement dernier* N2, *Profanation* N5, *Sentence maudite* N10, *Frappe de l'Éclipse* N11, *Effet Ange Et Démon* N12). Toute la valeur de ces six cartes dépend du nombre de marques présentes, posé à 2 par convention.
    - Les moins rentables : *Sentence maudite* (N10, 0,25), *Jugement dernier* (N2, 0,27), *Effet Ange Et Démon* (N12, 0,39), *Soin* (N2, 0,43) et *Frappe de l'Éclipse* (N11, 0,53, qui réduit en plus la constitution et la sagesse à 0 pendant 3 tours — un contrepoids que la grille ne chiffre pas).
  - [x] **Illusionniste** : son palier d'ouverture ressortait le plus bas du jeu (0,43), **c'était un artefact de mesure**. Relu carte par carte, il n'y a presque rien à corriger :
    - *Danse Enfiévrée* (N1) et *Inspiration Chantée* (N2) portent `replayable: @cha` — 2 charges au N1, 5 au N12 — et `nbTargets: 9999` (tous les alliés à portée 1), avec une durée à zéro donc permanente. Par **place en main**, la bonne unité pour une carte à charges, elles valent **5,4 contre 5,5 pour une carte moyenne de la classe** : elles sont à parité, et montent à 13,5 au N12.
    - *Magie Des Arcanes* (N2) et *Magie Verte* (N3) ont leur table de 1d6 — gain de zèle, copie de la carte renvoyée en main — entièrement dans `executeEval` (cf. règle 13). Elles fonctionnent, la grille ne les voit pas.
    - *Rapière Enchantée* (N3) est `passif` : elle s'installe et reste, la grille la compte une fois.
    - **Seule carte réellement faible : *Berceuse* (N3, ×1)**, à 0,36. Elle demande que la cible rate une sauvegarde de Sagesse **et** un 4 sur 1d4, pour un sommeil d'un tour qui `expireOnDamage` — il casse dès qu'elle subit le moindre dégât. Soit environ 12 % de chances d'un tour neutralisé, pour 6 PA et 1 mana.
    - Reste donc la forme générale à trancher : **0,43 → 1,96 → 1,72 → 1,34**, un plateau qui décroît après le N6.
    - Comme le Maître d'Armes, une monnaie propre : **35 % de son deck (18 modes) tient au compteur de portée**. Sept cartes l'accumulent (*Estoc perçant* ×5, *Allonge magique* ×4, *Fouet Enchanté* ×3, *Rapière Enchantée*, *Frappe Avec Salto Arrière* ×2, *Apothicaire* I et II), 120 PA-équivalent pour **+17 de portée au total** ; neuf la dépensent, 149 PA-équivalent. La grille pose la portée accumulée à 3, ce qui sous-estime tous les dépensiers.
    - Sensibilité à la portée accumulée (3 / 7 / 12) : *Orbe Grandissante* (N12) va de **0,42 à 0,80 puis 1,28**, *Frappe Illusoire* (N5) de 0,79 à 2,07, *Volée de shuriken* (N10) de 2,68 à 4,62. Ces cartes ne se jugent pas à la convention, elles se jugent sur la portée que la classe atteint vraiment en partie.
    - Une inversion qui résiste à toute hypothèse : *Volée de shuriken* (N10) reste **trois à quatre fois** plus rentable qu'*Orbe Grandissante* (N12) à tous les niveaux de portée testés, et *Passage vers le plan éthéré* (N9) plafonne à 0,62 même à portée 12, pour 19,3 PA-équivalent.
    - À confirmer : *Apothicaire II* (N8) et *Apothicaire I* (N5) ont **le même coût** (3 PA, +1 zèle), les mêmes cinq modes et le même soin `@wis+1d4`. La seule différence lue dans les descriptions est une potion échangée sur cinq (force de la terre pour I, feu pour II).
  - [x] **Trapper** : troisième classe à progresser jusqu'au bout. Valeur/PA-équivalent médiane : **1,10 (N1‑3) → 1,50 (N4‑6) → 1,47 (N7‑9) → 3,31 (N10‑12)**, et 4 cartes dominées seulement, le moins du jeu.
    - **La spé bêtes est en retrait** : 11 modes à 1,50 de valeur par PA-équivalent contre **1,95 pour les tirs et pièges** (21 modes), soit 23 % de moins. Six de ses cartes scalent sur CHA, que le Trapper porte à 6 (−2) — ce qui confirme par la mesure l'écart déjà noté dans « Caracs utilisées par les cartes ».
    - **Les pièges réactifs sont son vrai moteur** : six d'entre eux coûtent **0 point d'action** (joués hors tour), donc seulement du mana et du zèle. Même après avoir retiré les 31 % que leur coûte l'incritiquabilité (règle 10), *Piège à Fosse* (N5) sort à **7,02**, *Piège d'Affût* (N7) à 6,36 et *Piège en Chaîne* (N7) à 5,75 — trois à quatre fois la norme de la classe.
    - *Mutation virale* (N10, 5 PA + 1 mana, soit 7,9 PA-éq) délivre 38,4 là où la norme donnerait 20,8 — **4,9/PA contre 2,6 attendus**. C'est le `virus` le moins cher du jeu, et son prix d'entrée (3 poisons) est posé de façon certaine par deux de ses propres cartes. À comparer à *Virulence* (Mage Blanc N8, 5 malédictions accumulées, 1,6/PA) et à *Nécrose Blanche* (Élémentaliste N11, 27,1 PA-éq).
    - Les moins rentables : *Tir Supersonique* (N7, 0,34 — 9 PA pour 5,9 de valeur, et incritiquable), *Crocs Affûtés* (N11, 0,37), *Tir Enraciné* (N4, 0,41) et *Collet Mortel* (N11, 0,73).

## TODO détéctés
- [ ] Nouvelles cartes : clés de localisation FR/EN, illustrations, sons et visuels. **En attente** : *Lien du Fauve*, *Rémission Illusoire*, *Écho de Convalescence*, *Estoc Perçant*, *Refrain Vivifiant*, *Crescendo*, *Trait d'Ombre-Verte Mineur*, *Tir de Maître*, *Leçon Partagée* et *Leçon de Jeu de Jambes* sont encore sur `in_progress.png`.
- [ ] Reste ouvert : **dés de vie**, Élémentaliste (d4) à 52 PV au N12 contre 164 pour le Gardien.
- [ ] Reste ouvert : nettoyer l'`ItemChoice` vide de la Sorcière (`classes-fq8/witch.json`), puis retirer la ligne `pool vide :: witch.json` de `KNOWN_ISSUES`.
- [ ] ▶️ **Fin de l'étape** : `npm run report:classes -- --check` ne doit plus signaler d'écart sur le nombre de cartes (les niveaux sont faits), puis `npm test`.
- [ ] Incohérences déjà relevées :
  - [x] **Sorcière**, mesurée dans son unité : son armée rend **0,19 dégât par PA-équivalent et par tour** (264 PA-éq pour 49 dégâts/tour, tous exemplaires confondus), contre 0,66 **une seule fois** pour une carte de dégâts directs — donc rentable à partir du 4ᵉ tour. Le design se tient ; l'écart interne, lui, est de **1 à 12**.
    - *Croix De Squelettes* (N5, 4,0 PA-éq) rend **1,00** par PA-équivalent et par tour, là où *Nécromancie* (N7) rend 0,08, *Frappe Arcanique* (N6) 0,10 et *Main Sortie De Terre* (N1) 0,11.
    - *Carré De Squelettes* (N8, 22,2 PA-éq) invoque **exactement les mêmes 4 squelettes de niveau 1** que *Croix* (4,0 PA-éq), soit 5,5 fois le prix. La différence est le placement : *Croix* les pose sur les cases adjacentes à la sorcière, *Carré* une zone de 2×2 à portée 3 à max(5, 5+@cha). La grille vaut le positionnement 0 : à trancher à la main.
    - **Ses squelettes ne montent jamais** : au N12 elle invoque encore des `Skeleton lvl 1` à 1 dégât par tour (*Nécromancie* N7, *Croix* N5, *Carré* N8). La seule invocation qui scale est *Ostéologie* (N4), via le score de sacrifice plafonné à 4.
    - L'économie du sacrifice est complète : **21 modes la dépensent** (la variable la plus utilisée du jeu) contre quatre cartes qui la produisent (*Trait D’Ombre-Verte Mineur* N1 une fois sur deux, *Sortilège D’Ombre* N3, *Trait D’Ombre-Verte* N6) et surtout le sacrifice d'un sbire au charnier (`TokenHud`). Elle est remise à 0 à chaque combat (`CombatTurn.#resetAttribute`).
    - **Le jeu donne lui-même son taux de change** : cinq cartes offrent « N points de zèle OU M points de sacrifice » — 3/2 (*Écho Sépulcral* N1), 4/3 (*Rappel D’Outre-Tombe* N4, *Pacte D’Ossements* N6), 6/4 (*Exhumation* N10). Soit **1 point de sacrifice = 1,33 à 1,5 zèle = 6,3 à 7,0 PA-équivalent**, cohérent sur les quatre cartes.
  - [x] **Guerrier Runique**, mesuré dans son unité : le deck-building en combat fonctionne, et sa montée en puissance est la plus forte du jeu. *Rune du carnage* (N12, `4d10 + 3*@str + 3*@bonus.redRune`) va de **37 dégâts à vide à 97 avec 20 runes rouges** ; *Rune du rempart* (N12) de 20,5 à 80,5 en soins. C'est bien un late-game carry.
    - Deux branches sur trois sont complètes et **rigoureusement symétriques** : `redRune` et `blueRune` sont chacun alimentés par 32 effets et lus par **quatre** cartes aux mêmes niveaux (N4, N9, N10, N12) — *Saignée Runique*, *Rune d'hécatombe*, *Rune de perfection*, *Rune du carnage* pour le rouge ; *Communion Runique*, *Rune de l'éternité*, *Rune de l'insaisissable*, *Rune du rempart* pour le bleu.
    - **La branche jaune ne payait qu'au N4** — corrigé, voir « Corrections appliquées ». `yellowRune` est alimenté par 32 effets comme les deux autres, et le deck de base pousse à en tirer autant : quatre *Frappe runique jaune* (N1, N5, N8, N11) contre quatre rouges (N1, N3, N6, N9) et quatre bleues (N1, N4, N7, N10). Mais là où le rouge et le bleu ont chacun quatre lecteurs (N4, N9, N10, N12), le jaune n'en avait qu'un, *Décharge Runique* (N4) — et encore, dans son **coût** (`-max(5, 35-@bonus.yellowRune)`) et non dans sa valeur. Ses trois cartes de fin de campagne étaient **plates**.
    - *Marche du Nord* (N2) est la seule carte du jeu à **rendre** des points d'action : +5 PA et dissipe un niveau de fatigue, et elle nécessite d'avoir au moins un niveau de fatigue — donc d'avoir déjà vidé son deck une fois (cf. `CombatTurn.applyDeckFatigue`).
    - Vérifié au passage : ses `chooseCardsList` nomment `fq-card-engine.decks-pattern-fq8` alors que les decks de runes vivent dans l'extension. Ce n'est pas une erreur — `PackUtils.packsNamed` résout les paquets **par nom à travers tous les modules**, le préfixe est décoratif.


  - [ ] Moine : *Uppercut* annonce « piochez une carte » mais n'a pas de `draw`.
  - [ ] Gardien : *Frappe provocatrice*, le choix « -4 PV » coûte **aussi** 1 mana.
  - [ ] Mage Blanc : *Maudire* a `mana: 1` (gain au lieu d'un coût ?).
  - [ ] Mage Blanc : *Exorcisme* annonce « coûte @cha PA en moins » mais le coût est fixe (-7).
  - [ ] **Vérifié** : *Pluie De Flèches* (Trapper N8) annonce bien « incritiquable » sans porter de `bonusCrit`. Le même contrôle étendu aux neuf decks donne trois autres cas : *Passage vers le plan éthéré* (Illusionniste N9), *Maudire* (Mage Blanc N1) et *Réprouver* (Mage Blanc N4). Et cinq cartes portent l'inverse — un `bonusCrit` très négatif que leur description ne mentionne pas : *Plastron magique* (Élémentaliste N7), *Bouclier magique* (Mage Blanc N2), *Le Bien Et Le Mal* (Mage Blanc N6) et *Jugement dernier* (Mage Blanc N2).
  - [ ] **Casse des images** : 30 cartes et le dos du deck Moine généré pointent vers un fichier dont la casse diffère (`.png` / `.PNG`, dossier `Illusionist` au lieu de `illusionist`). Invisible sous Windows, image cassée sur un serveur Linux. Liste complète dans `KNOWN_ISSUES` du test d'intégrité.
- [ ] Caractéristiques dnd5e (tableau « Caracs utilisées par les cartes ») :
  - [ ] Illusionniste : 17 jets de toucher/sauvegarde sur **INT**, qui n'est ni primaire ni montée (INT 10).
  - [ ] Sorcière : les formules sont revenues à INT 9 / SAG 9, mais les **jets** restent sur SAG (4) plutôt que sur INT (3), alors que INT est primaire.
  - [ ] Trapper : la spé bêtes scale sur **CHA** (7 formules) alors que le Trapper démarre à CHA 6 (-2).
  - [ ] Mage Blanc : *Aura de Force* et *Exorcisme* scalent sur CHA, alors que le Mage Blanc a CHA 6 (-2).

### Corrections appliquées — Moine et Mage Blanc (2026‑10‑04)

Les deux classes qui décrochaient au dernier palier. Trois cartes corrigées, celles dont **le coût et la valeur sont tous deux dans les données** — sans dépendre d'une convention de la grille.

| Carte | Classe | N | avant | après | ce qui a changé |
|---|---|---|---|---|---|
| *Gant De Fer* | Moine | 12 | 0,27 | **1,68** | 8 PA → 6, zèle −3 → −1, `bonus.damage` 1 → 3 |
| *Effet Ange Et Démon* | Mage Blanc | 12 | 0,39 / 1,16 | **0,73 / 2,20** | 16 PA → 14, mana −4 → −2, zèle −4 → −1 (deux modes) |
| *Frappe de l'Éclipse* | Mage Blanc | 11 | 0,53 | **1,22** | mana −3 → −1, zèle −2 → retiré |

Effet sur les paliers : le N10‑12 du **Moine** passe de 0,49 à **1,23**, celui du **Mage Blanc** de 0,46 à **0,98**. Les deux restent sous leur N7‑9 (1,87 et 1,51), et le reliquat est entièrement porté par les cartes volontairement laissées de côté.

**Ce qui n'a PAS été touché, et pourquoi.** Deux familles, à trancher en partie plutôt que sur tableur :

- *Dépend de la convention sur X* : *Paume de l'Aube* (N12, convertisseur PA→PV 1:1 sans plafond), *Bague de soins* (N10 ×3), *Poings Des Cent Formes* (N10 ×2), *Sentence maudite* (Mage Blanc N10 ×2). Leur rendement monte avec X ; la grille le pose à 2, c'est-à-dire au plancher.
- *Invisible pour la grille, le paiement est dans la prose* : *Cape Inhibitrice* (N11 ×3, retire un effet néfaste pour 2 PA), *Souffle Perpétuel* (N10, **+1 zèle au début de chacun de vos tours sans plus rien payer** — un moteur permanent que la mesure vaut 0), *Fantôme Majeur* (Mage Blanc N12, lève un fantôme à +1..5 dégâts contre autant de malus).

Enfin, *Dissimulation* (N11, 2,55) et *Poing Rouge* (N12, 3,13) chez le Moine étaient déjà au-dessus de la cible : rien à y faire.

---

### Corrections appliquées — branche jaune du Guerrier Runique (2026‑10‑04)

Le rouge et le bleu portent tous deux `2*compteur` au N9, `2 + compteur` au N10 et `3*compteur` au N12. Les trois cartes jaunes des mêmes niveaux alimentaient `yellowRune` **sans jamais le lire** : elles ne récompensaient pas l'accumulation, alors que c'est tout le design de la classe. Elles le lisent maintenant, dans l'unité de la couleur — les points d'action.

La contrainte était double : brancher le compteur **et** redescendre, parce que ces cartes étaient déjà trop fortes. *Rune du zénith* sortait à **3,55** de valeur par PA-équivalent avant toute retouche, quand *Rune du carnage* (rouge, N12) est à 2,57.

| Carte | N | avant | après |
|---|---|---|---|
| *Rune de surcharge* | 9 | `action: "XXX"` | `action: "XXX + 2*@bonus.yellowRune"` |
| *Rune d'accélération* | 10 | `action.max: "6"` | `action.max: "3 + ceil(@bonus.yellowRune/4)"` |
| *Rune du zénith* | 12 | `action: "10"`, `action.max: "10"`, zèle −3 | `action: "5"`, `action.max: "6 + ceil(@bonus.yellowRune/3)"`, zèle −5 |

**Un point tous les 3 ou 4 compteurs, là où le rouge en met 3 par compteur** : un bonus d'`action.max` persiste 3 tours, donc un point y vaut trois points d'action réels, soit 3,75 dégâts équivalents. Le ratio final, comparé au rouge du même niveau :

| Carte | N | 0 rune | 5 | 10 | 20 | rouge au même N |
|---|---|---|---|---|---|---|
| *Rune de surcharge* | 9 | 0,50 | 1,00 | 1,50 | 2,50 | 1,75 |
| *Rune d'accélération* | 10 | 0,80 | 1,33 | 1,60 | 2,13 | 1,40 |
| *Rune du zénith* | 12 | 1,22 | 1,54 | 1,86 | 2,34 | 2,57 |

*Rune de surcharge* garde son coefficient plein parce qu'elle est la seule des trois à payer une contrepartie : son effet `Overload` met `action.max` à **0 pendant un tour**, soit un tour entier sans agir — 20,3 PA au N12, qui entrent dans son coût ci-dessus. Les deux autres n'ont aucun contrepoids, d'où les coefficients fractionnaires.

Les descriptions FR et EN suivent. Aucune carte créée, aucune clé de traduction ajoutée : trois cartes, cinq valeurs, six descriptions.

---

### Fin de chantier — Transformer ce fichier en aide de jeu pour les joueurs
Une fois **toutes les étapes ci-dessus réalisées**, ce document cesse d'être une note de conception et devient une **aide pour les joueurs** qui décrit chaque classe.
- [ ] Archiver dans `historique/` la version de travail complète (avant nettoyage) et le dernier `rapport-classes.md`.
- [ ] **Supprimer les outils temporaires de la passe** :
  - [ ] `utils/class-report.mjs` et le script `report:classes` de `package.json` ;
  - [ ] `tests/decks/class-deck-integrity.test.js` ;
  - [ ] `devNotes/rapport-classes.md` ;
  - [ ] ▶️ puis `npm test` pour vérifier que la suite reste verte.
- [ ] Supprimer tout ce qui relève du travail en cours :
  - [ ] ce TODO (outils et commandes compris) ;
  - [ ] les blocs « Questionnement et TODO », « À définir à la main », « Redondances à trancher », « Incohérences relevées », « Problème de caractérisation » et les mentions « À revoir » ;
  - [ ] les tableaux et sections techniques (chemins de fichiers, clés de données, hypothèses de calcul, « Constat des cartes », « Vue d'ensemble des cartes », « Caracs utilisées par les cartes », « Règles d'équilibrage »).
- [ ] Réécrire chaque classe pour un joueur : présentation, rôle, spécialisations, **points forts**, **points faibles**, caractéristiques à privilégier, style de jeu et cartes emblématiques.
- [ ] Garder un rappel des règles utile aux joueurs (stats FQ, rôle des caractéristiques) et, si utile, un tableau comparatif simple des classes.

---

## Rappel système

### Rôle des caractéristiques dnd5e

Chaque carac a un usage dominant bien tranché dans les formules de cartes. Dans les formules, `@str`, `@dex`, etc. désignent le **modificateur**.

| Carac | Usage principal | Usages secondaires |
|---|---|---|
| **@str** | **Dégâts de mêlée physiques** | Autre sort augmentant les dégâts, Critique |
| **@dex** | **Dégâts des attaques rapides et à distance** | **Portée**, Esquive, recul/déplacement, dés variables, bornes X de pioche/conversion |
| **@con** | **Points de vie** : réduction des coûts en PV, auto-soins | Régénération, résistance aux altérations d'état |
| **@int** | **Dégâts magiques directs** | Taille de zone, portée de sort, dégâts des invocations (Sorcier Squelette, Ours) |
| **@wis** | **Tout ce qui dure : DoT, effets appliqués et soins** | **Rejouabilité** (`replayable: @wis` des boucliers du Mage Blanc), durées d'effets |
| **@cha** | **Invocations**, **durée des effets** | Taunt |

#### Caracs utilisées par les cartes (decks de base, nombre de cartes qui citent la carac)

| Classe | Primaires | FOR | DEX | CON | INT | SAG | CHA | Arme (`@wpnM`/`@wpnR`) | Jets (toucher/sauvegarde) |
|---|---|---|---|---|---|---|---|---|---|
| Moine | FOR + DEX | 8 | 16 | 4 | – | 3 | 2 | – | DEX 6, FOR 4, CHA 1, SAG 1 |
| Gardien | FOR + CON | 16 | – | 20 | – | – | 3 | 8 | arme 11, FOR 3, CHA 2, CON 1 |
| Mage Blanc | CON + SAG | – | – | 4 | 8 | 15 | 2 | – | SAG 18, INT 4 |
| Élémentaliste | INT + SAG | – | 1 | – | 25 | 18 | 1 | – | INT 25, SAG 13, DEX 1 |
| Trapper | DEX + SAG | 1 | 16 | – | 3 | 6 | **7** | 10 | arme 10, SAG 6, DEX 4, CHA 2, INT 1 |
| Sorcière | INT + CHA | – | – | – | 9 | **9** | 11 | – | SAG 4, INT 3 |
| Illusionniste | DEX + CHA | 2 | 7 | 1 | 1 | 7 | 10 | 2 | **INT 17**, DEX 3, arme 2 |
| Maître d'Armes | FOR + DEX | 5 | 10 | – | – | – | 3 | 14 | arme 14, DEX 4, FOR 1 |
| Guerrier Runique | FOR + INT | 4 | – | 4 | 4 | – | – | 12 | arme 12 |

Écarts à traiter : INT pour l'Illusionniste (17 jets sur une carac ni primaire ni montée), CHA pour la spé bêtes du Trapper. La Sorcière est revenue à INT 9 à égalité avec SAG, mais ses **jets** restent sur SAG 4 contre INT 3.

### Stats FQ du personnage

| Stat | Chemin | Rôle | Montable via carte de stat |
|---|---|---|---|
| PV | `attributes.hp` | Vie ; dé de vie propre à la classe (d4 → d12) | Non (dé de vie) |
| Points d'action | `fq.action` | Capacité d'agir, remis au max à chaque round | Oui (`action-point`) |
| Mana | `fq.mana` | Ressource limitée, non régénérée par tour (repos court : + max(SAG, INT, 1) ; repos long : plein) | Oui (`mana`) |
| Zèle | `fq.zeal` | Monte en jouant des petites cartes, se dépense sur les grosses ; remis à `zeal.init` **au début du combat uniquement**, puis se cumule d'un tour à l'autre (max 8) | Oui (`zeal` → monte `init`) |
| Critique | `fq.attributes.critical` | Seuil `21 - crit - bonusCrit` sur 1d20 ; réussite = dégâts/soins doublés | Oui (`critical`) |
| Esquive | `fq.attributes.evasion` | Seuil `21 - eva - bonusEva` sur le d20 de la cible ; annule les dégâts (sauf critique adverse : dégâts simples) | Oui (`evasion`) |
| Main | `fq.cards.hand` | Cartes piochées au début du combat | Oui (`hand`) |
| Pioche | `fq.cards.pick` | Cartes piochées chaque tour | Oui (`pick`) |
| Déplacement | `movement.walk` | Mouvement (1 carte = +5 ft = +1 case) | Oui (`moving`) |
| Bonus de portée | `fq.bonus.range` | Ajouté au `maxReach` de toutes les cartes — **jamais montable**, uniquement en combat | Non |
| DOT/HOT | `fq.bonus.dot` | Dégâts (ou soins si négatif) par tour | Non |

8 types de cartes de stats existent : `action-point`, `mana`, `critical`, `evasion`, `hand`, `pick`, `moving`, `zeal`. Il n'existe **ni carte PV ni carte portée**.

**Distribution** : chaque classe reçoit au N1 ses *Start stats* (stats FQ et caracs), puis choisit **3 stats aux niveaux impairs et 2 aux niveaux pairs** (sans remise), dans **son propre pool** — 70 objets hors pioche, plus 1 à 3 objets de pioche. ASI de +2 à chaque niveau pair. L'identité FQ d'une classe tient donc à deux choses : ses *Start stats*, et ce qu'elle peut monter ou non au fil des niveaux.

Cumul des choix : 3 au N1, 5 au N2, 8 au N3, 10 au N4, 13 au N5, 15 au N6, 18 au N7, 20 au N8, 23 au N9, 25 au N10, 28 au N11, **30 au N12**.

### Stats de départ

Les neuf *starter heroes* sont strictement identiques (toutes caractéristiques à 10) ; seuls les *Start stats* de la classe (`classes-stats-fq8/start-stats-*.json`) les différencient. Budget de **10 points pour toutes les classes**.

| Classe | PA | Mana | Zèle | Crit | Esq | Main | Pioche | Dépl | Budget |
|---|---|---|---|---|---|---|---|---|---|
| **Starter hero (base)** | **7** | **2** | **0** | **0** | **0** | **0** | **0** | **5** | — |
| Moine | +2 | +2 | 0 | 0 | +2 | +2 | +1 | +1 | 10 |
| Gardien | +2 | 0 | 0 | +1 | +1 | +5 | 0 | +1 | 10 |
| Mage Blanc | +3 | +4 | 0 | 0 | +1 | +1 | +1 | 0 | 10 |
| Élémentaliste | +2 | +4 | 0 | +1 | 0 | +1 | +1 | +1 | 10 |
| Trapper | +4 | +1 | 0 | +2 | 0 | 0 | +1 | +2 | 10 |
| Sorcière | +2 | +3 | 0 | 0 | +1 | +2 | +1 | +1 | 10 |
| Illusionniste | 0 | +1 | 0 | +2 | +2 | +2 | +1 | +2 | 10 |
| Maître d'Armes | +3 | +1 | 0 | +1 | +1 | +1 | +1 | +2 | 10 |
| Guerrier Runique | +1 | +2 | 0 | +1 | +1 | +2 | +2 | +1 | 10 |

Le déplacement se compte en cases (l'effet vaut +5 ft). **Aucune classe ne démarre avec du zèle** ; le **Gardien** est le seul à ne pas piocher en début de partie, compensé par la plus grosse main du jeu (5).

### Pool de stats par classe

Le pool complet compte **100 objets** : PA 30, mana 24, critique 10, esquive 10, zèle 8, déplacement 8, main 7, pioche 3. Chaque classe en garde **70 hors pioche**, plus les objets de pioche qui lui sont laissés — les 30 retirés sont ce qu'elle ne peut pas monter, ou plus difficilement.

| Classe | PA /30 | Mana /24 | Crit /10 | Esq /10 | Zèle /8 | Dépl /8 | Main /7 | Pioche N3 | N5 | N8 | Pool |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Moine | 30 | 10 | **0** | 10 | 8 | 8 | 4 | ✓ | ✓ | ✓ | 73 |
| Gardien | 30 | 5 | 8 | 8 | 8 | 4 | 7 | ✓ | ✓ | - | 72 |
| Mage Blanc | 30 | 20 | 5 | 5 | 4 | 2 | 4 | ✓ | — | ✓ | 72 |
| Élémentaliste | 30 | 24 | 3 | 3 | 3 | 4 | 3 | ✓ | — | ✓ | 72 |
| Trapper | 30 | 16 | 10 | **0** | 4 | 8 | 2 | ✓ | ✓ | — | 72 |
| Sorcière | 30 | 18 | 6 | 4 | 6 | **0** | 6 | ✓ | ✓ | — | 72 |
| Illusionniste | 30 | 18 | 3 | 6 | 3 | 6 | 4 | ✓ | — | ✓ | 72 |
| Maître d'Armes | 30 | 16 | 8 | 4 | 4 | 4 | 4 | ✓ | ✓ | — | 72 |
| Guerrier Runique | 30 | 12 | 4 | 7 | 6 | 5 | 6 | ✓ | ✓ | ✓ | 73 |

Trois portes sont complètement fermées : le **Moine** ne monte jamais son critique, le **Trapper** jamais son esquive, la **Sorcière** jamais son déplacement (elle reste à 6 cases toute la campagne).

**Niveau minimum de chaque objet** (`system.prerequisites.level`) — le pool des PA suit exactement le cumul des choix, pour qu'un personnage puisse toujours tout mettre en points d'action :

| Stat | Objets | Répartition par niveau |
|---|---|---|
| Points d'action | 30 | 3 aux niveaux impairs, 2 aux pairs (N1 → N12) |
| Mana | 24 | N1:2 N2:2 N3:3 N4:2 N5:3 N6:3 N7:2 N8:3 N9:2 N10:2 |
| Critique, esquive | 10 chacun | 1 par niveau, N1 → N10 |
| Zèle, déplacement | 8 chacun | N1, N2, N4, N5, N6, N7, N9, N10 |
| Main | 7 | N1, N3, N4, N6, N7, N9, N10 |
| Pioche | 3 | N3, N5, N8 |

Quand une classe ne garde qu'une partie d'une stat, les objets retenus sont **répartis uniformément sur l'échelle des niveaux** (pour k objets sur n, on garde les indices `⌊j·n/k⌋`) : le premier reste accessible au N1 et les suivants s'étalent jusqu'au plafond de la stat, sans créer de trou en début de campagne.

### Niveaux des cartes
- `level` 1 à 12 : débloquée quand le niveau de la classe atteint cette valeur (les cartes neutres suivent le niveau global, somme des niveaux de classes).
- `level` 1 : en plus, **cartes de départ**. À la création du deck — quand le personnage reçoit sa première classe FQ — celles de la classe FQ **principale** y sont posées en tous leurs exemplaires ; leur total est figé comme **plancher du deck** (`system.fq.minSize`), en dessous duquel il ne peut plus descendre, et n'est plus jamais recalculé. Rien n'est verrouillé carte par carte : le joueur peut remplacer n'importe laquelle, à condition d'ajouter avant de retirer.
- **Il n'y a pas de niveau 0.** L'ancienne notion de « carte obligatoire » (N0, indéboulonnable du deck) a été remplacée par ce plancher.
- `level` 13 : hors campagne, jamais débloquée. Sert aujourd'hui de réserve de cartes « en attente ».

### Types de rôles utilisés dans ce document

- **Tank** : encaisse, provoque, protège (PV, taunt, réactions défensives)
- **DPS mêlée / distance** : dégâts directs, mono ou multi-cibles
- **Contrôle / debuff** : entraves, malus, DoT, zones
- **Soutien / soins** : buffs d'équipe, soins, boucliers
- **Invocateur** : joue à travers ses sbires
- **Moteur / scaling** : classe faible au départ qui construit sa puissance en cours de combat (ressource cumulative, deck-building, compteurs)

### Vue d'ensemble

| Classe | Dé de vie | Caracs dnd5e | Rôle | Signature |
|---|---|---|---|---|
| Élémentaliste | d4 | INT + SAG | DPS burst + debuff | 4 effets élémentaires prérequis des combos |
| Gardien | d12 | FOR + CON | Tank offensif | PV comme monnaie, zèle, charges de lame |
| Mage Blanc | d6 | CON + SAG | Soigneur / contrôleur DoT | Malédictions + boucliers réactifs + auras |
| Trapper | d8 | DEX + SAG | DPS distance / sniper | Critique-ressource, pièges réactifs, bêtes |
| Moine | d8 | FOR + DEX | Bruiser à tempo / soigneur de mêlée | Flux de cartes ↔ zèle, rejouable conditionnel, paumes de soin au contact |
| Sorcière | d6 | INT + CHA | Invocatrice | Armée de squelettes + score de sacrifice |
| Illusionniste | d6 | DEX + CHA | Contrôle / soutien hybride | Portée cumulative dépensable |
| Maître d'Armes | d10 | FOR + DEX | DPS martial polyvalent | Armes équipées (`@wpnM`/`@wpnR`), armes de jet |
| Guerrier Runique | d10 | FOR + INT | Moteur / late-game carry | Deck-building en combat (runes) |

Stats de départ notables (détail dans « Stats de départ ») : **critique** de départ nul pour Moine, Mage Blanc et Sorcière — et le Moine ne peut pas le monter du tout ; **esquive** nulle pour Trapper et Élémentaliste, le Trapper ne pouvant pas la monter non plus ; **zèle** nul pour toutes les classes ; **pioche** nulle pour le Gardien, qui n'a qu'un objet de pioche dans son pool ; **aucun point d'action** pour l'Illusionniste, qui compense par les cartes les moins chères du jeu.

### Vue d'ensemble des cartes (decks de base)
| Classe | N1 | N2 | N3 | N4 | N5 | N6 | N7 | N8 | N9 | N10 | N11 | N12 | Hors N1‑12 | Plancher deck | Total distinctes / exemplaires | Générées (dist./ex.) | Annexes (dist./ex.) | Coût moyen PA | Cartes 1‑4 PA | Réactives | Zèle + / − | Innées |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Moine | 4 | 4 | 4 | 3 | 4 | 3 | 4 | 3 | 3 | 3 | 4 | 4 | 0 | 14 | 43 / 87 | 1 / 99 | – | 5,7 | 14 | 5 | 20 / 18 | 1 |
| Gardien | 4 | 3 | 4 | 3 | 3 | 3 | 4 | 4 | 4 | 4 | 3 | 3 | 0 | 15 | 42 / 86 | 3 / 297 | – | 5,5 | 10 | 6 | 14 / 19 | 1 |
| Mage Blanc | 3 | 3 | 3 | 3 | 3 | 5 | 3 | 5 | 4 | 3 | 3 | 3 | 0 | 12 | 41 / 85 | 2 / 198 | – | 6,7 | 5 | 9 | 13 / 14 | 4 |
| Élémentaliste | 4 | 3 | 3 | 4 | 3 | 4 | 3 | 4 | 4 | 4 | 3 | 4 | 0 | 16 | 43 / 89 | 2 / 198 | – | 7,9 | 7 | 2 | 13 / 27 | 1 |
| Trapper | 3 | 3 | 4 | 4 | 3 | 3 | 3 | 4 | 3 | 3 | 3 | 3 | 0 | 9 | 39 / 74 | 0 / 0 | – | 8,1 | 5 | 9 | 17 / 16 | 1 |
| Sorcière | 3 | 3 | 2 | 4 | 6 | 4 | 3 | 4 | 4 | 3 | 3 | 3 | 0 | 10 | 42 / 86 | 1 / 99 | – | 6,6 | 6 | 1 | 5 / 17 | 2 |
| Illusionniste | 3 | 4 | 4 | 3 | 3 | 4 | 3 | 4 | 4 | 3 | 3 | 3 | 0 | 11 | 41 / 76 | 0 / 0 | – | 5,3 | 12 | 2 | 11 / 17 | 2 |
| Maître d'Armes | 4 | 4 | 4 | 4 | 3 | 4 | 3 | 3 | 4 | 3 | 3 | 3 | 0 | 12 | 42 / 88 | 12 / 46 | – | 5,5 | 20 | 3 | 14 / 22 | 5 |
| Guerrier Runique | 4 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 0 | 5 | 15 / 16 | 17 / 408 | 117 / 597 | 5,9 | 1 | 0 | 12 / 0 | 0 |

**Hors N1‑12** : plus aucune carte, les neuf decks sont rangés. **Plancher deck** : exemplaires des cartes N1, figés comme `minSize` du deck de départ — il reste à le ramener autour de 7‑8 partout (étape 4), l'Élémentaliste à 16 et le Gardien à 15 étant les plus lourds. **Annexes** : decks que le moteur *propose* en cours de partie (`chooseCardsFrom`) au lieu de les débloquer au niveau — les trois decks de runes du Guerrier Runique, dont les 117 cartes ne comptent dans aucune autre colonne. Tableau copié de `npm run report:classes` (2026‑10‑03).


### Règles générales sur les cartes
- Les dégâts de zone ne font pas beaucoup moins de dégâts que les sorts monocibles (on ne divise pas les dégâts entre les cibles)
- Environ 40 cartes différentes par deck au niveau 12 sauf guerrier runique
- **Le ratio générateurs / consommateurs de zèle n'est pas une contrainte de niveau.** Une classe n'a pas à pouvoir payer toutes ses cartes avec ses seuls générateurs, et un niveau qui n'ouvre que des consommateurs n'est pas un défaut : le zèle est une ressource que **le joueur** choisit d'alimenter, en gardant assez de cartes génératrices dans son deck pour lancer ensuite les plus puissantes. Le ratio de `npm run report:classes` sert à vérifier qu'une classe a de quoi en produire dans son catalogue, pas à équilibrer palier par palier.

### Grille de valorisation des cartes

> Section de travail : elle relève des « hypothèses de calcul » et disparaît en fin de chantier.

Mesurer une carte sur ses seuls `damage`/`heal` ne marche pas : **503 effets répartis sur 321 des 563 modes** portent une part de la puissance, et de 7 % (Élémentaliste) à 45 % (Illusionniste) des modes payants d'une classe n'ont ni dégâts ni soins. Cette grille ramène tout en **dégâts équivalents**, la seule unité commune.

#### Ancres

| Ancre | Valeur | Origine |
|---|---|---|
| 1 point d'action | **1,25 dégât** | régression sur les 134 cartes à dégâts des neuf decks |
| 1 mana | **≈ 2,9 PA** | même régression |
| 1 zèle | **≈ 4,7 PA** | même régression |
| Attaque de référence | **6 / 7 / 8 / 12** aux paliers N1‑3 / N4‑6 / N7‑9 / N10‑12 | médiane de 127 cartes mono‑cible à formule résolue |
| Soin d'une incantation | **4,5 / 5,5 / 8,8 / 19,2** aux mêmes paliers | médiane des 42 modes de soin des neuf decks |
| 1 point de vie | **1 dégât**, soit 0,8 PA | un PV payé est un PV à refaire soigner |
| 1 carte défaussée | **quartile bas des valeurs de la classe** | on jette ses cartes les plus faibles, et la main est la ressource qui contraint |
| PA max moyen | **10,3 / 14,0 / 17,5 / 21,4** aux mêmes paliers | profils de `npm run report:classes` |
| 1 point d'esquive ou de critique | **5 % d'une attaque** | seuil `21 − score` sur 1d20 |
| Avantage ou désavantage | **16,5 % d'une attaque** | espérance du meilleur de 2d20 (+3,3) |
| Zone sans division des dégâts | **3 cibles** | convention, cf. « Règles générales » |

#### Valeur des statuts du registre
X²  
Valeurs calculées au palier indiqué, d'après les effets canoniques de `StatusEffects.#REGISTRY` (`src/domain/system/effects/status-effects.js`) — c'est lui qui fait foi, pas la description de la carte.

| Statut | Effet canonique | N4‑6 | N10‑12 |
|---|---|---|---|
| `poison` | +1 dégât/tour, **durée illimitée**, se duplique → 1, 2, 3, 4… | **15** (horizon 5 tours) | 15, non borné |
| `acid` | trois effets empilés : 4 dégâts, puis 2, puis 1 | 7 | 7 |
| `burn` | +1 dégât/tour pendant 3 tours | 3 | 3 |
| `frost` | −1 PA max pendant 3 tours | 3,8 | 3,8 |
| `earth` | −1 esquive pendant 4 tours | 1,4 | 2,4 |
| `air` | −5 ft pendant 2 tours — positionnel, non chiffrable | **0** | **0** |
| `curse`, `haunt` | **aucun effet mécanique** : marque persistante comptée par les cartes combo | **0** | **0** |
| `virus` | PV max rabattus sur les PV courants jusqu'à la fin du combat : plus aucun soin ne prend. Vaut **deux incantations de soin refusées** | **11** | **38** |
| `empowered`, `exposed`, `shaken` | avantage ou désavantage sur **un seul** jet | 1,2 | 2,0 |
| `warded`, `poisoned`, `blinded`, `frightened`, `invisible` | désavantage pendant la durée de la carte | 1,2 / tour | 2,0 / tour |
| `restrained`, `grappled`, `prone` | tour partiellement perdu (0,3 tour) | 5,2 | 8,0 |
| `stunned`, `paralyzed`, `incapacitated`, `petrified`, `unconscious` | **le tour de la cible est perdu** : PA max × 1,25 | 17,5 | 26,8 |
| `charmed` | demi‑tour perdu | 8,8 | 13,4 |
| `disengaged` | ne provoque plus d'attaque d'opportunité — positionnel | **0** | **0** |

Les entraves dures valent donc plus cher que n'importe quelle carte de dégâts du jeu, et `poison` vaut cinq fois `burn` pour la même famille d'effet.

`virus` est le seul statut dont la valeur dépende de l'adversaire : deux incantations, c'est la borne basse de ce qu'un soigneur place dans les tours restants quand la carte tombe — et **zéro** si le camp d'en face ne soigne pas. Trois sorts de PNJ sur trente soignent (6,5 à 11,5 PV par incantation), aucun sbire ne régénère : c'est le MJ qui décide si la carte vaut quelque chose. On la chiffre pour le cas où elle sert, comme on chiffre un contre-sort. Les PV temporaires sont un pot séparé et ne sont pas concernés.

#### Valeur des effets libres (`changes` sans statut)

| Clé modifiée | Conversion |
|---|---|
| `system.fq.bonus.dot` | valeur × 3 tours |
| `system.fq.bonus.damage`, `system.fq.bonus.heal`, `system.rolls.damage.*` | valeur × durée |
| `system.attributes.hp.tempmax`, `system.attributes.hp.value` | 1 PV = 1 dégât |
| `system.fq.action.max`, `system.fq.action.value` | valeur × 1,25 × durée |
| `system.fq.attributes.evasion`, `system.fq.attributes.critical` | valeur × 5 % × attaque de référence × durée |
| `system.fq.zeal.*` | valeur × 4,7 |
| `system.fq.cards.pick`, `system.fq.cards.hand` | valeur × 2 × durée |
| `system.attributes.movement.speeds.walk`, `system.fq.bonus.range` | **0** — positionnel |
| `system.fq.cardBonus.*`, `system.fq.minions.*` | **hors grille** — économies propres, cf. plus bas |

#### Douze règles sans lesquelles la grille donne n'importe quoi

1. **Le déclenchement est une égalité stricte.** `CardEffect.playApplyEffectsFormulas` compare `effect.result === total` : `formula: "1d4"` avec `result: "4"` vaut **25 %**, pas « 4 ou plus ». Sur les 503 entrées, 397 sont certaines, 30 à 33 %, 22 à 25 %, 9 à 50 %, 45 dépendent d'un `XXX`. Toute valeur doit être pondérée par cette probabilité. Aucun effet n'est mort aujourd'hui : pas un `result` hors des valeurs atteignables par sa formule.
2. **Les valeurs sentinelles sont des états, pas des points.** `999999` d'esquive veut dire *intouchable*, `−999999` de bonus de dégâts veut dire *ne fait plus de dégâts*. Cinq cartes en portent (*Dissimulation*, *Garde absolue*, *Immatérialité*, *Bouclier Divin*, *Canalisation Des Ombres*). Les valoriser au prorata donne des centaines de milliers ; il faut les traiter comme la famille « immunité » : un tour adverse évité ≈ 3 attaques de référence.
3. **Un malus sur soi est un coût, pas une valeur négative.** Huit cartes s'infligent un malus par leurs effets, hors des champs `action`/`mana`/`zeal` — dont les cinq armes de jet du Maître d'Armes à −5 PA au tour suivant. Il entre au dénominateur. Sans ça, *Chakram* ressort première carte du jeu à 15 de valeur par PA, contre 4,3 en réalité.
4. **Les coûts sont parfois des formules.** 50 champs `action` ne sont pas numériques (`-8+@cha` pour *Croix De Squelettes*). Les lire comme nuls écarte 38 modes de toutes les moyennes et rend gratuites des cartes qui ne le sont pas. 65 modes, eux, n'ont réellement aucun coût en PA — réactifs, passifs ou gratuits par construction : les compter comme payants fausse l'autre bout de la moyenne.
5. **Un malus posé sur un ennemi vaut autant qu'un bonus sur soi.** Le signe du `change` dit où va l'effet, pas s'il est bon : −@int d'esquive sur la cible est un gain pour le lanceur. Le compter négativement donne des cartes à valeur négative (*Brouillard* ressortait à −12,8) et pénalise exactement les classes à debuffs — l'Illusionniste y gagne 13 points d'angle mort, le Maître d'Armes passe de 1,41 à 1,80 de valeur par PA.
6. **Les PV et les cartes sont des coûts, au même titre que les PA.** Le champ `hp` négatif (12 modes du Gardien, 49 PV en tout) et le champ `drop` (25 modes des neuf decks, jusqu'à 4 cartes) ne coûtent rien dans les champs de ressource. Les ignorer rend *Baroud D'Honneur* à 9,33 de valeur par PA-équivalent, cinq fois la norme de sa classe ; comptés, elle retombe à 0,97, dans la norme. Le Gardien et l'Élémentaliste portent presque toute cette dette.
7. **Le champ `hp` positif et un effet `tempmax` ne se cumulent pas.** `hp` remplit la réserve que `tempmax` vient d'ouvrir : le gain réel vaut une fois, pas deux. Sept modes portent les deux, dont les six cartes de PV temporaires du Gardien — *Essor Vital* ressortait à 29 de valeur pour 14 réels. Les six autres modes à `hp` positif (Moine, Mage Blanc) sont de vrais soins, sans doublon.
8. **Une durée vide vaut jusqu'à la fin du combat, pas un tour.** Le registre et les cartes écrivent `duration: ""` pour « jusqu'à la fin du combat » : c'est le cas de `poison`, `curse`, `haunt`, et de **21 changes par tour** répartis sur quatre cartes du Gardien (*Chair de Berzerker*, *Soif De Sang*, *Rage Ultime*, *Chair De Titan*), deux du Moine (*Gant De Fer*, *Posture Du Roseau*), six runes du Guerrier Runique et cinq cartes de la Sorcière. La grille retient **3 tours restants** quand la carte tombe — la borne basse, cohérente avec l'horizon de `poison`.
9. **Le mana et le zèle RENDUS sont de la valeur.** Les champs `mana` et `zeal` sont bidirectionnels comme `hp` : négatif c'est un coût, positif c'est un gain. Les neuf decks rendent **178 points de zèle et 22 de mana**, soit **1 123 dégâts équivalents** aux taux de la grille (1 zèle = 5,9 dégâts, 1 mana = 3,6). Les ignorer rend tous les générateurs de zèle gratuits en valeur et payants en coût : l'angle mort résiduel tombe de 24‑45 % à **0‑12 %** pour six classes sur sept quand on les compte, et le verdict du Gardien et du Moine s'inverse.
10. **`bonusCrit` très négatif veut dire « incritiquable », et ça coûte cher.** Le seuil étant `21 − crit − bonusCrit` sur 1d20, un `bonusCrit` de −9999 ferme définitivement le critique. Le prix dépend du critique de la classe : **31 % des dégâts de la carte pour le Trapper** (critique 6,2 au N12, le plus haut du jeu), 22 % pour le Gardien, 11 % pour l'Élémentaliste, **0 % pour le Moine** qui n'a jamais de critique. C'est donc un contrepoids auto-punitif : la classe qui s'en sert le plus est celle qui le paie le plus. La sentinelle est écrite de quatre façons dans les données (−9999, −99999, −999999, −999999999) pour un seul et même effet.
11. **Un bonus de dégâts s'applique à chaque attaque, pas une fois par tour.** `system.fq.bonus.damage` et `system.rolls.damage.*` se multiplient par le nombre d'attaques portées, pas par le nombre de tours. La grille retient **2 attaques par tour**, la borne basse (les classes jouent 2,7 à 4,8 cartes par tour). Sans ça, *Gant De Fer* valait 3 au lieu de 6, et les paliers du Gardien — qui porte six effets de ce type — étaient sous-évalués d'un tiers.
12. **Une durée à zéro vaut la même chose qu'une durée vide.** Dans Foundry, `duration: "0"` veut dire « aucune durée », donc l'effet tient jusqu'à la purge de fin de combat. Dix changes par tour sont dans ce cas, dont les buffs d'alliés de l'Illusionniste : *Danse Enfiévrée* passait de 0,18 à 0,55 de valeur par PA-équivalent une fois lue correctement.
13. **⚠️ `executeEval` n'est pas lu, et c'est la plus grosse limite de la grille.** **159 modes sur 563** (28 %) portent du script Foundry exécuté au jeu de la carte : gains de zèle, copies de carte renvoyées en main, tirages de dés à table de résultats, effets conditionnels. Toutes les classes en ont — Élémentaliste 30, Sorcière 24, Trapper 20, Mage Blanc 20, Gardien 18, Guerrier Runique 14, Moine 12, Maître d'Armes 10, Illusionniste 9. C'est l'explication de la plupart des cartes que la grille vaut 0 : *Magie Des Arcanes* et *Magie Verte* (Illusionniste) ont leur table de 1d6 entièrement là, *Leçon partagée* (Maître d'Armes) y porte 1 573 caractères. **Aucun rééquilibrage ne doit se faire sur une carte qui porte ce champ sans l'avoir lu à la main.**

#### Deux classes hors comparaison

La Sorcière et le Guerrier Runique ne se mesurent pas en dégâts par PA : leur monnaie n'en est pas une.

| Classe | Unité propre | Mesure |
|---|---|---|
| Sorcière | dégâts de sbires par tour | Chaque squelette a 10 PA et son arme en coûte 8 : il **attaque une fois par tour**, pour 1 à 10 dégâts selon son type. Tous exemplaires confondus, **264 PA-équivalent pour 49 dégâts par tour**, soit 0,19 par PA-équivalent et par tour — contre 0,66 **une seule fois** pour une carte de dégâts directs. Une invocation est donc rentable à partir du 4ᵉ tour. Second poste : le **score de sacrifice**, remis à 0 à chaque combat. |
| Guerrier Runique | runes tirées, puis compteurs de couleur | Son deck de base ne compte que **15 cartes**, dont **11 identiques** : une *Frappe runique* par niveau de N1 à N11 (7 PA + 1 mana, +1 zèle) qui tire une carte dans le deck de sa couleur. Les 117 cartes de rune sont le vrai contenu : 80 modes à effet seul, 10 soins, 9 dégâts, médiane 3 PA. Chaque rune incrémente son compteur, et des cartes de paiement le multiplient. |
| Maître d'Armes (partiellement) | bonus de couteau accumulé | **28 % de son deck de base** (12 cartes) alimente `cardBonus.knife`, que la grille vaut 0. Le couteau coûte **0 PA**, est `ephemere`, et existe en 24 exemplaires dans son deck généré. |
| Illusionniste (partiellement) | portée accumulée | **35 % de son deck de base** (18 modes) tient au compteur `fq.bonus.range`, que la grille vaut 0 à l'accumulation : 7 cartes en 17 exemplaires ajoutent +1 chacune, 9 cartes en 15 exemplaires la dépensent comme dégâts ou soins. |

La spécialisation bêtes du Trapper (4 modes d'invocation) relève de la même logique et sort de sa moyenne.

#### Ce que la grille ne voit toujours pas

| Classe | Angle mort résiduel | Classe | Angle mort résiduel |
|---|---|---|---|
| Élémentaliste | 0 % | Mage Blanc | 11 % |
| Gardien | 8 % | Moine | 12 % |
| Trapper | 8 % | Maître d'Armes | **34 %** |
| Illusionniste | 9 % | | |

C'est la part des modes payants que la grille vaut délibérément 0 : marques, déplacements, portée, pioche et défausse. Les 34 % du Maître d'Armes sont son moteur de couteaux, qui relève des économies propres. Deux réserves à garder en tête avant de conclure quoi que ce soit d'un écart entre classes :

- la valorisation du **Mage Blanc** tient à une seule hypothèse, le nombre de marques présentes quand une carte combo les consomme (2 par défaut) — toute sa courbe bouge avec ce chiffre ;
- les variables de jeu (`XXX` lu sur un script, un compteur d'états, une portée cumulée) sont posées à 2 par convention, c'est-à-dire au plancher. La part des modes qui en dépendent va de **5 %** (Maître d'Armes) et 7 % (Guerrier Runique) à 25‑34 % pour six classes, et **55 % pour le Moine** — deux fois la suivante. Une classe très exposée doit être lue avec un test de sensibilité : au Moine, passer X de 2 à 6 fait monter le palier N10‑12 de 0,33 à 0,76 de valeur par PA-équivalent. Les cartes qui en dépendent se relisent à la main, elles ne se classent pas.

---

## Gardien

> « Le plus grand nombre de points de vie du jeu. Peut puiser dans ses points de vie pour améliorer ses dégâts ou soutenir ses alliés. »

**Identité dnd5e** : d12, FOR + CON. Troisième stats CHA.

**Stats FQ** : la **plus grosse main du jeu** (5 au N1, 8 au N12) et **aucune pioche** —. 
**Le moins de mana du jeu** (2,2 au N1, 4,1 au N12, 5 objets de mana seulement) : l'alternative en points de vie n'est pas un confort, c'est sa ressource. 
Mobilité bridée (4 objets de déplacement).
Sa vraie ressource est le couple PV + zèle. **Les PV et la CA les plus élevés** (164 PV au N12, CA 18).

**Spécialisations validées** :

| Spécialisation | Principe | Nombres de cartes |
|---|---|---|
| Berzerker (dps) | utilise ses pvs pour devenir un dps redoutable | 16 |
| Sac à PV temp (tank) | A besoin de pas trop sacrifier ses pvs, Gros tank qui taunt ses ennemis | 16 |
| Ange Gardien (soutien) | Utilise surtout ses PVs pour buff ses alliés, Fais plus de dégâts si ses alliés réussissent | 11 |
| *(transverse)* | Changement de Posture, la seule innée | 1 |

**Mécaniques signature** :
- **PV comme monnaie** : Frappe Héroïque (−(6−@con) PV au lieu du mana), Frappe provocatrice, Montée de la rage (PV → mana), Offrande de Sang, Fureur Sacrificielle, et tout le versant Ange Gardien (Cri de Ralliement, Chœur de Guerre, Transmission de Rage, Sacrifice du Gardien, Aura du Gardien).
- **Chargement** : trois cartes à compteur, une par spécialisation, toutes bâties sur le même patron — un seul choix, `replayable: "99999999"` (rechargeable **plusieurs fois par tour**, contrairement à `passif`), compteur dans `flags.fq`, et au cap le script **défausse la carte** et **génère une carte éphémère** du deck `Guardian Generated`. Le surplus de charge est perdu.
  - Chargement Des Lames — charge en **PA**, cap 12 → *Lame Chargée* (grosse frappe au contact).
  - Tourbillon De Lame — charge en **PA**, cap 8 → *Tourbillon Déchaîné* (AoE adjacente).
  - Serment de Sang — charge en **points de vie**, cap 20 → *Bénédiction du Rempart* (PV temporaires à tous les alliés).
- **Avantage plutôt que critique** : Affûtage (sur soi) et Élan Partagé (sur un allié qui vient de frapper), via le statut `empowered`.
- **PV temporaires, et rien d'autre** : Renfort d'Armure, Chair de Titan, Intervention, Levée de Bouclier, Rempart Magique, Vigueur Intacte, Essor Vital, Baroud d'Honneur, Frappe d'Ancrage, Agrippe Salvatrice, Bouclier Partagé, Sacrifice du Gardien, Bénédiction du Rempart. Les deux formules à dé (Essor Vital, Baroud d'Honneur) tirent leur dé **une seule fois** dans l'`executeEval`, qui écrit le même total dans le soin et dans le `tempmax` — sans quoi les deux se désynchronisent.
- **Agripper des alliés ou des ennemis** (pas de déplacement supplémentaire, plutôt des choses pour attraper) : Chaîne de Fer (ennemi) et Agrippe Salvatrice (allié), toutes deux via la macro `IronChain`.
- **Écho des alliés** : le Gardien tire sa puissance des réussites de son équipe. Réactifs déclenchés pendant les tours des autres — Écho du Sang (`targetsDealtDamageThisRound`), Élan Partagé, Bouclier Partagé (`targetsTookDamageThisRound`), Intervention : ce sont eux qui redressent l'économie de zèle de la classe. Et **Frappe Inspirée**, la seule carte à dégâts de la classe dont la puissance dépend des autres : `xvalue` compte, dans les logs du round, les combattants **de votre camp** (le lanceur exclu) ayant infligé des dégâts FQ effectifs, et ajoute 3 par allié.
- **Réactions défensives** : Coup de bouclier (contre-charge), Intervention (prend les dégâts d'un allié à sa place), Levée De Bouclier (récupère la moitié des dégâts subis), Bouclier Partagé (prend la moitié à la place d'un allié), Garde Absolue.
- **Sous égide / garde brisée** : `warded` (Égide, Agrippe Salvatrice, Sacrifice du Gardien, Aura du Gardien) et `exposed` (Brèche).
- **Postures et trade-off crit ↔ esquive** : Changement De Posture (innée, rejouable à l'infini) — **la seule carte de la classe qui touche encore au critique ou à l'esquive**. Posture De Berzerker et Rage Ultime (puissance contre auto-DoT), Chair de Titan / Chair de Berzerker.
- **Taunt** : Frappe provocatrice, Onde de Choc (et hors classe : Uppercut du Moine, runes bleues du Guerrier Runique). ⚠️ Le taunt n'est aujourd'hui **qu'un message de chat** (`FQCARDENGINE.CardMsgTaunting`) : aucune contrainte mécanique, c'est le MJ qui l'applique.

**Boucle de jeu** : frapper pour générer du zèle, payer en PV ce que le mana ne couvre pas, encaisser/réagir hors tour, basculer protecteur (Rempart Magique, Intervention, Essor Vital) en fin de combat.

**Faiblesses** :
- Le moins de points de mana
- Pas de critique ou d'esquive bonus dans les cartes hormis le trade-off de *Changement de Posture*
- Tank qui ne se soigne pas (uniquement PV temporaires), les pv perdus sont perdus.
- A du mal à arriver au contact d'une cible (pas de sort pour augmenter le déplacement, uniquement pour agripper des ennemis)

### Constat des cartes (données)
- **41 cartes réparties sur N1‑N12** (3 à 4 par niveau), coût moyen 5,1 PA et 11 cartes à 1‑4 PA.
- 3 cartes **générées** dans `guardian-generated.json` (Lame Chargée, Tourbillon Déchaîné, Bénédiction du Rempart), toutes éphémères.
- Exemplaires : 75 au total, plus 32 exemplaires générés.
- Zèle : 13 générateurs pour 17 consommateurs (contre 6/15 avant le lot), grâce aux réactifs de l'Ange Gardien et aux petites frappes.
- Aucun soin réel ni HOT dans le deck : les 12 cartes du deck de base qui rendent des PV les rendent toutes en **temporaires** (13 avec la Bénédiction du Rempart, générée).
- Beaucoup de cartes coûtent 1 mana (Frappe Héroïque ×6, Hémorragie ×4, Brèche, Égide, Coup Puissant…) : l'alternative PV est indispensable avec 2,2 mana au N1 et 4,1 au N12 (5 objets de mana dans son pool).

### Redondances à trancher
- Bonus de dégâts contre auto-dégâts : Posture de Berzerker / Chair de Berzerker / Rage Ultime / Soif de Sang.
- Payer en PV : Offrande de Sang / choix PV de Frappe Héroïque.

### Incohérences relevées
- L'image d'Essor Vital est référencée avec une casse qui ne correspond pas au fichier (`KNOWN_ISSUES`).

**Questionnement et TODO :**
- Hemmoragie doit avoir un coup en PV alternatif
- Offrande de sang fais plus de dégâts si saignement
---

## Mage Blanc

> « Le meilleur soigneur et protecteur, mais ses malédictions peuvent infliger d'importants dégâts également. »

**Identité dnd5e** : d6, CON + SAG (les deux requises) ; INT s'ajoute en pratique (dégâts radiants, boucliers réactifs, 8 cartes) — classe structurellement étalée sur 3 caracs. CHA à 6 (-2).

**Stats FQ** : **le 2e meilleur mana du jeu** (6,8 au N1, 14,3 au N12, 20 objets de mana) et le meilleur budget d'action de départ (+3). **Déplacement le plus faible et quasi figé** (5,1 au N1, 5,8 au N12 : 2 objets de déplacement seulement) — il ne bougera jamais. Peu de zèle montable (4 objets), CA 8.

**Spécialisations validées** :

| Spécialisation | Principe | Nombres de cartes |
|---|---|---|
| Mage Blanc (healeur et soutien) | Fais des soins et utilise des aura pour soigner et buffé ces alliés | 16 |
| Malédictions (dps) | utilise des stacks de malédictions pour faire d'importants dégâts | 12 |
| Hanteur (dps spécial) | Consomme les malédictions et/ou réduits ses stats de dégâts et de heal pour contrôler d'autres tokens dans un tour bonus | 8 |
| *(transverse)* | Exorcisme, Infusion de Mana, Sang Bleu, Absorption de Sort, Lumière Révélatrice | 5 |

**Mécaniques signature** :
- **Malédiction (`Curse`)** : pose plusieurs stacks sur des cibles, permet d'utiliser d'autres sorts efficaces avec beaucoup de stacks surtout pour être utilisé avec Jugement dernier. Tue une cible ayant suffisamment de malédictions (Jugement Dernier).
- **Hantise (`Haunt`)** : seconde marque empilable, distincte de la malédiction et qui ne se confond jamais avec elle. Elle ne fait aucun dégât : elle ouvre la **prise de contrôle**. À 5 hantises, le *Fantôme* — une COPIE de la cible, sur sa case, jouée par le Mage Blanc le temps d'un seul tour puis dissipée. *Profanation* convertit les malédictions en hantises, une pour une, ce qui relie les deux spécialisations.
- **Suite de boucliers réactifs** : 8 des 9 réactives de la classe (Bouclier de Mana, Divin, Vengeur, Empathique, Réprouver, Soins d'Urgence, Ange Gardien, Absorption de Sort ; la neuvième, Voile de Cendres, relève de la Hantise), Bouclier de Mana avec `replayable: @wis`. Trois modèles de mitigation distincts : PV temporaires, soin réactif répété, invulnérabilité + restauration (Bouclier Divin).
- **Transmutation de ressources** : Sang Bleu (2 PV → 1 mana), Le Bien Et Le Mal (transfert de PV à portée quasi illimitée), Soins d'Urgence (défausse → soin), Infusion de Mana (source de mana passive permanente), Absorption de Sort.
- **Générateur de mana** : Infusion de Mana.
- **Beaucoup de cartes automatiques** : les auras qui coûtent 1 mana par tour, à combiner avec les infusions de mana.

**Boucle de jeu** : maudire tôt → laisser tourner les DoT en soignant/réagissant → détoner ; alimenter le tout par conversion de ressources.

**Faiblesses** :
- Lent (5 cases), fragile au contact (CA 8)

### Constat des cartes (données)
- **40 cartes réparties sur N1‑N12**, coût moyen 6,0 PA et 7 cartes à 1‑4 PA. Deux cartes de trop pour la cible de 30‑40 : l'élagage reste à faire.
- Seulement 2 cartes à 1‑4 PA.

**Questionnement et TODO :**
---

## Moine

> « Adepte d'un jeu très dynamique : joue beaucoup de cartes différentes pour monter rapidement son zèle. Robuste, score d'esquive élevé. »

**Identité dnd5e** : d8, FOR + DEX. CON alimente les coûts et les PV temporaires. ⚠️ **SAG reste plate à 8 (−1)** et n'est jamais montée par les ASI : toute formule en `@wis` rend *moins que rien* au Moine. Les soins du lot 2026‑09‑20 sont donc écrits en **DEX**, la vraie carac de la classe ; ne restent en `@wis` que l'appoint historique de Paume De Jade et le `@wis` de Sérénité Pleine, tous deux à reprendre.

**Stats FQ** : **la meilleure esquive du jeu** (2,4 au N1, 6,1 au N12) et de quoi jouer plusieurs petites cartes par tour (10,2 PA au N1, 21,3 au N12, 30 objets d'action dans son pool, 41 % du total). **Aucun critique, jamais** : c'est la seule classe dont le pool n'en contient aucun — il joue le volume, pas le burst. Déplacement correct mais plus le meilleur du jeu (6,3 au N1, 9,3 au N12) ; mana bridé (10 objets).

**Spécialisations proposées (à valider)** :

| Spécialisation | Principe | Nombres de cartes |
|---|---|---|
| Enchaînement (dps tempo) | Enchaîne des petites frappes rejouables pour monter son zèle, puis le dépense dans des cartes qui scalent | 11 |
| Main pleine (dps de ressource) | Garde ses cartes au lieu de les jouer : plus la main est pleine, plus ses cartes frappent | 8 |
| Paume (soutien) | Soigne au contact en frappant, à portée 1, sans jamais quitter la mêlée | 7 |
| *(transverse)* | Tank esquive et mobilité : encaisse en esquivant plutôt qu'en PV, et se replace sans cesse | 13 |

Détail des cartes :

| Spécialisation | Principe | Cartes existantes | Manques |
|---|---|---|---|
| **Enchaînement** (cadence, frappes) | Petites frappes rejouables qui montent le zèle, puis consommateurs scalables | Coup Droit, Coup Gauche, Combo, Combo 2, Lame Fantôme, Uppercut, Cadence, Élan Martial, Cycle du Souffle, Vacuité, Gant de Fer, **Crescendo** | Finisher N10‑12 |
| **Main pleine** (garde les cartes) | X = cartes restant en main : plus la main est pleine, plus les cartes frappent | Poings des Cent Formes, Paume des Mille Feuilles, Sérénité Pleine, Ferveur Intérieure, Hyperactivité, Lecture du Souffle, Second Souffle, Maître du Chi | Carte défensive qui scale sur la main |
| **Paume / soins au contact** | Soigne en frappant, à portée 1, sans jamais quitter la mêlée | Paume Curative, Paume De Jade, Sillage Curatif, Bague de Soins, Transfert de Soins, Méditation Zen, Vive-Esquive | Soin de groupe au contact, N8+ |
| **Tank esquive / mobilité** *(transverse)* | Encaisse en esquivant plutôt qu'en PV, et se replace sans cesse | Posture du Roseau, Sérénité Pleine, Dissimulation, Bouclier Zélé, Interruption, Déplacement Éclair, Sillage Curatif, Pas du Vide, Charge, Souffle de Ki, Poing Rouge, Souffle Perpétuel, Armes Secrètes, Cape Inhibitrice, Conversion | Provocation autre qu'Uppercut |

**Mécaniques signature** :
- **Économie de zèle fermée** : générateurs spammables (Coup Droit ×6, Coup Gauche ×5, Uppercut ×6, Paume Curative ×4, Posture du Roseau ×3, +1 chacun) → consommateurs scalables (Combo, Combo 2 non borné, Souffle de Ki, Méditation Zen, Paume De Jade).
  - Poing Rouge monte `zeal.max` (+5, permanent) ; *Crescendo* (N3, ×2) fait de même pour +1 chacun contre 1 zèle — carte reprise à l'Illusionniste le 2026‑09‑28.
- **Soigner au contact, en frappant** : c'est le seul soigneur de mêlée du jeu, tous ses soins sont à portée 1 (Paume Curative, Paume De Jade, Bague de Soins, Transfert de Soins) ou sur la trajectoire d'un déplacement (Sillage Curatif). Depuis le lot 2026‑09‑20, deux étages : **Paume Curative** (3 PA, aucun mana, petit soin fixe, **+1 zèle**) est un générateur spammable au même tempo que Coup Droit ; **Paume De Jade** (l'ancienne Paume Curative, améliorée : X jusqu'à 3, +2 au soin de base, et le Moine se soigne de SAG au passage) est le gros soin à zèle dépensé.
- **Le pendant soin du déplacement** : Déplacement Éclair (dégâts) et **Sillage Curatif** (soins) partagent la macro `FlashMove` et le même `customEval` d'alignement — deux faces d'une même mécanique, l'une traverse des ennemis, l'autre des alliés.
- **PV temporaires, et rien d'autre, pour l'auto-soin de tempo** : Méditation Zen rend ses PV en **temporaires pendant 1 tour** (patron du Gardien : le `hp` soigne, l'effet monte `hp.tempmax` de la même formule). Le vrai soin personnel passe par Vive-Esquive (réactif), Sérénité Pleine, Sillage Curatif et l'appoint en X de Paume De Jade.
- **Flux de cartes** : Souffle de Ki (zèle → X cartes **et** 2X actions), Maître Du Chi (carte innée passive bidirectionnelle : défausse ↔ zèle ↔ pioche), Armes Secrètes (X cartes défaussées → autant de dégâts inesquivables).
- **Rejouable conditionnel scripté** (unique au Moine) : Coup Droit/Gauche rejouables **une fois** seulement si assez de PA ont déjà été dépensés ce tour (4 / 5) — récompense l'**ordonnancement** des cartes.
- **Esquive plutôt que PV** : c'est la seule classe à gagner de l'esquive **définitivement** (Posture du Roseau, +1 par exemplaire, sans durée comme le Poing Rouge), au prix de −1 à tous ses dégâts pendant 1 tour. Sérénité Pleine y ajoute un pic d'esquive égal à la main restante jusqu'au prochain tour : les deux axes « main pleine » et « tank esquive » se rejoignent enfin sur une carte.
- **Défense réactive** : 4 réactives (Bouclier Zélé sur sort subi, Vive-Esquive sur dégâts, Armes Secrètes, Interruption qui retire 1d6 PA et entrave) + Dissimulation (intouchable 1 tour au prix de dégâts nuls, puis fenêtre offensive).
- **Déplacement améliorable** : Déplacement Éclair, Sillage Curatif, Pas du Vide, Charge.
- **Taunt** : Uppercut seul (⚠️ comme chez le Gardien, le taunt n'est qu'un message de chat, appliqué par le MJ).

**Boucle de jeu** : enchaîner les petites frappes et les petites paumes → zèle → convertir en cartes/actions/burst ou en gros soin ; l'ordre de jeu dans le tour est la compétence clé.

**Faiblesses** :
- **Aucun critique, et aucun moyen d'en gagner** : son pool n'en contient pas un seul.
- Son déplacement de départ est tombé à 6,3 cases : il ne survole plus le terrain, il doit monter la stat pour retrouver sa mobilité.
- Sérénité Pleine (et l'appoint `@wis` de Paume De Jade) scalent encore sur SAG, sa caractéristique la plus basse (−1) et jamais montée : ils rendent moins que leur libellé ne le laisse croire.
- Doit rester au contact pour soigner : aucun soin à distance, aucun soin de zone.
- Son auto-soin de tempo (Méditation Zen) ne rend plus que des PV temporaires : ce qui dépasse est perdu au bout d'un tour.

**Questionnement et TODO :**
---

## Élémentaliste

> « Allie des effets de feu, de givre, d'air et de terre pour infliger d'importants dégâts. Fragile mais possède les plus gros dégâts bruts du jeu. »

À revoir :

| Élément ou statut | Sauvegarde |
|---|---|
| feu, foudre, acide, force, radiant, tranchant, perforant ; brûlure | DEX |
| froid, tonnerre, poison, nécrotique ; givre, virus, poison | CON |
| psychique ; malédiction, charmé, inconscient | SAG |
| contondant ; agrippé, marque d'air | FOR |

**Identité dnd5e** : d4, INT + SAG (les deux requises). INT pour les dégâts directs, givre et terre ; SAG pour le feu et l'air. Assassin du Néant utilise DEX (12).

**Stats FQ** : **le meilleur mana du jeu** (7,0 au N1, 16,0 au N12, les 24 objets de mana) — c'est la seule classe qui garde le pool de mana en entier. En échange, presque tout le reste est rogné : critique, esquive, zèle et main à 3 objets chacun, et **les PV les plus bas** (18 / 28 / 52).

**Rôle** : DPS magique « glass cannon », mono-cible burst avec pivot AoE (Météore, Onde glacée, Choc de feu), contrôle/debuff en sous-produit.

**Spécialisations proposées (à valider)** — **la seule classe à 4 spécialisations, une par élément** :

| Spécialisation | Principe | Nombres de cartes |
|---|---|---|
| Feu (dps sur la durée) | Empile les effets de brûlure : peu de dégâts directs, beaucoup de dégâts par tour cumulés | 5 |
| Givre (contrôle de tempo) | Gèle une cible unique : ses sorts coûtent plus cher, elle perd ses points d'action | 5 |
| Terre (dps mono-cible) | Les plus gros dégâts sur une seule cible, qu'il cloue au sol en lui retirant son esquive | 4 |
| Air (dps multi-cible) | Frappe plusieurs cibles à la fois, les repousse et leur retire du déplacement | 5 |
| *(combos)* | Les 6 paires d'éléments : 10 cartes exigent les **deux** éléments sur la même cible, 6 acceptent l'un **ou** l'autre | 16 |
| *(transverse)* | Utilitaires : mana, pioche, report d'action, seule défense de la classe | 8 |

**Les spés se combinent, c'est la particularité de la classe** : 16 cartes sur 43 — plus du tiers du deck — sont des cartes de paire, dont 10 restent injouables tant que les deux éléments ne sont pas actifs sur la même cible. Un Élémentaliste ne joue donc jamais une seule spé : il en amorce deux au premier tour pour ouvrir la troisième carte. Détail élément par élément et paire par paire plus bas.

**Mécaniques signature** :
- Feu : plus de dégâts sur la durée, plus de cumul avec xvalue : dégâts de durée sur 5‑6 tours. Petits dégâts, plein de DoT (2 effets en moyenne)
- Givre : réduire les points d'action : faible chance de placer un effet de givre, mono-cible (0,33 effet en moyenne)
- Terre : réduire l'esquive, bloquer, réduire la portée : gros dégâts mono-cible (1 effet en moyenne)
- Air : réduire le déplacement des cibles : dégâts multicibles (0,67 effet en moyenne)
- Feu + Terre : les plus gros dégâts mono-cible ou quelques cibles
- Feu + Air : plein d'effets de brûlure et d'air
- Feu + Givre : mono-cible, transfert d'effets ?
- Terre + Air : plein de dégâts à plein de cibles accentués
- Terre + Givre : plein de dégâts à ceux qui ont des effets de givre en priorité
- Givre + Air : altération d'état (Brouillard)

**Boucle de jeu** : tours 1‑2 amorçage (poser les éléments, accumuler zèle) → tours 3+ détonation (combos verrouillés par prérequis).

**Faiblesses** :
- Le moins de points de vie (d4)
- Faible déplacement et esquive, doit rester à distance

### Constat des cartes (données)
- **43 cartes, la classe la plus fournie**, réparties sur N1‑N12 (4 par niveau jusqu'au N8) : coût moyen 7,8 PA, seulement 7 cartes à 1‑4 PA. Trois cartes de trop pour la cible de 30‑40 : il faut **continuer à en retirer**, pas en ajouter.
- **16 cartes de paire d'éléments** : 10 exigent deux éléments actifs sur la MÊME cible, 6 acceptent l'un ou l'autre (Brouillard, Givrefeu, Météore, Plastron Magique, Onde Glacée, Choc de Feu). S'y ajoutent 3 utilitaires « nécessite 1 élément parmi 3 », 4 ultimes mono-élément, et 2 cartes conditionnées au NOMBRE d'effets (Assassin du Néant, Missiles Magiques +).
- Zèle déséquilibré : **9 générateurs pour 25 consommateurs**, avec un zèle initial de 0,1 au N1 et 1,3 au N12 (3 objets de zèle dans son pool).
- Seulement 3 cartes à 1‑4 PA ; coût moyen 7,3 PA ; 6 cartes à 9 PA ou plus.
- Défense quasi absente : Plastron Magique, Repli du Souffle, Captation de Mana.

### Spécialisations — cartes par spé
| Spé | Cartes mono-élément | Ultime |
|---|---|---|
| **Feu** | Trait de Feu, Main Brûlante, Traînée Ardente, Attiser les Braises | Boule de Feu *(promue)* |
| **Givre** | Frappe de Givre, Stalactite Géante, Zéro Absolu, Mur de Givre | Éternité Glaciaire |
| **Terre** | Fracture Terrestre, Jet de Roche, Colosse de Pierre | Sépulcre de Pierre |
| **Air** | Tornade, Tourbillon, Bourrasque de Dégâts, Bourrasque de Répulsion | Cyclone |

Combos par paire d'éléments (à réduire à ~2 par paire) :

| Paire | Cartes |
|---|---|
| Feu + Givre | Givrefeu, Fusion des Extrêmes |
| Feu + Terre | Météore, Calcination, Cœur du Volcan |
| Feu + Air | Choc de Feu, Nuée Incandescente, Brasier Tournant |
| Terre + Air | Brouillard (air **ou** terre), Vent de Gravats, Convergence Tellurique |
| Terre + Givre | Permafrost, Plastron Magique (terre **ou** givre) |
| Givre + Air | Onde Glacée, Givre des Synapses, Nécrose Blanche |

Utilitaires / transverses : Magie des Éléments (innée), Captation de Mana, Incantation, Propagation des Dégâts, Assassin du Néant, Missiles Magiques +, Lecture des Courants, Repli du Souffle.

**Questionnement et TODO :**
---

## Trapper

> « Classe à distance spécialisée dans les attaques critiques, accompagnée de son familier, ou qui peut poser des pièges redoutables. »

**Identité dnd5e** : d8, DEX + SAG. CHA est le levier du build « maître des bêtes » (stats des minions, 7 cartes), alors que le Trapper démarre à CHA 6 (-2). INT reste marginal.

**Stats FQ** : **le plus de points d'action du jeu** (12,2 au N1, 23,5 au N12) et **le meilleur critique** (2,4 / 6,2, les 10 objets) : le sniper transforme les deux en portée et en dégâts. **Aucune esquive, jamais** — son pool n'en contient aucune, la classe doit rester loin. **Main quasi nulle** (0,1 au N1, 0,8 au N12, 2 objets) : il ne commence pratiquement jamais un combat avec une carte, tout passe par la pioche.

**Rôle** : archer/DPS très longue portée, sous-thèmes invocateur (Louve N1, Ours N7) et contrôleur de terrain (pièges, entraves).

**Spécialisations proposées (à valider)** :

| Spécialisation | Principe | Nombres de cartes |
|---|---|---|
| Sniper (dps critique) | Transforme son score de critique en ressource et tire de très loin, d'autant plus fort qu'il reste immobile et seul | 14 |
| Pièges (contrôle) | Pose des réactifs qui se déclenchent hors de son tour quand l'ennemi approche, entravent et empoisonnent | 12 |
| Maître des bêtes (invocateur) | Joue à travers son familier : l'améliore avant de l'invoquer, le soigne pour le garder en vie, ou le saigne pour frapper lui-même | 13 |

**Mécaniques signature** :
- **Le critique comme ressource** : buffs (Tireur d'Élite, Ajustage de Tir inné), conversion (Retrouver des Forces vend du critique contre du mana), et surtout les **pièges dont les dégâts scalent sur le score de critique** (`2d(critique)`) tout en étant incritiquables.
- **Portée extrême** : `maxReach` formulés (`10+@dex`, `7+@dex`), Tir Supersonique à portée illimitée ; **coût en action = distance** (`xvalue: reach`) sur Tir Précis et Supersonique.
- **Spécialiste du réactif** (9 réactives, record du jeu) : Piège à Pointes / Empoisonné — 0 action, 1 mana, déclenchés par `targetsWithinReach` quand un ennemi approche.
- **Auto-handicap comme ressource** : Embuscade (vide tous les PA → +@wis dégâts cumulable), Tir Enraciné (convertit le déplacement en dégâts + auto-immobilisation).
- **Bêtes** : Louve Apprivoisée, Ours Enragé, Faucon de Chasse, Tortue Géante, jouant après le tour du Trapper, scaling `@cha`. **Lien du Fauve** (lot du 2026‑09‑20) est la seule carte de la classe qui rende des points de vie — à une bête, jamais au Trapper.
- Zones distance (rectangle 3×3, ligne, cercle), entraves (Traquenard, repoussée du Tir Supersonique), DoT poison.

**Boucle de jeu** : préparer le tir (buffs de critique, embuscade), sécuriser la zone (pièges), déléguer le contact aux bêtes, décharger à longue portée.

**Faiblesses** :
- Pas d'esquive
- Pas d'attaque corps à corps
- **Aucun soin ni PV temporaire sur lui-même** : avec le Maître d'Armes, la seule classe dont le deck ne protège jamais ses propres points de vie (Lien du Fauve ne soigne que la bête).

### Spécialisations — cartes par spé
| Spé | Cartes existantes | Manques |
|---|---|---|
| **Sniper / critique** | Tir Précis, Tir Précis II, Tireur d'Élite, Ajustage de Tir, Tir Supersonique, Tir Enraciné, Tir Transperçant, Embuscade, Retrouver des Forces, Étude du Point Faible, Chasseur Solitaire, Double Flèche, Pluie de Flèches, Tir Explosif | Finisher N10‑12 |
| **Pièges** (réactifs, poison) | Piège à Pointes, Piège Empoisonné, Piège en Chaîne, Collet Mortel, Piège d'Affût, Piège à Fosse, Hallali, Réserve de Pièges, Traquenard, Tir Réflexe, Tir Empoisonné, Mutation Virale | Carte peu chère de pose |
| **Maître des bêtes** | Louve Apprivoisée, Ours Enragé, Faucon de Chasse, Tortue Géante, Sifflet du Chasseur, Meute, Dressage, Crocs Affûtés, Instinct de Chasse, Ordre d'Attaquer, Saignée du Fauve, Offrande Sauvage, **Lien du Fauve** | Caractéristique à trancher (CHA -2) |

### Incohérences relevées
- ~~Tir Précis II au niveau 21.~~ → fait : redescendu au N13 avec la spé Sniper, et retiré de `KNOWN_ISSUES`.
- Pluie de Flèches « incritiquable » sans `bonusCrit`.
- Ours Enragé (16 PA) et Tireur d'Élite (10 PA pour un buff) très chers au regard des 12,2 PA du N1.


**Questionnement et TODO :**

---

## Sorcière

> « Un mage puissant. Sa force réside dans le nombre de squelettes qu'elle ranime pour détruire ses adversaires. »

**Identité dnd5e** : d6, INT + CHA. **SAG est plus utilisée que INT dans les cartes** (9 contre 3 : Afflux, Mauvais Œil, Sortilège d'Ombre, Explosion d'Ombre…) : écart fiche/deck à trancher.

**Stats FQ** : **déplacement figé à 6 cases pour toute la campagne** — son pool n'a aucun objet de déplacement, elle reste derrière son armée. Bon mana (5,8 au N1, 12,5 au N12, 18 objets) et bonne main (2,2 / 4,5), CA 8, 19 PV. Coûts d'action réduits par les caracs (`−8+@cha`, `−7+@wis`) : les caracs rendent le kit moins cher.

**Rôle** : invocatrice / commandante d'armée à montée en puissance exponentielle — faible au premier tour, écrasante en fin de combat.

**Spécialisations proposées (à valider)** :

| Spécialisation | Principe | Nombres de cartes |
|---|---|---|
| Armée (invocateur) | Invoque de la piétaille en attaquant, puis buffe la masse : plus il y a de squelettes en jeu, plus elle est forte | 17 |
| Colosse (invocateur solo) | Passe son armée au charnier en rituels pour faire naître un Squelette Géant de plus en plus gros | 9 |
| Charnier (dps) | Sacrifie squelettes et défausse pour lancer elle-même des sorts directs et récupérer ses cartes | 12 |

**Mécaniques signature** :
- **Armée** : les cartes d'invocation pure (Main Sortie de Terre, Levée d'ossements, Croix / Carré de Squelettes, Nécromancie, Ostéologie) et la seule attaque qui invoque encore, Frappe Arcanique. Les deux Traits d'Ombre-Verte ont quitté ce rail : ils alimentent le charnier. Paliers : Skeleton lvl 1‑2 → Giant Skeleton → Skeleton Sorcerer (capstone N7, mini-nécromancien autonome). Piétaille plafonnée à 6 ; le Sorcier en fait partie.
- **Le squelette géant** : a son propre TYPE de sbire (`giantSkeleton`), donc son propre plafond de 1 hors des 6 de la piétaille, et il est le seul bénéficiaire des cartes de rituel. Mais il reste de FAMILLE `skeleton` (`CardFqSystem.MINION_FAMILY`) : les sorts qui dopent « tous vos squelettes » le prennent, et les comptages d'armée le comptent. Type = emplacement d'invocation, famille = genre de créature — c'est la seule créature où les deux divergent.
- **Rituels d'invocation** : des cartes qui ne font RIEN sur le champ de bataille — elles alimentent `system.fq.minions.giantSkeleton.{hp,damage,movement}`, compteurs que `Minion.statBonus` relit à l'invocation SUIVANTE du Squelette Géant. Faible coût (Éclats d'os, Crocs d'ivoire, Talons d'ossements : 1‑2 points de sacrifice), moyen (Onction de moelle : 2‑3), élevé (Couronne d'ossements, Sceptre de l'ossuaire, Marche funèbre : 3‑4, avec une seconde face jouable sur le Géant DÉJÀ en jeu ; Hécatombe d'ossements : 5‑8, soit une armée entière passée au charnier). Ces bonus tombent avec les effets FQ à la fin du combat.
- **Le charnier se remplit de deux façons** : aucune carte ne détruit de sbire (hors Déplacement Morbide qui l'exige), le joueur sacrifie ses squelettes au bouton du HUD de jeton — réduire son armée pour dépenser gros reste un choix de tour. Mais trois cartes créditent désormais le compteur sans passer par l'armée : Trait d'Ombre-Verte Mineur (1 chance sur 2 de +1), Trait d'Ombre-Verte (+1d3) et Sortilège d'Ombre (+1d2), par `executeEval`. `fq.minions.sacrificedMinion` est remis à zéro au début de chacun de ses tours : tout ce qui est gagné doit être dépensé dans le tour.
- **Score de sacrifice** (`fq.minions.sacrificedMinion`) : compteur-ressource de tour, consommé par Ostéologie (invoque un squelette de niveau = sacrifices, cap 4), Afflux De Vie/Mana, Déplacement Morbide, les rituels du Géant, et le choix 2 des cinq cartes de la ligne charnier (2 à 4 points chacune).
- **Comptage de l'armée** (`SCRIPT:` sur les tokens « Skeleton ») : Afflux D'Agilité (esquive), Afflux De Pouvoir (actions), Rituel Du Sang (zèle) — plus l'armée est grande, plus la sorcière est forte.
- **`targetType: Skeletons`** : buffs de masse dédiés (Bouclier D'Os, Canalisation Des Ombres — invulnérabilité 1 round —, Forme d'Ombre, Déplacement Morbide, Ossature Renforcée, Fureur des Morts, Apothéose Macabre).
- Défausse en coût d'appoint (Sortilège d'Ombre, Rituel Du Sang) et en carburant (Offrande de Cendres : X cartes défaussées → dégâts) — la ressource centrale reste le **sacrifice**.
- **La ligne charnier (récupération de défausse = buff de dégâts)** : les cinq cartes qui ramènent une carte de la défausse posent en plus un effet sur la sorcière qui écrit dans `system.fq.bonus.damage` — lu par `Damage.getFormulaWithBonus`, donc appliqué à TOUS ses jets de dégâts, pas aux seuls sorts de la ligne. Chacune porte **deux choix** qui ne diffèrent QUE par la monnaie : choix 1 le zèle, plus cher mais accumulé sur tout le combat ; choix 2 le score de sacrifice, moins cher mais à produire dans le tour même. Aucune ne se paie en mana seul :

| Carte | N | × | Choix 1 — zèle | Choix 2 — sacrifice | Bonus de dégâts | Durée |
|---|---|---|---|---|---|---|
| Écho Sépulcral | 1 | 2 | 3 | 2 | `+@int` | 1 round |
| Rappel d'Outre-Tombe | 4 | 2 | 4 | 3 | `+@int+1d4` | 1 round |
| Pacte d'Ossements | 6 | 2 | 4 (+ 4 PV) | 3 (+ 4 PV) | `+@int` | 2 rounds |
| Récolte Macabre | 8 | 1 | 5 | 3‑4 | `+3` en zèle, `+XXX` en sacrifice | 1 round |
| Exhumation (2 cartes) | 10 | 1 | 6 | 4 | `+(2*@int)` | 2 rounds |

  Le choix sacrifice porte le garde `minionsAtLeast("sacrificedMinion", N)` et sa borne `xmin`/`xmax` ; le choix zèle n'a ni l'un ni l'autre, et laisse `ResourceHandler` refuser la carte faute de zèle. Les deux choix partagent le nom d'effet : le joueur ne gagne rien à alterner les monnaies sur la même carte.

  Les noms d'effet sont distincts : enchaîner deux cartes de la ligne cumule les deux bonus. C'est le seul rail de la classe où INT pèse plus que SAG.

**Boucle de jeu** : invoquer en attaquant → sacrifier → recycler en mana/PV/actions/zèle → réinvoquer plus gros. Aucune défense personnelle : l'armée est le rempart.

**Faiblesses** :
- ~~Vite à court de mana~~.
- **Déplacement figé à 6 cases** sur toute la campagne : aucun objet de déplacement dans son pool.
- Peu de points de vie

### Constat des cartes (données)
- **39 cartes réparties sur N1‑N12**, le Colosse n'ouvrant qu'au N6 : coût moyen 6,8 PA et 5 cartes à 1‑4 PA (elle n'en avait aucune avant la passe). *Trait d'Ombre-Verte* est passé de 9 à 3 exemplaires, doublé par un *Trait d'Ombre-Verte Mineur* (×5) qui alimente le charnier au lieu de l'armée.
- **Aucune carte à 1‑4 PA** parmi les débloquables ; coût moyen 8,1 PA (le plus élevé) pour 8,5 PA au N1 : **une carte par tour au N1**.
- 3 cartes distinctes au N1 : Main Sortie De Terre (×3, 2 zèle et aucune action), Trait d'Ombre-Verte Mineur (×5) et Écho Sépulcral (×2).
- 4 générateurs de zèle pour **16** consommateurs depuis que les cinq cartes de la ligne charnier offrent un choix payé en zèle (3, 4, 4, 5, 6). Le zèle n'étant remis à son `init` qu'au premier round, il s'accumule sur tout le combat, et c'est précisément la soupape : un tour sans armée à sacrifier reste jouable. Mais 22 points de zèle si la ligne entière passe par le choix 1, avec Rituel Du Sang pour seul générateur de volume, reste à surveiller.

**Questionnement et TODO :**

---

## Maître d'Armes

> « Expert de tout l'arsenal : ses cartes frappent avec l'arme du moment, au corps à corps comme à distance. »

**Identité dnd5e** : d10, FOR + DEX (3e : CHA). DEX domine (tirs, armes de jet), FOR sur les frappes de mêlée.

**Stats FQ** : le profil le plus étalé du jeu — un point dans presque tout au départ (+3 action, +2 déplacement, +1 mana, critique, esquive, main et pioche), et un pool sans trou : 8 objets de critique, 4 d'esquive, de zèle, de déplacement et de main, 16 de mana.

**Rôle** : DPS martial polyvalent sur deux rails parallèles — mêlée (`@wpnM`) et distance (`@wpnR`) — plus un rail d'armes de jet.

**Spécialisations proposées (à valider)** :

| Spécialisation | Principe | Nombres de cartes |
|---|---|---|
| Mêlée (dps contact) | Frappe avec l'arme de mêlée équipée, en mono-cible ou sur toutes les cases autour de lui | 12 |
| Distance (dps distance) | Le même kit reporté sur l'arme à distance équipée : tirs lents, lourds, et une zone | 8 |
| Armes de jet (dps de ressource) | Fabrique des couteaux gratuits et les gonfle sans limite, plus cinq armes de jet uniques | 14 |
| *(transverse)* | Instructeur : porte les dégâts d'arme ou l'esquive d'un allié à un plancher fixe | 5 |

**Mécaniques signature** :
- **Coût en mana** : la plupart des attaques coûtent 1 mana (Attaque Simple, Tir Simple, Fente Précise, Visée Posée, Frappe Double…), alors que la classe n'a que 3,5 mana au N1.
- **Buffs d'arme fenêtrés** : Huile d'affûtage (mêlée), Prise équilibrée (distance), Maîtrise des armes (les deux, 3 rounds) — tour de setup puis burst.
- **Carte qui s'améliore en carte coûtant de plus en plus cher jusqu'à faire de gros dégâts** (Forges spectrale, éthérée, astrale, arcanique)
- **Carte qui duplique une autre carte en main** (Réplique parfaite, le seul à pouvoir faire ça)
- **Tous les buffs/malus durent 1 tour**
- **Moteur couteaux de lancer** : Ceinture de couteaux (−3 PA, −1 zèle) fabrique 3 cartes *Couteau de lancer* **gratuites** (jusqu'à ×24), boostées par Affûtage des couteaux (`@bonus.knife`, cumulable), Sang-froid, Momentum, Lancer lesté, Prise inversée, Volée de couteaux.
- **Armes de jet uniques** (5 innées, une fois par combat, malus de PA au tour suivant) : Javelot, Plumbata, Chakram, Filet de rétiaire, Kpinga ; Choix de l'Arsenal en fait revenir une.
- **Soutien (Charisme)** : Leçons d'estoc / de visée (dégâts d'arme d'un allié portés à 5 + CHA, plus fort pour les faibles jets), Leçon d'esquive (esquive portée à 7) + réduit l'esquive à 0 ?, Leçon de jeu de jambes (déplacement porté à 8 cases), Leçon partagée (donne une carte de sa main à un allié).
- Le seul à avoir des sorts faisant des dégâts d'armes touchant plusieurs cibles (Attaque Latérale, Diagonale, En Cercle, Pluie d'acier) — à vérifier : Illusionniste (Volée de shuriken, sans arme), Guerrier Runique (Frappe vindicative) et Gardien (Tourbillon de Lame, `@wpnM`).

**Boucle de jeu** : réunir les bonnes cartes pour faire de gros dégâts au corps à corps OU à distance OU monter les couteaux de lancer OU …

**Faiblesses** :
- Pas de heal personnel
- Pas d'amélioration personnelle d'esquive par les cartes (⚠️ Leçon d'esquive a une portée minimale de 0 : elle peut se cibler soi-même)

### Constat des cartes (données)
- **42 cartes réparties sur N1‑N12** (3 | 4 | 5 | 4 | 3 | 4 | 3 | 3 | 4 | 3 | 3 | 3) : les deux rails d'arme au N1, le moteur couteaux au N2, l'instructeur au N3, et les cinq armes innées aux N3, N5, N6, N8 et N10. Coût moyen 5,3 PA et **20 cartes à 1‑4 PA, la plus grande densité du jeu**.
- 12 cartes générées (couteaux, étapes des forges), 46 exemplaires.
- 88 exemplaires, dont **9 au N1** : c'est le plancher du deck de départ, au‑dessus de la cible de 7‑8. Zèle 13 générateurs / 18 consommateurs ; 3 cartes réactives, 5 armes innées.
- **Au‑dessus de la cible des 30‑40 cartes** (42) et le N3 est à 5 cartes : la prochaine carte ajoutée doit en faire sortir une, et deux candidates attendent dans « Redondances à trancher ».
- Lot du 2026‑10‑02 — trois cartes, **illustrations, visuels et sons à faire** :
  - *Tir de Maître* (N11, ×1) — 16 PA, 2 mana, −3 zèle, portée 4 à 16 cases, le triple des dégâts de l'arme à distance plus la Dextérité, **inesquivable**. Le finisher distance qui manquait. Le rail mêlée s'arrête toujours à *Frappe Triple* (N10), et **aucune carte ne fait de dégâts au N12**.
  - *Leçon Partagée* (N3, ×2) — 4 PA, −1 zèle, portée 1 à 6 : donne une carte de la main à un allié, qui la jouera avec **ses propres** caractéristiques. Première carte du jeu à déplacer une carte d'une main à une autre : `executeEval` + `passCards` en MJ par socketlib, faute de champ dédié dans le schéma.
  - *Leçon de Jeu de Jambes* (N4, ×2) — 4 PA, −1 zèle : déplacement d'un allié porté à 8 cases (40 ft, `upgrade`) pendant 2 tours. Ouvre l'instructeur avant le N7.

### Spécialisations — cartes par spé
| Spé | Cartes existantes | Manques |
|---|---|---|
| **Mêlée** | Frappe Simple, Fente Précise, Frappe Double, Frappe Triple, Huile d'Affûtage, Riposte, Attaque Latérale, Attaque Diagonale, Attaque en Cercle, Forge Spectrale, Forge Astrale, Reprise de Garde | Finisher au N12 (le rail s'arrête à Frappe Triple, N10) |
| **Distance** | Tir Simple, Visée Posée, Tir Appuyé, Prise Équilibrée, Riposte à Distance, Pluie d'Acier, Tir de Maître, Forge Éthérée, Forge Arcanique | |
| **Armes de jet** | Ceinture de Couteaux, Affûtage des Couteaux, Fourreau Caché, Sang-froid, Volée de Couteaux, Momentum, Lancer Lesté, Prise Inversée, Javelot, Plumbata, Chakram, Filet de Rétiaire, Kpinga, Choix de l'Arsenal | |
| **Instructeur** (soutien CHA) | Leçon Partagée, Leçon de Jeu de Jambes, Leçon d'Esquive, Leçon d'Estoc, Leçon de Visée, Maîtrise des Armes, Réplique Parfaite | |

### Redondances à trancher
- Frappe Simple / Fente Précise et Tir Simple / Visée Posée (même dégâts, +1 PA pour un bonus au toucher) — atténué par le rangement : les variantes à bonus sont au N4, trois niveaux après les cartes de base, et se lisent donc comme des montées en gamme.
- Six buffs de couteaux sur le même axe : Sang-froid, Momentum, Lancer Lesté, Prise Inversée, Affûtage, Volée.
- Quatre chaînes de forge (2 mêlée, 2 distance).

**Questionnement et TODO :**

---

## Illusionniste

> « Un combattant et soutien/healeur qui ne cesse d'augmenter sa portée au cours du combat. »

**Identité dnd5e** : d6, DEX + CHA. Classe la plus multi-carac du jeu : SAG (potions, mana), FOR/`@wpnM` (frappes), CON (Peste Noire). **17 jets de toucher/sauvegarde utilisent INT**, qui n'est pas primaire (INT 10) : à corriger ou à assumer.

**Stats FQ** : **aucun point d'action de départ**, ce qui en fait la classe qui en a le moins (8,3 au N1, 19,5 au N12) — ses cartes sont aussi les moins chères du jeu. En échange, **le meilleur couple critique + esquive de départ** (+2 et +2, soit 2,1 et 2,2 au N1) et une bonne mobilité (7,3 / 9,5). Critique et zèle bridés à 3 objets dans le pool. La **portée n'est achetable nulle part** — c'est précisément sa mécanique : elle se construit en combat.

**Rôle** :
- Dégâts corps à corps (bonus de portée)
- Soutien hybride (bonus de portée), sorts qui marchent avec toutes les classes
- Healeur à réaction et spé HOT (derniers dégâts)

**Spécialisations proposées (à valider)** :

| Spécialisation | Principe | Nombres de cartes |
|---|---|---|
| Lame d'allonge (dps) | Empile du bonus de portée avec des cartes bon marché, puis le convertit en dégâts | 13 |
| Barde (soutien, **healeur**) | Buffe l'équipe en continu — critique, esquive, dégâts, potions, invulnérabilité — et la maintient debout avec des **soins sur la durée** (HOT) plutôt qu'avec des gros soins d'urgence | 12 |
| Chronomancien (contrôle et soins) | Manipule l'espace, le temps et les effets : renvoie les dégâts subis, déplace les figurines, copie les effets | 14 |

**Mécaniques signature** :
- **Bonus de portée**
- **Cartes de manipulation d'espace** : peut bouger des cibles autres que lui (Passage éthéré, Cage de Rappel, Illusion de Maître de Jeu, Illusion Infranchissable)
- **Cartes de manipulation temporelle** : soins des derniers dégâts subis, soins HOT (Frappe Temporelle, Miroir, Bombe à Retardement, Piège de Retour dans le Temps, Soins Expansifs, Rémission Illusoire, Écho de Convalescence)
- **La portée comme ressource cumulative** (`fq.bonus.range`) : gains fiables (Allonge magique, Fouet Enchanté, Salto Arrière), aléatoires (Rapière Enchantée 1d2), temporaires (Potion d'allonge). Puis des cartes la dépensent ou la scalent : dégâts (Frappe Illusoire, Volée de shuriken, Prise En Traître), **taille de zone** (Volée de shuriken : cône de `2+portée`), DoT (Nuage de dague), conversion (Illusion De Caractéristiques : portée → critique/soins/mana).
- **Une zone qui scale sur un `xvalue` calculé exige que la POSE le calcule aussi** : `ZoneTargeting.resolveCardContent` ne substituait X que depuis les valeurs saisies au dialogue (`fd`), si bien qu'un `xvalue` — jamais saisi, puisque le choix le fixe — posait la zone avec X à 0 pendant que les dégâts, résolus plus tard, comptaient la vraie valeur. La pose calcule désormais `xvalue`/`yvalue` comme le jeu ; c'est la condition pour écrire une taille de zone en `XXX` sur n'importe quelle carte.
- **Trois `xvalue` distincts** : bonus de portée, distance réelle à la cible (Orbe Grandissante `XXXd6`, Passage éthéré, Bombe à Retardement), nombre de cibles (Succion De Mana).
- **Soutien d'équipe réel** : Inspiration Chantée (+crit, rejouable @cha fois), Danse Enfiévrée (+esquive), Inspiration Effrénée, Apothicaire I/II (potions), Immatérialité (invulnérabilité 1 tour).
- **Soins sur la durée (HOT)** : le Barde ne soigne pas d'un coup, il **installe la guérison**. Le patron est toujours le même — aucun soin immédiat, un effet qui pose `system.fq.bonus.dot` en **négatif** (un DoT retourné) pour quelques rounds : Soins Expansifs (`-(6+2*@wis)` sur 1 round), Rémission Illusoire (`-(ceil(@cha/2))` sur 3 rounds), Écho de Convalescence (`-(1 + portée)` sur 2 rounds, jusqu'à 3 cibles). C'est le pendant exact de Nuage de Dague, le DoT de la classe, qui utilise le même champ en positif.
- **Manipulation d'effets** : Peste Noire (duplique tous les effets FQ de la cible), Contagion (échange les effets de deux cibles), Images Miroir (esquive +@dex jusqu'au premier coup).
- **Contrôle** : Regard Envoûtant (charme), Berceuse (sommeil).
- Conversions : Vases communicants (mana ↔ 4 actions), zèle généré par 7 cartes et dépensé par 19.

**Boucle de jeu** : empiler la portée avec des cartes bon marché qui rendent du zèle → encaisser les payoffs → soutenir l'équipe en continu.

**Problème de caractérisation**
- Soutien un peu trop similaire au maître d'armes
- Bien différencier les soins des autres soigneurs : Moine (corps à corps) et Mage Blanc (soins directs et bouclier)

**Faiblesses** :
- Moins de dégâts ?
- Le moins de PA au N1

### Constat des cartes (données)
- **41 cartes réparties sur N1‑N12**, le Chronomancien ouvrant au N5 : coût moyen 5,2 PA et 13 cartes à 1‑4 PA. Une carte de trop pour la cible de 30‑40 depuis le lot du 2026‑09‑21 (*Estoc perçant*, *Refrain Vivifiant*) ; *Crescendo* est passée au Moine le 2026‑09‑28.
- 12 cartes à 1‑4 PA ; coût moyen 4,8 PA, le plus bas du jeu — cohérent avec ses 8,3 PA au N1, le plus bas aussi.
- 7 générateurs de zèle pour 19 consommateurs.
- *(résolu par le lot du 2026‑09‑20)* Magie des Arcanes est rattachée au dps (Lame d'allonge), **Magie Verte** au soutien (Barde) : elles ne sont plus « à reclasser ». *Magie Blanche* a été renommée **Magie Verte** le 2026‑09‑21 (clé `FQCARDTITLE.GreenMagic`, image `GreenMagic.png`) ; son `_id` technique `illWhiteMagic001` est conservé.

### Cartes du lot 2026‑09‑20
Le Barde devient explicitement le **healeur HOT** de la classe. Deux cartes ajoutées, toutes deux sans soin immédiat, et les deux cartes N12 rangées dans une spé.
- **Rémission Illusoire** (N8, ×2) — 4 PA, 1 mana, **+1 zèle**, portée 0‑2. La cible récupère `ceil(@cha/2)` PV au début de chacun de ses tours pendant 3 tours. Petite carte, générateur de zèle : la classe en manquait (6 générateurs pour 18 consommateurs avant le lot). **Illustration à faire** (sur `in_progress.png`).
- **Écho de Convalescence** (N9, ×1) — 6 PA, 1 mana, 1 zèle, jusqu'à 3 cibles à 4 cases. Chacune récupère `1 + bonus de portée` PV par tour pendant 2 tours. Elle branche le soin sur la **ressource signature** de la classe : nulle au premier tour, forte une fois la portée empilée. **Illustration à faire**.
- ⚠️ Les deux sont écrites en **@cha**, pas en `@wis` : la SAG de l'Illusionniste reste plate à 10 (+0) et n'est jamais montée, alors que le CHA passe de +2 à +5. Les soins historiques (Soins Expansifs, potions de vie de l'Apothicaire) scalent encore sur `@wis` et rendent donc moins que leur libellé ne le laisse croire — même piège que le `@wis` du Moine, à reprendre.

### Spécialisations — cartes par spé
| Spé | Cartes existantes | Manques |
|---|---|---|
| **Lame d'allonge** (mêlée qui scale sur la portée) | Fouet Enchanté, Frappe avec Salto Arrière, Frappe Illusoire, Allonge Magique, Rapière Enchantée, Prise en Traître, Volée de Shuriken, Nuage de Dague, Orbe Grandissante, Shuriken, Shuriken Empoisonné, Illusion de Caractéristiques, Magie des Arcanes, **Estoc Perçant** | Finisher N8‑12 |
| **Barde** (soutien, healeur HOT) | Inspiration Chantée, Danse Enfiévrée, Inspiration Effrénée, Apothicaire I, Apothicaire II, Immatérialité, Vases Communicants, Succion de Mana, Soins Expansifs, Magie Verte, Rémission Illusoire, Écho de Convalescence, **Refrain Vivifiant** | Sorts d'assistance (voir TODO) |
| **Chronomancien / manipulateur** | Passage vers le Plan Éthéré, Peste Noire, Contagion, Frappe Temporelle, Miroir, Distorsion, Bombe à Retardement, Cage de Rappel, Illusion de Maître de Jeu, Piège de Retour dans le Temps, Illusion Infranchissable, Regard Envoûtant, Berceuse, Images Miroir | Cartes N8‑N11 |

### Incohérences relevées
- Jets sur INT (non primaire).
- Orbe Grandissante coûte 14 PA : hors de portée avant le N6‑N7 en moyenne.


**Questionnement et TODO :**
- Reprendre en `@cha` les soins historiques restés en `@wis` (Soins Expansifs, potion de vie de l'Apothicaire I et II) : SAG 10 plate, jamais montée.
- Si vous faites un critique, vous pouvez augmenter votre bonus de portée de 1 ?
- Si vous faites une esquive, vous pouvez augmenter votre bonus de portée de 1 ?
- Sort d'assistance : (2 de portée) (coût : 1 point de zèle ou 1 carte défaussée) (doublon avec le moine, ou seulement sur les alliés alors ça va ?)
  - Peut agripper quelqu'un pour le ramener sur une case adjacente, lui rend 1d4 points de vie.
  - Peut pousser quelqu'un de X cases dans un sens (X étant le bonus de portée), lui rend 1d4 points de vie.
  - Peut se téléporter vers une case adjacente d'un allié (2 de portée), lui rend 1d4 points de vie.

---

## Guerrier Runique

> « DeckBuilder : entre en combat avec très peu de cartes ; ses runes en génèrent de nouvelles au fil de l'affrontement, rendant son deck de plus en plus puissant. »

*Hors périmètre de la passe 30‑40 cartes (structure particulière).*

**Identité dnd5e** : d10, FOR + INT (3e : CON) — frontliner qui frappe au corps à corps (`@wpnM`).

**Stats FQ prioritaires** : **la meilleure pioche et la 2e meilleure main du jeu** (2,1 / 3,2 de pioche, les 3 objets de pioche gardés ; 2,2 / 4,5 de main) — c'est ce qui alimente son deck-building en combat. Un point de critique et d'esquive au départ, mais peu montables (4 et 7 objets) ; PA modestes (9,2 au N1) et mana bridé à 12 objets.

**Rôle** : moteur / late-game carry. Départ délibérément faible (deck de base : 15 cartes distinctes, 16 exemplaires), montée en puissance par deck-building en cours de combat.

**Spécialisations proposées (à valider)** :

| Spécialisation | Principe | Nombres de cartes |
|---|---|---|
| Rouge (dps) | Dégâts et critique, améliorés par la Force ; ultime : immortel à 1 PV | 43 (4 frappes runiques + 39 runes) |
| Jaune (tempo) | Actions et déplacement, améliorés par l'Intelligence ; ultime : 35 d'action, réduits par les runes jaunes déjà jouées | 43 (4 frappes runiques + 39 runes) |
| Bleu (tank) | Soins personnels, esquive et regain de mana, améliorés par la Constitution ; ultime : régénération par rune bleue jouée | 43 (4 frappes runiques + 39 runes) |
| *(transverse)* | Rune du Hasard, Marche du Nord (seule carte à dissiper la fatigue), Appel des Runes | 3 |

Soit **132 cartes distinctes** : les 15 du deck de base et les 39 runes de chacune des 3 couleurs (N1 à N12).

**Mécaniques signature** :
- **Seules les frappes runiques qui génèrent des runes consomment du mana**
- **Gravure = deck-building en combat** : les cartes de gravure proposent N runes d'une couleur au choix
- Seule classe à pouvoir diminuer la fatigue (Marche du Nord) (la fatigue augmente et provoque des dégâts quand on repioche)
- **Identité des trois couleurs** (39 cartes par couleur, N1 à N12) :
  - **Rouge** = dégâts ET critique ; abilité améliorante : Force
    - Ulti : immortel avec 1 PV, dégâts augmentés par les runes rouges, coûtant 8 de zèle
  - **Jaune** = actions ET déplacement ; abilité améliorante : Intelligence
    - Ulti : coûtant 35 d'action, réduit par le nombre de runes jaunes jouées
  - **Bleu** = tank : soins personnels et esquive + regain de mana ; abilité améliorante : Constitution
    - Ulti : regagne X points de vie par tour, X étant le nombre de runes bleues jouées, coûtant 6 de mana

**Faiblesses** :
- Pas de sort de dégâts à distance (hors Rune de mort, portée 2)
- Pas de sort multi-cible (très peu d'exceptions)
- Pas de réactif
- Aucune pioche hormis des pioches en défaussant sur 3 runes jaunes

**Questionnement et TODO :**

---
