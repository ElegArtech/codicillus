import { describe, expect, it } from 'vitest';
import { adresseHttp } from './redirection';

describe('l’adresse d’une redirection', () => {
	it('encode ce qui sort de l’ASCII', () => {
		expect(adresseHttp('/notes/n-годовой-отчет?enregistree=1')).toBe(
			'/notes/n-' +
				encodeURIComponent('годовой') +
				'-' +
				encodeURIComponent('отчет') +
				'?enregistree=1'
		);
		expect(adresseHttp('/dossiers/東京-📁')).toBe(
			'/dossiers/' + encodeURIComponent('東京') + '-' + encodeURIComponent('📁')
		);
	});

	it('ne réencode pas une adresse déjà encodée', () => {
		expect(adresseHttp('/connexion?suite=%2Fnotes%2Fx')).toBe('/connexion?suite=%2Fnotes%2Fx');
	});
});
