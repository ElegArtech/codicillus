<script lang="ts">
	/**
	 * L'identité du produit en tête des deux écrans d'authentification —
	 * « le nom, et rien de plus » (`mockups/V-05-connexion.html:423`,
	 * commentaire du bloc `.auth__marque`).
	 *
	 * POURQUOI CE FRAGMENT EST PARTAGÉ, ET LUI SEUL. V-05 et V-06 portent la
	 * MÊME ossature `auth`, déclarée par leurs deux feuilles sous le titre
	 * « AUTHENTIFICATION — ossature commune à V-05 et V-06 » (V-05:411,
	 * V-06:413). Trois blocs de cette ossature apparaissent dans les deux
	 * maquettes — `.auth__marque`, `.auth__boite`, `.auth__pied` —, et un seul
	 * y est IDENTIQUE CARACTÈRE POUR CARACTÈRE : celui-ci (V-05:533-536,
	 * V-06:641-644). Les deux autres n'ont en commun que leur enveloppe ; leur
	 * contenu diffère d'un écran à l'autre, et les factoriser reviendrait à
	 * inventer une abstraction que le gel ne porte pas.
	 *
	 * AUCUN `style=` NE PEUT VIVRE ICI, et ce n'est pas une préférence.
	 * Aucune maquette ne répond des styles de `src/lib/auth` — seul un composant
	 * `V-xx.svelte` a un gel qui puisse en répondre. Ce fragment n'en porte aucun, et ne doit
	 * jamais en porter : un style en ligne appartient au composant `V-xx.svelte`
	 * que son propre gel prouve. Ce fichier n'est pas déclaré à
	 * `preuve-par-le-gel.json`, et un agent d'exécution ne l'y déclare jamais.
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI NON PLUS : `.auth__marque`,
	 * `.auth__sceau` et `.auth__nom` sont définies par `src/vues/V-05.css` et
	 * `src/vues/V-06.css`, feuilles portées à l'octet (P-6.3). Les deux
	 * définitions sont identiques — le relevé des homonymes divergents ne
	 * retient aucune de ces trois classes.
	 */
</script>

<!-- Identité du produit : le nom, et rien de plus. -->
<div class="auth__marque">
	<span class="auth__sceau" aria-hidden="true">C</span>
	<span class="auth__nom">Codicillus</span>
</div>
