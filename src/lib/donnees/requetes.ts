import { and, count, desc, eq, gt, isNull, sql } from 'drizzle-orm';
import type { Base, ExecuteurDeBase } from '../base/acces';
import {
	comptes,
	domaines,
	dossiers,
	droitsDeDossier,
	notes,
	requetesDeDocumentation as requetes,
	evenementsDeRequete as evenements
} from '../base/schema';
import {
	capacites,
	contourneLesDroitsDeDossier,
	indexerLesDroits,
	resoudreDroitDeDossier,
	type Identite
} from '../droits/resolution';
import { erreursDuDepot, estUnIdentifiantDeRequete } from '../requetes/modele';

export class ErreurDeRequete extends Error {
	constructor(
		public readonly statut: 400 | 404 | 409,
		message: string
	) {
		super(message);
	}
}
export function exigerAdministration(identite: Identite): void {
	if (!contourneLesDroitsDeDossier(identite))
		throw new ErreurDeRequete(404, 'Ressource introuvable.');
}
function exigerIdentifiant(id: string): void {
	if (!estUnIdentifiantDeRequete(id)) throw new ErreurDeRequete(404, 'Ressource introuvable.');
}
export type Requete = typeof requetes.$inferSelect;
export type NoteDeRequete = Pick<
	typeof notes.$inferSelect,
	'id' | 'identifiant' | 'titre' | 'statut' | 'visibilite' | 'dossierId'
>;

export async function deposerRequete(
	base: Base,
	identite: Identite,
	saisie: { id: string; sujet: string; besoin: string; recherche: string }
): Promise<void> {
	exigerIdentifiant(saisie.id);
	if (Object.keys(erreursDuDepot(saisie.sujet, saisie.besoin)).length)
		throw new ErreurDeRequete(400, 'Vérifiez les champs de la requête.');
	const connecte = identite.type === 'authentifie';
	await base.transaction(async (tx) => {
		const [inseree] = await tx
			.insert(requetes)
			.values({
				id: saisie.id,
				sujet: saisie.sujet.trim(),
				besoin: saisie.besoin.trim(),
				recherche: saisie.recherche,
				origine: saisie.recherche
					? connecte
						? 'recherche-interne'
						: 'recherche-publique'
					: connecte
						? 'accueil-interne'
						: 'accueil-public',
				demandeurId: connecte ? identite.compteId : null
			})
			.onConflictDoNothing()
			.returning({ id: requetes.id });
		// Le même envoi peut être rejoué après une réponse réseau perdue.
		if (inseree)
			await tx.insert(evenements).values({
				requeteId: inseree.id,
				acteurId: connecte ? identite.compteId : null,
				geste: 'depot',
				visibleDemandeur: true
			});
	});
}
export async function compteursDeRequetes(base: Base, identite: Identite) {
	const aEvaluer = contourneLesDroitsDeDossier(identite) ? await compterRequetesAEvaluer(base) : 0;
	if (identite.type === 'anonyme') return { aEvaluer, personnelles: 0, nouvelles: 0 };
	const [total, nouvelles] = await Promise.all([
		base
			.select({ nombre: count() })
			.from(requetes)
			.where(eq(requetes.demandeurId, identite.compteId)),
		base
			.select({ nombre: count() })
			.from(requetes)
			.where(
				and(
					eq(requetes.demandeurId, identite.compteId),
					gt(requetes.revision, requetes.revisionLue)
				)
			)
	]);
	return { aEvaluer, personnelles: total[0]?.nombre ?? 0, nouvelles: nouvelles[0]?.nombre ?? 0 };
}
export async function compterRequetesAEvaluer(base: Base): Promise<number> {
	const [r] = await base
		.select({ nombre: count() })
		.from(requetes)
		.where(and(isNull(requetes.supprimeeLe), eq(requetes.etat, 'a-evaluer')));
	return r?.nombre ?? 0;
}
export async function listeAdministrativeDeRequetes(base: Base, identite: Identite) {
	exigerAdministration(identite);
	return base
		.select({
			id: requetes.id,
			sujet: requetes.sujet,
			besoin: requetes.besoin,
			origine: requetes.origine,
			etat: requetes.etat,
			creeLe: requetes.creeLe,
			domaineId: requetes.domaineId,
			domaine: domaines.nom,
			demandeur: comptes.nom
		})
		.from(requetes)
		.leftJoin(comptes, eq(comptes.id, requetes.demandeurId))
		.leftJoin(domaines, eq(domaines.id, requetes.domaineId))
		.where(isNull(requetes.supprimeeLe))
		.orderBy(desc(requetes.creeLe));
}
export async function domainesDeRequete(base: ExecuteurDeBase) {
	return base.select({ id: domaines.id, nom: domaines.nom }).from(domaines).orderBy(domaines.nom);
}
export async function notesPourRequete(base: Base, identite: Identite) {
	exigerAdministration(identite);
	return base
		.select({
			id: notes.id,
			identifiant: notes.identifiant,
			titre: notes.titre,
			statut: notes.statut,
			visibilite: notes.visibilite,
			domaine: domaines.nom
		})
		.from(notes)
		.innerJoin(dossiers, eq(dossiers.id, notes.dossierId))
		.innerJoin(domaines, eq(domaines.id, dossiers.domaineId))
		.orderBy(notes.titre);
}
async function lireRequete(base: ExecuteurDeBase, id: string, verrouiller = false) {
	exigerIdentifiant(id);
	const lecture = base.select().from(requetes).where(eq(requetes.id, id));
	const [r] = verrouiller ? await lecture.for('update') : await lecture;
	if (!r || r.supprimeeLe) throw new ErreurDeRequete(404, 'Ressource introuvable.');
	return r;
}
async function noteAssociee(
	base: ExecuteurDeBase,
	id: string | null,
	verrouiller = false
): Promise<NoteDeRequete | null> {
	if (!id) return null;
	const lecture = base
		.select({
			id: notes.id,
			identifiant: notes.identifiant,
			titre: notes.titre,
			statut: notes.statut,
			visibilite: notes.visibilite,
			dossierId: notes.dossierId
		})
		.from(notes)
		.where(eq(notes.id, id));
	return (verrouiller ? await lecture.for('share') : await lecture)[0] ?? null;
}
export async function reponseAccessible(
	base: ExecuteurDeBase,
	r: Pick<Requete, 'demandeurId' | 'origine'>,
	note: NoteDeRequete | null
): Promise<boolean> {
	if (!note || note.statut !== 'publiee') return false;
	if (note.visibilite === 'publique') return true;
	if (r.origine === 'accueil-public' || r.origine === 'recherche-publique' || !r.demandeurId)
		return false;
	const [demandeur] = await base
		.select({ id: comptes.id, role: comptes.role, actif: comptes.actif })
		.from(comptes)
		.where(eq(comptes.id, r.demandeurId));
	if (!demandeur?.actif) return false;
	const [arbre, droits] = await Promise.all([
		base.select().from(dossiers),
		base.select().from(droitsDeDossier).where(eq(droitsDeDossier.compteId, demandeur.id))
	]);
	return capacites(
		resoudreDroitDeDossier(
			{ type: 'authentifie', compteId: demandeur.id, role: demandeur.role },
			note.dossierId,
			indexerLesDroits(arbre, droits)
		)
	).lire;
}
export async function detailAdministratifDeRequete(base: Base, identite: Identite, id: string) {
	exigerAdministration(identite);
	const requete = await lireRequete(base, id);
	const [note, historique, demandeurs] = await Promise.all([
		noteAssociee(base, requete.noteId),
		base
			.select({
				id: evenements.id,
				geste: evenements.geste,
				le: evenements.le,
				commentaireDemandeur: evenements.commentaireDemandeur,
				acteur: comptes.nom
			})
			.from(evenements)
			.leftJoin(comptes, eq(comptes.id, evenements.acteurId))
			.where(eq(evenements.requeteId, id))
			.orderBy(desc(evenements.le)),
		requete.demandeurId
			? base.select({ nom: comptes.nom }).from(comptes).where(eq(comptes.id, requete.demandeurId))
			: Promise.resolve([])
	]);
	return {
		requete,
		note,
		historique,
		demandeur: demandeurs[0]?.nom ?? null,
		reponseAccessible: await reponseAccessible(base, requete, note)
	};
}
export async function requetePourEditeur(
	base: Base,
	identite: Identite,
	id: string | null,
	noteIdentifiant?: string
) {
	if (!id) return null;
	exigerAdministration(identite);
	const r = await lireRequete(base, id);
	if (r.etat !== 'acceptee')
		throw new ErreurDeRequete(409, 'La requête doit être acceptée pour préparer sa réponse.');
	const note = await noteAssociee(base, r.noteId);
	if (noteIdentifiant ? note?.identifiant !== noteIdentifiant : Boolean(note))
		throw new ErreurDeRequete(
			409,
			'La note associée a changé. Reprenez la rédaction depuis la requête.'
		);
	const [domaine] = r.domaineId
		? await base.select({ nom: domaines.nom }).from(domaines).where(eq(domaines.id, r.domaineId))
		: [];
	return {
		id: r.id,
		sujet: r.sujet,
		besoin: r.besoin,
		domaine: domaine?.nom ?? '',
		publique: r.origine.endsWith('public') || r.origine.endsWith('publique')
	};
}
async function affectation(base: ExecuteurDeBase, id: string): Promise<string | null> {
	if (!id) return null;
	if (
		!estUnIdentifiantDeRequete(id) ||
		!(await base.select({ id: domaines.id }).from(domaines).where(eq(domaines.id, id)))[0]
	)
		throw new ErreurDeRequete(
			400,
			'Choisissez un domaine existant ou laissez la requête sans affectation.'
		);
	return id;
}
async function tracer(
	base: ExecuteurDeBase,
	r: Requete,
	identite: Identite,
	geste: string,
	commentaire = '',
	visible = false
) {
	await base.insert(evenements).values({
		requeteId: r.id,
		acteurId: identite.type === 'authentifie' ? identite.compteId : null,
		geste,
		commentaireDemandeur: commentaire,
		visibleDemandeur: visible
	});
}
export async function associerCreationARequete(
	base: ExecuteurDeBase,
	identite: Identite,
	id: string,
	noteId: string
) {
	exigerAdministration(identite);
	const r = await lireRequete(base, id, true);
	if (r.etat !== 'acceptee' || r.noteId)
		throw new ErreurDeRequete(409, 'La requête a changé. Reprenez sa réponse depuis la console.');
	await base.update(requetes).set({ noteId, modifieLe: new Date() }).where(eq(requetes.id, id));
	await tracer(base, r, identite, 'associer');
}
export async function agirSurRequete(
	base: Base,
	identite: Identite,
	id: string,
	geste: string,
	champs: FormData
) {
	exigerAdministration(identite);
	const texte = (nom: string) => String(champs.get(nom) ?? '').replace(/\r\n?/g, '\n');
	await base.transaction(async (tx) => {
		const r = await lireRequete(tx, id, true);
		const maintenant = new Date();
		const retour = r.demandeurId ? texte('retour').trim() : '';
		let modification: Partial<typeof requetes.$inferInsert> = { modifieLe: maintenant };
		let decision = false;
		if (geste === 'qualifier')
			modification = {
				...modification,
				domaineId: await affectation(tx, texte('domaine')),
				commentaireInterne: texte('interne')
			};
		else if (geste === 'accepter' && r.etat === 'a-evaluer') {
			modification = {
				...modification,
				etat: 'acceptee',
				domaineId: await affectation(tx, texte('domaine'))
			};
			decision = true;
		} else if (geste === 'refuser' && ['a-evaluer', 'acceptee'].includes(r.etat)) {
			modification = { ...modification, etat: 'non-retenue', commentaireInterne: texte('interne') };
			decision = true;
		} else if (geste === 'associer' && r.etat === 'acceptee') {
			const noteId = texte('note');
			if (!estUnIdentifiantDeRequete(noteId) || !(await noteAssociee(tx, noteId, true)))
				throw new ErreurDeRequete(400, 'Choisissez une note existante.');
			modification.noteId = noteId;
		} else if (geste === 'diffuser' && r.etat === 'acceptee') {
			if (!(await reponseAccessible(tx, r, await noteAssociee(tx, r.noteId, true))))
				throw new ErreurDeRequete(
					409,
					'La réponse doit être publiée et accessible au demandeur. Une requête publique exige une note publique.'
				);
			modification.etat = 'diffusee';
			decision = true;
		} else if (geste === 'supprimer') {
			// La trace administrative ne recopie ni sujet, ni besoin, ni commentaire.
			await tx
				.update(evenements)
				.set({ requeteId: null, commentaireDemandeur: '', visibleDemandeur: false })
				.where(eq(evenements.requeteId, id));
			if (!r.demandeurId) {
				await tx.insert(evenements).values({
					acteurId: identite.type === 'authentifie' ? identite.compteId : null,
					geste: 'supprimer'
				});
				await tx.delete(requetes).where(eq(requetes.id, id));
				return;
			}
			modification = {
				...modification,
				besoin: '',
				recherche: '',
				commentaireInterne: '',
				domaineId: null,
				supprimeeLe: maintenant,
				etat: ['a-evaluer', 'acceptee'].includes(r.etat) ? 'non-retenue' : r.etat
			};
			decision = true;
		} else
			throw new ErreurDeRequete(
				409,
				'Cette action n’est plus possible dans l’état actuel de la requête. Rechargez son détail.'
			);
		if (decision)
			modification = { ...modification, commentaireDemandeur: retour, revision: r.revision + 1 };
		await tx.update(requetes).set(modification).where(eq(requetes.id, id));
		await tracer(tx, r, identite, geste, decision ? retour : '', decision);
	});
}
export async function mesRequetes(base: Base, identite: Identite) {
	if (identite.type !== 'authentifie') throw new ErreurDeRequete(404, 'Ressource introuvable.');
	return base
		.select({
			id: requetes.id,
			sujet: requetes.sujet,
			etat: requetes.etat,
			creeLe: requetes.creeLe,
			nouveau: sql<boolean>`${requetes.revision} > ${requetes.revisionLue}`,
			domaine: domaines.nom
		})
		.from(requetes)
		.leftJoin(domaines, eq(domaines.id, requetes.domaineId))
		.where(eq(requetes.demandeurId, identite.compteId))
		.orderBy(desc(requetes.modifieLe));
}
export async function maRequete(base: Base, identite: Identite, id: string) {
	exigerIdentifiant(id);
	if (identite.type !== 'authentifie') throw new ErreurDeRequete(404, 'Ressource introuvable.');
	const [r] = await base
		.select({
			id: requetes.id,
			sujet: requetes.sujet,
			besoin: requetes.besoin,
			origine: requetes.origine,
			recherche: requetes.recherche,
			etat: requetes.etat,
			creeLe: requetes.creeLe,
			domaine: domaines.nom,
			noteId: requetes.noteId,
			commentaireDemandeur: requetes.commentaireDemandeur,
			supprimeeLe: requetes.supprimeeLe,
			revision: requetes.revision
		})
		.from(requetes)
		.leftJoin(domaines, eq(domaines.id, requetes.domaineId))
		.where(and(eq(requetes.id, id), eq(requetes.demandeurId, identite.compteId)));
	if (!r) throw new ErreurDeRequete(404, 'Ressource introuvable.');
	const n = r.etat === 'diffusee' ? await noteAssociee(base, r.noteId) : null;
	const accessible = await reponseAccessible(
		base,
		{ demandeurId: identite.compteId, origine: r.origine },
		n
	);
	const historique = await base
		.select({
			id: evenements.id,
			geste: evenements.geste,
			le: evenements.le,
			commentaireDemandeur: evenements.commentaireDemandeur
		})
		.from(evenements)
		.where(and(eq(evenements.requeteId, id), eq(evenements.visibleDemandeur, true)))
		.orderBy(desc(evenements.le));
	const requete = { ...r, noteId: undefined };
	return {
		requete,
		historique,
		note:
			accessible && n
				? { titre: n.titre, identifiant: n.identifiant, publique: n.visibilite === 'publique' }
				: null
	};
}
export async function marquerRequeteLue(
	base: Base,
	identite: Identite,
	id: string,
	revision: number
) {
	exigerIdentifiant(id);
	if (identite.type !== 'authentifie') throw new ErreurDeRequete(404, 'Ressource introuvable.');
	if (!Number.isSafeInteger(revision) || revision < 0)
		throw new ErreurDeRequete(400, 'Décision invalide.');
	const resultat = await base
		.update(requetes)
		.set({
			revisionLue: sql`greatest(${requetes.revisionLue}, least(${requetes.revision}, ${revision}))`
		})
		.where(and(eq(requetes.id, id), eq(requetes.demandeurId, identite.compteId)))
		.returning({ id: requetes.id });
	if (!resultat.length) throw new ErreurDeRequete(404, 'Ressource introuvable.');
}
export async function journalDeRequetes(base: Base, identite: Identite) {
	exigerAdministration(identite);
	return base
		.select({
			id: evenements.id,
			geste: evenements.geste,
			le: evenements.le,
			acteur: comptes.nom,
			requeteId: requetes.id,
			sujet: requetes.sujet
		})
		.from(evenements)
		.leftJoin(requetes, and(eq(requetes.id, evenements.requeteId), isNull(requetes.supprimeeLe)))
		.leftJoin(comptes, eq(comptes.id, evenements.acteurId))
		.orderBy(desc(evenements.le));
}
