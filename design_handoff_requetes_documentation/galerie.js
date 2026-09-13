for (const href of window.REQUETES_VUES.public.styles) {
	const lien = document.createElement('link');
	lien.rel = 'stylesheet';
	lien.href = href;
	document.querySelector('link[rel=stylesheet]').before(lien);
}
