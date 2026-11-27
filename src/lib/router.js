/**
 * Hash routes (refresh-safe on GitHub Pages):
 *   #/                 all prompts
 *   #/favorites        favorites
 *   #/recent           recently used
 *   #/examples         example prompts (tagged "example")
 *   #/category/<name>  category
 *   #/prompt/<id>      prompt detail
 *   #/edit/<id>        edit prompt
 *   #/new              new prompt
 *   #/tags             tag manager
 *   #/data             import / export / reset
 *   #/settings         settings (AI key)
 *   #/about            about
 */
export function parseHash(hash = '') {
  const path = String(hash).replace(/^#/, '').replace(/^\/+/, '');
  const [head = '', ...rest] = path.split('/');
  const arg = rest.length ? decodeURIComponent(rest.join('/')) : '';
  switch (head) {
    case '':
      return { name: 'list', view: { type: 'all' } };
    case 'favorites':
      return { name: 'list', view: { type: 'favorites' } };
    case 'recent':
      return { name: 'list', view: { type: 'recent' } };
    case 'examples':
      return { name: 'list', view: { type: 'examples' } };
    case 'category':
      return { name: 'list', view: { type: 'category', name: arg } };
    case 'prompt':
      return { name: 'detail', id: arg };
    case 'edit':
      return { name: 'edit', id: arg };
    case 'new':
      return { name: 'new' };
    case 'tags':
    case 'data':
    case 'settings':
    case 'about':
      return { name: head };
    default:
      return { name: 'notfound' };
  }
}

export function href(name, arg) {
  if (name === 'list' || !name) return '#/';
  return arg !== undefined ? `#/${name}/${encodeURIComponent(arg)}` : `#/${name}`;
}

export function navigate(name, arg) {
  window.location.hash = href(name, arg);
}
