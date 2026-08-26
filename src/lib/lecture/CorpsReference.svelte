<!--
	LE CORPS RÉDIGÉ DU REGISTRE RÉFÉRENCE — VIDÉ, ET C'EST LE CORRECTIF.

	Ce fichier portait la transcription figée du corps de la note de
	démonstration : `bkp-01.prod`, `pg-prod-01` huit fois, `barman` seize fois,
	un schéma, deux blocs de commandes et un lien vers `docs.pgbarman.org`.
	Trois maquettes le montrent, et il en était l'extraction fidèle.

	IL N'ÉTAIT PLUS RENDU NULLE PART, ET IL PARTAIT QUAND MÊME CHEZ CHAQUE
	LECTEUR. `NoteDeDemonstration.svelte` ne le monte que dans la branche
	`{:else}` de `affichee` — une propriété devenue REQUISE : la branche est
	morte. Mais un composant importé entre dans le paquet qu'il soit rendu ou
	non, et ces trente kilo-octets voyageaient dans le chunk de `/notes/{id}`,
	lisibles dans le source servi. Un test de rendu ne pouvait pas le voir,
	puisque rien ne s'affichait.

	LE CORPS D'UNE NOTE RÉELLE SORT DE `rendreDocument` (ADR-004), passé par
	l'appelant en HTML déjà rendu ; une note dont le registre Référence est vide
	rend l'état vide que `NoteDeDemonstration` porte lui-même. Il n'y a donc plus
	de troisième cas, et ce composant ne rend rien.

	IL SUBSISTE PARCE QU'IL EST ENCORE IMPORTÉ. La branche morte et son import
	vivent dans `NoteDeDemonstration.svelte`, partagé avec d'autres travaux en
	cours ; les retirer là-bas fera disparaître ce fichier et son jumeau
	`CorpsOperationnel.svelte`.
-->
