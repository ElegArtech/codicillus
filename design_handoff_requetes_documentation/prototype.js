(() => {
	'use strict';
	const vues = window.REQUETES_VUES;
	const $ = (s, racine = document) => racine.querySelector(s);
	const $$ = (s, racine = document) => [...racine.querySelectorAll(s)];
	const ech = (s = '') =>
		String(s).replace(
			/[&<>"']/g,
			(c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
		);
	const etats = {
		'a-evaluer': 'À évaluer',
		acceptee: 'Acceptée',
		diffusee: 'Diffusée',
		'non-retenue': 'Non retenue'
	};
	const onglets = {
		'a-evaluer': 'À évaluer',
		acceptee: 'Acceptées',
		diffusee: 'Diffusées',
		'non-retenue': 'Non retenues'
	};
	const sections = [
		'univers',
		'domaines',
		'types-de-note',
		'types-de-fiches',
		'types-de-relations',
		'templates',
		'comptes',
		'imports',
		'exports',
		'analytique',
		'configuration'
	];
	const date = '13 sept. 2026';
	const domaines = [
		'Infrastructure',
		'Applications',
		'Doctrine',
		'Instances',
		'Notes de service',
		'Chantiers'
	];
	const notes = [
		{
			id: 'sauvegarde',
			titre: 'Restaurer une sauvegarde PostgreSQL',
			domaine: 'Infrastructure',
			statut: 'Publiée',
			acces: 'Interne',
			lisible: true
		},
		{
			id: 'brouillon',
			titre: 'Vérifier une restauration avant la remise en service',
			domaine: 'Infrastructure',
			statut: 'Brouillon',
			acces: 'Interne',
			lisible: false
		}
	];
	const initiales = [
		{
			id: 'r1',
			sujet: 'Vérifier une restauration avant la remise en service',
			besoin:
				'La procédure explique comment restaurer la base. Il me manque les vérifications à effectuer ensuite, avant de rouvrir le service : cohérence des données, connexions des applications et contrôle des derniers enregistrements.',
			auteur: 'Camille Martin',
			origine: 'Recherche authentifiée',
			recherche: 'sauvegarde',
			domaine: '',
			etat: 'a-evaluer',
			nouveau: false
		},
		{
			id: 'r2',
			sujet: 'Accéder au réseau depuis un ordinateur personnel',
			besoin:
				'Je travaille ponctuellement depuis mon ordinateur personnel. Je voudrais savoir si cet accès est autorisé et quelles étapes suivre pour me connecter.',
			auteur: null,
			origine: 'Accueil public',
			recherche: '',
			domaine: '',
			etat: 'a-evaluer'
		},
		{
			id: 'r3',
			sujet: 'Préparer le passage d’astreinte',
			besoin:
				'Quelles informations faut-il transmettre au collègue qui reprend l’astreinte le vendredi ?',
			auteur: 'Sophie Nguyen',
			origine: 'Accueil authentifié',
			recherche: '',
			domaine: '',
			etat: 'a-evaluer'
		},
		{
			id: 'r4',
			sujet: 'Retrouver les décisions d’un comité',
			besoin:
				'Je retrouve plusieurs relevés, mais je ne sais pas lequel fait foi lorsque la décision a été modifiée.',
			auteur: 'Claire Marchand',
			origine: 'Recherche authentifiée',
			recherche: 'décisions comité',
			domaine: '',
			etat: 'a-evaluer'
		},
		{
			id: 'r5',
			sujet: 'Connaître les prérequis d’un accès distant',
			besoin:
				'Je prépare un déplacement et souhaite vérifier les prérequis avant de quitter les locaux.',
			auteur: null,
			origine: 'Recherche publique',
			recherche: 'accès distant',
			domaine: '',
			etat: 'a-evaluer'
		},
		{
			id: 'r6',
			sujet: 'Identifier les contrôles après une restauration',
			besoin: 'J’ai besoin d’une liste de contrôles après une restauration PostgreSQL.',
			auteur: 'Camille Martin',
			origine: 'Accueil authentifié',
			domaine: 'Infrastructure',
			recherche: '',
			etat: 'acceptee',
			note: 'brouillon',
			retour:
				'Le besoin est retenu. Une liste de contrôles est en préparation dans le domaine Infrastructure.',
			interne: 'Faire relire les contrôles par la personne responsable des sauvegardes.',
			nouveau: true
		},
		{
			id: 'r7',
			sujet: 'Retrouver la procédure de restauration PostgreSQL',
			besoin: 'Où trouver les étapes pour restaurer une base PostgreSQL ?',
			auteur: 'Camille Martin',
			origine: 'Recherche authentifiée',
			recherche: 'restauration postgres',
			domaine: 'Infrastructure',
			etat: 'diffusee',
			note: 'sauvegarde',
			retour:
				'La procédure de restauration répond à votre besoin. Le lien ci-dessous vous permet de la retrouver.',
			nouveau: true
		},
		{
			id: 'r8',
			sujet: 'Débloquer mon accès cet après-midi',
			besoin: 'Mon compte est bloqué et je dois rejoindre une réunion cet après-midi.',
			auteur: 'Camille Martin',
			origine: 'Accueil authentifié',
			recherche: '',
			domaine: '',
			etat: 'non-retenue',
			retour:
				'Votre situation nécessite une intervention individuelle. Contactez l’assistance pour faire débloquer votre compte.',
			interne: 'Demande individuelle ; aucun contenu durable à rédiger.',
			nouveau: true
		}
	].map((r) => ({
		...r,
		cree: date,
		historique: [
			{
				titre: 'Requête déposée',
				par: r.auteur || 'Visiteur anonyme',
				quand: '13 sept. 2026 · 08:20'
			},
			...(r.etat !== 'a-evaluer'
				? [
						{
							titre: etats[r.etat],
							par: 'Administration',
							quand: date + ' · 09:15',
							commentaire: r.retour || ''
						}
					]
				: [])
		]
	}));
	let params, vue, vide, role, jeu, courant, toastTimer;
	let etatEditeur = 'Brouillon';
	let visibiliteEditeur = 'Interne';
	let retourDialogue;
	let rechercheFile = '';
	let domaineFile = '';
	function chargerJeu() {
		const cle = 'codicillus-maquettes-requetes-' + (vide ? 'vide' : 'nominal');
		try {
			jeu = JSON.parse(sessionStorage.getItem(cle));
		} catch {
			jeu = null;
		}
		if (!jeu || params.get('reset') === '1')
			jeu = {
				requetes: vide ? [] : structuredClone(initiales),
				notes: structuredClone(notes),
				journal: []
			};
		if (params.has('reset')) {
			params.delete('reset');
			history.replaceState(null, '', '#' + params);
		}
	}
	function sauver() {
		try {
			sessionStorage.setItem(
				'codicillus-maquettes-requetes-' + (vide ? 'vide' : 'nominal'),
				JSON.stringify(jeu)
			);
		} catch {
			/* Le parcours reste utilisable sans stockage local. */
		}
	}
	function adresse(cible, plus = {}) {
		const p = new URLSearchParams({
			vue: cible,
			...(vide ? { vide: '1' } : {}),
			...(role === 'lecteur' ? { role } : {}),
			...plus
		});
		return '#' + p;
	}
	function aller(cible, plus = {}) {
		location.hash = adresse(cible, plus);
	}
	function lien(cible, texte, plus = {}, classe = 'rq-lien') {
		return `<a class="${classe}" href="${ech(adresse(cible, plus))}">${texte}</a>`;
	}
	function bouton(action, texte, principal = false, attributs = '') {
		return `<button type="button" class="btn${principal ? ' btn--principal' : ''}" data-rq="${action}" ${attributs}>${texte}</button>`;
	}
	function badge(etat) {
		return `<span class="rq-badge rq-badge--${etat}">${etats[etat]}</span>`;
	}
	function avertir(texte) {
		$('.rq-toast')?.remove();
		clearTimeout(toastTimer);
		const n = document.createElement('div');
		n.className = 'rq-toast';
		n.role = 'status';
		n.textContent = texte;
		document.body.append(n);
		toastTimer = setTimeout(() => n.remove(), 4500);
	}
	function evenement(r, titre, commentaire = '') {
		r.historique.push({ titre, par: 'Administration', quand: date + ' · 16:30', commentaire });
	}
	function changerEtat(r, etat, retour = '') {
		r.etat = etat;
		r.retour = retour;
		r.nouveau = Boolean(r.auteur);
		evenement(r, etats[etat], retour);
		sauver();
	}
	function mesRequetes() {
		return [
			...jeu.requetes.filter((r) => r.auteur === 'Camille Martin'),
			...(jeu.suivisRetires || [])
		];
	}
	function noteDe(r) {
		return jeu.notes.find((n) => n.id === r?.note);
	}
	function domaineOptions(valeur = '') {
		return `<option value="">Non assigné</option>${(vide ? [] : domaines).map((d) => `<option ${d === valeur ? 'selected' : ''}>${d}</option>`).join('')}`;
	}
	function entete(titre, description, action = '') {
		return `<header class="tete-section"><div class="tete-section__corps"><h1>${titre}</h1><p>${description}</p></div>${action}</header>`;
	}
	function modifierFil(texte) {
		const f = $('.fil__courant');
		if (f) f.textContent = texte;
	}
	function ajouterNavigation() {
		const nav = $('#nav2-groupes');
		if (!nav) return;
		const ancienne = $$('.nav2__lien');
		ancienne.forEach((n, i) => {
			n.dataset.rqSection = sections[i];
			if (vue === 'console' || vue === 'journal') n.removeAttribute('aria-current');
		});
		const compte = jeu.requetes.filter((r) => r.etat === 'a-evaluer').length;
		$('.nav2__groupe', nav).insertAdjacentHTML(
			'beforeend',
			`<button type="button" class="nav2__lien rq-nav-ajout" data-rq="console" ${vue === 'console' || vue === 'journal' ? 'aria-current="page"' : ''}><span aria-hidden="true">${$('.nav2__lien:nth-of-type(3) svg', nav)?.outerHTML || '+'}</span><span class="nav2__nomlien">Requêtes de documentation</span>${compte ? `<span class="nav2__n">${compte}</span>` : ''}</button>`
		);
		const select = $('#nav2-selecteur');
		$('optgroup', select).insertAdjacentHTML(
			'beforeend',
			`<option value="requetes">Requêtes de documentation${compte ? ' · ' + compte : ''}</option>`
		);
		if (vue === 'console' || vue === 'journal') select.value = 'requetes';
	}
	function accesPublic() {
		const zone = vue === 'public' ? $('.corps-public') : $('#resultats-zone');
		if (!zone) return;
		zone.insertAdjacentHTML(
			'beforeend',
			`<aside class="rq-public"><div><strong>Une connaissance vous manque ?</strong><p>Proposez un sujet à documenter pour aider les prochaines personnes.</p></div>${lien('depot-public', 'Formuler une requête de documentation', vue === 'public' ? {} : { q: params.get('q') || 'accès', origine: 'recherche' }, 'btn')}</aside>`
		);
	}
	function accueil() {
		const attente = jeu.requetes.filter((r) => r.etat === 'a-evaluer').length;
		const nouvelles = mesRequetes().filter((r) => r.nouveau).length;
		const carte = $('#t-surveiller')?.closest('.carte');
		if (carte && attente && role !== 'lecteur')
			carte.insertAdjacentHTML(
				'beforeend',
				lien(
					'console',
					`<span><b>${attente}</b> ${attente === 1 ? 'requête de documentation à évaluer' : 'requêtes de documentation à évaluer'}</span><span aria-hidden="true">›</span>`,
					{},
					'rq-signal'
				)
			);
		if (carte && nouvelles)
			carte.insertAdjacentHTML(
				'beforeend',
				lien(
					'mes-requetes',
					`<span><b>${nouvelles}</b> ${nouvelles === 1 ? 'de vos requêtes de documentation a été mise à jour' : 'de vos requêtes de documentation ont été mises à jour'}</span><span aria-hidden="true">›</span>`,
					{},
					'rq-signal'
				)
			);
		const recherche = $('main .recherche');
		if (recherche)
			recherche.insertAdjacentHTML(
				'afterend',
				`<div class="rq-acces">${lien('depot-interne', 'Formuler une requête de documentation')}${mesRequetes().length ? lien('mes-requetes', 'Mes requêtes de documentation') : ''}</div>`
			);
	}
	function champ(id, titre, valeur = '', type = 'textarea', aide = '') {
		return `<div class="rq-champ"><label for="rq-${id}">${titre}</label>${type === 'textarea' ? `<textarea id="rq-${id}" name="${id}" rows="4" ${['sujet', 'besoin'].includes(id) ? 'aria-required="true"' : ''} aria-describedby="rq-${id}-aide rq-${id}-erreur">${ech(valeur)}</textarea>` : `<input id="rq-${id}" name="${id}" value="${ech(valeur)}" ${id === 'sujet' ? 'aria-required="true"' : ''} aria-describedby="rq-${id}-aide rq-${id}-erreur" />`}<small id="rq-${id}-aide">${aide}</small><small class="rq-erreur" id="rq-${id}-erreur"></small></div>`;
	}
	function depot(interne) {
		const main = $('main');
		main.classList.add('rq-module');
		if (!interne) {
			$('.hamecon')?.remove();
			main.className = 'corps-public rq-module';
		}
		modifierFil('Requête de documentation');
		const q = params.get('q') || '';
		main.innerHTML = `<section class="rq-formulaire">${lien(interne ? 'accueil' : 'public', '← Retour à l’accueil')}<h1>Formuler une requête de documentation</h1><p class="rq-intro">Une connaissance manque, reste difficile à trouver ou ne répond pas à votre situation ? Décrivez ce qui vous serait utile.</p>${q ? `<div class="rq-contexte"><span class="etiq">Contexte de recherche</span><strong>« ${ech(q)} »</strong>Ces mots accompagnent votre requête. Vous pouvez préciser un autre sujet ci-dessous.</div>` : ''}<form id="rq-depot" novalidate>${champ('sujet', 'Sujet', q, 'input', 'Ce qui devrait être documenté. 160 caractères maximum.')}${champ('besoin', 'Besoin', '', 'textarea', 'La situation rencontrée et ce que vous auriez voulu trouver. 2 000 caractères maximum.')}<div class="rq-avis">N’indiquez aucun mot de passe, secret ni information personnelle sensible. Cette requête est transmise aux administrateurs pour évaluer un besoin de connaissance.</div><p class="rq-secondaire">${interne ? 'Votre requête sera rattachée à votre compte. Les décisions et les commentaires qui vous sont destinés seront disponibles dans « Mes requêtes de documentation ».' : 'Ce dépôt est anonyme. Vous recevrez une confirmation ici, sans suivi individuel ni réponse par courriel.'}</p><div id="rq-envoi-erreur" role="alert"></div><div class="rq-actions"><button type="submit" class="btn btn--principal">Transmettre la requête</button>${lien(interne ? 'accueil' : 'public', 'Annuler', {}, 'btn')}</div></form></section>`;
		if (params.get('etat') === 'erreur') {
			$('#rq-sujet').value = 'x'.repeat(161);
			$('#rq-besoin').value = '';
			validerDepot();
		}
	}
	function validerDepot() {
		let valide = true;
		for (const [id, max, libelle] of [
			['sujet', 160, 'un sujet'],
			['besoin', 2000, 'votre besoin']
		]) {
			const input = $('#rq-' + id);
			const n = [...input.value.trim()].length;
			const erreur =
				n === 0
					? 'Précisez ' + libelle + '.'
					: n > max
						? `${n} caractères saisis : la limite est de ${max}. Raccourcissez le texte pour continuer.`
						: '';
			$('#rq-' + id + '-erreur').textContent = erreur;
			input.setAttribute('aria-invalid', String(Boolean(erreur)));
			if (erreur) valide = false;
		}
		if (!valide) $('[aria-invalid="true"]')?.focus();
		return valide;
	}
	function recu(interne) {
		const main = $('main');
		modifierFil('Requête transmise');
		if (!interne) {
			$('.hamecon')?.remove();
			main.className = 'corps-public rq-module';
		}
		main.innerHTML = `<section class="rq-formulaire"><div class="rq-recu"><h1>Votre requête de documentation a été transmise.</h1><p>Les administrateurs vont évaluer le besoin que vous avez décrit.</p>${interne ? `<p>Vous retrouverez les décisions et les commentaires qui vous sont destinés dans votre suivi.</p><div class="rq-actions">${lien('mes-requetes', 'Voir mes requêtes de documentation', {}, 'btn btn--principal')}${lien('accueil', 'Retour à l’accueil', {}, 'btn')}</div>` : `<p>Ce dépôt est anonyme : aucun suivi individuel ni réponse par courriel ne sont prévus.</p><div class="rq-actions">${lien('public', 'Retour à l’accueil', {}, 'btn btn--principal')}</div>`}</div></section>`;
	}
	function ligne(r, personnel = false) {
		return lien(
			personnel ? 'mes-requetes' : 'console',
			`<span><strong>${ech(r.sujet)}</strong><small>${personnel ? (r.nouveau ? 'Nouvelle décision · ' : '') + r.cree : (r.auteur || 'Visiteur anonyme') + ' · ' + r.origine}</small></span><span>${ech(personnel ? r.domaine || 'En attente d’évaluation' : r.domaine || 'Non assigné')}</span>${badge(r.etat)}<span aria-hidden="true">›</span>`,
			{ requete: r.id, ...(personnel ? {} : { etat: r.etat }) },
			'rq-ligne'
		);
	}
	function ongletsConsole() {
		const etat = params.get('etat') || 'a-evaluer';
		return `<nav class="rq-onglets" aria-label="État des requêtes">${Object.keys(etats)
			.map(
				(e) =>
					`<a href="${ech(adresse('console', { etat: e }))}" ${e === etat ? 'aria-current="page"' : ''}>${onglets[e]} <b>${jeu.requetes.filter((r) => r.etat === e).length}</b></a>`
			)
			.join('')}</nav>`;
	}
	function rendreFile() {
		const etat = params.get('etat') || 'a-evaluer';
		const rs = jeu.requetes.filter(
			(r) =>
				r.etat === etat &&
				(!domaineFile || r.domaine === domaineFile) &&
				(r.sujet + ' ' + r.besoin)
					.toLocaleLowerCase('fr')
					.includes(rechercheFile.toLocaleLowerCase('fr'))
		);
		$('#rq-lignes').innerHTML = rs.length
			? `<div class="rq-liste"><div class="rq-ligne rq-ligne--tete"><span>Sujet · demandeur · origine</span><span>Domaine</span><span>État</span><span></span></div>${rs.map((r) => ligne(r)).join('')}</div>`
			: `<div class="rq-vide"><h2>${rechercheFile || domaineFile ? 'Aucune requête ne correspond à ces filtres' : etat === 'a-evaluer' ? 'Aucune requête à évaluer' : 'Aucune requête ' + (etat === 'acceptee' ? 'acceptée' : etat === 'diffusee' ? 'diffusée' : 'non retenue')}</h2><p>${rechercheFile || domaineFile ? 'Modifiez votre recherche ou retirez le filtre de domaine.' : 'Les requêtes de documentation déposées depuis l’accueil ou la recherche apparaîtront ici.'}</p>${rechercheFile || domaineFile ? bouton('effacer-filtres', 'Effacer les filtres') : ''}</div>`;
	}
	function consoleRequetes() {
		modifierFil('Requêtes de documentation');
		const main = $('main');
		main.classList.add('rq-module');
		if (params.get('requete')) {
			courant = jeu.requetes.find((r) => r.id === params.get('requete'));
			if (courant) {
				detail(courant, false);
				return;
			}
		}
		main.innerHTML =
			entete(
				'Requêtes de documentation',
				'Évaluer les besoins proposés, organiser leur prise en charge et identifier les réponses diffusées.',
				lien('journal', 'Journal des décisions', {}, 'btn')
			) +
			ongletsConsole() +
			`<div class="rq-outils"><div class="rq-champ"><label for="rq-filtre">Rechercher une requête</label><input id="rq-filtre" type="search" placeholder="Sujet ou besoin" value="${ech(rechercheFile)}" /></div><div class="rq-champ"><label for="rq-domaine-filtre">Domaine</label><select id="rq-domaine-filtre"><option value="">Tous les domaines</option>${(vide ? [] : domaines).map((d) => `<option ${d === domaineFile ? 'selected' : ''}>${d}</option>`).join('')}</select></div></div><div id="rq-lignes" aria-live="polite"></div>`;
		if (params.get('etat-vue') === 'erreur')
			$('#rq-lignes').innerHTML =
				`<div class="rq-avis rq-avis--erreur" role="alert"><strong>La liste des requêtes n’a pas pu être chargée.</strong><p>Réessayez dans un instant.</p>${bouton('reessayer-file', 'Réessayer')}</div>`;
		else rendreFile();
	}
	function historique(r, personnel) {
		return `<ol class="rq-historique">${[...r.historique]
			.reverse()
			.filter((h) => !personnel || !h.interne)
			.map(
				(h) =>
					`<li><strong>${ech(h.titre)}</strong><small>${ech(h.quand)}${personnel ? '' : ' · ' + ech(h.par)}</small>${h.commentaire ? `<p>${ech(h.commentaire)}</p>` : ''}</li>`
			)
			.join('')}</ol>`;
	}
	function detail(r, personnel) {
		const main = $('main');
		main.classList.add('rq-module');
		const n = noteDe(r);
		if (personnel) {
			r.nouveau = false;
			sauver();
			modifierFil('Mes requêtes de documentation');
		}
		const accesNote = personnel
			? r.etat === 'diffusee' && n?.lisible && n.statut === 'Publiée'
			: Boolean(n);
		const contexte = `<div class="rq-bloc"><h2>Besoin exprimé</h2><p class="rq-besoin">${ech(r.besoin)}</p><dl class="rq-definition"><dt>Déposée le</dt><dd>${r.cree}</dd><dt>Origine</dt><dd>${r.origine}</dd>${!personnel ? `<dt>Demandeur</dt><dd>${r.auteur ? ech(r.auteur) : 'Visiteur anonyme · aucun suivi individuel'}</dd>` : ''}${r.recherche ? `<dt>Mots recherchés</dt><dd>« ${ech(r.recherche)} »</dd>` : ''}<dt>Domaine</dt><dd>${ech(r.domaine || 'Non assigné')}</dd></dl></div>`;
		const reponse = `<div class="rq-bloc"><h2>${personnel ? 'Réponse à votre requête' : 'Note associée'}</h2>${n ? `${accesNote ? lien('note', ech(n.titre), { requete: r.id, origine: personnel ? 'personnel' : 'console' }, 'rq-note-liee') : `<p>${r.etat === 'acceptee' ? 'Le besoin est retenu. La réponse est en préparation.' : 'La note associée n’est plus accessible.'}</p>`}${!personnel ? `<p class="rq-secondaire">${n.statut} · ${n.acces} · ${ech(n.domaine)}</p>` : ''}` : `<p>${r.etat === 'diffusee' ? 'La réponse a été diffusée. La note associée n’est plus disponible.' : r.etat === 'non-retenue' ? 'Cette requête n’a pas été retenue.' : r.etat === 'acceptee' ? 'Le besoin est retenu. Aucune note n’est encore associée.' : personnel ? 'Votre requête attend une évaluation.' : 'Aucune note associée. La requête attend une évaluation.'}</p>`}${r.retour ? `<div class="rq-commentaire">${ech(r.retour)}</div>` : ''}${!personnel && r.etat === 'acceptee' ? `<div class="rq-actions">${bouton('associer', n ? 'Changer de note' : 'Associer une note')}${lien('editeur', n?.statut === 'Brouillon' ? 'Continuer la rédaction' : 'Écrire une note', { requete: r.id }, 'btn')}${n?.statut === 'Publiée' ? bouton('diffuser', 'Marquer comme diffusée', true) : ''}</div>${n?.statut === 'Brouillon' ? '<p class="rq-secondaire">La requête reste acceptée tant que la réponse n’est pas publiée.</p>' : ''}` : ''}</div>`;
		main.innerHTML = `${lien(personnel ? 'mes-requetes' : 'console', personnel ? '← Mes requêtes de documentation' : '← Requêtes de documentation', personnel ? {} : { etat: r.etat }, 'rq-lien rq-retour')}<div>${badge(r.etat)}<h1 class="rq-titre-detail">${ech(r.sujet)}</h1><p class="rq-secondaire">${r.cree}${!personnel ? ' · ' + ech(r.auteur || 'Visiteur anonyme') : ''}</p></div>${!personnel && r.etat === 'a-evaluer' ? `<div class="rq-actions">${bouton('accepter', 'Accepter', true)}${bouton('refuser', 'Ne pas retenir')}</div>` : ''}<div class="rq-detail"><div>${contexte}${personnel ? reponse : `<div class="rq-bloc"><h2>Historique des décisions</h2>${historique(r, false)}</div>`}</div><div>${personnel ? `<div class="rq-bloc"><h2>Suivi</h2>${historique(r, true)}</div>` : `${reponse}<form id="rq-qualification" class="rq-bloc"><h2>Qualification</h2><div class="rq-champ"><label for="rq-domaine">Domaine responsable</label><select id="rq-domaine" name="domaine">${domaineOptions(r.domaine)}</select>${vide ? '<small>Aucun domaine n’a encore été créé. La requête peut être acceptée sans affectation.</small>' : ''}</div>${champ('interne', 'Commentaire interne <span>· administrateurs uniquement</span>', r.interne || '', 'textarea')}<button class="btn" type="submit">Enregistrer la qualification</button></form><div class="rq-actions">${r.etat === 'acceptee' ? bouton('refuser', 'Ne plus retenir') : ''}${bouton('supprimer', 'Supprimer la requête')}</div>`}</div></div>`;
	}
	function suivi() {
		const main = $('main');
		main.classList.add('rq-module');
		modifierFil('Mes requêtes de documentation');
		courant = mesRequetes().find((r) => r.id === params.get('requete'));
		if (courant) {
			detail(courant, true);
			return;
		}
		const rs = mesRequetes();
		main.innerHTML = `<header class="rq-entete"><div><h1>Mes requêtes de documentation</h1><p class="rq-intro">Les décisions et les retours concernant les besoins que vous avez proposés.</p></div>${lien('depot-interne', 'Formuler une requête', {}, 'btn')}</header>${rs.length ? `<div class="rq-liste">${rs.map((r) => ligne(r, true)).join('')}</div>` : `<div class="rq-vide"><h2>Vous n’avez pas encore formulé de requête</h2><p>Une connaissance manque ou ne répond pas à votre situation ? Vous pouvez proposer un besoin aux administrateurs.</p>${lien('depot-interne', 'Formuler une requête de documentation', {}, 'btn btn--principal')}</div>`}`;
	}
	function journal() {
		const main = $('main');
		main.classList.add('rq-module');
		modifierFil('Requêtes de documentation');
		const lignes = [
			...jeu.requetes.flatMap((r) => r.historique.map((h) => ({ ...h, id: r.id, sujet: r.sujet }))),
			...jeu.journal
		].reverse();
		main.innerHTML =
			lien('console', '← Requêtes de documentation', {}, 'rq-lien rq-retour') +
			entete(
				'Journal des décisions',
				'Les décisions et suppressions restent consultables par les administrateurs.'
			) +
			`<div class="rq-bloc">${lignes.length ? `<ol class="rq-historique">${lignes.map((h) => `<li><strong>${ech(h.titre)}</strong>${h.id ? lien('console', ech(h.sujet), { requete: h.id }) : '<span>' + ech(h.sujet) + '</span>'}<small>${ech(h.quand)} · ${ech(h.par)}</small></li>`).join('')}</ol>` : '<p>Aucune décision pour le moment.</p>'}</div>`;
	}
	function ouvrirDialogue(titre, contenu, action, geste) {
		retourDialogue = document.activeElement;
		$('#rq-dialogue')?.remove();
		const d = document.createElement('dialog');
		d.className = 'rq-dialogue';
		d.id = 'rq-dialogue';
		d.setAttribute('aria-labelledby', 'rq-dialogue-titre');
		d.innerHTML = `<form id="rq-decision" data-action="${action}"><h2 id="rq-dialogue-titre">${titre}</h2>${contenu}<div id="rq-decision-erreur" role="alert"></div><div class="rq-actions">${bouton('fermer', 'Annuler')}<button class="btn btn--principal" type="submit">${geste}</button></div></form>`;
		document.body.append(d);
		d.showModal();
		d.addEventListener('close', () => retourDialogue?.focus());
	}
	function retourChamp(r, valeur = '') {
		return r.auteur
			? champ(
					'retour',
					'Commentaire destiné au demandeur <span>· facultatif</span>',
					valeur,
					'textarea',
					'Visible dans son suivi. Ce champ n’ouvre pas de conversation.'
				)
			: '<div class="rq-avis">Dépôt anonyme : aucun retour individuel ne sera envoyé.</div>';
	}
	function decision(action) {
		const r = courant;
		if (!r) return;
		if (action === 'accepter')
			ouvrirDialogue(
				'Accepter la requête',
				`<p>Le besoin est retenu. La requête ne sera diffusée qu’une fois une réponse publiée et identifiable.</p><div class="rq-champ"><label for="rq-domaine-decision">Domaine responsable <span>· facultatif</span></label><select id="rq-domaine-decision" name="domaine">${domaineOptions(r.domaine)}</select>${vide ? '<small>Aucun domaine disponible pour le moment.</small>' : ''}</div>${retourChamp(r, 'Le besoin est retenu. Nous allons préparer une réponse dans le corpus.')}`,
				action,
				'Accepter la requête'
			);
		if (action === 'refuser')
			ouvrirDialogue(
				'Ne pas retenir la requête',
				`<p>Cette décision sera conservée dans l’historique.${r.auteur ? ' Le demandeur en sera informé dans son suivi.' : ''}</p>${champ('interne-decision', 'Commentaire interne <span>· facultatif</span>', r.interne || '', 'textarea', 'Réservé aux administrateurs. Jamais affiché au demandeur.')}${retourChamp(r)}`,
				action,
				'Confirmer la non-retenue'
			);
		if (action === 'associer')
			ouvrirDialogue(
				'Associer une note',
				`<p>Choisissez une réponse existante ou une note en préparation. L’association ne diffuse pas encore la requête.</p><div class="rq-champ"><label for="rq-chercher-note">Rechercher une note</label><input id="rq-chercher-note" type="search" placeholder="Titre de la note" /></div><div id="rq-choix-notes">${(vide ? [] : jeu.notes).map((n) => `<label class="rq-choix" data-titre="${ech(n.titre.toLowerCase())}"><input type="radio" name="note" value="${n.id}" ${r.note === n.id ? 'checked' : ''} />${ech(n.titre)}<small>${n.statut} · ${n.acces} · ${ech(n.domaine)}</small></label>`).join('') || '<p>Aucune note disponible. Créez d’abord un domaine puis une note.</p>'}</div><p id="rq-notes-vides" hidden>Aucune note ne correspond à cette recherche.</p>`,
				action,
				'Associer cette note'
			);
		if (action === 'diffuser') {
			const n = noteDe(r);
			if (!n || n.statut !== 'Publiée') return;
			const acces = r.auteur ? n.lisible : n.acces === 'Publique';
			ouvrirDialogue(
				'Marquer comme diffusée',
				`<p>La réponse est publiée et répond au besoin exprimé.</p><div class="rq-contexte"><strong>${ech(n.titre)}</strong>${n.statut} · ${n.acces}</div>${acces ? retourChamp(r, 'La réponse est maintenant disponible dans la note associée.') : `<div class="rq-avis rq-avis--attention">${r.auteur ? 'Le demandeur ne peut pas consulter cette note. Rendez la réponse accessible ou associez une autre note.' : 'Cette requête vient du public. La note associée doit être publique pour que la réponse soit accessible.'}</div>`}`,
				action,
				'Confirmer la diffusion'
			);
			if (!acces) $('#rq-decision button[type=submit]').disabled = true;
		}
		if (action === 'supprimer')
			ouvrirDialogue(
				'Supprimer la requête',
				`<p>Le besoin et les commentaires internes seront retirés du module. La suppression restera tracée dans le journal administratif.</p>${r.auteur ? `<p>Le demandeur conservera une indication de la décision dans son suivi.${['a-evaluer', 'acceptee'].includes(r.etat) ? ' Sa requête sera indiquée comme non retenue.' : ''}</p>${retourChamp(r, r.retour || '')}` : '<p>Aucun suivi individuel n’est prévu pour ce dépôt anonyme.</p>'}`,
				action,
				'Supprimer la requête'
			);
	}
	function editeur() {
		courant = jeu.requetes.find((r) => r.id === params.get('requete'));
		if (!courant) return;
		if (vide) {
			$('main').innerHTML =
				`<section class="rq-vide"><h1>Un domaine est nécessaire pour écrire une note</h1><p>Cette instance ne contient encore aucun univers ni domaine. Créez le rangement depuis la console, puis reprenez cette requête acceptée.</p>${lien('console', 'Retour à la requête', { requete: courant.id }, 'btn')}</section>`;
			return;
		}
		const n = noteDe(courant);
		etatEditeur = n?.statut || 'Brouillon';
		visibiliteEditeur = n?.acces || (courant.auteur ? 'Interne' : 'Publique');
		const avis = $('#avis');
		avis.innerHTML = `<div class="rq-contexte rq-editeur-contexte"><span class="etiq">Requête de documentation acceptée</span><strong>${ech(courant.sujet)}</strong>${lien('console', 'Voir la requête', { requete: courant.id })}<p>${ech(courant.besoin)}</p>Un brouillon garde la requête acceptée. Après publication, la diffusion se confirme dans la console.</div>`;
		$('#titre').value = n?.titre || courant.sujet;
		if (courant.domaine && $('#m-domaine')) $('#m-domaine').value = courant.domaine;
		const redaction = $('#redaction');
		redaction.innerHTML =
			courant.corps || '<p>Décrivez les étapes et les contrôles qui répondent au besoin.</p>';
		redaction.setAttribute('contenteditable', 'true');
		$$('[data-val]').forEach((b) => {
			if (['Publiée', 'Brouillon'].includes(b.dataset.val))
				b.setAttribute('aria-pressed', String(b.dataset.val === etatEditeur));
			else if (['Interne', 'Publique'].includes(b.dataset.val))
				b.setAttribute('aria-pressed', String(b.dataset.val === visibiliteEditeur));
		});
		if (vide) {
			avis.insertAdjacentHTML(
				'beforeend',
				'<div class="rq-avis rq-avis--attention">Aucun domaine disponible. Créez un univers et un domaine dans la console pour commencer la rédaction.</div>'
			);
			$('#enregistrer').disabled = true;
		}
	}
	function note() {
		const r = jeu.requetes.find((r) => r.id === params.get('requete'));
		const n = noteDe(r);
		const main = $('main');
		if (r && n && n.id !== 'sauvegarde') {
			const h = $('h1', main);
			if (h) h.textContent = n.titre;
			const prose = $('.prose', main);
			if (prose) prose.innerHTML = r.corps || '<p>La rédaction de cette note est en cours.</p>';
			modifierFil(n.titre);
			$$('a')
				.filter((a) => a.textContent.trim() === 'Modifier')
				.forEach((a) => {
					a.href = adresse('editeur', { requete: r.id });
				});
		}
		if (r)
			main.insertAdjacentHTML(
				'afterbegin',
				`<div class="rq-contexte">${lien(params.get('origine') === 'personnel' ? 'mes-requetes' : 'console', '← Retour à la requête de documentation', { requete: r.id })}</div>`
			);
	}
	async function rendre() {
		params = new URLSearchParams(location.hash.slice(1));
		vue = params.get('vue') || 'public';
		vide = params.get('vide') === '1';
		role = params.get('role') || 'admin';
		chargerJeu();
		courant = null;
		if (role === 'lecteur' && ['console', 'journal', 'editeur'].includes(vue)) {
			aller('mes-requetes');
			return;
		}
		let source =
			{
				public: 'public',
				'depot-public': 'public',
				'recu-public': 'public',
				'recherche-publique': 'recherche-publique',
				accueil: 'accueil',
				'depot-interne': 'accueil',
				'recu-interne': 'accueil',
				'mes-requetes': 'accueil',
				console: 'console',
				journal: 'console',
				'recherche-interne': 'recherche-interne',
				'recherche-vide': 'recherche-vide',
				editeur: 'editeur',
				note: 'note',
				analytique: 'analytique'
			}[vue] || 'public';
		if (vue === 'source' && vues[params.get('source')]) source = params.get('source');
		if (vide && source === 'editeur') source = 'accueil-vide';
		if (vide && ['accueil', 'console'].includes(source)) source += '-vide';
		if (role === 'lecteur' && source === 'accueil' && vues['accueil-lecteur'])
			source = 'accueil-lecteur';
		const v = vues[source];
		for (const a of [...document.documentElement.attributes])
			if (a.name !== 'lang') document.documentElement.removeAttribute(a.name);
		Object.entries(v.attrs).forEach(([k, val]) => {
			if (k !== 'style') document.documentElement.setAttribute(k, val);
		});
		if (new URLSearchParams(location.search).has('capture'))
			document.documentElement.dataset.capture = '';
		$$('[data-source-css]').forEach((n) => n.remove());
		const liens = v.styles.map((href) => {
			const l = document.createElement('link');
			l.rel = 'stylesheet';
			l.href = href;
			l.dataset.sourceCss = '';
			$('#style-requetes').before(l);
			return new Promise((res) => {
				l.onload = res;
				l.onerror = res;
			});
		});
		document.body.innerHTML = v.html;
		$$('dialog').forEach((d) => d.removeAttribute('open'));
		if (vue === 'console' || vue === 'journal') {
			$$('.tiroir-form, .voile-form').forEach((n) => n.remove());
		}
		if (vue !== 'source') {
			ajouterNavigation();
			const menu = $('.rail__menu');
			if (menu)
				$('.rail__menu-version', menu)?.insertAdjacentHTML(
					'beforebegin',
					lien('mes-requetes', 'Mes requêtes de documentation', {}, 'rail__menu-lien')
				);
		}
		switch (vue) {
			case 'public':
			case 'recherche-publique':
				accesPublic();
				break;
			case 'accueil':
				accueil();
				break;
			case 'depot-public':
				depot(false);
				break;
			case 'depot-interne':
				depot(true);
				break;
			case 'recu-public':
				recu(false);
				break;
			case 'recu-interne':
				recu(true);
				break;
			case 'console':
				consoleRequetes();
				break;
			case 'mes-requetes':
				suivi();
				break;
			case 'journal':
				journal();
				break;
			case 'editeur':
				editeur();
				break;
			case 'note':
				note();
				break;
			case 'recherche-interne':
			case 'recherche-vide': {
				const zone = $('main.rech > div');
				zone?.insertAdjacentHTML(
					'beforeend',
					`<aside class="rq-public rq-recherche"><div><strong>Vous n’avez pas trouvé ce qu’il vous faut ?</strong><p>Vous pouvez proposer un besoin, même si la recherche donne des résultats.</p></div>${lien('depot-interne', 'Formuler une requête de documentation', { q: vue === 'recherche-vide' ? 'introuvablexyz' : 'sauvegarde', origine: 'recherche' }, 'btn')}</aside>`
				);
				break;
			}
		}
		if (params.get('terme')) {
			rechercheFile = params.get('terme');
			if ($('#rq-filtre')) {
				$('#rq-filtre').value = rechercheFile;
				rendreFile();
			}
		}
		document.body.insertAdjacentHTML(
			'beforeend',
			'<button type="button" data-rq="parcours" class="rq-atelier">Maquettes · choisir une vue</button>'
		);
		document.title =
			'Codicillus — ' +
			(vue.includes('depot') ? 'Formuler une requête' : 'Requêtes de documentation');
		await Promise.all(liens);
		await document.fonts.ready;
		window.scrollTo(0, 0);
		document.documentElement.dataset.pret = 'oui';
	}
	document.addEventListener('submit', (e) => {
		e.preventDefault();
		const form = e.target;
		if (form.id === 'rq-depot') {
			if (!validerDepot()) return;
			if (params.get('echec') === '1') {
				params.delete('echec');
				$('#rq-envoi-erreur').innerHTML =
					'<div class="rq-avis rq-avis--erreur">L’envoi n’a pas abouti. Votre saisie est conservée ; vous pouvez réessayer.</div>';
				return;
			}
			const interne = vue === 'depot-interne';
			const r = {
				id: 'r' + Date.now(),
				sujet: $('#rq-sujet').value.trim(),
				besoin: $('#rq-besoin').value.trim(),
				auteur: interne ? 'Camille Martin' : null,
				origine: params.has('q')
					? interne
						? 'Recherche authentifiée'
						: 'Recherche publique'
					: interne
						? 'Accueil authentifié'
						: 'Accueil public',
				recherche: params.get('q') || '',
				etat: 'a-evaluer',
				domaine: '',
				cree: date,
				historique: [
					{
						titre: 'Requête déposée',
						par: interne ? 'Camille Martin' : 'Visiteur anonyme',
						quand: date + ' · 16:30'
					}
				]
			};
			jeu.requetes.unshift(r);
			sauver();
			aller(interne ? 'recu-interne' : 'recu-public');
			return;
		}
		if (form.id === 'rq-qualification') {
			courant.domaine = $('#rq-domaine').value;
			courant.interne = $('#rq-interne').value;
			evenement(courant, 'Qualification mise à jour');
			courant.historique.at(-1).interne = true;
			sauver();
			avertir('Qualification enregistrée.');
			return;
		}
		if (form.id === 'rq-decision') {
			const r = courant;
			const f = new FormData(form);
			const action = form.dataset.action;
			if (action === 'accepter') {
				r.domaine = f.get('domaine');
				changerEtat(r, 'acceptee', f.get('retour') || '');
			}
			if (action === 'refuser') {
				r.interne = f.get('interne-decision') || '';
				r.note = null;
				changerEtat(r, 'non-retenue', f.get('retour') || '');
			}
			if (action === 'associer') {
				if (!f.get('note')) {
					$('#rq-decision-erreur').innerHTML =
						'<p class="rq-erreur">Choisissez une note à associer.</p>';
					return;
				}
				r.note = f.get('note');
				evenement(r, 'Note associée');
				r.historique.at(-1).interne = true;
				sauver();
			}
			if (action === 'diffuser') changerEtat(r, 'diffusee', f.get('retour') || '');
			if (action === 'supprimer') {
				if (r.auteur) {
					const etat = r.etat === 'diffusee' ? 'diffusee' : 'non-retenue';
					const retour = f.get('retour') || r.retour || '';
					(jeu.suivisRetires ||= []).push({
						id: r.id,
						sujet: r.sujet,
						besoin: 'Cette requête a été retirée du module après décision.',
						auteur: r.auteur,
						origine: r.origine,
						recherche: '',
						domaine: '',
						cree: r.cree,
						etat,
						retour,
						nouveau: true,
						historique: [
							{
								titre: etats[etat],
								par: 'Administration',
								quand: date + ' · 16:30',
								commentaire: retour
							}
						]
					});
				}
				jeu.journal.push({
					titre: 'Requête supprimée',
					sujet: r.auteur
						? 'Requête liée à un compte · contenu retiré'
						: 'Requête anonyme · contenu retiré',
					par: 'Administration',
					quand: date + ' · 16:30'
				});
				jeu.requetes = jeu.requetes.filter((x) => x !== r);
				sauver();
				$('#rq-dialogue').close();
				aller('console');
				avertir('Requête supprimée. L’action reste dans le journal.');
				return;
			}
			$('#rq-dialogue').close();
			sauver();
			rendre();
			avertir(
				action === 'accepter'
					? 'Requête acceptée.'
					: action === 'refuser'
						? 'Requête non retenue.'
						: action === 'associer'
							? 'Note associée. La requête reste acceptée.'
							: 'Réponse diffusée.'
			);
			return;
		}
	});
	document.addEventListener('input', (e) => {
		if (e.target.id === 'rq-filtre') {
			rechercheFile = e.target.value;
			rendreFile();
		}
		if (e.target.id === 'rq-chercher-note') {
			const q = e.target.value.toLowerCase();
			$$('.rq-choix').forEach((n) => {
				n.hidden = !n.dataset.titre.includes(q);
			});
			$('#rq-notes-vides').hidden = $$('.rq-choix:not([hidden])').length > 0;
		}
		if (
			['rq-sujet', 'rq-besoin'].includes(e.target.id) &&
			e.target.getAttribute('aria-invalid') === 'true'
		) {
			$('#' + e.target.id + '-erreur').textContent = '';
			e.target.removeAttribute('aria-invalid');
		}
	});
	document.addEventListener('change', (e) => {
		if (e.target.id === 'rq-domaine-filtre') {
			domaineFile = e.target.value;
			rendreFile();
		}
		if (e.target.id === 'nav2-selecteur') {
			if (e.target.value === 'requetes') aller('console');
			else
				window.open(
					'http://127.0.0.1:5173/console/' +
						({ notes: 'types-de-note', fiches: 'types-de-fiches', relations: 'types-de-relations' }[
							e.target.value
						] || e.target.value),
					'_blank',
					'noopener'
				);
		}
	});
	document.addEventListener('click', (e) => {
		const el = e.target.closest('button, a, [data-ouvrir-tiroir], [data-fermer-tiroir]');
		if (!el) return;
		const action = el.dataset.rq;
		if (action) {
			e.preventDefault();
			if (action === 'parcours') {
				ouvrirDialogue(
					'Parcours de maquette',
					`<p>Changer de point de vue conserve vos dépôts et décisions dans cet onglet.</p><div class="rq-actions">${lien('public', 'Accueil public', { role: 'admin' }, 'btn')}${lien('accueil', 'Accueil administrateur', { role: 'admin' }, 'btn')}${lien('accueil', 'Accueil lecteur', { role: 'lecteur' }, 'btn')}${lien('console', 'Console', { role: 'admin' }, 'btn')}${lien('mes-requetes', 'Suivi du demandeur', { role: 'lecteur' }, 'btn')}</div><p><a class="rq-lien" href="index.html">Toutes les maquettes et les comparaisons</a></p>`,
					'parcours',
					''
				);
				$('#rq-decision button[type=submit]').remove();
			} else if (action === 'fermer') $('#rq-dialogue').close();
			else if (action === 'console') aller('console');
			else if (action === 'effacer-filtres') {
				rechercheFile = '';
				domaineFile = '';
				consoleRequetes();
			} else if (action === 'reessayer-file') rendreFile();
			else decision(action);
			return;
		}
		if (el.dataset.rqSection) {
			e.preventDefault();
			window.open('http://127.0.0.1:5173/console/' + el.dataset.rqSection, '_blank', 'noopener');
			return;
		}
		if (el.hasAttribute('data-ouvrir-tiroir')) {
			$('.app').dataset.tiroir = el.dataset.ouvrirTiroir;
			return;
		}
		if (el.hasAttribute('data-fermer-tiroir')) {
			delete $('.app').dataset.tiroir;
			return;
		}
		if (vue === 'editeur') {
			if (el.dataset.val) {
				e.preventDefault();
				$$('button', el.parentElement).forEach((b) =>
					b.setAttribute('aria-pressed', String(b === el))
				);
				if (['Publiée', 'Brouillon'].includes(el.dataset.val)) etatEditeur = el.dataset.val;
				else visibiliteEditeur = el.dataset.val;
				return;
			}
			if (el.id === 'enregistrer') {
				e.preventDefault();
				const titre = $('#titre').value.trim();
				if (!titre) {
					$('#erreur-titre').hidden = false;
					$('#titre').focus();
					return;
				}
				let n = noteDe(courant);
				if (!n || n.id === 'sauvegarde') {
					n = { id: 'note-' + Date.now() };
					jeu.notes.push(n);
				}
				Object.assign(n, {
					titre,
					domaine: $('#m-domaine')?.value || courant.domaine,
					statut: etatEditeur,
					acces: visibiliteEditeur,
					lisible: true
				});
				courant.note = n.id;
				courant.corps = $('#redaction').innerHTML;
				evenement(courant, etatEditeur === 'Brouillon' ? 'Brouillon enregistré' : 'Note publiée');
				courant.historique.at(-1).interne = true;
				sauver();
				aller('console', { requete: courant.id, etat: 'acceptee' });
				return;
			}
			if (el.id === 'annuler') {
				e.preventDefault();
				aller('console', { requete: courant.id });
				return;
			}
			if (el.id === 'ouvrir-meta') {
				$('.app').dataset.meta = $('.app').dataset.meta === 'ouvert' ? 'ferme' : 'ouvert';
				return;
			}
			if (el.id === 'previsualiser' || el.textContent.trim() === 'Reprendre la rédaction') {
				$('.app').dataset.vue = $('.app').dataset.vue === 'apercu' ? 'redaction' : 'apercu';
				const a = $('#apercu');
				if (a) a.innerHTML = $('#redaction').innerHTML;
				return;
			}
			if (el.dataset.cmd) {
				$('#redaction').focus();
				document.execCommand(el.dataset.cmd);
				return;
			}
			if (/^h[123]$/.test(el.dataset.bloc || '')) {
				$('#redaction').focus();
				document.execCommand('formatBlock', false, el.dataset.bloc);
				return;
			}
		}
		if (el.tagName === 'A') {
			const href = el.getAttribute('href');
			if (!href || href.startsWith('#') || href === 'index.html') return;
			const url = new URL(href, 'http://127.0.0.1:5173/');
			e.preventDefault();
			if (url.pathname === '/') aller(vue.includes('public') ? 'public' : 'accueil');
			else if (url.pathname === '/recherche')
				aller(vue.includes('public') ? 'recherche-publique' : 'recherche-interne');
			else if (url.pathname === '/connexion') aller('accueil');
			else if (url.pathname === '/console') aller('console');
			else window.open(url.href, '_blank', 'noopener');
		}
	});
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape') {
			const a = $('.app');
			if (a) delete a.dataset.tiroir;
		}
		if (
			e.key === 'Enter' &&
			e.target.matches('input[type=search]') &&
			!e.target.id.startsWith('rq-')
		) {
			e.preventDefault();
			aller(vue.includes('public') ? 'recherche-publique' : 'recherche-interne', {
				q: e.target.value
			});
		}
	});
	window.addEventListener('hashchange', () => {
		rechercheFile = '';
		domaineFile = '';
		rendre();
	});
	rendre();
})();
