import { describe, expect, it } from 'vitest';
import { titreDeLaPage } from './titre';

describe('le titre de l’onglet', () => {
	it('nomme les pages fixes', () => {
		expect(titreDeLaPage('/', {})).toBe('Accueil · Codicillus');
		expect(titreDeLaPage('/console/comptes', {})).toBe('Comptes · Console · Codicillus');
	});

	it('nomme la note, le guide, l’univers et le domaine affichés', () => {
		expect(titreDeLaPage('/notes/[identifiant]', { note: { titre: 'Guide VPN' } })).toBe(
			'Guide VPN · Codicillus'
		);
		expect(
			titreDeLaPage('/notes/[identifiant]/historique', { affichee: { titre: 'Guide VPN' } })
		).toBe('Historique — Guide VPN · Codicillus');
		expect(titreDeLaPage('/guides/[identifiant]', { guide: { titre: 'Wi-Fi' } })).toBe(
			'Wi-Fi · Codicillus'
		);
		expect(titreDeLaPage('/univers/[univers]', { univers: { nom: 'Infra' } })).toBe(
			'Infra · Codicillus'
		);
		expect(
			titreDeLaPage('/univers/[univers]/[domaine]/signets', { domaine: { nom: 'Serveurs' } })
		).toBe('Signets — Serveurs · Codicillus');
	});

	it('se replie sur la nature de la page quand la donnée ne nomme rien', () => {
		expect(titreDeLaPage('/notes/[identifiant]', {})).toBe('Note · Codicillus');
	});

	it('laisse leur titre aux pages qui le posent', () => {
		expect(titreDeLaPage('/requetes/nouvelle', {})).toBeNull();
	});
});
