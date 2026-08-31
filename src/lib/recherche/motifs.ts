/**
 * POURQUOI IL N'Y A RIEN À CHERCHER — LE MOTIF, SON TITRE ET SON TEXTE, écrits une seule
 * fois pour les deux écrans qui les rendent : `/recherche` (V-08) et la palette.
 *
 * « Une recherche sans requête n'est pas une recherche sans résultat » : quatre causes,
 * quatre phrases, et chacune NOMME l'adresse ou la commande qui débloque. Les textes
 * étaient écrits dans `V-08.svelte` ; la palette les aurait recopiés, et la copie aurait
 * vieilli — l'écran resté sur l'ancienne aurait nommé un geste que l'autre ne nomme plus.
 *
 * CE MODULE NE LIT NI LA BASE NI LE MOTEUR : il part au navigateur avec la palette. Le
 * verdict, lui, se prend côté serveur — `$lib/recherche/vide`.
 */
export type MotifDuVide = 'sans-index' | 'sans-univers' | 'perimetre-ferme' | 'corpus-vide';

export const TITRE_DU_VIDE: Readonly<Record<MotifDuVide, string>> = {
	'sans-index': "La recherche n'a pas encore d'index",
	'sans-univers': 'Votre base est vide',
	'perimetre-ferme': 'Aucun dossier ne vous est ouvert',
	'corpus-vide': "Aucune note n'est encore écrite"
};

export const TEXTE_DU_VIDE: Readonly<Record<MotifDuVide, string>> = {
	'sans-index':
		'Le moteur interroge un index, et celui de cette instance n’a jamais été construit : ' +
		'aucune note ne peut être rapportée, même si le corpus en porte. Un administrateur le ' +
		'construit par la commande base:reindexer ; les notes restent lisibles depuis le rail.',
	'sans-univers':
		'Aucun univers n’existe encore sur cette instance : il n’y a nulle part où ranger une ' +
		'note, donc rien à chercher. Créez un univers, puis un domaine, dans la console — ' +
		'/console/univers.',
	'perimetre-ferme':
		'La recherche ne rapporte que ce que vous avez le droit de lire, et aucun dossier ne ' +
		'vous est encore ouvert. Demandez l’accès à un administrateur : la recherche s’ouvrira ' +
		'alors sur votre périmètre.',
	'corpus-vide':
		'La recherche ne rapporte que des notes, et le corpus n’en porte encore aucune. ' +
		'Écrivez la première — /notes/nouvelle — et elle sera cherchable aussitôt.'
};
